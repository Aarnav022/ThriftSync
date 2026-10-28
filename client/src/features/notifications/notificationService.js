import apiClient from '../../services/apiClient.js';

/**
 * Fetch notifications for authenticated user
 * @param {object} params - { unreadOnly, page, limit }
 */
export async function fetchNotifications(params = {}) {
  const response = await apiClient.get('/notifications', { params });
  return response.data;
}

/**
 * Mark a single notification as read
 * @param {string} id
 */
export async function markNotificationAsRead(id) {
  const response = await apiClient.patch(`/notifications/${id}/read`);
  return response.data;
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead() {
  const response = await apiClient.patch('/notifications/mark-all-read');
  return response.data;
}
