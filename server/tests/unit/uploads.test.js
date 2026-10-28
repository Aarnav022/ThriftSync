import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/modules/users/userModel.js';
import { signToken } from '../../src/modules/authentication/authService.js';
import * as uploadService from '../../src/modules/uploads/uploadService.js';

describe('Cloudinary Image Upload & Storage Pipeline Module', () => {
  const studentUser = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Taylor Student',
    email: 'taylor@campus.edu',
    role: 'student',
    campus: 'North Quad',
    isActive: true,
  };

  let studentToken;

  beforeEach(() => {
    vi.restoreAllMocks();
    studentToken = signToken(studentUser);
  });

  describe('1. Access Control & File Type Validation', () => {
    it('should reject unauthenticated upload with 401', async () => {
      const res = await request(app)
        .post('/api/uploads/image')
        .attach('image', Buffer.from('fake-image-bytes'), 'test.png');

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('fail');
    });

    it('should reject invalid non-image file formats (e.g. text/plain) with 400', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(studentUser);

      const res = await request(app)
        .post('/api/uploads/image')
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('image', Buffer.from('plain-text-content'), 'malicious.txt');

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Only JPEG, PNG, WEBP, and GIF');
    });

    it('should reject request when no file is attached with 400', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(studentUser);

      const res = await request(app)
        .post('/api/uploads/image')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('No image file uploaded');
    });

    it('should reject file that exceeds maximum allowed 5MB limit with 400', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(studentUser);

      // Create buffer exceeding 5MB (5.2 MB)
      const oversizedBuffer = Buffer.alloc(5.2 * 1024 * 1024);

      const res = await request(app)
        .post('/api/uploads/image')
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('image', oversizedBuffer, 'oversized.jpg');

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('exceeds maximum allowed size of 5MB');
    });
  });

  describe('2. Single & Multiple Image Uploads', () => {
    it('should successfully upload single image and return secure URL (201)', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(studentUser);
      vi.spyOn(uploadService, 'uploadBufferToCloudinary').mockResolvedValue({
        url: 'https://res.cloudinary.com/thriftsync/image/upload/v1234/test.webp',
        public_id: 'thriftsync/listings/test',
        format: 'webp',
      });

      const res = await request(app)
        .post('/api/uploads/image')
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('image', Buffer.from([0xff, 0xd8, 0xff, 0xe0]), 'photo.jpg');

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.url).toContain('cloudinary.com');
    });

    it('should successfully upload multiple images gallery (201)', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(studentUser);
      vi.spyOn(uploadService, 'uploadMultipleBuffers').mockResolvedValue([
        { url: 'https://res.cloudinary.com/test1.webp', public_id: 'img1' },
        { url: 'https://res.cloudinary.com/test2.webp', public_id: 'img2' },
      ]);

      const res = await request(app)
        .post('/api/uploads/images')
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('images', Buffer.from([0xff, 0xd8, 0xff, 0xe0]), 'photo1.jpg')
        .attach('images', Buffer.from([0x89, 0x50, 0x4e, 0x47]), 'photo2.png');

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.urls).toHaveLength(2);
    });

    it('should reject multiple uploads when no files attached with 400', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(studentUser);

      const res = await request(app)
        .post('/api/uploads/images')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('No image files uploaded');
    });
  });
});
