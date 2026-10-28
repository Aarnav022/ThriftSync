import Order from './orderModel.js';
import Listing from '../listings/listingModel.js';

/**
 * Places a new outright purchase order on an active campus listing.
 * Atomically locks inventory (status: 'active' -> 'reserved') to prevent race conditions.
 */
export async function createOrder(
  buyerId,
  { listingId, pickupLocation, meetupNotes, paymentMethod }
) {
  // Find listing first
  const listing = await Listing.findById(listingId);
  if (!listing) {
    const error = new Error('Listing not found');
    error.statusCode = 404;
    throw error;
  }

  // Prevent self-purchase
  if (listing.seller.toString() === buyerId.toString()) {
    const error = new Error('You cannot purchase your own listing');
    error.statusCode = 400;
    throw error;
  }

  // Check eligibility for outright purchase
  if (listing.listingType !== 'buy' && listing.listingType !== 'buy_and_rent') {
    const error = new Error('This listing is not offered for outright purchase');
    error.statusCode = 400;
    throw error;
  }

  if (listing.price === null || listing.price === undefined || listing.price < 0) {
    const error = new Error('Listing does not have a valid purchase price');
    error.statusCode = 400;
    throw error;
  }

  // Atomic conditional reservation: ensures only one buyer/renter acquires lock
  const reservedListing = await Listing.findOneAndUpdate(
    { _id: listingId, status: 'active' },
    { status: 'reserved' },
    { new: true }
  );

  if (!reservedListing) {
    const error = new Error('This item is no longer available for purchase');
    error.statusCode = 409;
    throw error;
  }

  const itemPrice = Number(listing.price);
  const serviceFee = 0; // 0% campus circular commission
  const totalAmount = itemPrice + serviceFee;

  const order = new Order({
    buyer: buyerId,
    seller: listing.seller,
    listing: listing._id,
    itemPrice,
    serviceFee,
    totalAmount,
    paymentMethod: paymentMethod || 'CAMPUS_HANDOVER',
    paymentStatus: 'PENDING',
    pickupLocation: pickupLocation || listing.pickupLocation || 'Campus Student Center',
    meetupNotes: meetupNotes || '',
    status: 'PENDING',
    timeline: [
      {
        action: 'ORDER_PLACED',
        actor: buyerId,
        note: meetupNotes ? `Order placed: ${meetupNotes}` : 'Purchase order placed',
        timestamp: new Date(),
      },
    ],
  });

  await order.save();

  await order.populate([
    { path: 'buyer', select: '_id name campus avatar email' },
    { path: 'seller', select: '_id name campus avatar email' },
    {
      path: 'listing',
      select: '_id title category condition listingType price campus pickupLocation images status',
    },
  ]);

  return order;
}

/**
 * Retrieves orders for the authenticated student, optionally filtered by role and status.
 */
export async function getOrders(userId, { role, status }) {
  const query = {};

  if (role === 'buyer') {
    query.buyer = userId;
  } else if (role === 'seller') {
    query.seller = userId;
  } else {
    query.$or = [{ buyer: userId }, { seller: userId }];
  }

  if (status) {
    query.status = status;
  }

  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .populate([
      { path: 'buyer', select: '_id name campus avatar email' },
      { path: 'seller', select: '_id name campus avatar email' },
      {
        path: 'listing',
        select: '_id title category condition listingType price campus pickupLocation images status',
      },
    ]);

  return orders;
}

/**
 * Retrieves a single order by ID with authorization verification.
 */
export async function getOrderById(userId, orderId, userRole = 'student') {
  const order = await Order.findById(orderId).populate([
    { path: 'buyer', select: '_id name campus avatar email' },
    { path: 'seller', select: '_id name campus avatar email' },
    {
      path: 'listing',
      select: '_id title category condition listingType price campus pickupLocation images status',
    },
  ]);

  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  const isBuyer = order.buyer._id.toString() === userId.toString();
  const isSeller = order.seller._id.toString() === userId.toString();
  const isAdmin = userRole === 'admin';

  if (!isBuyer && !isSeller && !isAdmin) {
    const error = new Error('Forbidden: You are not authorized to view this order');
    error.statusCode = 403;
    throw error;
  }

  return order;
}

/**
 * Seller accepts order and confirms meetup location/schedule.
 */
export async function confirmOrder(userId, orderId, { pickupLocation, meetupNotes }) {
  const order = await Order.findById(orderId);
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  if (order.seller.toString() !== userId.toString()) {
    const error = new Error('Forbidden: Only the seller can confirm this order');
    error.statusCode = 403;
    throw error;
  }

  if (order.status !== 'PENDING') {
    const error = new Error(`Cannot confirm an order in ${order.status} state`);
    error.statusCode = 400;
    throw error;
  }

  order.status = 'CONFIRMED';
  if (pickupLocation) order.pickupLocation = pickupLocation;
  if (meetupNotes) order.meetupNotes = meetupNotes;

  order.timeline.push({
    action: 'SELLER_CONFIRMED',
    actor: userId,
    note: meetupNotes || 'Seller accepted order and confirmed handover plan',
    timestamp: new Date(),
  });

  await order.save();

  await order.populate([
    { path: 'buyer', select: '_id name campus avatar email' },
    { path: 'seller', select: '_id name campus avatar email' },
    {
      path: 'listing',
      select: '_id title category condition listingType price campus pickupLocation images status',
    },
  ]);

  return order;
}

