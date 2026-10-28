import Order from './orderModel.js';
import Payment from '../payments/paymentModel.js';
import StatusHistory from './statusHistoryModel.js';
import { commitReservation } from '../inventory/reservationService.js';
import COMMERCE_CONFIG from '../../config/commerceConfig.js';

/**
 * Background Payment Reconciliation Job
 * Resolves edge-cases where payment was captured at the gateway but local order state wasn't updated.
 */
export async function reconcileStalePayments() {
  const staleThreshold = new Date(Date.now() - 15 * 60 * 1000); // Older than 15 minutes

  // Find online orders that are still marked UNPAID but have a payment record
  const pendingOrders = await Order.find({
    paymentMethod: 'ONLINE_RAZORPAY',
    paymentStatus: COMMERCE_CONFIG.PAYMENT_STATUS.UNPAID,
    createdAt: { $lt: staleThreshold },
  }).limit(50);

  const reconciliationReport = {
    evaluatedCount: pendingOrders.length,
    reconciledCount: 0,
    discrepanciesCount: 0,
    details: [],
  };

  for (const order of pendingOrders) {
    const payment = await Payment.findOne({ order: order._id });

    if (!payment || !payment.providerOrderId) {
      continue;
    }

    try {
      // In production with live credentials, query Razorpay order status
      // Here, check if gateway captured or if payment marked captured
      if (payment.status === 'CAPTURED') {
        // Discrepancy detected: Payment is captured, but order is still UNPAID!
        await commitReservation(order._id);

        order.paymentStatus = 'PAID';
        order.orderStatus = 'CONFIRMED';
        order.status = 'CONFIRMED';
        await order.save();

        await StatusHistory.create({
          entityType: 'PAYMENT',
          entityId: order._id,
          field: 'paymentStatus',
          previousState: 'UNPAID',
          newState: 'PAID',
          actorType: 'SYSTEM',
          reason: 'Reconciliation: Captured payment matched with stale order state',
          metadata: { providerOrderId: payment.providerOrderId },
        });

        reconciliationReport.reconciledCount += 1;
        reconciliationReport.details.push({
          orderId: order._id,
          action: 'RECONCILED_TO_PAID',
        });
      }
    } catch (err) {
      reconciliationReport.discrepanciesCount += 1;
      reconciliationReport.details.push({
        orderId: order._id,
        error: err.message,
      });
    }
  }

  return reconciliationReport;
}

export default {
  reconcileStalePayments,
};
