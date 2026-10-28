import Swap from './swapModel.js';
import Listing from '../listings/listingModel.js';

/**
 * Proposes a new circular swap between an offered listing and a requested listing.
 */
export async function createProposal(userId, { offeredListingId, requestedListingId, message }) {
  // Proposer cannot swap with self
  if (offeredListingId === requestedListingId) {
    const error = new Error('You cannot swap an item for itself');
    error.statusCode = 400;
    throw error;
  }

  // Verify offered listing
  const offeredListing = await Listing.findById(offeredListingId);
  if (!offeredListing) {
    const error = new Error('Offered listing not found');
    error.statusCode = 404;
    throw error;
  }

  if (offeredListing.seller.toString() !== userId.toString()) {
    const error = new Error('Forbidden: You can only offer items from your own inventory');
    error.statusCode = 403;
    throw error;
  }

  if (offeredListing.status !== 'active') {
    const error = new Error('The offered listing is not currently active');
    error.statusCode = 400;
    throw error;
  }

  // Verify requested listing
  const requestedListing = await Listing.findById(requestedListingId);
  if (!requestedListing) {
    const error = new Error('Requested listing not found');
    error.statusCode = 404;
    throw error;
  }

  if (requestedListing.seller.toString() === userId.toString()) {
    const error = new Error('Invalid request: You cannot propose a swap with yourself');
    error.statusCode = 400;
    throw error;
  }

  if (requestedListing.status !== 'active') {
    const error = new Error('The requested listing is not currently available for swaps');
    error.statusCode = 400;
    throw error;
  }

  // Check for duplicate active proposal between these items
  const existingActiveProposal = await Swap.findOne({
    offeredListing: offeredListing._id,
    requestedListing: requestedListing._id,
    status: { $in: ['PENDING', 'COUNTERED', 'ACCEPTED'] },
  });

  if (existingActiveProposal) {
    const error = new Error('An active swap proposal already exists for these items');
    error.statusCode = 409;
    throw error;
  }

  const recipientId = requestedListing.seller;

  const swap = new Swap({
    proposer: userId,
    recipient: recipientId,
    offeredListing: offeredListing._id,
    requestedListing: requestedListing._id,
    initialMessage: message || '',
    status: 'PENDING',
    currentTurn: recipientId,
    timeline: [
      {
        action: 'PROPOSAL_CREATED',
        actor: userId,
        note: message || 'Initial proposal submitted',
      },
    ],
  });

  await swap.save();

  await swap.populate([
    { path: 'proposer', select: '_id name campus avatar' },
    { path: 'recipient', select: '_id name campus avatar' },
    { path: 'offeredListing', select: '_id title category condition listingType price campus images status' },
    { path: 'requestedListing', select: '_id title category condition listingType price campus images status' },
  ]);

  return swap;
}

/**
 * Retrieves swap proposals for the authenticated student.
 */
export async function getSwaps(userId, filters = {}) {
  const query = {};

  if (filters.type === 'incoming') {
    query.recipient = userId;
  } else if (filters.type === 'outgoing') {
    query.proposer = userId;
  } else {
    query.$or = [{ proposer: userId }, { recipient: userId }];
  }

  if (filters.status) {
    query.status = filters.status;
  }

  const swaps = await Swap.find(query)
    .sort({ updatedAt: -1 })
    .populate([
      { path: 'proposer', select: '_id name campus avatar' },
      { path: 'recipient', select: '_id name campus avatar' },
      { path: 'offeredListing', select: '_id title category condition listingType price campus images status' },
      { path: 'requestedListing', select: '_id title category condition listingType price campus images status' },
      { path: 'counterOffers.offeredListing', select: '_id title category condition' },
      { path: 'counterOffers.requestedListing', select: '_id title category condition' },
    ]);

  return {
    swaps,
    total: swaps.length,
  };
}

/**
 * Retrieves a single swap proposal by ID with authorization verification.
 */
