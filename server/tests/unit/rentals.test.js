import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import Rental from '../../src/modules/rentals/rentalModel.js';
import Listing from '../../src/modules/listings/listingModel.js';
import User from '../../src/modules/users/userModel.js';
import { signToken } from '../../src/modules/authentication/authService.js';

describe('Campus Rental Lifecycle & Deposit Module', () => {
  const renterUser = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Elena Renter',
    email: 'elena@campus.edu',
    role: 'student',
    campus: 'North Quad',
    isActive: true,
  };

  const ownerUser = {
    _id: '507f1f77bcf86cd799439022',
    name: 'Marcus Owner',
    email: 'marcus@campus.edu',
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

  const listingId = '607f1f77bcf86cd799439101';
  const rentalId = '707f1f77bcf86cd799439201';

  let renterToken;
  let ownerToken;
  let thirdToken;

  beforeEach(() => {
    vi.restoreAllMocks();
    renterToken = signToken(renterUser);
    ownerToken = signToken(ownerUser);
    thirdToken = signToken(thirdUser);
  });

  describe('1. Rental Request Creation & Validation', () => {
    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app).post('/api/rentals').send({
        listingId,
        startDate: '2026-11-01T00:00:00.000Z',
        endDate: '2026-12-01T00:00:00.000Z',
      });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('fail');
    });

    it('should reject when endDate is before startDate with 400', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(renterUser);

      const res = await request(app)
        .post('/api/rentals')
        .set('Authorization', `Bearer ${renterToken}`)
        .send({
          listingId,
          startDate: '2026-12-01T00:00:00.000Z',
          endDate: '2026-11-01T00:00:00.000Z',
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
    });

    it('should reject renting an item when renter is also the owner with 400', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(ownerUser);
      vi.spyOn(Listing, 'findById').mockResolvedValue({
        _id: listingId,
        seller: { toString: () => ownerUser._id },
        listingType: 'rent',
        status: 'active',
      });

      const res = await request(app)
        .post('/api/rentals')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          listingId,
          startDate: '2026-11-01T00:00:00.000Z',
          endDate: '2026-12-01T00:00:00.000Z',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('cannot rent your own listing');
    });

    it('should reject renting an item that is only for sale with 400', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(renterUser);
      vi.spyOn(Listing, 'findById').mockResolvedValue({
        _id: listingId,
        seller: { toString: () => ownerUser._id },
        listingType: 'buy',
        status: 'active',
      });

      const res = await request(app)
        .post('/api/rentals')
        .set('Authorization', `Bearer ${renterToken}`)
        .send({
          listingId,
          startDate: '2026-11-01T00:00:00.000Z',
          endDate: '2026-12-01T00:00:00.000Z',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('not offered for rental');
    });

    it('should reject renting when item already has an overlapping active booking with 409', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(renterUser);
      vi.spyOn(Listing, 'findById').mockResolvedValue({
        _id: listingId,
        seller: { toString: () => ownerUser._id },
        listingType: 'rent',
        rentalRate: 15,
        rentalPeriod: 'per week',
        deposit: 30,
        status: 'active',
      });

      // Existing overlapping booking
      vi.spyOn(Rental, 'findOne').mockResolvedValue({
        _id: 'existing-rental-id',
        status: 'ACTIVE',
        startDate: new Date('2026-11-10'),
        endDate: new Date('2026-11-20'),
      });

      const res = await request(app)
        .post('/api/rentals')
        .set('Authorization', `Bearer ${renterToken}`)
        .send({
          listingId,
          startDate: '2026-11-15T00:00:00.000Z',
          endDate: '2026-11-25T00:00:00.000Z',
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already booked or requested for overlapping dates');
    });

    it('should create rental request with separate rental fee and refundable deposit (201)', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(renterUser);
      vi.spyOn(Listing, 'findById').mockResolvedValue({
        _id: listingId,
        seller: { toString: () => ownerUser._id },
        listingType: 'rent',
        rentalRate: 10,
        rentalPeriod: 'per week',
        deposit: 25,
        status: 'active',
      });
      vi.spyOn(Rental, 'findOne').mockResolvedValue(null);

      const mockSavedRental = {
        _id: rentalId,
        renter: renterUser,
        owner: ownerUser,
        listing: { _id: listingId, title: 'Calculus Textbook', deposit: 25 },
        startDate: new Date('2026-11-01T00:00:00.000Z'),
        endDate: new Date('2026-11-15T00:00:00.000Z'), // 14 days = 2 weeks
        rentalPeriod: 'per week',
        durationUnits: 2,
        rentalFee: 20, // 2 weeks * $10
        depositAmount: 25, // Separated deposit
        status: 'REQUESTED',
        depositStatus: 'HELD',
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockImplementation(async function () {
          return this;
        }),
      };

      vi.spyOn(Rental.prototype, 'save').mockImplementation(async function () {
        Object.assign(this, mockSavedRental);
        return this;
      });
      vi.spyOn(Rental.prototype, 'populate').mockImplementation(async function () {
        return mockSavedRental;
      });

      const res = await request(app)
        .post('/api/rentals')
        .set('Authorization', `Bearer ${renterToken}`)
        .send({
          listingId,
          startDate: '2026-11-01T00:00:00.000Z',
          endDate: '2026-11-15T00:00:00.000Z',
          notes: 'Preparing for midterm exam',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.rental.rentalFee).toBe(20);
      expect(res.body.data.rental.depositAmount).toBe(25);
      expect(res.body.data.rental.depositStatus).toBe('HELD');
      expect(res.body.data.rental.status).toBe('REQUESTED');
    });
  });

  describe('2. Rental Querying & Participant Access Control', () => {
    it('should list rentals for authenticated user', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(renterUser);
      vi.spyOn(Rental, 'find').mockReturnValue({
        sort: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue([
            { _id: rentalId, renter: renterUser, owner: ownerUser, rentalFee: 20, depositAmount: 25 },
          ]),
        }),
      });

      const res = await request(app)
        .get('/api/rentals?role=renter')
        .set('Authorization', `Bearer ${renterToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.rentals).toHaveLength(1);
    });

    it('should reject unauthorized 3rd party from viewing rental agreement with 403', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(thirdUser);
      vi.spyOn(Rental, 'findById').mockReturnValue({
        populate: vi.fn().mockResolvedValue({
          _id: rentalId,
          renter: { _id: { toString: () => renterUser._id } },
          owner: { _id: { toString: () => ownerUser._id } },
        }),
      });

      const res = await request(app)
        .get(`/api/rentals/${rentalId}`)
        .set('Authorization', `Bearer ${thirdToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('not authorized');
    });
  });

  describe('3. Owner Decision (Approve / Reject)', () => {
    it('should allow owner to approve rental request', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(ownerUser);

      const mockRental = {
        _id: rentalId,
        owner: { toString: () => ownerUser._id },
        renter: renterUser,
        status: 'REQUESTED',
        timeline: [],
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockImplementation(async function () {
          return this;
        }),
      };

      vi.spyOn(Rental, 'findById').mockResolvedValue(mockRental);

      const res = await request(app)
        .patch(`/api/rentals/${rentalId}/decision`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ decision: 'APPROVE' });

      expect(res.status).toBe(200);
      expect(mockRental.status).toBe('APPROVED');
      expect(mockRental.timeline[0].action).toBe('APPROVED');
    });

    it('should allow owner to reject rental request and release deposit hold', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(ownerUser);

      const mockRental = {
        _id: rentalId,
        owner: { toString: () => ownerUser._id },
        renter: renterUser,
        status: 'REQUESTED',
        depositStatus: 'HELD',
        timeline: [],
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockImplementation(async function () {
          return this;
        }),
      };

      vi.spyOn(Rental, 'findById').mockResolvedValue(mockRental);

      const res = await request(app)
        .patch(`/api/rentals/${rentalId}/decision`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ decision: 'REJECT', reason: 'Item under maintenance' });

      expect(res.status).toBe(200);
      expect(mockRental.status).toBe('REJECTED');
      expect(mockRental.depositStatus).toBe('REFUNDED');
      expect(mockRental.rejectionReason).toBe('Item under maintenance');
    });

    it('should reject non-owner attempting to decide request with 403', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(renterUser);

      vi.spyOn(Rental, 'findById').mockResolvedValue({
        _id: rentalId,
        owner: { toString: () => ownerUser._id },
        status: 'REQUESTED',
      });

      const res = await request(app)
        .patch(`/api/rentals/${rentalId}/decision`)
        .set('Authorization', `Bearer ${renterToken}`)
        .send({ decision: 'APPROVE' });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Only the item owner');
    });
  });

  describe('4. Bilateral Handover Pickup & Inventory Protection', () => {
    it('should record pickup when renter confirms first, remaining in APPROVED', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(renterUser);

      const mockRental = {
        _id: rentalId,
        renter: { toString: () => renterUser._id },
        owner: { toString: () => ownerUser._id },
        status: 'APPROVED',
        handover: { pickupConfirmedByRenter: false, pickupConfirmedByOwner: false },
        timeline: [],
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockImplementation(async function () {
          return this;
        }),
      };

      vi.spyOn(Rental, 'findById').mockResolvedValue(mockRental);

      const res = await request(app)
        .patch(`/api/rentals/${rentalId}/handover`)
        .set('Authorization', `Bearer ${renterToken}`)
        .send({ condition: 'Like New', note: 'Received at Student Center' });

      expect(res.status).toBe(200);
      expect(mockRental.handover.pickupConfirmedByRenter).toBe(true);
      expect(mockRental.status).toBe('APPROVED'); // Still approved until owner confirms
    });

    it('should transition to ACTIVE and mark listing as rented when owner also confirms (bilateral complete)', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(ownerUser);
      const updateListingSpy = vi.spyOn(Listing, 'findByIdAndUpdate').mockResolvedValue({});

      const mockRental = {
        _id: rentalId,
        renter: { toString: () => renterUser._id },
        owner: { toString: () => ownerUser._id },
        listing: listingId,
        status: 'APPROVED',
        handover: {
          pickupConfirmedByRenter: true, // Already confirmed by renter
          pickupConfirmedByOwner: false,
        },
        timeline: [],
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockImplementation(async function () {
          return this;
        }),
      };

      vi.spyOn(Rental, 'findById').mockResolvedValue(mockRental);

      const res = await request(app)
        .patch(`/api/rentals/${rentalId}/handover`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ condition: 'Like New' });

      expect(res.status).toBe(200);
      expect(mockRental.status).toBe('ACTIVE');
      expect(mockRental.handover.pickupConfirmedByOwner).toBe(true);
      expect(updateListingSpy).toHaveBeenCalledWith(listingId, { status: 'rented' });
    });
  });

  describe('5. Return Inspection, Deposit Settlement & Listing Re-Activation', () => {
    it('should allow renter to initiate return, transitioning to RETURN_PENDING', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(renterUser);

      const mockRental = {
        _id: rentalId,
        renter: { toString: () => renterUser._id },
        owner: { toString: () => ownerUser._id },
        status: 'ACTIVE',
        handover: { returnConfirmedByRenter: false },
        timeline: [],
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockImplementation(async function () {
          return this;
        }),
      };

      vi.spyOn(Rental, 'findById').mockResolvedValue(mockRental);

      const res = await request(app)
        .patch(`/api/rentals/${rentalId}/return`)
        .set('Authorization', `Bearer ${renterToken}`)
        .send({ action: 'INITIATE_RETURN' });

      expect(res.status).toBe(200);
      expect(mockRental.status).toBe('RETURN_PENDING');
      expect(mockRental.handover.returnConfirmedByRenter).toBe(true);
    });

    it('should complete rental with full deposit refund and revert listing to active', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(ownerUser);
      const updateListingSpy = vi.spyOn(Listing, 'findByIdAndUpdate').mockResolvedValue({});

      const mockRental = {
        _id: rentalId,
        renter: { toString: () => renterUser._id },
        owner: { toString: () => ownerUser._id },
        listing: listingId,
        status: 'RETURN_PENDING',
        depositAmount: 30,
        handover: { returnConfirmedByRenter: true, returnConfirmedByOwner: false },
        timeline: [],
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockImplementation(async function () {
          return this;
        }),
      };

      vi.spyOn(Rental, 'findById').mockResolvedValue(mockRental);

      const res = await request(app)
        .patch(`/api/rentals/${rentalId}/return`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          action: 'CONFIRM_RETURN',
          depositAction: 'FULL_REFUND',
          conditionAtReturn: 'Excellent',
        });

      expect(res.status).toBe(200);
      expect(mockRental.status).toBe('COMPLETED');
      expect(mockRental.depositStatus).toBe('REFUNDED');
      expect(mockRental.depositRefundAmount).toBe(30);
      expect(mockRental.depositDeductionAmount).toBe(0);
      expect(updateListingSpy).toHaveBeenCalledWith(listingId, { status: 'active' });
    });

    it('should support partial deposit deduction with itemized damage disclosure', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(ownerUser);
      vi.spyOn(Listing, 'findByIdAndUpdate').mockResolvedValue({});

      const mockRental = {
        _id: rentalId,
        renter: { toString: () => renterUser._id },
        owner: { toString: () => ownerUser._id },
        listing: listingId,
        status: 'RETURN_PENDING',
        depositAmount: 50,
        handover: { returnConfirmedByRenter: true, returnConfirmedByOwner: false },
        timeline: [],
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockImplementation(async function () {
          return this;
        }),
      };

      vi.spyOn(Rental, 'findById').mockResolvedValue(mockRental);

      const res = await request(app)
        .patch(`/api/rentals/${rentalId}/return`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          action: 'CONFIRM_RETURN',
          depositAction: 'PARTIAL_REFUND',
          damageDescription: 'Torn spine on pages 40-50 requiring repair',
          deductionAmount: 20,
        });

      expect(res.status).toBe(200);
      expect(mockRental.status).toBe('COMPLETED');
      expect(mockRental.depositStatus).toBe('FORFEITED_PARTIAL');
      expect(mockRental.depositDeductionAmount).toBe(20);
      expect(mockRental.depositRefundAmount).toBe(30);
      expect(mockRental.damageReport.hasDamage).toBe(true);
      expect(mockRental.damageReport.description).toContain('Torn spine');
    });
  });

  describe('6. Cancellation & Dispute Escalation', () => {
    it('should allow student to cancel rental prior to pickup handover', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(renterUser);
      const updateListingSpy = vi.spyOn(Listing, 'findByIdAndUpdate').mockResolvedValue({});

      const mockRental = {
        _id: rentalId,
        renter: { toString: () => renterUser._id },
        owner: { toString: () => ownerUser._id },
        listing: listingId,
        status: 'REQUESTED',
        timeline: [],
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockImplementation(async function () {
          return this;
        }),
      };

      vi.spyOn(Rental, 'findById').mockResolvedValue(mockRental);

      const res = await request(app)
        .patch(`/api/rentals/${rentalId}/cancel`)
        .set('Authorization', `Bearer ${renterToken}`)
        .send({ reason: 'Class dropped' });

      expect(res.status).toBe(200);
      expect(mockRental.status).toBe('CANCELLED');
      expect(mockRental.depositStatus).toBe('REFUNDED');
      expect(updateListingSpy).toHaveBeenCalledWith(listingId, { status: 'active' });
    });

    it('should reject cancelling an already ACTIVE rental with 400', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(renterUser);

      vi.spyOn(Rental, 'findById').mockResolvedValue({
        _id: rentalId,
        renter: { toString: () => renterUser._id },
        owner: { toString: () => ownerUser._id },
        status: 'ACTIVE',
      });

      const res = await request(app)
        .patch(`/api/rentals/${rentalId}/cancel`)
        .set('Authorization', `Bearer ${renterToken}`)
        .send({ reason: 'Cannot cancel active rental' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot cancel a rental in ACTIVE state');
    });

    it('should allow participant to escalate a dispute', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(renterUser);

      const mockRental = {
        _id: rentalId,
        renter: { toString: () => renterUser._id },
        owner: { toString: () => ownerUser._id },
        status: 'RETURN_PENDING',
        timeline: [],
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockImplementation(async function () {
          return this;
        }),
      };

      vi.spyOn(Rental, 'findById').mockResolvedValue(mockRental);

      const res = await request(app)
        .patch(`/api/rentals/${rentalId}/dispute`)
        .set('Authorization', `Bearer ${renterToken}`)
        .send({ reason: 'Disputing unjustified damage deduction for pre-existing wear' });

      expect(res.status).toBe(200);
      expect(mockRental.status).toBe('DISPUTED');
    });
  });
});
