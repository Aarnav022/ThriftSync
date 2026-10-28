import * as swapService from './swapService.js';

export async function handleCreateProposal(req, res, next) {
  try {
    const swap = await swapService.createProposal(req.user._id, req.body);
    return res.status(201).json({
      status: 'success',
      message: 'Swap proposal created successfully',
      data: { swap },
    });
  } catch (error) {
    next(error);
  }
}

export async function handleGetSwaps(req, res, next) {
  try {
    const result = await swapService.getSwaps(req.user._id, req.query);
    return res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleGetSwapById(req, res, next) {
  try {
    const swap = await swapService.getSwapById(req.params.id, req.user._id, req.user.role);
    return res.status(200).json({
      status: 'success',
      data: { swap },
    });
  } catch (error) {
    next(error);
  }
}

export async function handleCounterProposal(req, res, next) {
  try {
    const swap = await swapService.counterProposal(req.params.id, req.user._id, req.body);
    return res.status(200).json({
      status: 'success',
      message: 'Counter-offer submitted successfully',
      data: { swap },
    });
  } catch (error) {
    next(error);
  }
}

export async function handleAcceptProposal(req, res, next) {
  try {
    const swap = await swapService.acceptProposal(req.params.id, req.user._id);
    return res.status(200).json({
      status: 'success',
      message: 'Swap proposal accepted. Items reserved for exchange.',
      data: { swap },
    });
  } catch (error) {
    next(error);
  }
}

export async function handleRejectProposal(req, res, next) {
  try {
    const swap = await swapService.rejectProposal(req.params.id, req.user._id, req.body?.reason);
    return res.status(200).json({
      status: 'success',
      message: 'Swap proposal rejected',
      data: { swap },
    });
  } catch (error) {
    next(error);
  }
}

export async function handleWithdrawProposal(req, res, next) {
  try {
    const swap = await swapService.withdrawProposal(req.params.id, req.user._id);
    return res.status(200).json({
      status: 'success',
      message: 'Swap proposal withdrawn',
      data: { swap },
    });
  } catch (error) {
    next(error);
  }
}

export async function handleCancelProposal(req, res, next) {
  try {
    const swap = await swapService.cancelProposal(req.params.id, req.user._id, req.body?.reason);
    return res.status(200).json({
      status: 'success',
      message: 'Swap exchange cancelled. Item reservations released.',
      data: { swap },
    });
  } catch (error) {
    next(error);
  }
}

export async function handleConfirmHandover(req, res, next) {
  try {
    const swap = await swapService.confirmHandover(req.params.id, req.user._id);
    const isCompleted = swap.status === 'COMPLETED';
    return res.status(200).json({
      status: 'success',
      message: isCompleted
        ? 'Physical handover confirmed by both participants! Exchange completed.'
        : 'Your handover confirmation recorded. Awaiting peer confirmation.',
      data: { swap },
    });
  } catch (error) {
    next(error);
  }
}
