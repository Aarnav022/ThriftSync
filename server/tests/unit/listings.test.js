import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import Listing from '../../src/modules/listings/listingModel.js';
import User from '../../src/modules/users/userModel.js';
import { signToken } from '../../src/modules/authentication/authService.js';

describe('Listings & Catalog API Module', () => {
  const mockStudentUser = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Alex Rivera',
    email: 'alex.rivera@campus.edu',
    role: 'student',
    campus: 'North Quad',
    isActive: true,
  };

  const mockOtherUser = {
    _id: '507f1f77bcf86cd799439099',
    name: 'Other Student',
    email: 'other@campus.edu',
    role: 'student',
    campus: 'East Campus',
    isActive: true,
  };

  const mockAdminUser = {
    _id: '507f1f77bcf86cd799439088',
    name: 'Campus Admin',
    email: 'admin@campus.edu',
    role: 'admin',
    campus: 'Admin Center',
    isActive: true,
  };

  let studentToken;
  let otherToken;
  let adminToken;

  beforeEach(() => {
    vi.restoreAllMocks();
    studentToken = signToken(mockStudentUser);
    otherToken = signToken(mockOtherUser);
    adminToken = signToken(mockAdminUser);
  });

  describe('POST /api/listings', () => {
    it('should reject unauthenticated listing creation with 401', async () => {
      const res = await request(app).post('/api/listings').send({
        title: 'Economics Textbook',
        description: 'Hardcover principles of economics 10th edition',
        category: 'Textbooks',
        condition: 'Like New',
        listingType: 'buy',
        price: 25.0,
      });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('fail');
    });

    it('should successfully create a buy listing and associate seller', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(mockStudentUser);

      const mockCreatedListing = {
        _id: '607f1f77bcf86cd799439001',
        title: 'Economics 10th Edition',
        description: 'Hardcover principles of economics in perfect condition',
        category: 'Textbooks',
        condition: 'Like New',
        listingType: 'buy',
        price: 32.5,
        deposit: 0,
        seller: mockStudentUser,
        status: 'active',
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockImplementation(function () {
          this.seller = {
            _id: mockStudentUser._id,
            name: mockStudentUser.name,
            campus: mockStudentUser.campus,
          };
          return Promise.resolve(this);
        }),
      };

      vi.spyOn(Listing.prototype, 'save').mockImplementation(async function () {
        this._id = mockCreatedListing._id;
        return this;
      });
      vi.spyOn(Listing.prototype, 'populate').mockImplementation(async function () {
        this.seller = {
          _id: mockStudentUser._id,
          name: mockStudentUser.name,
          campus: mockStudentUser.campus,
        };
        return this;
      });

      const res = await request(app)
        .post('/api/listings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Economics 10th Edition',
          description: 'Hardcover principles of economics in perfect condition',
          category: 'Textbooks',
          condition: 'Like New',
          listingType: 'buy',
          price: 32.5,
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.listing.title).toBe('Economics 10th Edition');
      expect(res.body.data.listing.price).toBe(32.5);
    });

    it('should successfully create a rental listing with separate rentalRate and deposit', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(mockStudentUser);

      vi.spyOn(Listing.prototype, 'save').mockImplementation(async function () {
        this._id = '607f1f77bcf86cd799439002';
        return this;
      });
      vi.spyOn(Listing.prototype, 'populate').mockImplementation(async function () {
        this.seller = mockStudentUser;
        return this;
      });

      const res = await request(app)
        .post('/api/listings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Graphing Calculator TI-84 Plus',
          description: 'Scientific calculator with cable and fresh batteries',
          category: 'Electronics',
          condition: 'Excellent',
          listingType: 'rent',
          rentalRate: 15.0,
          rentalPeriod: 'per semester',
          deposit: 30.0, // Tracked separately per AGENTS.md
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.listing.rentalRate).toBe(15.0);
      expect(res.body.data.listing.deposit).toBe(30.0);
    });

    it('should reject buy listing if price is missing (400 Bad Request)', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(mockStudentUser);

      const res = await request(app)
        .post('/api/listings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Vintage Denim Jacket',
          description: 'Authentic retro denim oversized jacket',
          category: 'Fashion',
          condition: 'Good',
          listingType: 'buy',
          // price is missing
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(JSON.stringify(res.body.errors)).toMatch(/price is required/i);
    });

    it('should reject rental listing if rentalRate is missing (400 Bad Request)', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(mockStudentUser);

      const res = await request(app)
        .post('/api/listings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Dorm Mini Projector',
          description: 'Compact 1080p LED projector with HDMI cable',
          category: 'Electronics',
          condition: 'Like New',
          listingType: 'rent',
          // rentalRate is missing
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(JSON.stringify(res.body.errors)).toMatch(/rental rate is required/i);
    });

    it('should reject swap listing if swapFor preference is missing (400 Bad Request)', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(mockStudentUser);

      const res = await request(app)
        .post('/api/listings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Organic Chemistry Model Set',
          description: 'Complete molecular modeling kit for chemistry students',
          category: 'Textbooks',
          condition: 'Like New',
          listingType: 'swap',
          // swapFor is missing
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(JSON.stringify(res.body.errors)).toMatch(/specify the item you are seeking/i);
    });
  });

  describe('GET /api/listings', () => {
    it('should return catalog listings with pagination metadata', async () => {
      const mockListings = [
        {
          _id: '607f1f77bcf86cd799439001',
          title: 'Calculus Early Transcendentals',
          category: 'Textbooks',
          price: 45.0,
          status: 'active',
          seller: { name: 'Jordan', campus: 'North Quad' },
        },
      ];

      vi.spyOn(Listing, 'find').mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockResolvedValue(mockListings),
      });

      vi.spyOn(Listing, 'countDocuments').mockResolvedValue(1);

      const res = await request(app).get('/api/listings?category=Textbooks&page=1&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.listings).toHaveLength(1);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.page).toBe(1);
    });

    it('should filter listings with search query', async () => {
      const mockQueryFind = vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockResolvedValue([]),
      });
      vi.spyOn(Listing, 'find').mockImplementation(mockQueryFind);
      vi.spyOn(Listing, 'countDocuments').mockResolvedValue(0);

      const res = await request(app).get('/api/listings?search=calculator');

      expect(res.status).toBe(200);
      expect(mockQueryFind).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.any(Array),
        })
      );
    });

    it('should filter listings by condition and price range', async () => {
      const mockQueryFind = vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockResolvedValue([]),
      });
      vi.spyOn(Listing, 'find').mockImplementation(mockQueryFind);
      vi.spyOn(Listing, 'countDocuments').mockResolvedValue(0);

      const res = await request(app).get('/api/listings?condition=Like%20New&minPrice=10&maxPrice=50');

      expect(res.status).toBe(200);
      expect(mockQueryFind).toHaveBeenCalledWith(
        expect.objectContaining({
          condition: 'Like New',
          price: { $gte: 10, $lte: 50 },
        })
      );
    });

    it('should filter listings by rental rate range and sort by price_asc', async () => {
      const mockSort = vi.fn().mockReturnThis();
      const mockQueryFind = vi.fn().mockReturnValue({
        sort: mockSort,
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockResolvedValue([]),
      });
      vi.spyOn(Listing, 'find').mockImplementation(mockQueryFind);
      vi.spyOn(Listing, 'countDocuments').mockResolvedValue(0);

      const res = await request(app).get('/api/listings?minRentalRate=5&maxRentalRate=25&sort=price_asc');

      expect(res.status).toBe(200);
      expect(mockQueryFind).toHaveBeenCalledWith(
        expect.objectContaining({
          rentalRate: { $gte: 5, $lte: 25 },
        })
      );
      expect(mockSort).toHaveBeenCalledWith({ price: 1, createdAt: -1 });
    });

    it('should safely handle search queries containing regex special characters without crashing', async () => {
      const mockQueryFind = vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockResolvedValue([]),
      });
      vi.spyOn(Listing, 'find').mockImplementation(mockQueryFind);
      vi.spyOn(Listing, 'countDocuments').mockResolvedValue(0);

      // Testing special chars: (, [, *, +, ?, ^, $
      const res = await request(app).get('/api/listings?search=TI-84+(Plus)*[Graphing]');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(mockQueryFind).toHaveBeenCalled();
    });
  });

  describe('GET /api/listings/:id', () => {
    it('should return 200 with listing when found', async () => {
      const mockListing = {
        _id: '607f1f77bcf86cd799439001',
        title: 'Calculus 8th Edition',
        price: 40.0,
        seller: { name: 'Morgan', campus: 'East Quad' },
      };

      vi.spyOn(Listing, 'findById').mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockListing),
      });

      const res = await request(app).get('/api/listings/607f1f77bcf86cd799439001');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.listing.title).toBe('Calculus 8th Edition');
    });

    it('should return 404 when listing does not exist', async () => {
      vi.spyOn(Listing, 'findById').mockReturnValue({
        populate: vi.fn().mockResolvedValue(null),
      });

      const res = await request(app).get('/api/listings/nonexistent-id');

      expect(res.status).toBe(404);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toMatch(/not found/i);
    });
  });

  describe('GET /api/listings/mine', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/listings/mine');
      expect(res.status).toBe(401);
    });

    it('should return student listings for authenticated user', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(mockStudentUser);
      vi.spyOn(Listing, 'find').mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        populate: vi.fn().mockResolvedValue([
          { _id: '1', title: 'My Book', seller: mockStudentUser },
        ]),
      });

      const res = await request(app)
        .get('/api/listings/mine')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.listings).toHaveLength(1);
      expect(Listing.find).toHaveBeenCalledWith({ seller: mockStudentUser._id });
    });
  });

  describe('PUT /api/listings/:id', () => {
    it('should deny update if user is neither owner nor admin (403 Forbidden)', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(mockOtherUser);

      const existingListing = {
        _id: '607f1f77bcf86cd799439001',
        title: 'Original Title',
        seller: { toString: () => mockStudentUser._id },
      };

      vi.spyOn(Listing, 'findById').mockResolvedValue(existingListing);

      const res = await request(app)
        .put('/api/listings/607f1f77bcf86cd799439001')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          title: 'Attempted Hijack Title',
        });

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toMatch(/permission/i);
    });

    it('should allow owner to update their own listing', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(mockStudentUser);

      const existingListing = {
        _id: '607f1f77bcf86cd799439001',
        title: 'Original Title',
        seller: { toString: () => mockStudentUser._id },
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(Listing, 'findById').mockResolvedValue(existingListing);

      const res = await request(app)
        .put('/api/listings/607f1f77bcf86cd799439001')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Updated Textbook Title',
          price: 29.99,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(existingListing.title).toBe('Updated Textbook Title');
      expect(existingListing.price).toBe(29.99);
    });

    it('should allow admin to update any listing', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(mockAdminUser);

      const existingListing = {
        _id: '607f1f77bcf86cd799439001',
        title: 'Student Title',
        seller: { toString: () => mockStudentUser._id },
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(Listing, 'findById').mockResolvedValue(existingListing);

      const res = await request(app)
        .put('/api/listings/607f1f77bcf86cd799439001')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'archived',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(existingListing.status).toBe('archived');
    });
  });

  describe('DELETE /api/listings/:id', () => {
    it('should deny delete if user is neither owner nor admin (403 Forbidden)', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(mockOtherUser);

      const existingListing = {
        _id: '607f1f77bcf86cd799439001',
        seller: { toString: () => mockStudentUser._id },
      };

      vi.spyOn(Listing, 'findById').mockResolvedValue(existingListing);

      const res = await request(app)
        .delete('/api/listings/607f1f77bcf86cd799439001')
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('fail');
    });

    it('should archive listing when deleted by owner', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(mockStudentUser);

      const existingListing = {
        _id: '607f1f77bcf86cd799439001',
        seller: { toString: () => mockStudentUser._id },
        status: 'active',
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(Listing, 'findById').mockResolvedValue(existingListing);

      const res = await request(app)
        .delete('/api/listings/607f1f77bcf86cd799439001')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(existingListing.status).toBe('archived');
    });
  });
});
