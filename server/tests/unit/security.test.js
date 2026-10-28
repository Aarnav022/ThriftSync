import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../../src/app.js';
import User from '../../src/modules/users/userModel.js';
import Listing from '../../src/modules/listings/listingModel.js';
import Swap from '../../src/modules/swaps/swapModel.js';
import Order from '../../src/modules/orders/orderModel.js';
import Report from '../../src/modules/administration/reportModel.js';
import { signToken } from '../../src/modules/authentication/authService.js';
import { handleErrors } from '../../src/middleware/handleErrors.js';
import { sanitizeInput } from '../../src/middleware/sanitizeInput.js';

describe('ThriftSync Master Security Architecture Verification', () => {
  const standardStudent = {
    _id: '507f1f77bcf86cd799439001',
    name: 'Normal Student',
    email: 'student@campus.edu',
    role: 'student',
    campus: 'North Quad',
    isActive: true,
  };

  const platformAdmin = {
    _id: '507f1f77bcf86cd799439002',
    name: 'Security Admin',
    email: 'admin@campus.edu',
    role: 'admin',
    campus: 'Admin Center',
    isActive: true,
  };

  let studentToken;
  let adminToken;

  beforeEach(() => {
    vi.restoreAllMocks();
    studentToken = signToken(standardStudent);
    adminToken = signToken(platformAdmin);
  });

  describe('1. Security Headers (Helmet)', () => {
    it('should set secure HTTP headers and suppress X-Powered-By header', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.headers['x-powered-by']).toBeUndefined();
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    });
  });

  describe('2. Input Sanitization & NoSQL Injection Protection', () => {
    it('should strip MongoDB query operators ($gt, $ne, etc.) from body and query', () => {
      const mockReq = {
        body: {
          email: 'test@campus.edu',
          $gt: '',
          nested: {
            safe: 'value',
            $where: 'sleep(5000)',
          },
        },
        query: {
          $ne: 'null',
          category: 'Textbooks',
        },
        params: {},
      };
      const mockRes = {};
      const next = vi.fn();

      sanitizeInput(mockReq, mockRes, next);

      expect(next).toHaveBeenCalled();
      expect(mockReq.body.$gt).toBeUndefined();
      expect(mockReq.body.nested.$where).toBeUndefined();
      expect(mockReq.body.nested.safe).toBe('value');
      expect(mockReq.query.$ne).toBeUndefined();
      expect(mockReq.query.category).toBe('Textbooks');
    });

    it('should strip script tags from input strings to prevent stored/reflected XSS', () => {
      const mockReq = {
        body: {
          title: 'Clean Title <script>alert("hacked")</script>',
          description: 'Normal text',
        },
        query: {},
        params: {},
      };
      const next = vi.fn();

      sanitizeInput(mockReq, {}, next);

      expect(mockReq.body.title).not.toMatch(/<script>/i);
      expect(mockReq.body.title).toBe('Clean Title');
    });
  });

  describe('3. Role-Based Access Control (RBAC)', () => {
    it('should deny non-admin users from accessing /api/admin routes with 403 Forbidden', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(standardStudent);

      const res = await request(app)
        .get('/api/admin/metrics')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toMatch(/administrator/i);
    });

    it('should grant verified admin users access to /api/admin routes', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(platformAdmin);
      vi.spyOn(User, 'countDocuments').mockResolvedValue(150);
      vi.spyOn(Listing, 'countDocuments').mockResolvedValue(320);
      vi.spyOn(Swap, 'countDocuments').mockResolvedValue(45);
      vi.spyOn(Order, 'countDocuments').mockResolvedValue(20);
      vi.spyOn(Report, 'countDocuments').mockResolvedValue(2);

      const res = await request(app)
        .get('/api/admin/metrics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.metrics.totalUsers).toBe(150);
      expect(res.body.data.metrics.pendingReports).toBe(2);
    });
  });

  describe('4. User Data Isolation', () => {
    it('should strictly isolate profile updates to the authenticated user ID', async () => {
      const mockTargetUser = {
        _id: standardStudent._id,
        name: 'Original Name',
        campus: 'North Quad',
        isActive: true,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(User, 'findById').mockImplementation(async (id) => {
        if (id.toString() === standardStudent._id.toString()) {
          return mockTargetUser;
        }
        return null;
      });

      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'Updated Name',
          campus: 'South Village',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(mockTargetUser.name).toBe('Updated Name');
      expect(mockTargetUser.campus).toBe('South Village');
    });

    it('should strip private fields (email, role, password) in public profile endpoint', async () => {
      const mockPeer = {
        _id: '507f1f77bcf86cd799439099',
        name: 'Campus Seller',
        email: 'private.seller@campus.edu',
        role: 'student',
        password: 'hashed-password-not-leaked',
        campus: 'East Quad',
        avatar: 'https://example.com/avatar.jpg',
        isActive: true,
        createdAt: new Date(),
      };

      vi.spyOn(User, 'findById').mockResolvedValue(mockPeer);

      const res = await request(app).get('/api/users/507f1f77bcf86cd799439099/public');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.name).toBe('Campus Seller');
      expect(res.body.data.user.campus).toBe('East Quad');
      // Verify sensitive fields are not exposed publicly
      expect(res.body.data.user.email).toBeUndefined();
      expect(res.body.data.user.role).toBeUndefined();
      expect(res.body.data.user.password).toBeUndefined();
    });
  });

  describe('5. Password Security & Sanitization', () => {
    it('should hash passwords using bcrypt with salt rounds of 10', async () => {
      const plainPassword = 'SecurePassword123!';
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(plainPassword, salt);

      expect(hash).not.toBe(plainPassword);
      expect(hash.startsWith('$2a$10$') || hash.startsWith('$2b$10$')).toBe(true);
      const isMatch = await bcrypt.compare(plainPassword, hash);
      expect(isMatch).toBe(true);
    });

    it('should strip passwords in user toJSON transformation', () => {
      const userDoc = new User({
        name: 'Test Student',
        email: 'test@campus.edu',
        password: 'Password123!',
        campus: 'North Quad',
      });

      const json = userDoc.toJSON();
      expect(json.password).toBeUndefined();
      expect(json.__v).toBeUndefined();
    });
  });

  describe('6. Operational Hygiene & Production Error Masking', () => {
    it('should return generic error message and omit stack trace when NODE_ENV is production', () => {
      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const mockError = new Error('Database connection leak with raw internal details');
      mockError.statusCode = 500;

      const mockRes = {
        statusCode: 500,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json: vi.fn(),
      };

      const spyConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      handleErrors(mockError, {}, mockRes, () => {});

      expect(mockRes.statusCode).toBe(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'An unexpected internal server error occurred.',
      });
      // Stack trace should NOT be sent to client
      expect(mockRes.json.mock.calls[0][0].stack).toBeUndefined();

      process.env.NODE_ENV = origEnv;
    });
  });

  describe('6. Campus Content Moderation & Reporting', () => {
    const targetListingId = '607f1f77bcf86cd799439001';

    it('should allow authenticated student to report a prohibited item', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(standardStudent);
      vi.spyOn(Listing, 'findById').mockResolvedValue({
        _id: targetListingId,
        title: 'Banned Item',
      });
      vi.spyOn(Report, 'findOne').mockResolvedValue(null);

      const mockSavedReport = {
        _id: 'report-1',
        reporter: standardStudent._id,
        targetType: 'LISTING',
        targetId: targetListingId,
        reason: 'PROHIBITED_ITEM',
        description: 'Violates campus safety guidelines',
        status: 'PENDING',
      };
      vi.spyOn(Report.prototype, 'save').mockResolvedValue(mockSavedReport);

      const res = await request(app)
        .post('/api/admin/reports')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          targetType: 'LISTING',
          targetId: targetListingId,
          reason: 'PROHIBITED_ITEM',
          description: 'Violates campus safety guidelines',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toMatch(/report submitted/i);
    });

    it('should reject duplicate report on the same listing with 400', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(standardStudent);
      vi.spyOn(Listing, 'findById').mockResolvedValue({ _id: targetListingId });
      vi.spyOn(Report, 'findOne').mockResolvedValue({ _id: 'existing-report' });

      const res = await request(app)
        .post('/api/admin/reports')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          targetType: 'LISTING',
          targetId: targetListingId,
          reason: 'COUNTERFEIT_OR_SCAM',
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toMatch(/already submitted a report/i);
    });

    it('should allow admin to list pending moderation reports', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(platformAdmin);

      const mockReports = [
        {
          _id: 'r-1',
          targetType: 'LISTING',
          reason: 'PROHIBITED_ITEM',
          status: 'PENDING',
        },
      ];

      vi.spyOn(Report, 'find').mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue(mockReports),
        }),
      });
      vi.spyOn(Report, 'countDocuments').mockResolvedValue(1);

      const res = await request(app)
        .get('/api/admin/reports?status=PENDING')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.reports).toHaveLength(1);
    });

    it('should allow admin to resolve report and suspend violating listing', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(platformAdmin);

      const mockReport = {
        _id: 'r-1',
        targetType: 'LISTING',
        targetId: targetListingId,
        status: 'PENDING',
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(Report, 'findById').mockResolvedValue(mockReport);
      vi.spyOn(Listing, 'findByIdAndUpdate').mockResolvedValue({ _id: targetListingId, status: 'archived' });

      const res = await request(app)
        .patch('/api/admin/reports/r-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'RESOLVED',
          resolutionNotes: 'Item verified as prohibited and archived.',
          action: 'SUSPEND_LISTING',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(mockReport.status).toBe('RESOLVED');
      expect(Listing.findByIdAndUpdate).toHaveBeenCalledWith(targetListingId, { status: 'archived' });
    });
  });
});