export async function getSwapById(swapId, userId, userRole) {
  const swap = await Swap.findById(swapId).populate([
    { path: 'proposer', select: '_id name campus avatar' },
    { path: 'recipient', select: '_id name campus avatar' },
    { path: 'offeredListing' },
    { path: 'requestedListing' },
    { path: 'timeline.actor', select: '_id name' },
    { path: 'counterOffers.sender', select: '_id name' },
    { path: 'counterOffers.offeredListing', select: '_id title category' },
    { path: 'counterOffers.requestedListing', select: '_id title category' },
  ]);

  if (!swap) {
    const error = new Error('Swap proposal not found');
    error.statusCode = 404;
    throw error;
  }

  const isProposer = swap.proposer._id.toString() === userId.toString();
  const isRecipient = swap.recipient._id.toString() === userId.toString();
  const isAdmin = userRole === 'admin';

  if (!isProposer && !isRecipient && !isAdmin) {
    const error = new Error('Access denied: You do not have permission to view this proposal');
    error.statusCode = 403;
    throw error;
  }

  return swap;
}

/**
 * Submits a counter-offer for an active swap proposal.
 */
export async function counterProposal(swapId, userId, { offeredListingId, requestedListingId, message }) {
  const swap = await Swap.findById(swapId);

  if (!swap) {
    const error = new Error('Swap proposal not found');
    error.statusCode = 404;
    throw error;
  }

  if (swap.status !== 'PENDING' && swap.status !== 'COUNTERED') {
    const error = new Error(`Cannot submit a counter-offer for a proposal in '${swap.status}' status`);
    error.statusCode = 400;
    throw error;
  }

  if (swap.currentTurn.toString() !== userId.toString()) {
    const error = new Error('It is not your turn to respond to or counter this proposal');
    error.statusCode = 403;
    throw error;
  }

  const isProposer = swap.proposer.toString() === userId.toString();
  const newRecipient = isProposer ? swap.recipient : swap.proposer;

  // Use provided listings or keep current
  let activeOffered = swap.offeredListing;
  let activeRequested = swap.requestedListing;

  if (offeredListingId) {
    const offered = await Listing.findById(offeredListingId);
    if (!offered || offered.status !== 'active' || offered.seller.toString() !== userId.toString()) {
      const error = new Error('Invalid offered listing in counter-offer');
      error.statusCode = 400;
      throw error;
    }
    activeOffered = offered._id;
  }

  if (requestedListingId) {
    const requested = await Listing.findById(requestedListingId);
    if (!requested || requested.status !== 'active' || requested.seller.toString() !== newRecipient.toString()) {
      const error = new Error('Invalid requested listing in counter-offer');
      error.statusCode = 400;
      throw error;
    }
    activeRequested = requested._id;
  }

  swap.offeredListing = activeOffered;
  swap.requestedListing = activeRequested;
  swap.status = 'COUNTERED';
  swap.currentTurn = newRecipient;

  swap.counterOffers.push({
    sender: userId,
    recipient: newRecipient,
    offeredListing: activeOffered,
    requestedListing: activeRequested,
    message: message || '',
    createdAt: new Date(),
  });

  swap.timeline.push({
    action: 'COUNTER_OFFERED',
    actor: userId,
    note: message || 'Counter-offer proposed with updated terms',
    timestamp: new Date(),
  });

  await swap.save();
  await swap.populate([
    { path: 'proposer', select: '_id name campus avatar' },
    { path: 'recipient', select: '_id name campus avatar' },
    { path: 'offeredListing', select: '_id title category condition price status' },
    { path: 'requestedListing', select: '_id title category condition price status' },
  ]);

  return swap;
}

/**
 * Accepts an active proposal or counter-offer with atomic listing reservation.
 */
