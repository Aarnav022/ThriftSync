import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import paymentGateway from '../../src/modules/payments/paymentGateway.js';
import PaymentWebhookEvent from '../../src/modules/payments/paymentWebhookModel.js';
import Order from '../../src/modules/orders/orderModel.js';
import Payment from '../../src/modules/payments/paymentModel.js';
import StatusHistory from '../../src/modules/orders/statusHistoryModel.js';
import * as reservationService from '../../src/modules/inventory/reservationService.js';

describe('Razorpay Webhook Cryptographic Verification & Idempotency', () => {
  const TEST_WEBHOOK_SECRET = 'whsec_test_secret_thriftsync_2026';
  let originalWebhookSecret;
  let originalKeySecret;

  beforeEach(() => {
    vi.restoreAllMocks();
    originalWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    originalKeySecret = process.env.RAZORPAY_KEY_SECRET;
    process.env.RAZORPAY_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;
  });

  afterEach(() => {
    process.env.RAZORPAY_WEBHOOK_SECRET = originalWebhookSecret;
    process.env.RAZORPAY_KEY_SECRET = originalKeySecret;
  });

  it('rejects webhook when x-razorpay-signature header is missing without mutating database', async () => {
    const createEventSpy = vi.spyOn(PaymentWebhookEvent, 'create');
    const findOrderSpy = vi.spyOn(Order, 'findById');
    const commitSpy = vi.spyOn(reservationService, 'commitReservation');

    const res = await request(app)
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .send({
        event: 'order.paid',
        payload: {
          order: {
            entity: { id: 'order_test_1', receipt: 'receipt_1' },
          },
        },
      });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('fail');
    expect(res.body.message).toContain('Missing Razorpay webhook signature header');
    expect(createEventSpy).not.toHaveBeenCalled();
    expect(findOrderSpy).not.toHaveBeenCalled();
    expect(commitSpy).not.toHaveBeenCalled();
  });

  it('rejects webhook when signature is invalid without mutating database', async () => {
    const createEventSpy = vi.spyOn(PaymentWebhookEvent, 'create');
    const findOrderSpy = vi.spyOn(Order, 'findById');
    const commitSpy = vi.spyOn(reservationService, 'commitReservation');

    const rawPayload = JSON.stringify({
      event: 'order.paid',
      payload: {
        order: {
          entity: { id: 'order_test_2', receipt: 'receipt_2' },
        },
      },
    });

    const res = await request(app)
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef')
      .send(rawPayload);

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('fail');
    expect(res.body.message).toContain('Invalid Razorpay webhook signature');
    expect(createEventSpy).not.toHaveBeenCalled();
    expect(findOrderSpy).not.toHaveBeenCalled();
    expect(commitSpy).not.toHaveBeenCalled();
  });

  it('fails closed when raw body buffer is unavailable (middleware configuration guard)', async () => {
    // Test direct route handler behavior if req.rawBody is not provided
    const express = (await import('express')).default;
    const paymentWebhookRouter = (await import('../../src/modules/payments/paymentWebhookRoutes.js')).default;
    const testApp = express();

    // Mount standard express.json WITHOUT the verify callback
    testApp.use(express.json());
    testApp.use('/webhook-test', paymentWebhookRouter);

    const res = await request(testApp)
      .post('/webhook-test/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', 'some_signature')
      .send({ event: 'order.paid' });

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toContain('Webhook raw body buffer is unavailable');
    expect(res.body.message).toContain('express.json({ verify: (req, res, buf) => { req.rawBody = buf; } })');
  });

  it('successfully processes valid webhook signed with dedicated secret against exact raw request bytes', async () => {
    const mockOrderId = new mongoose.Types.ObjectId();
    const mockOrder = {
      _id: mockOrderId,
      orderStatus: 'PENDING',
      paymentStatus: 'UNPAID',
      save: vi.fn().mockResolvedValue(true),
    };

    const mockWebhookDoc = {
      _id: new mongoose.Types.ObjectId(),
      processed: false,
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(PaymentWebhookEvent, 'findOne').mockResolvedValue(null);
    vi.spyOn(PaymentWebhookEvent, 'create').mockResolvedValue(mockWebhookDoc);
    vi.spyOn(Order, 'findById').mockResolvedValue(mockOrder);
    vi.spyOn(Payment, 'findOneAndUpdate').mockResolvedValue({});
    vi.spyOn(StatusHistory, 'create').mockResolvedValue({});
    vi.spyOn(reservationService, 'commitReservation').mockResolvedValue({ committed: 1 });

    const rawBodyString = JSON.stringify({
      event: 'order.paid',
      payload: {
        order: {
          entity: {
            id: 'order_test_valid_1',
            receipt: mockOrderId.toString(),
          },
        },
        payment: {
          entity: {
            id: 'pay_test_captured_1',
          },
        },
      },
    });

    const validSignature = crypto
      .createHmac('sha256', TEST_WEBHOOK_SECRET)
      .update(rawBodyString)
      .digest('hex');

    const res = await request(app)
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', validSignature)
      .send(rawBodyString);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(mockOrder.paymentStatus).toBe('PAID');
    expect(mockOrder.orderStatus).toBe('CONFIRMED');
    expect(reservationService.commitReservation).toHaveBeenCalledWith(mockOrderId);
    expect(mockWebhookDoc.processed).toBe(true);
  });

  it('rejects signature if raw request bytes do not match due to re-serialization / whitespace differences', async () => {
    const canonicalPayload = '{"event":"order.paid","entity":"order_1"}';
    const validSignature = crypto
      .createHmac('sha256', TEST_WEBHOOK_SECRET)
      .update(canonicalPayload)
      .digest('hex');

    // Transmit different bytes (with extra spacing) but identical semantic JSON
    const modifiedPayload = '{ "event": "order.paid", "entity": "order_1" }';

    const res = await request(app)
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', validSignature)
      .send(modifiedPayload);

    // Mismatched raw bytes MUST fail cryptographic signature verification
    expect(res.status).toBe(400);
    expect(res.body.status).toBe('fail');
    expect(res.body.message).toContain('Invalid Razorpay webhook signature');
  });

  it('does not fall back to RAZORPAY_KEY_SECRET when dedicated webhook secret is not set', async () => {
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
    process.env.RAZORPAY_KEY_SECRET = 'api_key_secret_only';

    const payload = JSON.stringify({ event: 'order.paid' });
    const signatureSignedWithKeySecret = crypto
      .createHmac('sha256', 'api_key_secret_only')
      .update(payload)
      .digest('hex');

    const res = await request(app)
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', signatureSignedWithKeySecret)
      .send(payload);

    // Must fail closed because webhook verification requires a dedicated webhook secret
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Invalid Razorpay webhook signature');
  });

  it('handles duplicate webhook events idempotently without modifying orders or reservations', async () => {
    const rawPayload = JSON.stringify({
      event: 'order.paid',
      payload: {
        order: {
          entity: { id: 'order_test_dup_1', receipt: 'rcpt_dup_1' },
        },
      },
    });

    const validSignature = crypto
      .createHmac('sha256', TEST_WEBHOOK_SECRET)
      .update(rawPayload)
      .digest('hex');

    // Simulate an existing, already processed webhook document
    vi.spyOn(PaymentWebhookEvent, 'findOne').mockResolvedValue({
      eventId: 'order_test_dup_1',
      processed: true,
    });

    const orderSpy = vi.spyOn(Order, 'findById');
    const commitSpy = vi.spyOn(reservationService, 'commitReservation');
    const createEventSpy = vi.spyOn(PaymentWebhookEvent, 'create');

    const res = await request(app)
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', validSignature)
      .send(rawPayload);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Event already processed');
    expect(orderSpy).not.toHaveBeenCalled();
    expect(commitSpy).not.toHaveBeenCalled();
    expect(createEventSpy).not.toHaveBeenCalled();
  });
});