/**
 * Confirms bilateral handover and payment at safe campus exchange point.
 * Once both buyer and seller confirm, order becomes COMPLETED and listing status becomes 'sold'.
 */
export async function confirmOrderHandover(userId, orderId, { note }) {
  const order = await Order.findById(orderId);
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  const isBuyer = order.buyer.toString() === userId.toString();
  const isSeller = order.seller.toString() === userId.toString();

  if (!isBuyer && !isSeller) {
    const error = new Error('Forbidden: You are not a participant in this order');
    error.statusCode = 403;
    throw error;
  }

  if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') {
    const error = new Error(`Cannot confirm handover for order in ${order.status} state`);
    error.statusCode = 400;
    throw error;
  }

  if (isBuyer) {
    if (order.handover.buyerConfirmed) {
      const error = new Error('You have already confirmed physical receipt and payment handover');
      error.statusCode = 400;
      throw error;
    }
    order.handover.buyerConfirmed = true;
    order.handover.buyerConfirmedAt = new Date();
    order.timeline.push({
      action: 'BUYER_HANDOVER_CONFIRMED',
      actor: userId,
      note: note || 'Buyer verified item condition and handed payment',
      timestamp: new Date(),
    });
  }

  if (isSeller) {
    if (order.handover.sellerConfirmed) {
      const error = new Error('You have already confirmed item handover and payment receipt');
      error.statusCode = 400;
      throw error;
    }
    order.handover.sellerConfirmed = true;
    order.handover.sellerConfirmedAt = new Date();
    order.timeline.push({
      action: 'SELLER_HANDOVER_CONFIRMED',
      actor: userId,
      note: note || 'Seller confirmed delivery of item and received payment',
      timestamp: new Date(),
    });
  }

  // Bilateral check: if BOTH have confirmed, complete order and mark listing sold
  if (order.handover.buyerConfirmed && order.handover.sellerConfirmed) {
    order.status = 'COMPLETED';
    order.paymentStatus = 'VERIFIED_UPON_HANDOVER';
    order.timeline.push({
      action: 'COMPLETED',
      actor: userId,
      note: 'Bilateral handover and payment verified. Order completed.',
      timestamp: new Date(),
    });

    await Listing.findByIdAndUpdate(order.listing, { status: 'sold' });
  }

  await order.save();

  await order.populate([
    { path: 'buyer', select: '_id name campus avatar email' },
    { path: 'seller', select: '_id name campus avatar email' },
    {
      path: 'listing',
      select: '_id title category condition listingType price campus pickupLocation images status',
    },
  ]);

  return order;
}

/**
 * Cancels an order before completion and unlocks the listing back to 'active'.
 */
export async function cancelOrder(userId, orderId, { reason }) {
  const order = await Order.findById(orderId);
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  const isBuyer = order.buyer ? order.buyer.toString() === userId.toString() : false;
  const isSeller = order.seller ? order.seller.toString() === userId.toString() : false;

  if (!isBuyer && !isSeller) {
    const error = new Error('Forbidden: You are not authorized to cancel this order');
    error.statusCode = 403;
    throw error;
  }

  // Pre-shipment check for Money Path orders
  if (order.fulfillmentStatus && ['SHIPPED', 'DELIVERED', 'RTO'].includes(order.fulfillmentStatus)) {
    const error = new Error('Cannot cancel an order that has already been shipped or delivered');
    error.statusCode = 400;
    throw error;
  }

  if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') {
    const error = new Error(`Cannot cancel an order in ${order.status} state`);
    error.statusCode = 400;
    throw error;
  }

  order.status = 'CANCELLED';
  order.cancellationReason = reason || 'Order cancelled prior to completion';
  order.paymentStatus = 'CANCELLED';

  order.timeline.push({
    action: 'CANCELLED',
    actor: userId,
    note: reason ? `Cancelled: ${reason}` : 'Order cancelled prior to completion',
    timestamp: new Date(),
  });

  // Atomically unlock listing back to 'active'
  await Listing.findByIdAndUpdate(order.listing, { status: 'active' });

  await order.save();

  await order.populate([
    { path: 'buyer', select: '_id name campus avatar email' },
    { path: 'seller', select: '_id name campus avatar email' },
    {
      path: 'listing',
      select: '_id title category condition listingType price campus pickupLocation images status',
    },
  ]);

  return order;
}

/**
 * Flags a purchase order dispute for campus mediator review.
 */
export async function disputeOrder(userId, orderId, { reason }) {
  const order = await Order.findById(orderId);
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  const isBuyer = order.buyer.toString() === userId.toString();
  const isSeller = order.seller.toString() === userId.toString();

  if (!isBuyer && !isSeller) {
    const error = new Error('Forbidden: You are not authorized to dispute this order');
    error.statusCode = 403;
    throw error;
  }

  if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') {
    const error = new Error(`Cannot dispute an order in ${order.status} state`);
    error.statusCode = 400;
    throw error;
  }

  order.status = 'DISPUTED';
  order.timeline.push({
    action: 'DISPUTED',
    actor: userId,
    note: `Dispute filed: ${reason}`,
    timestamp: new Date(),
  });

  await order.save();

  await order.populate([
    { path: 'buyer', select: '_id name campus avatar email' },
    { path: 'seller', select: '_id name campus avatar email' },
    {
      path: 'listing',
      select: '_id title category condition listingType price campus pickupLocation images status',
    },
  ]);

  return order;
}
