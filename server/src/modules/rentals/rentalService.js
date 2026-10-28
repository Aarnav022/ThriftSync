import Rental from './rentalModel.js';
import Listing from '../listings/listingModel.js';

/**
 * Calculates duration units and rental fee based on listing rate and period.
 */
export function calculateRentalFee(rentalRate, rentalPeriod, startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  let durationUnits = 1;

  switch (rentalPeriod) {
    case 'per day':
      durationUnits = diffDays;
      break;
    case 'per week':
      durationUnits = Math.max(1, Math.ceil(diffDays / 7));
      break;
    case 'per month':
      durationUnits = Math.max(1, Math.ceil(diffDays / 30));
      break;
    case 'per semester':
    default:
      durationUnits = 1;
      break;
  }

  const rate = Number(rentalRate) || 0;
  const totalFee = Math.round(rate * durationUnits * 100) / 100;

  return { durationUnits, rentalFee: totalFee };
}

/**
 * Creates a new student rental booking request.
 */
export async function createRentalRequest(userId, { listingId, startDate, endDate, notes }) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    const error = new Error('Invalid start or end date format');
    error.statusCode = 400;
    throw error;
  }

  if (end <= start) {
    const error = new Error('End date must be strictly after start date');
    error.statusCode = 400;
    throw error;
  }

  // Verify listing exists
  const listing = await Listing.findById(listingId);
  if (!listing) {
    const error = new Error('Listing not found');
    error.statusCode = 404;
    throw error;
  }

  // Prevent self-rental
  if (listing.seller.toString() === userId.toString()) {
    const error = new Error('You cannot rent your own listing');
    error.statusCode = 400;
    throw error;
  }

  // Verify listing eligibility
  if (listing.listingType !== 'rent' && listing.listingType !== 'buy_and_rent') {
    const error = new Error('This listing is not offered for rental');
    error.statusCode = 400;
    throw error;
  }

  if (listing.status !== 'active') {
    const error = new Error(`Listing is not currently available for rental (current status: ${listing.status})`);
    error.statusCode = 400;
    throw error;
  }

  // Concurrency & Overlap Protection:
  // Check for active or requested bookings on this listing with overlapping dates
  const overlappingRental = await Rental.findOne({
    listing: listing._id,
    status: { $in: ['REQUESTED', 'APPROVED', 'ACTIVE', 'RETURN_PENDING', 'OVERDUE'] },
    startDate: { $lt: end },
    endDate: { $gt: start },
  });

  if (overlappingRental) {
    const error = new Error('This item is already booked or requested for overlapping dates');
    error.statusCode = 409;
    throw error;
  }

  const { durationUnits, rentalFee } = calculateRentalFee(
    listing.rentalRate,
    listing.rentalPeriod,
    start,
    end
  );

  const depositAmount = Number(listing.deposit) || 0;

  const rental = new Rental({
    renter: userId,
    owner: listing.seller,
    listing: listing._id,
    startDate: start,
    endDate: end,
    rentalPeriod: listing.rentalPeriod || 'per semester',
    durationUnits,
    rentalFee,
    depositAmount,
    status: 'REQUESTED',
    depositStatus: 'HELD',
    notes: notes || '',
    timeline: [
      {
        action: 'REQUEST_CREATED',
        actor: userId,
        note: notes ? `Booking requested: ${notes}` : 'Booking request submitted',
        timestamp: new Date(),
      },
    ],
  });

  await rental.save();

  await rental.populate([
    { path: 'renter', select: '_id name campus avatar email' },
    { path: 'owner', select: '_id name campus avatar email' },
    {
      path: 'listing',
      select: '_id title category condition listingType price rentalRate rentalPeriod deposit campus pickupLocation images status',
    },
  ]);

  return rental;
}

/**
 * Retrieves rentals for the authenticated user, optionally filtered by role and status.
 */
export async function getRentals(userId, { role, status }) {
  const query = {};

  if (role === 'renter') {
    query.renter = userId;
  } else if (role === 'owner') {
    query.owner = userId;
  } else {
    query.$or = [{ renter: userId }, { owner: userId }];
  }

  if (status) {
    query.status = status;
  }

  const rentals = await Rental.find(query)
    .sort({ createdAt: -1 })
    .populate([
      { path: 'renter', select: '_id name campus avatar email' },
      { path: 'owner', select: '_id name campus avatar email' },
      {
        path: 'listing',
        select: '_id title category condition listingType price rentalRate rentalPeriod deposit campus pickupLocation images status',
      },
    ]);

  return rentals;
}

