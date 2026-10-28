import express from 'express';
import {
  handleCreateListing,
  handleGetListings,
  handleGetMyListings,
  handleGetListingById,
  handleUpdateListing,
  handleDeleteListing,
} from './listingController.js';
import requireAuthentication from '../../middleware/requireAuthentication.js';
import validateRequest from '../../middleware/validateRequest.js';
import { createListingSchema, updateListingSchema } from './listingValidation.js';

const router = express.Router();

// Public catalog discovery
router.get('/', handleGetListings);

// Current user's listings (must be defined before /:id)
router.get('/mine', requireAuthentication, handleGetMyListings);

// Single listing retrieval
router.get('/:id', handleGetListingById);

// Authenticated listing management
router.post('/', requireAuthentication, validateRequest(createListingSchema), handleCreateListing);
router.put('/:id', requireAuthentication, validateRequest(updateListingSchema), handleUpdateListing);
router.delete('/:id', requireAuthentication, handleDeleteListing);

export default router;
