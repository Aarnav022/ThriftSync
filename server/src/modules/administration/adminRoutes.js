import express from 'express';
import {
  handleGetMetrics,
  handleGetUsers,
  handleUpdateUserStatus,
  handleGetAdminListings,
  handleUpdateListingStatus,
  handleCreateReport,
  handleGetReports,
  handleResolveReport,
  handleGetAdminOrders,
  handleUpdateAdminOrderFulfillment,
} from './adminController.js';
import requireAuthentication from '../../middleware/requireAuthentication.js';
import requireAdmin from '../../middleware/requireAdmin.js';
import { creationLimiter } from '../../middleware/rateLimiter.js';

const router = express.Router();

// Student-accessible report submission endpoint (requires student login & spam rate limiter)
router.post('/reports', requireAuthentication, creationLimiter, handleCreateReport);

// Strict RBAC: All administrative moderation routes require verified admin privileges
router.use(requireAuthentication, requireAdmin);

router.get('/metrics', handleGetMetrics);
router.get('/users', handleGetUsers);
router.patch('/users/:id/status', handleUpdateUserStatus);
router.get('/listings', handleGetAdminListings);
router.patch('/listings/:id/status', handleUpdateListingStatus);
router.get('/reports', handleGetReports);
router.patch('/reports/:id', handleResolveReport);
router.get('/orders', handleGetAdminOrders);
router.patch('/orders/:id/fulfillment', handleUpdateAdminOrderFulfillment);

export default router;
