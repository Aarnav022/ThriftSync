import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import User from '../../src/modules/users/userModel.js';
import { signToken } from '../../src/modules/authentication/authService.js';

describe('ThriftSync User Profile & Account Settings API', () => {
  const mockUserId = new mongoose.Types.ObjectId();
  let mockUser;
  let studentToken;

  const createMockQuery = (doc) => {
    const p = Promise.resolve(doc);
    p.select = vi.fn().mockResolvedValue(doc);
    return p;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = {
      _id: mockUserId,
      name: 'Priya Patel',
      email: 'priya.patel@campus.edu',
      role: 'student',
      campus: 'North Campus Quad',
      avatar: 'https://example.com/avatar.jpg',
      isActive: true,
      comparePassword: vi.fn(),
      save: vi.fn().mockResolvedValue(true),
      toJSON: function () {
        const copy = { ...this };
        delete copy.password;
        return copy;
      },
    };
    studentToken = signToken(mockUser);
  });

  describe('GET /api/users/profile', () => {
    it('returns the authenticated user profile with HTTP 200', async () => {
      vi.spyOn(User, 'findById').mockImplementation(() => createMockQuery(mockUser));

      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.name).toBe('Priya Patel');
      expect(res.body.data.user.email).toBe('priya.patel@campus.edu');
    });

    it('rejects unauthenticated requests with HTTP 401', async () => {
      const res = await request(app).get('/api/users/profile');
      expect(res.status).toBe(401);
      expect(res.body.status).toBe('fail');
    });
  });

  describe('PUT /api/users/profile', () => {
    it('updates user profile information with HTTP 200', async () => {
      vi.spyOn(User, 'findById').mockImplementation(() => createMockQuery(mockUser));

      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'Priya Sharma',
          campus: 'South Campus Block B',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(mockUser.name).toBe('Priya Sharma');
      expect(mockUser.campus).toBe('South Campus Block B');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('validates input length and rejects short name with HTTP 400', async () => {
      vi.spyOn(User, 'findById').mockImplementation(() => createMockQuery(mockUser));

      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ name: 'A' }); // less than 2 chars

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
    });
  });

  describe('PATCH /api/users/password', () => {
    it('rejects password change if current password does not match with HTTP 400', async () => {
      mockUser.comparePassword.mockResolvedValue(false);
      vi.spyOn(User, 'findById').mockImplementation(() => createMockQuery(mockUser));

      const res = await request(app)
        .patch('/api/users/password')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewSecurePassword123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toMatch(/Current password does not match/i);
      expect(mockUser.save).not.toHaveBeenCalled();
    });

    it('successfully updates password when current password matches with HTTP 200', async () => {
      mockUser.comparePassword.mockResolvedValue(true);
      vi.spyOn(User, 'findById').mockImplementation(() => createMockQuery(mockUser));

      const res = await request(app)
        .patch('/api/users/password')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          currentPassword: 'CorrectPassword123!',
          newPassword: 'BrandNewPassword456!',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toMatch(/Password updated successfully/i);
      expect(res.body.data.token).toBeDefined();
      expect(mockUser.password).toBe('BrandNewPassword456!');
      expect(mockUser.tokenVersion).toBe(1);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('rejects stale JWT tokens after password change increments tokenVersion (HTTP 401)', async () => {
      // User has tokenVersion = 1 after password change
      const updatedUser = { ...mockUser, tokenVersion: 1 };
      vi.spyOn(User, 'findById').mockImplementation(() => createMockQuery(updatedUser));

      // studentToken was signed with tokenVersion: 0
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toMatch(/Session has expired due to a recent password change/i);
    });

    it('rejects weak new password with HTTP 400', async () => {
      vi.spyOn(User, 'findById').mockImplementation(() => createMockQuery(mockUser));

      const res = await request(app)
        .patch('/api/users/password')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          currentPassword: 'CorrectPassword123!',
          newPassword: 'weak', // less than 8 chars, no number
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
    });
  });

  describe('GET /api/users/:id/public', () => {
    it('returns sanitized public peer profile without private fields', async () => {
      vi.spyOn(User, 'findById').mockImplementation(() => createMockQuery(mockUser));

      const res = await request(app).get(`/api/users/${mockUserId}/public`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.name).toBe('Priya Patel');
      expect(res.body.data.user.campus).toBe('North Campus Quad');
      expect(res.body.data.user.email).toBeUndefined();
      expect(res.body.data.user.role).toBeUndefined();
    });
  });
});
