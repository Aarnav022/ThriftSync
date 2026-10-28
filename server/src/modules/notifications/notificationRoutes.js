import { Router } from 'express';
import requireAuthentication from '../../middleware/requireAuthentication.js';
import * as notificationController from './notificationController.js';

const router = Router();

router.use(requireAuthentication);

router.get('/', notificationController.handleGetNotifications);
router.patch('/mark-all-read', notificationController.handleMarkAllAsRead);
router.patch('/:id/read', notificationController.handleMarkAsRead);

export default router;
