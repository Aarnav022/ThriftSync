import express from 'express';
import {
  handleGetAddresses,
  handleCreateAddress,
  handleUpdateAddress,
  handleDeleteAddress,
} from './addressController.js';
import requireAuthentication from '../../middleware/requireAuthentication.js';

const router = express.Router();

router.use(requireAuthentication);

router.get('/', handleGetAddresses);
router.post('/', handleCreateAddress);
router.patch('/:id', handleUpdateAddress);
router.delete('/:id', handleDeleteAddress);

export default router;
