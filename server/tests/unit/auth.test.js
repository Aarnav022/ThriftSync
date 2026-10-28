import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/modules/users/userModel.js';
import { signToken } from '../../src/modules/authentication/authService.js';

describe('Authentication API & Authorization Slices', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should successfully register a student user and return a JWT token', async () => {
      vi.spyOn(User, 'findOne').mockResolvedValue(null);

      const mockSavedUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Alex Rivera',
        email: 'alex.rivera@campus.edu',
        role: 'student',
        campus: 'North Quad',
        isActive: true,
        toJSON: () => ({
          _id: '507f1f77bcf86cd799439011',
          name: 'Alex Rivera',
          email: 'alex.rivera@campus.edu',
          role: 'student',
          campus: 'North Quad',
          isActive: true,
        }),
      };

      vi.spyOn(User, 'create').mockResolvedValue(mockSavedUser);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Alex Rivera',
          email: 'alex.rivera@campus.edu',
          password: 'Password123!',
          campus: 'North Quad',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('alex.rivera@campus.edu');
      expect(res.body.data.user.role).toBe('student');
      expect(res.body.data.user.password).toBeUndefined();

      // Ensure server enforces student role
      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'student',
        })
      );
    });

    it('should reject registration if email is already taken (409 Conflict)', async () => {
      vi.spyOn(User, 'findOne').mockResolvedValue({
        _id: 'existing-id',
        email: 'duplicate@campus.edu',
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jordan Smith',
          email: 'duplicate@campus.edu',
          password: 'SecurePassword1',
        });

      expect(res.status).toBe(409);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('should reject registration if input validation fails (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'A', // Too short (min 2)
          email: 'not-an-email',
          password: 'short', // Too short (min 8) and missing number
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.errors).toBeInstanceOf(Array);
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it('should ignore client-supplied admin role and enforce student role', async () => {
      vi.spyOn(User, 'findOne').mockResolvedValue(null);

      const mockSavedUser = {
        _id: '507f1f77bcf86cd799439012',
        name: 'Hacker',
        email: 'hacker@campus.edu',
        role: 'student', // Server enforces student
        toJSON: () => ({
          _id: '507f1f77bcf86cd799439012',
          name: 'Hacker',
          email: 'hacker@campus.edu',
          role: 'student',
        }),
      };

      vi.spyOn(User, 'create').mockResolvedValue(mockSavedUser);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Hacker Attempt',
          email: 'hacker@campus.edu',
          password: 'Password999',
          role: 'admin', // Attempting privilege escalation
        });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('student');
      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'student' })
      );
    });
  });

  describe('POST /api/auth/login', () => {
    it('should successfully log in with valid credentials and return a token', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Alex Rivera',
        email: 'alex.rivera@campus.edu',
        role: 'student',
        isActive: true,
        comparePassword: vi.fn().mockResolvedValue(true),
        toJSON: () => ({
          _id: '507f1f77bcf86cd799439011',
          name: 'Alex Rivera',
          email: 'alex.rivera@campus.edu',
          role: 'student',
        }),
      };

      // Mock findOne with chainable .select('+password')
      vi.spyOn(User, 'findOne').mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser),
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alex.rivera@campus.edu',
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('alex.rivera@campus.edu');
    });

    it('should reject login with invalid password (401 Unauthorized)', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'alex.rivera@campus.edu',
        isActive: true,
        comparePassword: vi.fn().mockResolvedValue(false), // Password mismatch
      };

      vi.spyOn(User, 'findOne').mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser),
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alex.rivera@campus.edu',
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toMatch(/invalid email or password/i);
    });

    it('should reject login if user does not exist (401 Unauthorized)', async () => {
      vi.spyOn(User, 'findOne').mockReturnValue({
        select: vi.fn().mockResolvedValue(null),
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@campus.edu',
          password: 'Password123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('fail');
    });
  });

  describe('GET /api/auth/me (Protected Route)', () => {
    it('should return current user profile when valid Bearer token provided', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Alex Rivera',
        email: 'alex.rivera@campus.edu',
        role: 'student',
        isActive: true,
      };

      const token = signToken(mockUser);
      vi.spyOn(User, 'findById').mockResolvedValue(mockUser);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.email).toBe('alex.rivera@campus.edu');
    });

    it('should reject access with 401 if Authorization header is missing', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toMatch(/Authentication required/i);
    });

    it('should reject access with 401 if token is tampered/invalid', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.tampered.token');

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('fail');
    });
  });

  describe('GET /api/auth/admin-check (Role-Based Authorization)', () => {
    it('should reject non-admin student with 403 Forbidden', async () => {
      const studentUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Alex Student',
        email: 'alex@campus.edu',
        role: 'student',
        isActive: true,
      };

      const token = signToken(studentUser);
      vi.spyOn(User, 'findById').mockResolvedValue(studentUser);

      const res = await request(app)
        .get('/api/auth/admin-check')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toMatch(/Administrator privileges required/i);
    });

    it('should grant access to admin user with 200 OK', async () => {
      const adminUser = {
        _id: '507f1f77bcf86cd799439099',
        name: 'Campus Staff Admin',
        email: 'admin@campus.edu',
        role: 'admin',
        isActive: true,
      };

      const token = signToken(adminUser);
      vi.spyOn(User, 'findById').mockResolvedValue(adminUser);

      const res = await request(app)
        .get('/api/auth/admin-check')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.role).toBe('admin');
    });
  });
});
