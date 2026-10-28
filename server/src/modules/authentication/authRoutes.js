import { Router } from 'express';
import authController from './authController.js';
import { registerSchema, loginSchema } from './authValidation.js';
import validateRequest from '../../middleware/validateRequest.js';
import requireAuthentication from '../../middleware/requireAuthentication.js';
import requireAdmin from '../../middleware/requireAdmin.js';

const router = Router();

// Public routes
router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);

// Protected routes
router.get('/me', requireAuthentication, authController.getMe);
router.get('/admin-check', requireAuthentication, requireAdmin, authController.checkAdmin);

export default router;
