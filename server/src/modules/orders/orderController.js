import * as orderService from './orderService.js';
import * as checkoutService from './checkoutService.js';

export async function handleInitiateCheckout(req, res, next) {
  try {
    const idempotencyKey = req.headers['idempotency-key'] || req.headers['Idempotency-Key'] || null;
    const result = await checkoutService.initiateCheckout({
      userId: req.user._id,
      addressId: req.body.addressId,
      shippingAddress: req.body.shippingAddress,
      paymentMethod: req.body.paymentMethod,
      idempotencyKey,
    });
    return res.status(201).json({
      status: 'success',
      message: 'Checkout completed successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleConfirmOnlinePayment(req, res, next) {
  try {
    const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
    const order = await checkoutService.confirmOnlinePayment({
      orderId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
    });
    return res.status(200).json({
      status: 'success',
      message: 'Payment confirmed successfully',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
}

export async function handleUpdateTracking(req, res, next) {
  try {
    const { awbNumber, courierName, fulfillmentStatus } = req.body;
    const order = await checkoutService.updateTracking({
      orderId: req.params.id,
      awbNumber,
      courierName,
      fulfillmentStatus,
      adminId: req.user._id,
    });
    return res.status(200).json({
      status: 'success',
      message: 'Fulfillment and tracking details updated',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
}

export async function handleCreateOrder(req, res, next) {
  try {
    const order = await orderService.createOrder(req.user._id, req.body);
    return res.status(201).json({
      status: 'success',
      message: 'Purchase order created successfully',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
}

export async function handleGetOrders(req, res, next) {
  try {
    const orders = await orderService.getOrders(req.user._id, req.query);
    return res.status(200).json({
      status: 'success',
      data: {
        orders,
        count: orders.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function handleGetOrderById(req, res, next) {
  try {
    const order = await orderService.getOrderById(req.user._id, req.params.id, req.user.role);
    return res.status(200).json({
      status: 'success',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
}

export async function handleConfirmOrder(req, res, next) {
  try {
    const order = await orderService.confirmOrder(req.user._id, req.params.id, req.body);
    return res.status(200).json({
      status: 'success',
      message: 'Purchase order confirmed by seller',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
}

export async function handleConfirmHandover(req, res, next) {
  try {
    const order = await orderService.confirmOrderHandover(req.user._id, req.params.id, req.body);
    const msg = order.status === 'COMPLETED'
      ? 'Bilateral handover verified. Order completed successfully.'
      : 'Handover confirmed. Waiting for other party verification.';
    return res.status(200).json({
      status: 'success',
      message: msg,
      data: { order },
    });
  } catch (error) {
    next(error);
  }
}

export async function handleCancelOrder(req, res, next) {
  try {
    const order = await orderService.cancelOrder(req.user._id, req.params.id, req.body);
    return res.status(200).json({
      status: 'success',
      message: 'Purchase order cancelled',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
}

export async function handleDisputeOrder(req, res, next) {
  try {
    const order = await orderService.disputeOrder(req.user._id, req.params.id, req.body);
    return res.status(200).json({
      status: 'success',
      message: 'Dispute submitted for review',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
}
