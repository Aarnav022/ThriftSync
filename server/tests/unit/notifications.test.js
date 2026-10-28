import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import Notification from '../../src/modules/notifications/notificationModel.js';
import User from '../../src/modules/users/userModel.js';
import { signToken } from '../../src/modules/authentication/authService.js';
import * as notificationService from '../../src/modules/notifications/notificationService.js';

describe('Campus Safety & Notifications Module', () => {
  const mockStudent = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Maya Lin',
    email: 'maya@campus.edu',
    role: 'student',
    campus: 'North Quad',
    isActive: true,
  };

  const mockOtherStudent = {
    _id: '507f1f77bcf86cd799439022',
    name: 'Jordan Lee',
    email: 'jordan@campus.edu',
    role: 'student',
    campus: 'East Campus',
    isActive: true,
  };

  let token;
  let otherToken;

  beforeEach(() => {
    vi.restoreAllMocks();
    token = signToken(mockStudent);
    otherToken = signToken(mockOtherStudent);
  });

  describe('GET /api/notifications', () => {
    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.status).toBe(401);
      expect(res.body.status).toBe('fail');
    });

    it('should return user notifications and accurate unread count', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(mockStudent);

      const mockNotifications = [
        {
          _id: 'notif-1',
          recipient: mockStudent._id,
          type: 'ORDER_PLACED',
          title: 'New Order Received',
          message: 'Alex ordered your Economics textbook.',
          isRead: false,
          createdAt: new Date(),
        },
        {
          _id: 'notif-2',
          recipient: mockStudent._id,
          type: 'HANDOVER_SCHEDULED',
          title: 'Handover Meeting Scheduled',
          message: 'Meet at Student Center Desk at 2:00 PM.',
          isRead: true,
          createdAt: new Date(),
        },
      ];

      vi.spyOn(Notification, 'find').mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockNotifications),
      });

      vi.spyOn(Notification, 'countDocuments')
        .mockResolvedValueOnce(2) // total
        .mockResolvedValueOnce(1); // unreadCount

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.notifications).toHaveLength(2);
      expect(res.body.data.unreadCount).toBe(1);
      expect(res.body.data.total).toBe(2);
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    it('should mark single notification as read', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(mockStudent);

      const mockNotif = {
        _id: 'notif-1',
        recipient: mockStudent._id,
        isRead: false,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(Notification, 'findOne').mockResolvedValue(mockNotif);

      const res = await request(app)
        .patch('/api/notifications/notif-1/read')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(mockNotif.isRead).toBe(true);
      expect(mockNotif.save).toHaveBeenCalled();
    });

    it('should return 404 if notification belongs to another student', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(mockStudent);
      vi.spyOn(Notification, 'findOne').mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/notifications/foreign-notif/read')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found or access denied/i);
    });
  });

  describe('PATCH /api/notifications/mark-all-read', () => {
    it('should mark all unread notifications as read', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(mockStudent);
      vi.spyOn(Notification, 'updateMany').mockResolvedValue({ modifiedCount: 3 });

      const res = await request(app)
        .patch('/api/notifications/mark-all-read')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.modifiedCount).toBe(3);
      expect(Notification.updateMany).toHaveBeenCalledWith(
        { recipient: mockStudent._id, isRead: false },
        { $set: { isRead: true } }
      );
    });
  });

  describe('Notification Service Validation', () => {
    it('should throw error when missing required fields', async () => {
      await expect(
        notificationService.createNotification({
          recipient: mockStudent._id,
          // missing type, title, message
        })
      ).rejects.toThrow(/required/i);
    });

    it('should successfully create notification with valid fields', async () => {
      const mockSaved = {
        _id: 'new-notif-id',
        recipient: mockStudent._id,
        type: 'SAFETY_ALERT',
        title: 'Safe Handover Reminder',
        message: 'Always meet during daylight hours at verified campus pickup spots.',
      };

      vi.spyOn(Notification.prototype, 'save').mockResolvedValue(mockSaved);

      const created = await notificationService.createNotification({
        recipient: mockStudent._id,
        type: 'SAFETY_ALERT',
        title: 'Safe Handover Reminder',
        message: 'Always meet during daylight hours at verified campus pickup spots.',
      });

      expect(created.type).toBe('SAFETY_ALERT');
      expect(created.title).toBe('Safe Handover Reminder');
    });
  });
});
