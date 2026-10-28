import Review from './reviewModel.js';
import Order from '../orders/orderModel.js';
import Rental from '../rentals/rentalModel.js';
import Swap from '../swaps/swapModel.js';
import Listing from '../listings/listingModel.js';

/**
 * Submits an authentic peer review for a completed transaction.
 * Strictly verifies completed transaction participation and prevents duplicate reviews.
 */
export async function createReview(authorId, data) {
  // Prevent self-reviews
  if (authorId.toString() === data.targetUserId.toString()) {
    const error = new Error('You cannot review yourself');
    error.statusCode = 400;
    throw error;
  }

  // Check for duplicate review on this transaction
  const existingReview = await Review.findOne({
    author: authorId,
    transactionId: data.transactionId,
  });

  if (existingReview) {
    const error = new Error('You have already submitted a review for this transaction');
    error.statusCode = 409;
    throw error;
  }

  // Transaction verification based on type
  if (data.transactionType === 'PURCHASE') {
    const order = await Order.findById(data.transactionId);
    if (!order) {
      const error = new Error('Associated purchase order not found');
      error.statusCode = 404;
      throw error;
    }

    if (order.status !== 'COMPLETED') {
      const error = new Error(`Reviews can only be submitted for completed transactions (current status: ${order.status})`);
      error.statusCode = 400;
      throw error;
    }

    const isBuyer = order.buyer.toString() === authorId.toString();
    const isSeller = order.seller.toString() === authorId.toString();

    if (!isBuyer && !isSeller) {
      const error = new Error('Forbidden: You were not a participant in this transaction');
      error.statusCode = 403;
      throw error;
    }

    if (isBuyer && order.seller.toString() !== data.targetUserId.toString()) {
      const error = new Error('Target user does not match the seller of this order');
      error.statusCode = 400;
      throw error;
    }

    if (isSeller && order.buyer.toString() !== data.targetUserId.toString()) {
      const error = new Error('Target user does not match the buyer of this order');
      error.statusCode = 400;
      throw error;
    }
  } else if (data.transactionType === 'RENTAL') {
    const rental = await Rental.findById(data.transactionId);
    if (!rental) {
      const error = new Error('Associated rental agreement not found');
      error.statusCode = 404;
      throw error;
    }

    if (rental.status !== 'COMPLETED') {
      const error = new Error(`Reviews can only be submitted for completed rentals (current status: ${rental.status})`);
      error.statusCode = 400;
      throw error;
    }

    const isRenter = rental.renter.toString() === authorId.toString();
    const isOwner = rental.owner.toString() === authorId.toString();

    if (!isRenter && !isOwner) {
      const error = new Error('Forbidden: You were not a participant in this rental agreement');
      error.statusCode = 403;
      throw error;
    }

    if (isRenter && rental.owner.toString() !== data.targetUserId.toString()) {
      const error = new Error('Target user does not match the owner of this rental');
      error.statusCode = 400;
      throw error;
    }

    if (isOwner && rental.renter.toString() !== data.targetUserId.toString()) {
      const error = new Error('Target user does not match the borrower of this rental');
      error.statusCode = 400;
      throw error;
    }
  } else if (data.transactionType === 'SWAP') {
    const swap = await Swap.findById(data.transactionId);
    if (!swap) {
      const error = new Error('Associated swap agreement not found');
      error.statusCode = 404;
      throw error;
    }

    if (swap.status !== 'COMPLETED') {
      const error = new Error(`Reviews can only be submitted for completed swaps (current status: ${swap.status})`);
      error.statusCode = 400;
      throw error;
    }

    const isProposer = swap.proposer.toString() === authorId.toString();
    const isRecipient = swap.recipient.toString() === authorId.toString();

    if (!isProposer && !isRecipient) {
      const error = new Error('Forbidden: You were not a participant in this circular swap');
      error.statusCode = 403;
      throw error;
    }

    if (isProposer && swap.recipient.toString() !== data.targetUserId.toString()) {
      const error = new Error('Target user does not match the recipient of this swap');
      error.statusCode = 400;
      throw error;
    }

    if (isRecipient && swap.proposer.toString() !== data.targetUserId.toString()) {
      const error = new Error('Target user does not match the proposer of this swap');
      error.statusCode = 400;
      throw error;
    }
  }

  const review = new Review({
    author: authorId,
    targetUser: data.targetUserId,
    listing: data.listingId,
    transactionType: data.transactionType,
    transactionId: data.transactionId,
    rating: data.rating,
    reviewText: data.reviewText,
    criteria: {
      itemConditionAsDescribed: data.itemConditionAsDescribed ?? true,
      punctualHandover: data.punctualHandover ?? true,
      communication: data.communication ?? 5,
    },
    isVerifiedTransaction: true,
  });

  await review.save();

  await review.populate([
    { path: 'author', select: '_id name campus avatar' },
    { path: 'targetUser', select: '_id name campus avatar' },
    { path: 'listing', select: '_id title category condition listingType price' },
  ]);

  return review;
}

/**
 * Retrieves reviews and aggregate trust metrics for a campus user.
 */
export async function getReviewsForUser(userId) {
  const reviews = await Review.find({ targetUser: userId })
    .sort({ createdAt: -1 })
    .populate([
      { path: 'author', select: '_id name campus avatar' },
      { path: 'listing', select: '_id title category condition listingType price' },
    ]);

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? Math.round((reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews) * 10) / 10
      : 5.0;

  const accurateCount = reviews.filter((r) => r.criteria?.itemConditionAsDescribed).length;
  const conditionAccuracyRate =
    totalReviews > 0 ? Math.round((accurateCount / totalReviews) * 100) : 100;

  const punctualCount = reviews.filter((r) => r.criteria?.punctualHandover).length;
  const punctualityRate =
    totalReviews > 0 ? Math.round((punctualCount / totalReviews) * 100) : 100;

  const verifiedCount = reviews.filter((r) => r.isVerifiedTransaction).length;

  return {
    reviews,
    trustMetrics: {
      averageRating,
      totalReviews,
      verifiedCount,
      conditionAccuracyRate,
      punctualityRate,
    },
  };
}

/**
 * Retrieves reviews associated with a specific listing.
 */
export async function getReviewsForListing(listingId) {
  const reviews = await Review.find({ listing: listingId })
    .sort({ createdAt: -1 })
    .populate([{ path: 'author', select: '_id name campus avatar' }]);

  return reviews;
}

/**
 * Retrieves reviews authored by the authenticated student.
 */
export async function getMySubmittedReviews(userId) {
  const reviews = await Review.find({ author: userId })
    .sort({ createdAt: -1 })
    .populate([
      { path: 'targetUser', select: '_id name campus avatar' },
      { path: 'listing', select: '_id title category condition listingType price' },
    ]);

  return reviews;
}
