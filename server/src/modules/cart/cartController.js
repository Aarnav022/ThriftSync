import cartService from './cartService.js';

function resolveIdentifiers(req) {
  const userId = req.user ? req.user._id : null;
  const guestId = req.headers['x-guest-id'] || req.query.guestId || req.body?.guestId || null;
  return { userId, guestId };
}

export async function handleGetCart(req, res, next) {
  try {
    const { userId, guestId } = resolveIdentifiers(req);
    const cart = await cartService.getCart({ userId, guestId });
    res.status(200).json({ status: 'success', data: cart });
  } catch (error) {
    next(error);
  }
}

export async function handleAddToCart(req, res, next) {
  try {
    const { userId, guestId } = resolveIdentifiers(req);
    const { listingId, quantity } = req.body;
    const cart = await cartService.addToCart({ userId, guestId, listingId, quantity });
    res.status(200).json({ status: 'success', message: 'Item added to bag', data: cart });
  } catch (error) {
    next(error);
  }
}

export async function handleUpdateCartItem(req, res, next) {
  try {
    const { userId, guestId } = resolveIdentifiers(req);
    const { listingId, quantity } = req.body;
    const cart = await cartService.updateCartItem({ userId, guestId, listingId, quantity });
    res.status(200).json({ status: 'success', message: 'Cart updated', data: cart });
  } catch (error) {
    next(error);
  }
}

export async function handleRemoveCartItem(req, res, next) {
  try {
    const { userId, guestId } = resolveIdentifiers(req);
    const { listingId } = req.params;
    const cart = await cartService.removeFromCart({ userId, guestId, listingId });
    res.status(200).json({ status: 'success', message: 'Item removed from bag', data: cart });
  } catch (error) {
    next(error);
  }
}

export async function handleClearCart(req, res, next) {
  try {
    const { userId, guestId } = resolveIdentifiers(req);
    await cartService.clearCart({ userId, guestId });
    res.status(200).json({ status: 'success', message: 'Cart cleared' });
  } catch (error) {
    next(error);
  }
}

export async function handleMergeGuestCart(req, res, next) {
  try {
    const userId = req.user._id;
    const { guestId } = req.body;
    const cart = await cartService.mergeGuestCart({ userId, guestId });
    res.status(200).json({ status: 'success', message: 'Guest bag merged into account', data: cart });
  } catch (error) {
    next(error);
  }
}

export default {
  handleGetCart,
  handleAddToCart,
  handleUpdateCartItem,
  handleRemoveCartItem,
  handleClearCart,
  handleMergeGuestCart,
};
