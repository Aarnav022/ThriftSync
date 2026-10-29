import express from 'express';
import paymentGateway from './paymentGateway.js';
import PaymentWebhookEvent from './paymentWebhookModel.js';
import Order from '../orders/orderModel.js';
import Payment from './paymentModel.js';
import StatusHistory from '../orders/statusHistoryModel.js';
import { commitReservation } from '../inventory/reservationService.js';

const router = express.Router();

/**
 * Razorpay Webhook Handler
 */
router.post('/webhook', async (req, res) => {
  try {
    // 1. Fail closed if raw body is unavailable (middleware configuration requirement)
    if (!req.rawBody) {
      console.error(
        '[Payment Webhook Error]: Webhook raw body buffer is unavailable. Middleware express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }) must be configured.'
      );
      return res.status(500).json({
        status: 'error',
        message:
          'Webhook raw body buffer is unavailable. Middleware express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }) must be configured.',
      });
    }

    // 2. Reject missing signature header without mutating state
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      return res.status(400).json({
        status: 'fail',
        message: 'Missing Razorpay webhook signature header (x-razorpay-signature)',
      });
    }

    // 3. Cryptographically verify signature against exact raw request bytes using dedicated webhook secret
    const isValid = paymentGateway.verifyWebhookSignature(req.rawBody, signature);
    if (!isValid) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid Razorpay webhook signature',
      });
    }

    const event = req.body;

    if (!event || !event.event) {
      return res.status(400).json({ status: 'fail', message: 'Invalid webhook payload' });
    }

    const eventId = event.payload?.payment?.entity?.id || event.payload?.order?.entity?.id || `evt_${Date.now()}`;
    const eventType = event.event;

    // Check for duplicate webhook event (idempotent processing)
    const existingEvent = await PaymentWebhookEvent.findOne({
      provider: 'RAZORPAY',
      eventId,
    });

    if (existingEvent && existingEvent.processed) {
      return res.status(200).json({ status: 'success', message: 'Event already processed' });
    }

    // Record event
    const webhookDoc =
      existingEvent ||
      (await PaymentWebhookEvent.create({
        provider: 'RAZORPAY',
        eventId,
        eventType,
        signature: signature || null,
        processed: false,
        payload: event,
      }));

    // Process payment success / capture events
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = event.payload?.payment?.entity;
      const orderEntity = event.payload?.order?.entity;
      const receipt = orderEntity?.receipt || paymentEntity?.notes?.receipt;

      let order = null;
      if (receipt) {
        order = await Order.findById(receipt);
      }
      if (!order && orderEntity?.id) {
        const paymentRecord = await Payment.findOne({ providerOrderId: orderEntity.id });
        if (paymentRecord) order = await Order.findById(paymentRecord.order);
      }

      if (order && order.paymentStatus !== 'PAID') {
        // 1. Commit reserved inventory
        await commitReservation(order._id);

        // 2. Update order state
        order.paymentStatus = 'PAID';
        order.orderStatus = 'CONFIRMED';
        order.status = 'CONFIRMED';
        await order.save();

        // 3. Update payment document
        await Payment.findOneAndUpdate(
          { order: order._id },
          {
            providerPaymentId: paymentEntity?.id || 'pay_wh_captured',
            status: 'CAPTURED',
          }
        );

        // 4. Record status history
        await StatusHistory.create({
          entityType: 'PAYMENT',
          entityId: order._id,
          field: 'paymentStatus',
          previousState: 'UNPAID',
          newState: 'PAID',
          actorType: 'WEBHOOK',
          reason: `Webhook processed event: ${eventType}`,
          metadata: { eventId, eventType },
        });
      }
    }

    webhookDoc.processed = true;
    webhookDoc.processedAt = new Date();
    await webhookDoc.save();

    return res.status(200).json({ status: 'success', message: 'Webhook processed successfully' });
  } catch (error) {
    // Log error on server without crashing or returning stack trace
    console.error('[Payment Webhook Error]:', error.message);
    return res.status(500).json({ status: 'error', message: 'Webhook processing error' });
  }
});

export default router;
