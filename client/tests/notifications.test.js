import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../src/features/notifications/notificationService.js';
import apiClient from '../src/services/apiClient.js';

vi.mock('../src/services/apiClient.js', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('Campus Notifications Client Service Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches user notifications with query params', async () => {
    const mockData = {
      notifications: [
        {
          _id: 'n-1',
          type: 'ORDER_PLACED',
          title: 'New Order',
          isRead: false,
        },
      ],
      unreadCount: 1,
      total: 1,
    };

    apiClient.get.mockResolvedValueOnce({ data: mockData });

    const result = await fetchNotifications({ limit: 10 });
    expect(apiClient.get).toHaveBeenCalledWith('/notifications', {
      params: { limit: 10 },
    });
    expect(result.unreadCount).toBe(1);
    expect(result.notifications).toHaveLength(1);
  });

  it('marks individual notification as read', async () => {
    const mockUpdated = {
      notification: {
        _id: 'n-1',
        isRead: true,
      },
    };

    apiClient.patch.mockResolvedValueOnce({ data: mockUpdated });

    const res = await markNotificationAsRead('n-1');
    expect(apiClient.patch).toHaveBeenCalledWith('/notifications/n-1/read');
    expect(res.notification.isRead).toBe(true);
  });

  it('marks all notifications as read', async () => {
    const mockResult = {
      modifiedCount: 4,
    };

    apiClient.patch.mockResolvedValueOnce({ data: mockResult });

    const res = await markAllNotificationsAsRead();
    expect(apiClient.patch).toHaveBeenCalledWith('/notifications/mark-all-read');
    expect(res.modifiedCount).toBe(4);
  });
});