/**
 * Retrieves a single rental by ID with participant/admin authorization check.
 */
export async function getRentalById(userId, rentalId, userRole = 'student') {
  const rental = await Rental.findById(rentalId).populate([
    { path: 'renter', select: '_id name campus avatar email' },
    { path: 'owner', select: '_id name campus avatar email' },
    {
      path: 'listing',
      select: '_id title category condition listingType price rentalRate rentalPeriod deposit campus pickupLocation images status',
    },
  ]);

  if (!rental) {
    const error = new Error('Rental agreement not found');
    error.statusCode = 404;
    throw error;
  }

  const isRenter = rental.renter._id.toString() === userId.toString();
  const isOwner = rental.owner._id.toString() === userId.toString();
  const isAdmin = userRole === 'admin';

  if (!isRenter && !isOwner && !isAdmin) {
    const error = new Error('Forbidden: You are not authorized to view this rental agreement');
    error.statusCode = 403;
    throw error;
  }

  return rental;
}

/**
 * Owner accepts or declines an incoming rental request.
 */
export async function decideRentalRequest(userId, rentalId, { decision, reason }) {
  const rental = await Rental.findById(rentalId);
  if (!rental) {
    const error = new Error('Rental agreement not found');
    error.statusCode = 404;
    throw error;
  }

  if (rental.owner.toString() !== userId.toString()) {
    const error = new Error('Forbidden: Only the item owner can decide this rental request');
    error.statusCode = 403;
    throw error;
  }

  if (rental.status !== 'REQUESTED') {
    const error = new Error(`Cannot decide rental request in ${rental.status} state`);
    error.statusCode = 400;
    throw error;
  }

  if (decision === 'REJECT') {
    rental.status = 'REJECTED';
    rental.rejectionReason = reason || 'Declined by owner';
    rental.depositStatus = 'REFUNDED';
    rental.timeline.push({
      action: 'REJECTED',
      actor: userId,
      note: reason || 'Rental request declined by owner',
      timestamp: new Date(),
    });
  } else if (decision === 'APPROVE') {
    rental.status = 'APPROVED';
    rental.timeline.push({
      action: 'APPROVED',
      actor: userId,
      note: 'Rental request approved by owner. Awaiting campus handover pickup.',
      timestamp: new Date(),
    });
  }

  await rental.save();

  await rental.populate([
    { path: 'renter', select: '_id name campus avatar email' },
    { path: 'owner', select: '_id name campus avatar email' },
    {
      path: 'listing',
      select: '_id title category condition listingType price rentalRate rentalPeriod deposit campus pickupLocation images status',
    },
  ]);

  return rental;
}

/**
 * Confirms bilateral physical pickup at safe campus exchange point.
 * Once both renter and owner confirm, the rental becomes ACTIVE and listing status updates to 'rented'.
 */
export async function confirmHandoverPickup(userId, rentalId, { condition, note }) {
  const rental = await Rental.findById(rentalId);
  if (!rental) {
    const error = new Error('Rental agreement not found');
    error.statusCode = 404;
    throw error;
  }

  const isRenter = rental.renter.toString() === userId.toString();
  const isOwner = rental.owner.toString() === userId.toString();

  if (!isRenter && !isOwner) {
    const error = new Error('Forbidden: You are not a participant in this rental agreement');
    error.statusCode = 403;
    throw error;
  }

  if (rental.status !== 'APPROVED') {
    const error = new Error(`Pickup handover can only be confirmed for approved rentals (current status: ${rental.status})`);
    error.statusCode = 400;
    throw error;
  }

  if (isRenter) {
    if (rental.handover.pickupConfirmedByRenter) {
      const error = new Error('You have already confirmed pickup handover');
      error.statusCode = 400;
      throw error;
    }
    rental.handover.pickupConfirmedByRenter = true;
    rental.timeline.push({
      action: 'PICKUP_CONFIRMED_RENTER',
      actor: userId,
      note: note || 'Renter confirmed physical receipt of item',
      timestamp: new Date(),
    });
  }

  if (isOwner) {
    if (rental.handover.pickupConfirmedByOwner) {
      const error = new Error('You have already confirmed item handover');
      error.statusCode = 400;
      throw error;
    }
    rental.handover.pickupConfirmedByOwner = true;
    rental.timeline.push({
      action: 'PICKUP_CONFIRMED_OWNER',
      actor: userId,
      note: note || 'Owner confirmed item handed to renter',
      timestamp: new Date(),
    });
  }

  if (condition) {
    rental.conditionAtPickup = condition;
  }

  // Bilateral check: if BOTH have now confirmed, transition to ACTIVE and mark listing as rented
  if (rental.handover.pickupConfirmedByRenter && rental.handover.pickupConfirmedByOwner) {
    rental.status = 'ACTIVE';
    rental.handover.pickupConfirmedAt = new Date();
    rental.timeline.push({
      action: 'RENTAL_ACTIVATED',
      actor: userId,
      note: 'Bilateral pickup verified. Rental is now active.',
      timestamp: new Date(),
    });

    await Listing.findByIdAndUpdate(rental.listing, { status: 'rented' });
  }

  await rental.save();

  await rental.populate([
    { path: 'renter', select: '_id name campus avatar email' },
    { path: 'owner', select: '_id name campus avatar email' },
    {
      path: 'listing',
      select: '_id title category condition listingType price rentalRate rentalPeriod deposit campus pickupLocation images status',
    },
  ]);

  return rental;
}

