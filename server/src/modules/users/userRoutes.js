import express from 'express';
import {
  handleGetMyProfile,
  handleUpdateMyProfile,
  handleGetPublicProfile,
  handleChangePassword,
} from './userController.js';
import requireAuthentication from '../../middleware/requireAuthentication.js';
import validateRequest from '../../middleware/validateRequest.js';
import { updateProfileSchema, changePasswordSchema } from './userValidation.js';

const router = express.Router();

// Public peer profile (sanitized)
router.get('/:id/public', handleGetPublicProfile);

// Authenticated user profile routes (strictly isolated to authenticated user)
router.get('/profile', requireAuthentication, handleGetMyProfile);
router.put('/profile', requireAuthentication, validateRequest(updateProfileSchema), handleUpdateMyProfile);
router.patch('/password', requireAuthentication, validateRequest(changePasswordSchema), handleChangePassword);

export default router;
