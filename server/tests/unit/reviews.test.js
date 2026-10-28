import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import Review from '../../src/modules/reviews/reviewModel.js';
import Order from '../../src/modules/orders/orderModel.js';
import Rental from '../../src/modules/rentals/rentalModel.js';
import Swap from '../../src/modules/swaps/swapModel.js';
import User from '../../src/modules/users/userModel.js';
import { signToken } from '../../src/modules/authentication/authService.js';

describe('Campus Peer Reviews & Trust Metrics Module', () => {
  const reviewerUser = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Maya Reviewer',
    email: 'maya@campus.edu',
    role: 'student',
    campus: 'North Quad',
    isActive: true,
  };

  const targetPeer = {
    _id: '507f1f77bcf86cd799439022',
    name: 'David Seller',
    email: 'david@campus.edu',
    role: 'student',
    campus: 'East Campus',
    isActive: true,
  };

  const thirdUser = {
    _id: '507f1f77bcf86cd799439033',
    name: 'Jordan Third',
    email: 'jordan@campus.edu',
    role: 'student',
    campus: 'West Quad',
    isActive: true,
  };

  const listingId = '607f1f77bcf86cd799439101';
  const orderId = '807f1f77bcf86cd799439301';
  const rentalId = '707f1f77bcf86cd799439201';
  const swapId = '907f1f77bcf86cd799439401';
  const reviewId = 'a07f1f77bcf86cd799439501';

  let reviewerToken;
  let targetToken;
  let thirdToken;

  beforeEach(() => {
    vi.restoreAllMocks();
    reviewerToken = signToken(reviewerUser);
    targetToken = signToken(targetPeer);
    thirdToken = signToken(thirdUser);
  });

  describe('1. Review Submission Constraints & Validation', () => {
    it('should reject unauthenticated review submission with 401', async () => {
      const res = await request(app).post('/api/reviews').send({
        targetUserId: targetPeer._id,
        listingId,
        transactionType: 'PURCHASE',
        transactionId: orderId,
        rating: 5,
        reviewText: 'Great campus experience!',
      });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('fail');
    });

    it('should reject self-review attempts with 400', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(reviewerUser);

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({
          targetUserId: reviewerUser._id, // Self-review
          listingId,
          transactionType: 'PURCHASE',
          transactionId: orderId,
          rating: 5,
          reviewText: 'Reviewing myself',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('cannot review yourself');
    });

    it('should reject rating values outside 1-5 with 400', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(reviewerUser);

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({
          targetUserId: targetPeer._id,
          listingId,
          transactionType: 'PURCHASE',
          transactionId: orderId,
          rating: 6, // Invalid rating
          reviewText: 'Too many stars',
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
    });

    it('should reject review when transaction is not completed with 400', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(reviewerUser);
      vi.spyOn(Review, 'findOne').mockResolvedValue(null);

      // Order is still PENDING
      vi.spyOn(Order, 'findById').mockResolvedValue({
        _id: orderId,
        buyer: { toString: () => reviewerUser._id },
        seller: { toString: () => targetPeer._id },
        status: 'PENDING',
      });

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({
          targetUserId: targetPeer._id,
          listingId,
          transactionType: 'PURCHASE',
          transactionId: orderId,
          rating: 5,
          reviewText: 'Cannot review pending order',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('only be submitted for completed transactions');
    });

    it('should reject non-participant attempting to review with 403', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(thirdUser);
      vi.spyOn(Review, 'findOne').mockResolvedValue(null);

      // Order was between reviewerUser and targetPeer
      vi.spyOn(Order, 'findById').mockResolvedValue({
        _id: orderId,
        buyer: { toString: () => reviewerUser._id },
        seller: { toString: () => targetPeer._id },
        status: 'COMPLETED',
      });

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${thirdToken}`)
        .send({
          targetUserId: targetPeer._id,
          listingId,
          transactionType: 'PURCHASE',
          transactionId: orderId,
          rating: 5,
          reviewText: 'I did not buy this item',
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('not a participant');
    });

    it('should prevent duplicate reviews on the same completed transaction with 409', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(reviewerUser);

      // Existing review already found
      vi.spyOn(Review, 'findOne').mockResolvedValue({
        _id: 'existing-review-id',
        author: reviewerUser._id,
        transactionId: orderId,
      });

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({
          targetUserId: targetPeer._id,
          listingId,
          transactionType: 'PURCHASE',
          transactionId: orderId,
          rating: 5,
          reviewText: 'Duplicate attempt',
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already submitted a review for this transaction');
    });

    it('should successfully submit verified review for a completed purchase order (201)', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(reviewerUser);
      vi.spyOn(Review, 'findOne').mockResolvedValue(null);

      vi.spyOn(Order, 'findById').mockResolvedValue({
        _id: orderId,
        buyer: { toString: () => reviewerUser._id },
        seller: { toString: () => targetPeer._id },
        status: 'COMPLETED',
      });

      const mockSavedReview = {
        _id: reviewId,
        author: reviewerUser,
        targetUser: targetPeer,
        listing: { _id: listingId, title: 'Calculus Textbook' },
        transactionType: 'PURCHASE',
        transactionId: orderId,
        rating: 5,
        reviewText: 'Item was in pristine condition, very punctual handover!',
        criteria: { itemConditionAsDescribed: true, punctualHandover: true, communication: 5 },
        isVerifiedTransaction: true,
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockImplementation(async function () {
          return this;
        }),
      };

      vi.spyOn(Review.prototype, 'save').mockImplementation(async function () {
        Object.assign(this, mockSavedReview);
        return this;
      });
      vi.spyOn(Review.prototype, 'populate').mockImplementation(async function () {
        return mockSavedReview;
      });

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({
          targetUserId: targetPeer._id,
          listingId,
          transactionType: 'PURCHASE',
          transactionId: orderId,
          rating: 5,
          reviewText: 'Item was in pristine condition, very punctual handover!',
          itemConditionAsDescribed: true,
          punctualHandover: true,
          communication: 5,
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.review.isVerifiedTransaction).toBe(true);
      expect(res.body.data.review.rating).toBe(5);
    });
  });

  describe('2. Trust Metrics Aggregation & Queries', () => {
    it('should aggregate user trust scores and punctuality metrics', async () => {
      const mockReviews = [
        {
          _id: 'rev-1',
          rating: 5,
          criteria: { itemConditionAsDescribed: true, punctualHandover: true },
          isVerifiedTransaction: true,
        },
        {
          _id: 'rev-2',
          rating: 4,
          criteria: { itemConditionAsDescribed: true, punctualHandover: false },
          isVerifiedTransaction: true,
        },
      ];

      vi.spyOn(Review, 'find').mockReturnValue({
        sort: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue(mockReviews),
        }),
      });

      const res = await request(app).get(`/api/reviews/user/${targetPeer._id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.trustMetrics.totalReviews).toBe(2);
      expect(res.body.data.trustMetrics.averageRating).toBe(4.5); // (5 + 4) / 2
      expect(res.body.data.trustMetrics.conditionAccuracyRate).toBe(100); // 2 of 2
      expect(res.body.data.trustMetrics.punctualityRate).toBe(50); // 1 of 2
      expect(res.body.data.trustMetrics.verifiedCount).toBe(2);
    });

    it('should retrieve reviews for a specific listing', async () => {
      vi.spyOn(Review, 'find').mockReturnValue({
        sort: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue([
            { _id: 'rev-1', rating: 5, reviewText: 'Loved the textbook' },
          ]),
        }),
      });

      const res = await request(app).get(`/api/reviews/listing/${listingId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.reviews).toHaveLength(1);
    });

    it('should retrieve student user own submitted reviews', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(reviewerUser);
      vi.spyOn(Review, 'find').mockReturnValue({
        sort: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue([
            { _id: 'rev-1', author: reviewerUser._id, rating: 5 },
          ]),
        }),
      });

      const res = await request(app)
        .get('/api/reviews/mine')
        .set('Authorization', `Bearer ${reviewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.reviews).toHaveLength(1);
    });
  });
});
