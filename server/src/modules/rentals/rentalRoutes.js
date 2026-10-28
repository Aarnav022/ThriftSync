import express from 'express';
import {
  handleCreateRental,
  handleGetRentals,
  handleGetRentalById,
  handleDecideRental,
  handleHandoverPickup,
  handleProcessReturn,
  handleCancelRental,
  handleDisputeRental,
} from './rentalController.js';
import requireAuthentication from '../../middleware/requireAuthentication.js';
import validateRequest from '../../middleware/validateRequest.js';
import {
  createRentalRequestSchema,
  rentalDecisionSchema,
  handoverPickupSchema,
  returnSettlementSchema,
  rentalCancelSchema,
  rentalDisputeSchema,
} from './rentalValidation.js';

const router = express.Router();

// All rental operations strictly require an authenticated student session
router.use(requireAuthentication);

// Booking creation and querying
router.post('/', validateRequest(createRentalRequestSchema), handleCreateRental);
router.get('/', handleGetRentals);
router.get('/:id', handleGetRentalById);

// Owner decision (Approve / Reject)
router.patch('/:id/decision', validateRequest(rentalDecisionSchema), handleDecideRental);
router.post('/:id/decision', validateRequest(rentalDecisionSchema), handleDecideRental);

// Handover pickup confirmation (Renter / Owner bilateral verification)
router.patch('/:id/handover', validateRequest(handoverPickupSchema), handleHandoverPickup);
router.post('/:id/handover', validateRequest(handoverPickupSchema), handleHandoverPickup);

// Return initiation & condition inspection + deposit settlement
router.patch('/:id/return', validateRequest(returnSettlementSchema), handleProcessReturn);
router.post('/:id/return', validateRequest(returnSettlementSchema), handleProcessReturn);

// Cancellation before bilateral pickup
router.patch('/:id/cancel', validateRequest(rentalCancelSchema), handleCancelRental);
router.post('/:id/cancel', validateRequest(rentalCancelSchema), handleCancelRental);

// Dispute escalation
router.patch('/:id/dispute', validateRequest(rentalDisputeSchema), handleDisputeRental);
router.post('/:id/dispute', validateRequest(rentalDisputeSchema), handleDisputeRental);

export default router;
