import express from 'express';
import {
  handleCreateOrder,
  handleGetOrders,
  handleGetOrderById,
  handleConfirmOrder,
  handleConfirmHandover,
  handleCancelOrder,
  handleDisputeOrder,
  handleInitiateCheckout,
  handleConfirmOnlinePayment,
  handleUpdateTracking,
} from './orderController.js';
import requireAuthentication from '../../middleware/requireAuthentication.js';
import requireAdmin from '../../middleware/requireAdmin.js';
import validateRequest from '../../middleware/validateRequest.js';
import {
  createOrderSchema,
  confirmOrderSchema,
  handoverOrderSchema,
  cancelOrderSchema,
  disputeOrderSchema,
} from './orderValidation.js';

const router = express.Router();

// All order operations strictly require an authenticated student session
router.use(requireAuthentication);

// Money Path MVP Checkout & Payment Confirmation
router.post('/checkout', handleInitiateCheckout);
router.post('/confirm-payment', handleConfirmOnlinePayment);

// Order placement and querying
router.post('/', validateRequest(createOrderSchema), handleCreateOrder);
router.get('/', handleGetOrders);
router.get('/:id', handleGetOrderById);

// Seller acceptance & handover plan
router.patch('/:id/confirm', validateRequest(confirmOrderSchema), handleConfirmOrder);
router.post('/:id/confirm', validateRequest(confirmOrderSchema), handleConfirmOrder);

// Handover & payment verification
router.patch('/:id/handover', validateRequest(handoverOrderSchema), handleConfirmHandover);
router.post('/:id/handover', validateRequest(handoverOrderSchema), handleConfirmHandover);

// Cancellation before completion (pre-shipment / pre-handover)
router.patch('/:id/cancel', validateRequest(cancelOrderSchema), handleCancelOrder);
router.post('/:id/cancel', validateRequest(cancelOrderSchema), handleCancelOrder);

// Admin manual tracking & fulfillment status update
router.patch('/:id/tracking', requireAdmin, handleUpdateTracking);
router.post('/:id/tracking', requireAdmin, handleUpdateTracking);

// Dispute escalation
router.patch('/:id/dispute', validateRequest(disputeOrderSchema), handleDisputeOrder);
router.post('/:id/dispute', validateRequest(disputeOrderSchema), handleDisputeOrder);

export default router;