/**
 * Handles return handover initiation (renter) or return condition inspection & deposit release (owner).
 * When return is confirmed by owner, rental status becomes COMPLETED and listing status reverts to 'active'.
 */
export async function processReturn(
  userId,
  rentalId,
  { action, conditionAtReturn, depositAction, damageDescription, deductionAmount }
) {
  const rental = await Rental.findById(rentalId);
  if (!rental) {
    const error = new Error('Rental agreement not found');
    error.statusCode = 404;
    throw error;
  }

  const isRenter = rental.renter.toString() === userId.toString();
  const isOwner = rental.owner.toString() === userId.toString();

  if (!isRenter && !isOwner) {
    const error = new Error('Forbidden: You are not a participant in this rental agreement');
    error.statusCode = 403;
    throw error;
  }

  if (action === 'INITIATE_RETURN') {
    if (!isRenter) {
      const error = new Error('Forbidden: Only the borrowing student can initiate return');
      error.statusCode = 403;
      throw error;
    }

    if (rental.status !== 'ACTIVE' && rental.status !== 'OVERDUE') {
      const error = new Error(`Cannot initiate return in status ${rental.status}`);
      error.statusCode = 400;
      throw error;
    }

    rental.status = 'RETURN_PENDING';
    rental.handover.returnConfirmedByRenter = true;
    rental.timeline.push({
      action: 'RETURN_INITIATED',
      actor: userId,
      note: 'Renter initiated return and marked item ready for return inspection',
      timestamp: new Date(),
    });
  } else if (action === 'CONFIRM_RETURN') {
    if (!isOwner) {
      const error = new Error('Forbidden: Only the item owner can inspect return condition and settle deposit');
      error.statusCode = 403;
      throw error;
    }

    if (
      rental.status !== 'RETURN_PENDING' &&
      rental.status !== 'ACTIVE' &&
      rental.status !== 'OVERDUE'
    ) {
      const error = new Error(`Cannot confirm return in status ${rental.status}`);
      error.statusCode = 400;
      throw error;
    }

    rental.handover.returnConfirmedByOwner = true;
    rental.handover.returnConfirmedAt = new Date();
    rental.conditionAtReturn = conditionAtReturn || 'Good';

    // Deposit settlement logic
    const deposit = rental.depositAmount || 0;

    if (depositAction === 'FULL_REFUND' || deposit === 0) {
      rental.depositStatus = 'REFUNDED';
      rental.depositRefundAmount = deposit;
      rental.depositDeductionAmount = 0;
      rental.damageReport = { hasDamage: false, description: '', deductionAmount: 0 };
    } else if (depositAction === 'PARTIAL_REFUND') {
      const deduction = Math.min(deposit, Math.max(0, Number(deductionAmount) || 0));
      rental.depositStatus = 'FORFEITED_PARTIAL';
      rental.depositDeductionAmount = deduction;
      rental.depositRefundAmount = Math.max(0, deposit - deduction);
      rental.damageReport = {
        hasDamage: true,
        description: damageDescription || 'Partial deduction for item wear or delay',
        deductionAmount: deduction,
      };
    } else if (depositAction === 'NO_REFUND') {
      rental.depositStatus = 'FORFEITED_FULL';
      rental.depositDeductionAmount = deposit;
      rental.depositRefundAmount = 0;
      rental.damageReport = {
        hasDamage: true,
        description: damageDescription || 'Full deposit retained due to severe damage or item loss',
        deductionAmount: deposit,
      };
    }

    rental.status = 'COMPLETED';

    rental.timeline.push({
      action: 'RETURN_CONFIRMED_OWNER',
      actor: userId,
      note: `Owner confirmed return in condition: ${rental.conditionAtReturn}`,
      timestamp: new Date(),
    });

    rental.timeline.push({
      action: 'DEPOSIT_SETTLED',
      actor: userId,
      note: `Deposit settled: status=${rental.depositStatus}, refund=$${rental.depositRefundAmount}, deduction=$${rental.depositDeductionAmount}`,
      timestamp: new Date(),
    });

    // Revert listing status back to 'active' for future buyers or renters
    await Listing.findByIdAndUpdate(rental.listing, { status: 'active' });
  }

  await rental.save();

  await rental.populate([
    { path: 'renter', select: '_id name campus avatar email' },
    { path: 'owner', select: '_id name campus avatar email' },
    {
      path: 'listing',
      select: '_id title category condition listingType price rentalRate rentalPeriod deposit campus pickupLocation images status',
    },
  ]);

  return rental;
}

