import crypto from 'crypto';
import Order from './orderModel.js';
import Payment from '../payments/paymentModel.js';
import Refund from '../refunds/refundModel.js';
import StatusHistory from './statusHistoryModel.js';
import IdempotencyRecord from '../idempotency/idempotencyModel.js';
import Address from '../addresses/addressModel.js';
import Listing from '../listings/listingModel.js';
import { getCart, clearCart, calculateAuthoritativeCartTotals } from '../cart/cartService.js';
import {
  reserveStockForOrder,
  commitReservation,
  releaseReservation,
} from '../inventory/reservationService.js';
import paymentGateway from '../payments/paymentGateway.js';
import COMMERCE_CONFIG from '../../config/commerceConfig.js';

function createHttpError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

/**
 * Generates SHA-256 hash of the checkout request payload
 */
function hashPayload(payload) {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

/**
 * Initiates checkout and creates an order with atomic stock reservations
 */
export async function initiateCheckout({
  userId,
  addressId = null,
  shippingAddress = null,
  paymentMethod = 'COD',
  idempotencyKey = null,
}) {
  if (!userId) {
    throw createHttpError('UNAUTHORIZED: Authentication required to proceed to checkout.', 401);
  }

  // 1. Idempotency Check
  const effectiveKey = idempotencyKey || `auto_${userId}_${Date.now()}`;
  const requestPayloadHash = hashPayload({ userId, addressId, shippingAddress, paymentMethod });

  const existingIdempotency = await IdempotencyRecord.findOne({
    actor: userId.toString(),
    key: effectiveKey,
    operation: 'CHECKOUT',
  });

  if (existingIdempotency) {
    if (existingIdempotency.status === 'COMPLETED') {
      return existingIdempotency.responseBody;
    }
    if (existingIdempotency.status === 'IN_PROGRESS') {
      throw createHttpError('CONCURRENT_REQUEST: A checkout is currently processing for this request.', 409);
    }
  }

  // Record In-Progress Idempotency Record
  await IdempotencyRecord.create({
    key: effectiveKey,
    actor: userId.toString(),
    operation: 'CHECKOUT',
    requestHash: requestPayloadHash,
    status: 'IN_PROGRESS',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  }).catch(() => {});

  try {
    // 2. Resolve Shipping Address
    let resolvedAddress = shippingAddress;
    if (addressId) {
      const dbAddress = await Address.findOne({ _id: addressId, user: userId });
      if (dbAddress) {
        resolvedAddress = {
          fullName: dbAddress.fullName,
          phone: dbAddress.phone,
          street: dbAddress.street,
          city: dbAddress.city,
          state: dbAddress.state,
          postalCode: dbAddress.postalCode,
        };
      }
    }

    if (!resolvedAddress || !resolvedAddress.street || !resolvedAddress.city || !resolvedAddress.postalCode) {
      throw createHttpError(
        'INVALID_ADDRESS: A complete delivery address (street, city, state, PIN code, and phone) is required.',
        400
      );
    }

    // 3. Resolve Cart and Authoritative Monetary Totals
    const userCart = await getCart({ userId });
    if (!userCart.items || userCart.items.length === 0) {
      throw createHttpError('CART_EMPTY: Your shopping cart is empty.', 400);
    }

    // Build immutable item snapshots
    const orderItems = userCart.items.map((item) => {
      const listing = item.listing;
      const unitPricePaise =
        listing.pricePaise ||
        (typeof listing.price === 'number' ? Math.round(listing.price * 100) : 0) ||
        item.priceSnapshotPaise ||
        0;
      const qty = item.quantity || 1;
      return {
        listing: listing._id,
        sku: listing.sku || `TS-${listing._id.toString().slice(-6).toUpperCase()}`,
        title: listing.title,
        unitPricePaise,
        quantity: qty,
        lineTotalPaise: unitPricePaise * qty,
        image: (listing.images && listing.images[0]) || null,
      };
    });

    const totals = calculateAuthoritativeCartTotals(userCart.items);

    // 4. Validate Payment Method and COD limits
    const normalizedMethod =
      paymentMethod === 'ONLINE_RAZORPAY' ? 'ONLINE_RAZORPAY' : 'COD';

    if (normalizedMethod === 'COD' && !totals.codEligible) {
      throw createHttpError(
        `COD_LIMIT_EXCEEDED: Orders above ₹5,000 are not eligible for Cash on Delivery. Current order total is ₹${(
          totals.totalPaise / 100
        ).toFixed(2)}. Please choose Online Payment.`,
        400
      );
    }

    // 5. Create Order Document
    const initialOrderStatus =
      normalizedMethod === 'COD'
        ? COMMERCE_CONFIG.ORDER_STATUS.CONFIRMED
        : COMMERCE_CONFIG.ORDER_STATUS.PENDING;

    const initialPaymentStatus = COMMERCE_CONFIG.PAYMENT_STATUS.UNPAID;
    const initialFulfillmentStatus = COMMERCE_CONFIG.FULFILLMENT_STATUS.UNFULFILLED;

    const firstSellerId = userCart.items[0]?.listing?.seller || userId;

    const order = await Order.create({
      buyer: userId,
      seller: firstSellerId,
      listing: orderItems[0].listing,
      items: orderItems,
      shippingAddress: resolvedAddress,
      subtotalPaise: totals.subtotalPaise,
      shippingPaise: totals.shippingPaise,
      taxPaise: totals.taxPaise,
      totalPaise: totals.totalPaise,
      currency: totals.currency,
      itemPrice: totals.subtotalPaise / 100,
      totalAmount: totals.totalPaise / 100,
      paymentMethod: normalizedMethod,
      orderStatus: initialOrderStatus,
      status: initialOrderStatus,
      paymentStatus: initialPaymentStatus,
      fulfillmentStatus: initialFulfillmentStatus,
      idempotencyKey: effectiveKey,
    });

    // 6. Two-phase Inventory Reservation
    await reserveStockForOrder({
      orderId: order._id,
      items: orderItems,
    });

    // 7. Payment Initialization
    let gatewayOrder = null;
    if (normalizedMethod === 'ONLINE_RAZORPAY') {
      gatewayOrder = await paymentGateway.createOrder({
        amountPaise: totals.totalPaise,
        currency: totals.currency,
        receipt: order._id.toString(),
      });

      await Payment.create({
        order: order._id,
        provider: 'RAZORPAY',
        providerOrderId: gatewayOrder.providerOrderId,
        amountPaise: totals.totalPaise,
        currency: totals.currency,
        status: 'CREATED',
        rawMetadata: gatewayOrder,
      });
    } else {
      // COD Order: Commit stock immediately as order is confirmed
      await commitReservation(order._id);

      await Payment.create({
        order: order._id,
        provider: 'COD',
        amountPaise: totals.totalPaise,
        currency: totals.currency,
        status: 'CREATED',
      });
    }

    // 8. Record Status History
    await StatusHistory.create({
      entityType: 'ORDER',
      entityId: order._id,
      field: 'orderStatus',
      previousState: null,
      newState: initialOrderStatus,
      actorType: 'USER',
      actorId: userId,
      reason: `Order created via ${normalizedMethod}`,
      metadata: { totalPaise: totals.totalPaise },
    });

    // 9. Clear User's Cart
    await clearCart({ userId });

    const responseData = {
      success: true,
      order: {
        _id: order._id,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        items: order.items,
        shippingAddress: order.shippingAddress,
        subtotalPaise: order.subtotalPaise,
        shippingPaise: order.shippingPaise,
        totalPaise: order.totalPaise,
        currency: order.currency,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
      },
      gateway: gatewayOrder,
    };

    // 10. Update Idempotency Record to COMPLETED
    await IdempotencyRecord.updateOne(
      { actor: userId.toString(), key: effectiveKey, operation: 'CHECKOUT' },
      {
        status: 'COMPLETED',
        statusCode: 201,
        responseBody: responseData,
      }
    ).catch(() => {});

    return responseData;
  } catch (error) {
    // Record Failure in Idempotency
    await IdempotencyRecord.updateOne(
      { actor: userId.toString(), key: effectiveKey, operation: 'CHECKOUT' },
      {
        status: 'FAILED',
        responseBody: { error: error.message },
      }
    ).catch(() => {});

    throw error;
  }
}

/**
 * Confirms an online payment from Razorpay and marks the order confirmed
 */
export async function confirmOnlinePayment({
  orderId,
  razorpayPaymentId,
  razorpayOrderId,
  razorpaySignature,
}) {
  const order = await Order.findById(orderId);
  if (!order) throw new Error('ORDER_NOT_FOUND: Order does not exist.');

  if (order.paymentStatus === 'PAID') {
    return order; // Idempotent return
  }

  // Verify signature
  const isValid = paymentGateway.verifyPaymentSignature({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });

  if (!isValid) {
    throw createHttpError('SIGNATURE_VERIFICATION_FAILED: Invalid payment signature from gateway.', 400);
  }

  // 1. Commit reserved stock
  await commitReservation(order._id);

  // 2. Update Order
  order.paymentStatus = 'PAID';
  order.orderStatus = 'CONFIRMED';
  order.status = 'CONFIRMED';
  await order.save();

  // 3. Update Payment record
  await Payment.findOneAndUpdate(
    { order: order._id },
    {
      providerPaymentId: razorpayPaymentId,
      providerSignature: razorpaySignature,
      status: 'CAPTURED',
    }
  );

  // 4. Status History
  await StatusHistory.create({
    entityType: 'PAYMENT',
    entityId: order._id,
    field: 'paymentStatus',
    previousState: 'UNPAID',
    newState: 'PAID',
    actorType: 'WEBHOOK',
    reason: 'Payment verified and captured successfully via Razorpay',
    metadata: { razorpayPaymentId },
  });

  return order;
}

/**
 * Pre-shipment cancellation of an order
 */
export async function cancelOrder({ orderId, userId, reason = 'Customer requested cancellation', isAdmin = false }) {
  const order = await Order.findById(orderId);
  if (!order) throw createHttpError('ORDER_NOT_FOUND: Order does not exist.', 404);

  // Ownership check
  if (!isAdmin && order.buyer.toString() !== userId.toString()) {
    throw createHttpError('FORBIDDEN: You are not authorized to cancel this order.', 403);
  }

  // Pre-shipment check
  if (['SHIPPED', 'DELIVERED'].includes(order.fulfillmentStatus)) {
    throw createHttpError(
      'CANCELLATION_NOT_ALLOWED: This order has already been shipped or delivered. Pre-shipment cancellation is closed.',
      400
    );
  }

  if (order.orderStatus === 'CANCELLED') {
    return order; // Idempotent return
  }

  // 1. Release Inventory back to availableStock
  await releaseReservation(order._id, reason);

  // If order was already confirmed and committed (like COD), restore stock directly
  for (const item of order.items || []) {
    const listingId = item.listing?._id || item.listing;
    const qty = item.quantity || 1;
    await Listing.updateOne(
      { _id: listingId },
      {
        $inc: {
          soldStock: -qty,
          availableStock: qty,
        },
      }
    ).catch(() => {});
  }

  // 2. Handle refund if online paid
  if (order.paymentStatus === 'PAID') {
    const payment = await Payment.findOne({ order: order._id, status: 'CAPTURED' });
    if (payment && payment.providerPaymentId) {
      const refundResult = await paymentGateway.initiateRefund({
        paymentId: payment.providerPaymentId,
        amountPaise: order.totalPaise,
        reason,
      });

      await Refund.create({
        order: order._id,
        payment: payment._id,
        amountPaise: order.totalPaise,
        providerRefundId: refundResult.providerRefundId,
        reason,
        status: 'PROCESSED',
        initiatedBy: userId,
      });

      order.paymentStatus = 'REFUNDED';
    }
  }

  // 3. Update order state
  order.orderStatus = 'CANCELLED';
  order.status = 'CANCELLED';
  order.cancellationReason = reason;
  await order.save();

  // 4. Status history
  await StatusHistory.create({
    entityType: 'ORDER',
    entityId: order._id,
    field: 'orderStatus',
    previousState: 'CONFIRMED',
    newState: 'CANCELLED',
    actorType: isAdmin ? 'ADMIN' : 'USER',
    actorId: userId,
    reason,
  });

  return order;
}

/**
 * Manual tracking & AWB update by administrator
 */
export async function updateTracking({
  orderId,
  awbNumber,
  courierName,
  fulfillmentStatus,
  adminId,
}) {
  const order = await Order.findById(orderId);
  if (!order) throw new Error('ORDER_NOT_FOUND: Order does not exist.');

  const previousFulfillment = order.fulfillmentStatus;

  if (awbNumber) order.tracking.awbNumber = awbNumber;
  if (courierName) order.tracking.courierName = courierName;

  if (fulfillmentStatus && fulfillmentStatus !== previousFulfillment) {
    order.fulfillmentStatus = fulfillmentStatus;
    if (fulfillmentStatus === 'SHIPPED') order.tracking.shippedAt = new Date();
    if (fulfillmentStatus === 'DELIVERED') {
      order.tracking.deliveredAt = new Date();
      order.orderStatus = 'COMPLETED';
      order.status = 'COMPLETED';
    }

    await StatusHistory.create({
      entityType: 'FULFILLMENT',
      entityId: order._id,
      field: 'fulfillmentStatus',
      previousState: previousFulfillment,
      newState: fulfillmentStatus,
      actorType: 'ADMIN',
      actorId: adminId,
      reason: `Manual fulfillment status update. AWB: ${awbNumber || order.tracking?.awbNumber || 'N/A'}`,
    });
  }

  await order.save();
  return order;
}

export default {
  initiateCheckout,
  confirmOnlinePayment,
  cancelOrder,
  updateTracking,
};
