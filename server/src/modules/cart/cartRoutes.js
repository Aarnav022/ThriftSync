import express from 'express';
import {
  handleGetCart,
  handleAddToCart,
  handleUpdateCartItem,
  handleRemoveCartItem,
  handleClearCart,
  handleMergeGuestCart,
} from './cartController.js';
import optionalAuthentication from '../../middleware/optionalAuthentication.js';
import requireAuthentication from '../../middleware/requireAuthentication.js';

const router = express.Router();

router.use(optionalAuthentication);

router.get('/', handleGetCart);
router.post('/items', handleAddToCart);
router.patch('/items', handleUpdateCartItem);
router.delete('/items/:listingId', handleRemoveCartItem);
router.delete('/', handleClearCart);
router.post('/merge', requireAuthentication, handleMergeGuestCart);

export default router;
