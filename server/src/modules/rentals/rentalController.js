import * as rentalService from './rentalService.js';

export async function handleCreateRental(req, res, next) {
  try {
    const rental = await rentalService.createRentalRequest(req.user._id, req.body);
    return res.status(201).json({
      status: 'success',
      message: 'Rental request submitted successfully',
      data: { rental },
    });
  } catch (error) {
    next(error);
  }
}

export async function handleGetRentals(req, res, next) {
  try {
    const rentals = await rentalService.getRentals(req.user._id, req.query);
    return res.status(200).json({
      status: 'success',
      data: {
        rentals,
        count: rentals.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function handleGetRentalById(req, res, next) {
  try {
    const rental = await rentalService.getRentalById(req.user._id, req.params.id, req.user.role);
    return res.status(200).json({
      status: 'success',
      data: { rental },
    });
  } catch (error) {
    next(error);
  }
}

export async function handleDecideRental(req, res, next) {
  try {
    const rental = await rentalService.decideRentalRequest(req.user._id, req.params.id, req.body);
    const msg = req.body.decision === 'APPROVE' ? 'Rental request approved' : 'Rental request rejected';
    return res.status(200).json({
      status: 'success',
      message: msg,
      data: { rental },
    });
  } catch (error) {
    next(error);
  }
}

export async function handleHandoverPickup(req, res, next) {
  try {
    const rental = await rentalService.confirmHandoverPickup(req.user._id, req.params.id, req.body);
    return res.status(200).json({
      status: 'success',
      message: rental.status === 'ACTIVE'
        ? 'Bilateral pickup verified. Rental is now active.'
        : 'Handover pickup confirmed. Waiting for other party.',
      data: { rental },
    });
  } catch (error) {
    next(error);
  }
}

export async function handleProcessReturn(req, res, next) {
  try {
    const rental = await rentalService.processReturn(req.user._id, req.params.id, req.body);
    const msg = req.body.action === 'CONFIRM_RETURN'
      ? 'Return confirmed and security deposit settled'
      : 'Return initiated and awaiting owner inspection';
    return res.status(200).json({
      status: 'success',
      message: msg,
      data: { rental },
    });
  } catch (error) {
    next(error);
  }
}

export async function handleCancelRental(req, res, next) {
  try {
    const rental = await rentalService.cancelRental(req.user._id, req.params.id, req.body);
    return res.status(200).json({
      status: 'success',
      message: 'Rental request cancelled',
      data: { rental },
    });
  } catch (error) {
    next(error);
  }
}

export async function handleDisputeRental(req, res, next) {
  try {
    const rental = await rentalService.raiseDispute(req.user._id, req.params.id, req.body);
    return res.status(200).json({
      status: 'success',
      message: 'Dispute submitted for review',
      data: { rental },
    });
  } catch (error) {
    next(error);
  }
}