export async function acceptProposal(swapId, userId) {
  const swap = await Swap.findById(swapId);

  if (!swap) {
    const error = new Error('Swap proposal not found');
    error.statusCode = 404;
    throw error;
  }

  if (swap.status !== 'PENDING' && swap.status !== 'COUNTERED') {
    const error = new Error(`Cannot accept a proposal in '${swap.status}' status`);
    error.statusCode = 400;
    throw error;
  }

  if (swap.currentTurn.toString() !== userId.toString()) {
    const error = new Error('Only the receiving party may accept this proposal');
    error.statusCode = 403;
    throw error;
  }

  // Atomic conditional reservation to guard against competing acceptance
  const reservedOffered = await Listing.findOneAndUpdate(
    { _id: swap.offeredListing, status: 'active' },
    { status: 'reserved' },
    { new: true }
  );

  if (!reservedOffered) {
    const error = new Error('Conflict: The offered listing is no longer active or available');
    error.statusCode = 409;
    throw error;
  }

  const reservedRequested = await Listing.findOneAndUpdate(
    { _id: swap.requestedListing, status: 'active' },
    { status: 'reserved' },
    { new: true }
  );

  if (!reservedRequested) {
    // Rollback the first item's reservation
    await Listing.findByIdAndUpdate(swap.offeredListing, { status: 'active' });
    const error = new Error('Conflict: The requested listing is no longer active or available');
    error.statusCode = 409;
    throw error;
  }

  swap.status = 'ACCEPTED';
  swap.timeline.push({
    action: 'ACCEPTED',
    actor: userId,
    note: 'Proposal accepted. Both items reserved for physical exchange.',
    timestamp: new Date(),
  });

  await swap.save();
  await swap.populate([
    { path: 'proposer', select: '_id name campus avatar' },
    { path: 'recipient', select: '_id name campus avatar' },
    { path: 'offeredListing' },
    { path: 'requestedListing' },
  ]);

  return swap;
}

/**
 * Rejects an active proposal or counter-offer.
 */
export async function rejectProposal(swapId, userId, reason = '') {
  const swap = await Swap.findById(swapId);

  if (!swap) {
    const error = new Error('Swap proposal not found');
    error.statusCode = 404;
    throw error;
  }

  if (swap.status !== 'PENDING' && swap.status !== 'COUNTERED') {
    const error = new Error(`Cannot reject a proposal in '${swap.status}' status`);
    error.statusCode = 400;
    throw error;
  }

  if (swap.currentTurn.toString() !== userId.toString()) {
    const error = new Error('Only the receiving party may reject this proposal');
    error.statusCode = 403;
    throw error;
  }

  swap.status = 'REJECTED';
  swap.rejectionReason = reason;
  swap.timeline.push({
    action: 'REJECTED',
    actor: userId,
    note: reason || 'Proposal was rejected',
    timestamp: new Date(),
  });

  await swap.save();
  return swap;
}

/**
 * Withdraws a proposal prior to acceptance by the offering party.
 */
export async function withdrawProposal(swapId, userId) {
  const swap = await Swap.findById(swapId);

  if (!swap) {
    const error = new Error('Swap proposal not found');
    error.statusCode = 404;
    throw error;
  }

  if (swap.status !== 'PENDING' && swap.status !== 'COUNTERED') {
    const error = new Error(`Cannot withdraw a proposal in '${swap.status}' status`);
    error.statusCode = 400;
    throw error;
  }

  // Only the party who does NOT have the current turn (i.e. who sent the active offer) can withdraw
  const isParticipant =
    swap.proposer.toString() === userId.toString() ||
    swap.recipient.toString() === userId.toString();

  if (!isParticipant || swap.currentTurn.toString() === userId.toString()) {
    const error = new Error('Only the party who submitted the active offer may withdraw it');
    error.statusCode = 403;
    throw error;
  }

  swap.status = 'WITHDRAWN';
  swap.timeline.push({
    action: 'WITHDRAWN',
    actor: userId,
    note: 'Proposal withdrawn by proposer before acceptance',
    timestamp: new Date(),
  });

  await swap.save();
  return swap;
}

/**
 * Cancels an accepted exchange prior to completion and releases item reservations.
 */
