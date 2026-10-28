import express from 'express';
import {
  handleCreateProposal,
  handleGetSwaps,
  handleGetSwapById,
  handleCounterProposal,
  handleAcceptProposal,
  handleRejectProposal,
  handleWithdrawProposal,
  handleCancelProposal,
  handleConfirmHandover,
} from './swapController.js';
import requireAuthentication from '../../middleware/requireAuthentication.js';
import validateRequest from '../../middleware/validateRequest.js';
import {
  createSwapSchema,
  counterOfferSchema,
  reasonSchema,
} from './swapValidation.js';

const router = express.Router();

// All swap operations require authenticated session
router.use(requireAuthentication);

// Proposal creation and listing
router.post('/', validateRequest(createSwapSchema), handleCreateProposal);
router.get('/', handleGetSwaps);
router.get('/:id', handleGetSwapById);

// State transitions and lifecycle mutations
router.post('/:id/counter-offers', validateRequest(counterOfferSchema), handleCounterProposal);
router.post('/:id/accept', handleAcceptProposal);
router.post('/:id/reject', validateRequest(reasonSchema), handleRejectProposal);
router.post('/:id/withdraw', handleWithdrawProposal);
router.post('/:id/cancel', validateRequest(reasonSchema), handleCancelProposal);
router.post('/:id/confirm-handover', handleConfirmHandover);

export default router;
