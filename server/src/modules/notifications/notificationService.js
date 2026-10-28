import Notification from './notificationModel.js';

/**
 * Creates and dispatches a campus notification to a student.
 */
export async function createNotification({ recipient, type, title, message, link = '', metadata = {} }) {
  if (!recipient || !type || !title || !message) {
    throw new Error('Recipient, type, title, and message are required to create a notification.');
  }

  const notification = new Notification({
    recipient,
    type,
    title,
    message,
    link,
    metadata,
  });

  await notification.save();
  return notification;
}

/**
 * Retrieves notifications for an authenticated student.
 */
export async function getNotificationsForUser(userId, options = {}) {
  const query = { recipient: userId };
  if (options.unreadOnly === true || options.unreadOnly === 'true') {
    query.isRead = false;
  }

  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(options.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(query),
    Notification.countDocuments({ recipient: userId, isRead: false }),
  ]);

  return {
    notifications,
    total,
    unreadCount,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

/**
 * Marks a specific notification as read if owned by the authenticated student.
 */
export async function markAsRead(notificationId, userId) {
  const notification = await Notification.findOne({ _id: notificationId, recipient: userId });
  if (!notification) {
    return null;
  }

  notification.isRead = true;
  await notification.save();
  return notification;
}

/**
 * Marks all notifications for a student as read.
 */
export async function markAllAsRead(userId) {
  const result = await Notification.updateMany(
    { recipient: userId, isRead: false },
    { $set: { isRead: true } }
  );

  return {
    modifiedCount: result.modifiedCount,
  };
}
