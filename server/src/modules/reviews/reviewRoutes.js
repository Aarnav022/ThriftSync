import express from 'express';
import {
  handleCreateReview,
  handleGetUserReviews,
  handleGetListingReviews,
  handleGetMyReviews,
} from './reviewController.js';
import requireAuthentication from '../../middleware/requireAuthentication.js';
import validateRequest from '../../middleware/validateRequest.js';
import { createReviewSchema } from './reviewValidation.js';

const router = express.Router();

// Publicly viewable peer trust metrics and reviews
router.get('/user/:userId', handleGetUserReviews);
router.get('/listing/:listingId', handleGetListingReviews);

// Protected reviewer actions
router.post('/', requireAuthentication, validateRequest(createReviewSchema), handleCreateReview);
router.get('/mine', requireAuthentication, handleGetMyReviews);

export default router;