export async function cancelProposal(swapId, userId, reason = '') {
  const swap = await Swap.findById(swapId);

  if (!swap) {
    const error = new Error('Swap proposal not found');
    error.statusCode = 404;
    throw error;
  }

  if (swap.status !== 'ACCEPTED') {
    const error = new Error(`Cannot cancel a proposal in '${swap.status}' status`);
    error.statusCode = 400;
    throw error;
  }

  const isProposer = swap.proposer.toString() === userId.toString();
  const isRecipient = swap.recipient.toString() === userId.toString();

  if (!isProposer && !isRecipient) {
    const error = new Error('Access denied: Only exchange participants can cancel an accepted swap');
    error.statusCode = 403;
    throw error;
  }

  // Release item reservations back to active status
  await Listing.findByIdAndUpdate(swap.offeredListing, { status: 'active' });
  await Listing.findByIdAndUpdate(swap.requestedListing, { status: 'active' });

  swap.status = 'CANCELLED';
  swap.cancellationReason = reason;
  swap.timeline.push({
    action: 'CANCELLED',
    actor: userId,
    note: reason || 'Exchange cancelled prior to handover. Item locks released.',
    timestamp: new Date(),
  });

  await swap.save();
  return swap;
}

/**
 * Confirms physical handover by a participant. When both confirm, transitions to COMPLETED.
 */
export async function confirmHandover(swapId, userId) {
  const swap = await Swap.findById(swapId);

  if (!swap) {
    const error = new Error('Swap proposal not found');
    error.statusCode = 404;
    throw error;
  }

  if (swap.status !== 'ACCEPTED') {
    const error = new Error(`Cannot confirm handover for a proposal in '${swap.status}' status`);
    error.statusCode = 400;
    throw error;
  }

  const isProposer = swap.proposer.toString() === userId.toString();
  const isRecipient = swap.recipient.toString() === userId.toString();

  if (!isProposer && !isRecipient) {
    const error = new Error('Forbidden: Only swap participants may confirm physical handover');
    error.statusCode = 403;
    throw error;
  }

  const now = new Date();

  if (isProposer) {
    if (swap.handoverConfirmations.proposerConfirmed) {
      const error = new Error('You have already confirmed handover for this exchange');
      error.statusCode = 400;
      throw error;
    }
    swap.handoverConfirmations.proposerConfirmed = true;
    swap.handoverConfirmations.proposerConfirmedAt = now;
  } else if (isRecipient) {
    if (swap.handoverConfirmations.recipientConfirmed) {
      const error = new Error('You have already confirmed handover for this exchange');
      error.statusCode = 400;
      throw error;
    }
    swap.handoverConfirmations.recipientConfirmed = true;
    swap.handoverConfirmations.recipientConfirmedAt = now;
  }

  swap.timeline.push({
    action: 'HANDOVER_CONFIRMED',
    actor: userId,
    note: `Handover verified by ${isProposer ? 'proposer' : 'recipient'}`,
    timestamp: now,
  });

  // If both participants confirmed handover, complete the exchange!
  if (
    swap.handoverConfirmations.proposerConfirmed &&
    swap.handoverConfirmations.recipientConfirmed
  ) {
    swap.status = 'COMPLETED';
    swap.timeline.push({
      action: 'COMPLETED',
      actor: userId,
      note: 'Both participants independently confirmed physical handover. Circular exchange complete!',
      timestamp: now,
    });

    // Mark both items as archived (swapped)
    await Listing.findByIdAndUpdate(swap.offeredListing, { status: 'archived' });
    await Listing.findByIdAndUpdate(swap.requestedListing, { status: 'archived' });
  }

  await swap.save();
  await swap.populate([
    { path: 'proposer', select: '_id name campus avatar' },
    { path: 'recipient', select: '_id name campus avatar' },
    { path: 'offeredListing' },
    { path: 'requestedListing' },
  ]);

  return swap;
}
