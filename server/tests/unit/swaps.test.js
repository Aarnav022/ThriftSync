import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import Swap from '../../src/modules/swaps/swapModel.js';
import Listing from '../../src/modules/listings/listingModel.js';
import User from '../../src/modules/users/userModel.js';
import { signToken } from '../../src/modules/authentication/authService.js';

describe('Circular Student Swaps API & Lifecycle Module', () => {
  const proposerUser = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Alex Proposer',
    email: 'alex@campus.edu',
    role: 'student',
    campus: 'North Quad',
    isActive: true,
  };

  const recipientUser = {
    _id: '507f1f77bcf86cd799439022',
    name: 'Sam Recipient',
    email: 'sam@campus.edu',
    role: 'student',
    campus: 'East Campus',
    isActive: true,
  };

  const thirdUser = {
    _id: '507f1f77bcf86cd799439033',
    name: 'Jordan Third',
    email: 'jordan@campus.edu',
    role: 'student',
    campus: 'West Quad',
    isActive: true,
  };

  const offeredListingId = '607f1f77bcf86cd799439101';
  const requestedListingId = '607f1f77bcf86cd799439102';

  let proposerToken;
  let recipientToken;
  let thirdToken;

  beforeEach(() => {
    vi.restoreAllMocks();
    proposerToken = signToken(proposerUser);
    recipientToken = signToken(recipientUser);
    thirdToken = signToken(thirdUser);
  });

  describe('POST /api/swaps (Proposal Creation)', () => {
    it('should reject unauthenticated swap proposal with 401', async () => {
      const res = await request(app).post('/api/swaps').send({
        offeredListingId,
        requestedListingId,
      });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('fail');
    });

    it('should reject proposal when proposer does not own offered listing (403)', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(proposerUser);

      // Offered listing belongs to thirdUser
      vi.spyOn(Listing, 'findById').mockImplementation(async (id) => {
        if (id === offeredListingId) {
          return {
            _id: offeredListingId,
            seller: { toString: () => thirdUser._id },
            status: 'active',
          };
        }
        return null;
      });

      const res = await request(app)
        .post('/api/swaps')
        .set('Authorization', `Bearer ${proposerToken}`)
        .send({
          offeredListingId,
          requestedListingId,
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/own inventory/i);
    });

    it('should reject self-swap attempts with 400', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(proposerUser);

      vi.spyOn(Listing, 'findById').mockImplementation(async (id) => {
        if (id === offeredListingId) {
          return {
            _id: offeredListingId,
            seller: { toString: () => proposerUser._id },
            status: 'active',
          };
        }
        if (id === requestedListingId) {
          // Also belongs to proposer
          return {
            _id: requestedListingId,
            seller: { toString: () => proposerUser._id },
            status: 'active',
          };
        }
        return null;
      });

      const res = await request(app)
        .post('/api/swaps')
        .set('Authorization', `Bearer ${proposerToken}`)
        .send({
          offeredListingId,
          requestedListingId,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/with yourself/i);
    });

    it('should reject proposal if requested listing is not active (400)', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(proposerUser);

      vi.spyOn(Listing, 'findById').mockImplementation(async (id) => {
        if (id === offeredListingId) {
          return {
            _id: offeredListingId,
            seller: { toString: () => proposerUser._id },
            status: 'active',
          };
        }
        if (id === requestedListingId) {
          return {
            _id: requestedListingId,
            seller: { toString: () => recipientUser._id },
            status: 'reserved', // Not active!
          };
        }
        return null;
      });

      const res = await request(app)
        .post('/api/swaps')
        .set('Authorization', `Bearer ${proposerToken}`)
        .send({
          offeredListingId,
          requestedListingId,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/not currently available/i);
    });

    it('should reject duplicate active proposals between same items (409 Conflict)', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(proposerUser);

      vi.spyOn(Listing, 'findById').mockImplementation(async (id) => {
        if (id === offeredListingId) {
          return {
            _id: offeredListingId,
            seller: { toString: () => proposerUser._id },
            status: 'active',
          };
        }
        if (id === requestedListingId) {
          return {
            _id: requestedListingId,
            seller: { toString: () => recipientUser._id },
            status: 'active',
          };
        }
        return null;
      });

      vi.spyOn(Swap, 'findOne').mockResolvedValue({
        _id: 'existing-swap-id',
        status: 'PENDING',
      });

      const res = await request(app)
        .post('/api/swaps')
        .set('Authorization', `Bearer ${proposerToken}`)
        .send({
          offeredListingId,
          requestedListingId,
          message: 'Duplicate attempt',
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('should successfully create proposal with PENDING status and recipient turn', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(proposerUser);

      vi.spyOn(Listing, 'findById').mockImplementation(async (id) => {
        if (id === offeredListingId) {
          return {
            _id: offeredListingId,
            seller: { toString: () => proposerUser._id },
            status: 'active',
          };
        }
        if (id === requestedListingId) {
          return {
            _id: requestedListingId,
            seller: { toString: () => recipientUser._id },
            status: 'active',
          };
        }
        return null;
      });

      vi.spyOn(Swap, 'findOne').mockResolvedValue(null);

      vi.spyOn(Swap.prototype, 'save').mockImplementation(async function () {
        this._id = '707f1f77bcf86cd799439201';
        return this;
      });

      vi.spyOn(Swap.prototype, 'populate').mockImplementation(async function () {
        return this;
      });

      const res = await request(app)
        .post('/api/swaps')
        .set('Authorization', `Bearer ${proposerToken}`)
        .send({
          offeredListingId,
          requestedListingId,
          message: 'Hi Sam, I would love to trade my Calculus book for your Chemistry kit!',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.swap.status).toBe('PENDING');
      expect(res.body.data.swap.currentTurn).toBe(recipientUser._id);
    });
  });

  describe('GET /api/swaps (List User Swaps)', () => {
    it('should return swap proposals involving authenticated user', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(proposerUser);

      const mockSwaps = [
        {
          _id: '707f1f77bcf86cd799439201',
          status: 'PENDING',
          proposer: proposerUser,
          recipient: recipientUser,
        },
      ];

      vi.spyOn(Swap, 'find').mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        populate: vi.fn().mockResolvedValue(mockSwaps),
      });

      const res = await request(app)
        .get('/api/swaps?type=outgoing')
        .set('Authorization', `Bearer ${proposerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.swaps).toHaveLength(1);
    });
  });

  describe('GET /api/swaps/:id (Single Proposal)', () => {
    it('should deny access to unauthorized third party (403 Forbidden)', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(thirdUser);

      const mockSwap = {
        _id: '707f1f77bcf86cd799439201',
        proposer: { _id: proposerUser._id },
        recipient: { _id: recipientUser._id },
      };

      vi.spyOn(Swap, 'findById').mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockSwap),
      });

      const res = await request(app)
        .get('/api/swaps/707f1f77bcf86cd799439201')
        .set('Authorization', `Bearer ${thirdToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/permission/i);
    });
  });

  describe('POST /api/swaps/:id/counter-offers', () => {
    it('should reject counter-offer if not recipient turn (403 Forbidden)', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(proposerUser);

      const mockSwap = {
        _id: '707f1f77bcf86cd799439201',
        status: 'PENDING',
        proposer: proposerUser._id,
        recipient: recipientUser._id,
        currentTurn: { toString: () => recipientUser._id }, // Recipient's turn, not proposer's
      };

      vi.spyOn(Swap, 'findById').mockResolvedValue(mockSwap);

      const res = await request(app)
        .post('/api/swaps/707f1f77bcf86cd799439201/counter-offers')
        .set('Authorization', `Bearer ${proposerToken}`)
        .send({ message: 'Early counter' });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/not your turn/i);
    });

    it('should successfully record counter-offer and switch turn to other participant', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(recipientUser);

      const mockSwap = {
        _id: '707f1f77bcf86cd799439201',
        status: 'PENDING',
        proposer: proposerUser._id,
        recipient: recipientUser._id,
        currentTurn: { toString: () => recipientUser._id },
        counterOffers: [],
        timeline: [],
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(Swap, 'findById').mockResolvedValue(mockSwap);

      const res = await request(app)
        .post('/api/swaps/707f1f77bcf86cd799439201/counter-offers')
        .set('Authorization', `Bearer ${recipientToken}`)
        .send({
          message: 'Can you also include the study guide for Economics?',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(mockSwap.status).toBe('COUNTERED');
      expect(mockSwap.currentTurn).toBe(proposerUser._id); // Turned back to proposer
      expect(mockSwap.counterOffers).toHaveLength(1);
    });
  });

  describe('POST /api/swaps/:id/accept (Acceptance & Concurrency Safeguard)', () => {
    it('should reject acceptance if items are concurrently reserved or sold (409 Conflict)', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(recipientUser);

      const mockSwap = {
        _id: '707f1f77bcf86cd799439201',
        status: 'PENDING',
        proposer: proposerUser._id,
        recipient: recipientUser._id,
        offeredListing: offeredListingId,
        requestedListing: requestedListingId,
        currentTurn: { toString: () => recipientUser._id },
      };

      vi.spyOn(Swap, 'findById').mockResolvedValue(mockSwap);

      // Competing update: offered listing is no longer active (already locked by another checkout or swap)
      vi.spyOn(Listing, 'findOneAndUpdate').mockResolvedValue(null);

      const res = await request(app)
        .post('/api/swaps/707f1f77bcf86cd799439201/accept')
        .set('Authorization', `Bearer ${recipientToken}`);

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/no longer active/i);
    });

    it('should successfully accept proposal and atomically reserve both listings', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(recipientUser);

      const mockSwap = {
        _id: '707f1f77bcf86cd799439201',
        status: 'PENDING',
        proposer: proposerUser._id,
        recipient: recipientUser._id,
        offeredListing: offeredListingId,
        requestedListing: requestedListingId,
        currentTurn: { toString: () => recipientUser._id },
        timeline: [],
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(Swap, 'findById').mockResolvedValue(mockSwap);

      vi.spyOn(Listing, 'findOneAndUpdate').mockResolvedValue({
        status: 'reserved',
      });

      const res = await request(app)
        .post('/api/swaps/707f1f77bcf86cd799439201/accept')
        .set('Authorization', `Bearer ${recipientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(mockSwap.status).toBe('ACCEPTED');
      expect(Listing.findOneAndUpdate).toHaveBeenCalledTimes(2);
    });
  });

  describe('POST /api/swaps/:id/cancel (Cancellation & Lock Release)', () => {
    it('should release item reservations back to active when accepted swap is cancelled', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(proposerUser);

      const mockSwap = {
        _id: '707f1f77bcf86cd799439201',
        status: 'ACCEPTED',
        proposer: { toString: () => proposerUser._id },
        recipient: { toString: () => recipientUser._id },
        offeredListing: offeredListingId,
        requestedListing: requestedListingId,
        timeline: [],
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(Swap, 'findById').mockResolvedValue(mockSwap);
      vi.spyOn(Listing, 'findByIdAndUpdate').mockResolvedValue(true);

      const res = await request(app)
        .post('/api/swaps/707f1f77bcf86cd799439201/cancel')
        .set('Authorization', `Bearer ${proposerToken}`)
        .send({ reason: 'Cannot meet this week due to exams' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(mockSwap.status).toBe('CANCELLED');
      expect(Listing.findByIdAndUpdate).toHaveBeenCalledWith(offeredListingId, { status: 'active' });
      expect(Listing.findByIdAndUpdate).toHaveBeenCalledWith(requestedListingId, { status: 'active' });
    });
  });

  describe('POST /api/swaps/:id/confirm-handover (Dual Confirmation & Completion)', () => {
    it('should record first confirmation without prematurely completing swap', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(proposerUser);

      const mockSwap = {
        _id: '707f1f77bcf86cd799439201',
        status: 'ACCEPTED',
        proposer: { toString: () => proposerUser._id },
        recipient: { toString: () => recipientUser._id },
        handoverConfirmations: {
          proposerConfirmed: false,
          recipientConfirmed: false,
        },
        timeline: [],
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(Swap, 'findById').mockResolvedValue(mockSwap);

      const res = await request(app)
        .post('/api/swaps/707f1f77bcf86cd799439201/confirm-handover')
        .set('Authorization', `Bearer ${proposerToken}`);

      expect(res.status).toBe(200);
      expect(mockSwap.handoverConfirmations.proposerConfirmed).toBe(true);
      expect(mockSwap.status).toBe('ACCEPTED'); // Stays accepted until both confirm!
    });

    it('should transition to COMPLETED and archive listings once both parties confirm', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(recipientUser);

      const mockSwap = {
        _id: '707f1f77bcf86cd799439201',
        status: 'ACCEPTED',
        proposer: { toString: () => proposerUser._id },
        recipient: { toString: () => recipientUser._id },
        offeredListing: offeredListingId,
        requestedListing: requestedListingId,
        handoverConfirmations: {
          proposerConfirmed: true, // Proposer already confirmed
          recipientConfirmed: false,
        },
        timeline: [],
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(Swap, 'findById').mockResolvedValue(mockSwap);
      vi.spyOn(Listing, 'findByIdAndUpdate').mockResolvedValue(true);

      const res = await request(app)
        .post('/api/swaps/707f1f77bcf86cd799439201/confirm-handover')
        .set('Authorization', `Bearer ${recipientToken}`);

      expect(res.status).toBe(200);
      expect(mockSwap.handoverConfirmations.recipientConfirmed).toBe(true);
      expect(mockSwap.status).toBe('COMPLETED'); // Now completed!
      expect(Listing.findByIdAndUpdate).toHaveBeenCalledWith(offeredListingId, { status: 'archived' });
      expect(Listing.findByIdAndUpdate).toHaveBeenCalledWith(requestedListingId, { status: 'archived' });
    });
  });
});
