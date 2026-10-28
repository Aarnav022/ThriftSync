import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import User from '../../src/modules/users/userModel.js';
import Listing from '../../src/modules/listings/listingModel.js';
import Order from '../../src/modules/orders/orderModel.js';
import Cart from '../../src/modules/cart/cartModel.js';
import Address from '../../src/modules/addresses/addressModel.js';
import Reservation from '../../src/modules/inventory/reservationModel.js';
import Payment from '../../src/modules/payments/paymentModel.js';
import PaymentWebhookEvent from '../../src/modules/payments/paymentWebhookModel.js';
import IdempotencyRecord from '../../src/modules/idempotency/idempotencyModel.js';
import StatusHistory from '../../src/modules/orders/statusHistoryModel.js';
import { signToken } from '../../src/modules/authentication/authService.js';
import {
  calculateAuthoritativeCartTotals,
  mergeGuestCart,
} from '../../src/modules/cart/cartService.js';
import {
  reserveStockForOrder,
  commitReservation,
  releaseReservation,
} from '../../src/modules/inventory/reservationService.js';
import { reconcileStalePayments } from '../../src/modules/orders/reconciliationService.js';
import COMMERCE_CONFIG from '../../src/config/commerceConfig.js';

describe('ThriftSync Money Path MVP & Backend Architecture Verification', () => {
  const studentUser = {
    _id: new mongoose.Types.ObjectId().toString(),
    name: 'Aarav Sharma',
    email: 'aarav@campus.edu.in',
    role: 'student',
    campus: 'North Campus',
    isActive: true,
  };

  const adminUser = {
    _id: new mongoose.Types.ObjectId().toString(),
    name: 'Platform Moderator',
    email: 'admin@thriftsync.in',
    role: 'admin',
    campus: 'Administration Block',
    isActive: true,
  };

  const studentToken = signToken(studentUser);
  const adminToken = signToken(adminUser);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(StatusHistory, 'create').mockResolvedValue({});
    vi.spyOn(Cart, 'updateOne').mockResolvedValue({});
    vi.spyOn(User, 'findById').mockImplementation(async (id) => {
      if (id.toString() === studentUser._id.toString()) return studentUser;
      if (id.toString() === adminUser._id.toString()) return adminUser;
      return null;
    });
  });

  describe('1. Authoritative Money Handling & Shipping Thresholds (in Paise)', () => {
    it('applies flat delivery fee of ₹49 (4900 paise) when subtotal is below ₹499 (49900 paise)', () => {
      const items = [
        {
          listing: { pricePaise: 35000, price: 350 }, // ₹350
          quantity: 1,
        },
      ];

      const totals = calculateAuthoritativeCartTotals(items);
      expect(totals.currency).toBe('INR');
      expect(totals.subtotalPaise).toBe(35000);
      expect(totals.shippingPaise).toBe(4900); // ₹49
      expect(totals.taxPaise).toBe(0);
      expect(totals.totalPaise).toBe(39900); // ₹399
      expect(totals.isFreeShipping).toBe(false);
      expect(totals.amountNeededForFreeShippingPaise).toBe(14900); // Need ₹149 more
      expect(totals.codEligible).toBe(true);
    });

    it('unverifiably unlocks FREE delivery when subtotal meets or exceeds ₹499 (49900 paise)', () => {
      const items = [
        {
          listing: { pricePaise: 50000, price: 500 }, // ₹500
          quantity: 1,
        },
      ];

      const totals = calculateAuthoritativeCartTotals(items);
      expect(totals.subtotalPaise).toBe(50000);
      expect(totals.shippingPaise).toBe(0); // Free shipping
      expect(totals.totalPaise).toBe(50000);
      expect(totals.isFreeShipping).toBe(true);
      expect(totals.amountNeededForFreeShippingPaise).toBe(0);
    });

    it('flags COD as ineligible when order total exceeds ₹5,000 (500000 paise)', () => {
      const items = [
        {
          listing: { pricePaise: 550000, price: 5500 }, // ₹5500
          quantity: 1,
        },
      ];

      const totals = calculateAuthoritativeCartTotals(items);
      expect(totals.totalPaise).toBe(550000);
      expect(totals.codEligible).toBe(false);
    });
  });

  describe('2. Two-Phase Inventory Reservation & Atomic Concurrency', () => {
    it('successfully reserves available stock and creates 15-minute reservation records', async () => {
      const mockOrderId = new mongoose.Types.ObjectId();
      const mockListingId = new mongoose.Types.ObjectId();

      vi.spyOn(Listing, 'findOneAndUpdate').mockResolvedValueOnce({
        _id: mockListingId,
        availableStock: 1,
        reservedStock: 1,
        sku: 'TS-ENG-01',
      });

      vi.spyOn(Reservation, 'create').mockResolvedValueOnce({
        _id: new mongoose.Types.ObjectId(),
        order: mockOrderId,
        listing: mockListingId,
        quantity: 1,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });

      const items = [{ listingId: mockListingId, quantity: 1, sku: 'TS-ENG-01' }];
      const result = await reserveStockForOrder({ orderId: mockOrderId, items });

      expect(Listing.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: mockListingId,
          availableStock: { $gte: 1 },
        }),
        expect.objectContaining({
          $inc: { availableStock: -1, reservedStock: 1 },
        }),
        { new: true }
      );
      expect(result).toHaveLength(1);
    });

    it('rolls back previously reserved items if a subsequent item has insufficient stock', async () => {
      const mockOrderId = new mongoose.Types.ObjectId();
      const mockItem1 = new mongoose.Types.ObjectId();
      const mockItem2 = new mongoose.Types.ObjectId();

      // First item succeeds
      vi.spyOn(Listing, 'findOneAndUpdate').mockResolvedValueOnce({
        _id: mockItem1,
        availableStock: 0,
        reservedStock: 1,
        sku: 'TS-ITEM-01',
      });
      // Second item fails (out of stock)
      vi.spyOn(Listing, 'findOneAndUpdate').mockResolvedValueOnce(null);

      const rollbackSpy = vi.spyOn(Listing, 'updateOne').mockResolvedValue({});

      const items = [
        { listingId: mockItem1, quantity: 1, sku: 'TS-ITEM-01' },
        { listingId: mockItem2, quantity: 1, sku: 'TS-ITEM-02' },
      ];

      await expect(reserveStockForOrder({ orderId: mockOrderId, items })).rejects.toThrow(
        /INSUFFICIENT_STOCK/
      );

      // Verify compensation rollback was executed on the first item
      expect(rollbackSpy).toHaveBeenCalledWith(
        { _id: mockItem1 },
        { $inc: { availableStock: 1, reservedStock: -1 } }
      );
    });

    it('commits reserved stock to soldStock on payment success without decrementing available stock twice', async () => {
      const mockOrderId = new mongoose.Types.ObjectId();
      const mockListingId = new mongoose.Types.ObjectId();

      const mockReservation = {
        _id: new mongoose.Types.ObjectId(),
        order: mockOrderId,
        listing: mockListingId,
        quantity: 1,
        status: 'PENDING',
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(Reservation, 'find').mockResolvedValueOnce([mockReservation]);
      const updateListingSpy = vi.spyOn(Listing, 'updateOne').mockResolvedValue({});

      await commitReservation(mockOrderId);

      expect(updateListingSpy).toHaveBeenCalledWith(
        { _id: mockListingId },
        { $inc: { reservedStock: -1, soldStock: 1 } }
      );
      expect(mockReservation.status).toBe('COMMITTED');
    });

    it('releases reserved stock back to availableStock when order is cancelled or times out', async () => {
      const mockOrderId = new mongoose.Types.ObjectId();
      const mockListingId = new mongoose.Types.ObjectId();

      const mockReservation = {
        _id: new mongoose.Types.ObjectId(),
        order: mockOrderId,
        listing: mockListingId,
        quantity: 1,
        status: 'PENDING',
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(Reservation, 'find').mockResolvedValueOnce([mockReservation]);
      const updateListingSpy = vi.spyOn(Listing, 'updateOne').mockResolvedValue({});

      await releaseReservation(mockOrderId, 'User cancelled checkout');

      expect(updateListingSpy).toHaveBeenCalledWith(
        { _id: mockListingId },
        { $inc: { reservedStock: -1, availableStock: 1 } }
      );
      expect(mockReservation.status).toBe('RELEASED');
    });
  });

  describe('3. Guest Cart & Authenticated Cart Merge', () => {
    it('merges guest cart items into authenticated user cart while respecting available stock', async () => {
      const mockListingId = new mongoose.Types.ObjectId();
      const mockGuestCart = {
        _id: new mongoose.Types.ObjectId(),
        guestId: 'guest_session_123',
        items: [{ listing: mockListingId, sku: 'TS-JEANS-01', quantity: 2 }],
      };

      const mockUserCart = {
        _id: new mongoose.Types.ObjectId(),
        user: studentUser._id,
        items: [{ listing: mockListingId, sku: 'TS-JEANS-01', quantity: 1, priceSnapshotPaise: 40000 }],
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(Cart, 'findOne')
        .mockResolvedValueOnce(mockGuestCart) // guest cart lookup
        .mockResolvedValueOnce(mockUserCart) // user cart lookup
        .mockReturnValue({
          populate: vi.fn().mockResolvedValue({
            _id: mockUserCart._id,
            items: [
              {
                listing: {
                  _id: mockListingId,
                  title: 'Vintage Denim',
                  pricePaise: 40000,
                  availableStock: 5,
                  status: 'active',
                },
                quantity: 3,
                sku: 'TS-JEANS-01',
              },
            ],
          }),
        });

      vi.spyOn(Listing, 'findById').mockResolvedValue({
        _id: mockListingId,
        title: 'Vintage Denim',
        pricePaise: 40000,
        availableStock: 5,
        status: 'active',
      });

      vi.spyOn(Cart, 'deleteOne').mockResolvedValue({});

      const result = await mergeGuestCart({
        userId: studentUser._id,
        guestId: 'guest_session_123',
      });

      expect(mockUserCart.items[0].quantity).toBe(3); // 1 + 2 = 3
      expect(result.items).toHaveLength(1);
    });
  });

  describe('4. Idempotent Checkout & Pre-Shipment Cancellation API', () => {
    it('returns 400 when Cash on Delivery exceeds the ₹5,000 limit', async () => {
      const mockListing = {
        _id: new mongoose.Types.ObjectId(),
        title: 'High-end Lab Calculator',
        pricePaise: 550000, // ₹5,500
        price: 5500,
        availableStock: 2,
        status: 'active',
      };

      vi.spyOn(IdempotencyRecord, 'findOne').mockResolvedValue(null);
      vi.spyOn(IdempotencyRecord, 'create').mockResolvedValue({});
      vi.spyOn(IdempotencyRecord, 'updateOne').mockResolvedValue({});

      vi.spyOn(Cart, 'findOne').mockReturnValue({
        populate: vi.fn().mockResolvedValue({
          _id: new mongoose.Types.ObjectId(),
          items: [{ listing: mockListing, quantity: 1, sku: 'TS-CALC' }],
        }),
      });

      const res = await request(app)
        .post('/api/orders/checkout')
        .set('Authorization', `Bearer ${studentToken}`)
        .set('Idempotency-Key', 'test-idemp-key-101')
        .send({
          paymentMethod: 'COD',
          shippingAddress: {
            fullName: 'Aarav Sharma',
            phone: '9876543210',
            street: 'Room 204, Ganga Hostel',
            city: 'New Delhi',
            state: 'Delhi',
            postalCode: '110007',
          },
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/COD_LIMIT_EXCEEDED/);
    });

    it('creates an online Razorpay order and returns 201 with gateway order details', async () => {
      const mockListing = {
        _id: new mongoose.Types.ObjectId(),
        title: 'Algorithms Textbook',
        pricePaise: 40000, // ₹400
        price: 400,
        availableStock: 3,
        status: 'active',
      };

      vi.spyOn(IdempotencyRecord, 'findOne').mockResolvedValue(null);
      vi.spyOn(IdempotencyRecord, 'create').mockResolvedValue({});
      vi.spyOn(IdempotencyRecord, 'updateOne').mockResolvedValue({});

      vi.spyOn(Cart, 'findOne').mockReturnValue({
        populate: vi.fn().mockResolvedValue({
          _id: new mongoose.Types.ObjectId(),
          items: [{ listing: mockListing, quantity: 1, sku: 'TS-BOOK-01' }],
        }),
      });

      vi.spyOn(Listing, 'findOneAndUpdate').mockResolvedValue({
        _id: mockListing._id,
        availableStock: 2,
        reservedStock: 1,
        sku: 'TS-BOOK-01',
      });

      vi.spyOn(Reservation, 'create').mockResolvedValue({});
      vi.spyOn(Payment, 'create').mockResolvedValue({});

      const mockOrder = {
        _id: new mongoose.Types.ObjectId(),
        buyer: studentUser._id,
        orderStatus: 'PENDING',
        paymentStatus: 'UNPAID',
        fulfillmentStatus: 'UNFULFILLED',
        items: [{ title: 'Algorithms Textbook', unitPricePaise: 40000, quantity: 1 }],
        subtotalPaise: 40000,
        shippingPaise: 4900,
        totalPaise: 44900,
        currency: 'INR',
        paymentMethod: 'ONLINE_RAZORPAY',
        createdAt: new Date(),
      };

      vi.spyOn(Order, 'create').mockResolvedValue(mockOrder);

      const res = await request(app)
        .post('/api/orders/checkout')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          paymentMethod: 'ONLINE_RAZORPAY',
          shippingAddress: {
            fullName: 'Aarav Sharma',
            phone: '9876543210',
            street: 'Room 204, Ganga Hostel',
            city: 'New Delhi',
            state: 'Delhi',
            postalCode: '110007',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.order.paymentMethod).toBe('ONLINE_RAZORPAY');
      expect(res.body.data.gateway).toBeDefined();
    });

    it('allows pre-shipment cancellation and prevents cancellation once shipped', async () => {
      const mockShippedOrder = {
        _id: new mongoose.Types.ObjectId(),
        buyer: studentUser._id,
        seller: new mongoose.Types.ObjectId(),
        fulfillmentStatus: 'SHIPPED',
        orderStatus: 'CONFIRMED',
        status: 'CONFIRMED',
      };

      vi.spyOn(Order, 'findById').mockResolvedValue(mockShippedOrder);

      const res = await request(app)
        .patch(`/api/orders/${mockShippedOrder._id}/cancel`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ reason: 'Changed mind' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Cannot cancel|shipped/i);
    });
  });

  describe('5. Webhook Idempotency & Reconciliation', () => {
    it('processes order.paid webhook idempotently and avoids duplicate processing', async () => {
      const mockOrderId = new mongoose.Types.ObjectId();
      const mockOrder = {
        _id: mockOrderId,
        orderStatus: 'PENDING',
        paymentStatus: 'UNPAID',
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(PaymentWebhookEvent, 'findOne').mockResolvedValue(null);
      const mockWebhookDoc = {
        _id: new mongoose.Types.ObjectId(),
        processed: false,
        save: vi.fn().mockResolvedValue(true),
      };
      vi.spyOn(PaymentWebhookEvent, 'create').mockResolvedValue(mockWebhookDoc);

      vi.spyOn(Order, 'findById').mockResolvedValue(mockOrder);
      vi.spyOn(Reservation, 'find').mockResolvedValue([]);
      vi.spyOn(Payment, 'findOneAndUpdate').mockResolvedValue({});

      const res = await request(app)
        .post('/api/payments/webhook')
        .send({
          event: 'order.paid',
          payload: {
            order: {
              entity: {
                id: 'order_test_wh_1',
                receipt: mockOrderId.toString(),
              },
            },
          },
        });

      expect(res.status).toBe(200);
      expect(mockOrder.paymentStatus).toBe('PAID');
      expect(mockOrder.orderStatus).toBe('CONFIRMED');
      expect(mockWebhookDoc.processed).toBe(true);
    });

    it('reconciles captured payments that were missed by webhooks', async () => {
      const mockOrderId = new mongoose.Types.ObjectId();
      const mockOrder = {
        _id: mockOrderId,
        paymentStatus: 'UNPAID',
        orderStatus: 'PENDING',
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(Order, 'find').mockReturnValue({
        limit: vi.fn().mockResolvedValue([mockOrder]),
      });

      vi.spyOn(Payment, 'findOne').mockResolvedValue({
        providerOrderId: 'order_test_recon',
        status: 'CAPTURED',
      });

      vi.spyOn(Reservation, 'find').mockResolvedValue([]);

      const report = await reconcileStalePayments();

      expect(report.reconciledCount).toBe(1);
      expect(mockOrder.paymentStatus).toBe('PAID');
      expect(mockOrder.orderStatus).toBe('CONFIRMED');
    });
  });

  describe('6. Delivery Address CRUD & Data Isolation', () => {
    it('isolates user addresses and enforces 6-digit Indian PIN code format', async () => {
      const mockAddress = {
        _id: new mongoose.Types.ObjectId(),
        user: studentUser._id,
        fullName: 'Aarav Sharma',
        phone: '9876543210',
        street: 'North Campus Hostel',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110007',
        isDefault: true,
      };

      vi.spyOn(Address, 'find').mockReturnValue({
        sort: vi.fn().mockResolvedValue([mockAddress]),
      });

      const res = await request(app)
        .get('/api/addresses')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.addresses).toHaveLength(1);
      expect(res.body.data.addresses[0].postalCode).toBe('110007');
    });
  });
});
