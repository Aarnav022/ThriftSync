import * as reviewService from './reviewService.js';

export async function handleCreateReview(req, res, next) {
  try {
    const review = await reviewService.createReview(req.user._id, req.body);
    return res.status(201).json({
      status: 'success',
      message: 'Peer review submitted successfully',
      data: { review },
    });
  } catch (error) {
    next(error);
  }
}

export async function handleGetUserReviews(req, res, next) {
  try {
    const data = await reviewService.getReviewsForUser(req.params.userId);
    return res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleGetListingReviews(req, res, next) {
  try {
    const reviews = await reviewService.getReviewsForListing(req.params.listingId);
    return res.status(200).json({
      status: 'success',
      data: {
        reviews,
        count: reviews.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function handleGetMyReviews(req, res, next) {
  try {
    const reviews = await reviewService.getMySubmittedReviews(req.user._id);
    return res.status(200).json({
      status: 'success',
      data: {
        reviews,
        count: reviews.length,
      },
    });
  } catch (error) {
    next(error);
  }
}
