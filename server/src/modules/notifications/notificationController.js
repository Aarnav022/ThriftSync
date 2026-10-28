import * as notificationService from './notificationService.js';

export async function handleGetNotifications(req, res, next) {
  try {
    const result = await notificationService.getNotificationsForUser(req.user._id, req.query);
    return res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleMarkAsRead(req, res, next) {
  try {
    const updated = await notificationService.markAsRead(req.params.id, req.user._id);
    if (!updated) {
      return res.status(404).json({
        status: 'fail',
        message: 'Notification not found or access denied.',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Notification marked as read.',
      data: { notification: updated },
    });
  } catch (error) {
    next(error);
  }
}

export async function handleMarkAllAsRead(req, res, next) {
  try {
    const result = await notificationService.markAllAsRead(req.user._id);
    return res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
