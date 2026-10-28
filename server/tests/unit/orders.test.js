import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import Order from '../../src/modules/orders/orderModel.js';
import Listing from '../../src/modules/listings/listingModel.js';
import User from '../../src/modules/users/userModel.js';
import { signToken } from '../../src/modules/authentication/authService.js';

describe('Campus Orders & Purchase Lifecycle Module', () => {
  const buyerUser = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Maya Buyer',
    email: 'maya@campus.edu',
    role: 'student',
    campus: 'North Quad',
    isActive: true,
  };

  const sellerUser = {
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

  let buyerToken;
  let sellerToken;
  let thirdToken;

  beforeEach(() => {
    vi.restoreAllMocks();
    buyerToken = signToken(buyerUser);
    sellerToken = signToken(sellerUser);
    thirdToken = signToken(thirdUser);
  });

  describe('1. Purchase Order Creation & Concurrency Guard', () => {
    it('should reject unauthenticated order request with 401', async () => {
      const res = await request(app).post('/api/orders').send({
        listingId,
      });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('fail');
    });

    it('should reject invalid listing ID format with 400', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(buyerUser);

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          listingId: 'invalid-id-123',
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
    });

    it('should reject self-purchase attempts with 400', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(sellerUser);
      vi.spyOn(Listing, 'findById').mockResolvedValue({
        _id: listingId,
        seller: { toString: () => sellerUser._id },
        listingType: 'buy',
        price: 35,
        status: 'active',
      });

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          listingId,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('cannot purchase your own listing');
    });

    it('should reject purchase when listing is swap-only with 400', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(buyerUser);
      vi.spyOn(Listing, 'findById').mockResolvedValue({
        _id: listingId,
        seller: { toString: () => sellerUser._id },
        listingType: 'swap',
        status: 'active',
      });

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          listingId,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('not offered for outright purchase');
    });

    it('should reject purchase with 409 Conflict if listing is already reserved or rented (race condition guard)', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(buyerUser);
      vi.spyOn(Listing, 'findById').mockResolvedValue({
        _id: listingId,
        seller: { toString: () => sellerUser._id },
        listingType: 'buy',
        price: 45,
        status: 'active',
      });

      // Atomic conditional update fails because another concurrent request already reserved/rented it
      vi.spyOn(Listing, 'findOneAndUpdate').mockResolvedValue(null);

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          listingId,
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('no longer available for purchase');
    });

    it('should create order and atomically lock listing to reserved status (201)', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(buyerUser);
      vi.spyOn(Listing, 'findById').mockResolvedValue({
        _id: listingId,
        seller: { toString: () => sellerUser._id },
        listingType: 'buy',
        price: 30,
        status: 'active',
      });

      const findOneAndUpdateSpy = vi.spyOn(Listing, 'findOneAndUpdate').mockResolvedValue({
        _id: listingId,
        status: 'reserved',
      });

      const mockSavedOrder = {
        _id: orderId,
        buyer: buyerUser,
        seller: sellerUser,
        listing: { _id: listingId, title: 'Economics Textbook', price: 30 },
        itemPrice: 30,
        serviceFee: 0,
        totalAmount: 30,
        paymentMethod: 'CAMPUS_HANDOVER',
        paymentStatus: 'PENDING',
        status: 'PENDING',
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockImplementation(async function () {
          return this;
        }),
      };

      vi.spyOn(Order.prototype, 'save').mockImplementation(async function () {
        Object.assign(this, mockSavedOrder);
        return this;
      });
      vi.spyOn(Order.prototype, 'populate').mockImplementation(async function () {
        return mockSavedOrder;
      });

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          listingId,
          pickupLocation: 'Campus Student Center',
          meetupNotes: 'Available after 3pm',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.order.totalAmount).toBe(30);
      expect(res.body.data.order.serviceFee).toBe(0);
      expect(res.body.data.order.status).toBe('PENDING');
      expect(findOneAndUpdateSpy).toHaveBeenCalledWith(
        { _id: listingId, status: 'active' },
        { status: 'reserved' },
        { new: true }
      );
    });
  });

  describe('2. Order Querying & Access Control', () => {
    it('should list orders for authenticated buyer', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(buyerUser);
      vi.spyOn(Order, 'find').mockReturnValue({
        sort: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue([
            { _id: orderId, buyer: buyerUser, seller: sellerUser, totalAmount: 30 },
          ]),
        }),
      });

      const res = await request(app)
        .get('/api/orders?role=buyer')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.orders).toHaveLength(1);
    });

    it('should reject unauthorized 3rd party from reading order with 403', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(thirdUser);
      vi.spyOn(Order, 'findById').mockReturnValue({
        populate: vi.fn().mockResolvedValue({
          _id: orderId,
          buyer: { _id: { toString: () => buyerUser._id } },
          seller: { _id: { toString: () => sellerUser._id } },
        }),
      });

      const res = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${thirdToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('not authorized');
    });
  });

  describe('3. Seller Order Confirmation', () => {
    it('should allow seller to confirm order and update pickup notes', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(sellerUser);

      const mockOrder = {
        _id: orderId,
        seller: { toString: () => sellerUser._id },
        buyer: buyerUser,
        status: 'PENDING',
        timeline: [],
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockImplementation(async function () {
          return this;
        }),
      };

      vi.spyOn(Order, 'findById').mockResolvedValue(mockOrder);

      const res = await request(app)
        .patch(`/api/orders/${orderId}/confirm`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          pickupLocation: 'Library Front Desk',
          meetupNotes: 'See you Tuesday at 4pm',
        });

      expect(res.status).toBe(200);
      expect(mockOrder.status).toBe('CONFIRMED');
      expect(mockOrder.pickupLocation).toBe('Library Front Desk');
      expect(mockOrder.timeline[0].action).toBe('SELLER_CONFIRMED');
    });

    it('should reject non-seller attempting to confirm order with 403', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(buyerUser);

      vi.spyOn(Order, 'findById').mockResolvedValue({
        _id: orderId,
        seller: { toString: () => sellerUser._id },
        status: 'PENDING',
      });

      const res = await request(app)
        .patch(`/api/orders/${orderId}/confirm`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({});

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Only the seller');
    });
  });

  describe('4. Bilateral Handover & Inventory Sale Completion', () => {
    it('should record handover when buyer confirms first, remaining in CONFIRMED', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(buyerUser);

      const mockOrder = {
        _id: orderId,
        buyer: { toString: () => buyerUser._id },
        seller: { toString: () => sellerUser._id },
        status: 'CONFIRMED',
        handover: { buyerConfirmed: false, sellerConfirmed: false },
        timeline: [],
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockImplementation(async function () {
          return this;
        }),
      };

      vi.spyOn(Order, 'findById').mockResolvedValue(mockOrder);

      const res = await request(app)
        .patch(`/api/orders/${orderId}/handover`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ note: 'Received item in great shape' });

      expect(res.status).toBe(200);
      expect(mockOrder.handover.buyerConfirmed).toBe(true);
      expect(mockOrder.status).toBe('CONFIRMED'); // Still confirmed until seller also verifies
    });

    it('should complete order and permanently mark listing as sold when seller also confirms (bilateral complete)', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(sellerUser);
      const updateListingSpy = vi.spyOn(Listing, 'findByIdAndUpdate').mockResolvedValue({});

      const mockOrder = {
        _id: orderId,
        buyer: { toString: () => buyerUser._id },
        seller: { toString: () => sellerUser._id },
        listing: listingId,
        status: 'CONFIRMED',
        handover: {
          buyerConfirmed: true, // Already confirmed by buyer
          sellerConfirmed: false,
        },
        timeline: [],
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockImplementation(async function () {
          return this;
        }),
      };

      vi.spyOn(Order, 'findById').mockResolvedValue(mockOrder);

      const res = await request(app)
        .patch(`/api/orders/${orderId}/handover`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ note: 'Handed over textbook and received cash' });

      expect(res.status).toBe(200);
      expect(mockOrder.status).toBe('COMPLETED');
      expect(mockOrder.paymentStatus).toBe('VERIFIED_UPON_HANDOVER');
      expect(mockOrder.handover.sellerConfirmed).toBe(true);
      expect(updateListingSpy).toHaveBeenCalledWith(listingId, { status: 'sold' });
    });
  });

  describe('5. Order Cancellation & Listing Unlock', () => {
    it('should cancel order and atomically unlock listing back to active', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(buyerUser);
      const updateListingSpy = vi.spyOn(Listing, 'findByIdAndUpdate').mockResolvedValue({});

      const mockOrder = {
        _id: orderId,
        buyer: { toString: () => buyerUser._id },
        seller: { toString: () => sellerUser._id },
        listing: listingId,
        status: 'PENDING',
        timeline: [],
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockImplementation(async function () {
          return this;
        }),
      };

      vi.spyOn(Order, 'findById').mockResolvedValue(mockOrder);

      const res = await request(app)
        .patch(`/api/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ reason: 'Found textbook in campus library' });

      expect(res.status).toBe(200);
      expect(mockOrder.status).toBe('CANCELLED');
      expect(mockOrder.paymentStatus).toBe('CANCELLED');
      expect(mockOrder.cancellationReason).toBe('Found textbook in campus library');
      expect(updateListingSpy).toHaveBeenCalledWith(listingId, { status: 'active' });
    });

    it('should reject cancelling an already COMPLETED order with 400', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(buyerUser);

      vi.spyOn(Order, 'findById').mockResolvedValue({
        _id: orderId,
        buyer: { toString: () => buyerUser._id },
        seller: { toString: () => sellerUser._id },
        status: 'COMPLETED',
      });

      const res = await request(app)
        .patch(`/api/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ reason: 'Cannot cancel' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot cancel an order in COMPLETED state');
    });

    it('should allow participant to escalate a dispute', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(buyerUser);

      const mockOrder = {
        _id: orderId,
        buyer: { toString: () => buyerUser._id },
        seller: { toString: () => sellerUser._id },
        status: 'CONFIRMED',
        timeline: [],
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockImplementation(async function () {
          return this;
        }),
      };

      vi.spyOn(Order, 'findById').mockResolvedValue(mockOrder);

      const res = await request(app)
        .patch(`/api/orders/${orderId}/dispute`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ reason: 'Seller did not appear at scheduled meetup location' });

      expect(res.status).toBe(200);
      expect(mockOrder.status).toBe('DISPUTED');
    });
  });
});