/**
 * Cancels a rental prior to bilateral pickup handover.
 */
export async function cancelRental(userId, rentalId, { reason }) {
  const rental = await Rental.findById(rentalId);
  if (!rental) {
    const error = new Error('Rental agreement not found');
    error.statusCode = 404;
    throw error;
  }

  const isRenter = rental.renter.toString() === userId.toString();
  const isOwner = rental.owner.toString() === userId.toString();

  if (!isRenter && !isOwner) {
    const error = new Error('Forbidden: You are not authorized to cancel this rental agreement');
    error.statusCode = 403;
    throw error;
  }

  if (rental.status !== 'REQUESTED' && rental.status !== 'APPROVED') {
    const error = new Error(`Cannot cancel a rental in ${rental.status} state`);
    error.statusCode = 400;
    throw error;
  }

  rental.status = 'CANCELLED';
  rental.cancellationReason = reason || 'Cancelled prior to pickup handover';
  rental.depositStatus = 'REFUNDED';

  rental.timeline.push({
    action: 'CANCELLED',
    actor: userId,
    note: reason ? `Cancelled: ${reason}` : 'Rental cancelled prior to pickup handover',
    timestamp: new Date(),
  });

  // Ensure listing status remains active
  await Listing.findByIdAndUpdate(rental.listing, { status: 'active' });

  await rental.save();

  await rental.populate([
    { path: 'renter', select: '_id name campus avatar email' },
    { path: 'owner', select: '_id name campus avatar email' },
    {
      path: 'listing',
      select: '_id title category condition listingType price rentalRate rentalPeriod deposit campus pickupLocation images status',
    },
  ]);

  return rental;
}

/**
 * Flags a dispute for administrative or campus mediation.
 */
export async function raiseDispute(userId, rentalId, { reason }) {
  const rental = await Rental.findById(rentalId);
  if (!rental) {
    const error = new Error('Rental agreement not found');
    error.statusCode = 404;
    throw error;
  }

  const isRenter = rental.renter.toString() === userId.toString();
  const isOwner = rental.owner.toString() === userId.toString();

  if (!isRenter && !isOwner) {
    const error = new Error('Forbidden: You are not authorized to dispute this rental agreement');
    error.statusCode = 403;
    throw error;
  }

  if (rental.status !== 'RETURN_PENDING' && rental.status !== 'OVERDUE' && rental.status !== 'ACTIVE') {
    const error = new Error(`Cannot dispute rental in ${rental.status} state`);
    error.statusCode = 400;
    throw error;
  }

  rental.status = 'DISPUTED';
  rental.timeline.push({
    action: 'DISPUTED',
    actor: userId,
    note: `Dispute raised: ${reason}`,
    timestamp: new Date(),
  });

  await rental.save();

  await rental.populate([
    { path: 'renter', select: '_id name campus avatar email' },
    { path: 'owner', select: '_id name campus avatar email' },
    {
      path: 'listing',
      select: '_id title category condition listingType price rentalRate rentalPeriod deposit campus pickupLocation images status',
    },
  ]);

  return rental;
}
