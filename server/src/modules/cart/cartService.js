import Cart from './cartModel.js';
import Listing from '../listings/listingModel.js';
import COMMERCE_CONFIG from '../../config/commerceConfig.js';

/**
 * Calculates authoritative money totals in paise.
 * Free delivery above ₹499 (49900 paise); otherwise ₹49 (4900 paise).
 */
export function calculateAuthoritativeCartTotals(cartItems = []) {
  let subtotalPaise = 0;

  for (const item of cartItems) {
    const unitPricePaise =
      item.listing?.pricePaise ||
      (typeof item.listing?.price === 'number' ? Math.round(item.listing.price * 100) : 0) ||
      item.priceSnapshotPaise ||
      0;
    const qty = item.quantity || 1;
    subtotalPaise += unitPricePaise * qty;
  }

  const isFreeShipping =
    subtotalPaise >= COMMERCE_CONFIG.FREE_SHIPPING_THRESHOLD_PAISE || subtotalPaise === 0;
  const shippingPaise = isFreeShipping ? 0 : COMMERCE_CONFIG.SHIPPING_FEE_PAISE;
  const taxPaise = 0; // Tax is not fabricated without documented GST regulations
  const totalPaise = subtotalPaise + shippingPaise + taxPaise;
  const amountNeededForFreeShippingPaise = Math.max(
    0,
    COMMERCE_CONFIG.FREE_SHIPPING_THRESHOLD_PAISE - subtotalPaise
  );

  return {
    currency: COMMERCE_CONFIG.CURRENCY,
    subtotalPaise,
    shippingPaise,
    taxPaise,
    totalPaise,
    isFreeShipping,
    amountNeededForFreeShippingPaise,
    codEligible: totalPaise <= COMMERCE_CONFIG.COD_MAX_LIMIT_PAISE,
    maxCodLimitPaise: COMMERCE_CONFIG.COD_MAX_LIMIT_PAISE,
  };
}

/**
 * Retrieves the cart for an authenticated user or guest.
 */
export async function getCart({ userId = null, guestId = null }) {
  if (!userId && !guestId) {
    throw new Error('MISSING_IDENTIFIER: Either userId or guestId must be provided.');
  }

  const query = userId ? { user: userId } : { guestId };
  let cart = await Cart.findOne(query).populate({
    path: 'items.listing',
    select: 'title price pricePaise images availableStock status condition campus category sku',
  });

  if (!cart) {
    cart = await Cart.create({
      user: userId,
      guestId: userId ? null : guestId,
      items: [],
      lastActiveAt: new Date(),
    });
  }

  // Filter out archived or completely missing items
  const validItems = (cart.items || []).filter((item) => item.listing && item.listing.status !== 'archived');
  const totals = calculateAuthoritativeCartTotals(validItems);

  return {
    cartId: cart._id,
    items: validItems,
    totals,
  };
}

/**
 * Adds an item to the cart.
 */
export async function addToCart({ userId = null, guestId = null, listingId, quantity = 1 }) {
  if (!listingId) throw new Error('INVALID_INPUT: listingId is required.');
  const parsedQty = Math.max(1, parseInt(quantity, 10) || 1);

  const listing = await Listing.findById(listingId);
  if (!listing || listing.status === 'archived' || listing.status === 'sold') {
    throw new Error('ITEM_UNAVAILABLE: This item is no longer available for purchase.');
  }

  const query = userId ? { user: userId } : { guestId };
  let cart = await Cart.findOne(query);

  if (!cart) {
    cart = new Cart({
      user: userId,
      guestId: userId ? null : guestId,
      items: [],
    });
  }

  const existingItemIndex = cart.items.findIndex(
    (item) => item.listing.toString() === listingId.toString()
  );

  const currentQtyInCart = existingItemIndex >= 0 ? cart.items[existingItemIndex].quantity : 0;
  const newTotalQty = currentQtyInCart + parsedQty;

  const availableStock = listing.availableStock !== undefined ? listing.availableStock : 1;
  if (newTotalQty > availableStock) {
    throw new Error(
      `INSUFFICIENT_STOCK: Only ${availableStock} unit(s) available in stock.`
    );
  }

  if (newTotalQty > COMMERCE_CONFIG.MAX_QTY_PER_ITEM) {
    throw new Error(
      `QTY_LIMIT_EXCEEDED: Maximum allowed quantity per item is ${COMMERCE_CONFIG.MAX_QTY_PER_ITEM}.`
    );
  }

  const priceSnapshotPaise =
    listing.pricePaise || (typeof listing.price === 'number' ? Math.round(listing.price * 100) : 0);

  if (existingItemIndex >= 0) {
    cart.items[existingItemIndex].quantity = newTotalQty;
    cart.items[existingItemIndex].priceSnapshotPaise = priceSnapshotPaise;
  } else {
    cart.items.push({
      listing: listingId,
      sku: listing.sku || `TS-${listingId.toString().slice(-6).toUpperCase()}`,
      quantity: parsedQty,
      priceSnapshotPaise,
    });
  }

  cart.lastActiveAt = new Date();
  await cart.save();

  return getCart({ userId, guestId });
}

/**
 * Updates item quantity in cart.
 */
export async function updateCartItem({ userId = null, guestId = null, listingId, quantity }) {
  const parsedQty = parseInt(quantity, 10);
  const query = userId ? { user: userId } : { guestId };
  const cart = await Cart.findOne(query);

  if (!cart) throw new Error('CART_NOT_FOUND: Cart does not exist.');

  if (parsedQty <= 0) {
    cart.items = cart.items.filter((item) => item.listing.toString() !== listingId.toString());
  } else {
    const item = cart.items.find((item) => item.listing.toString() === listingId.toString());
    if (!item) throw new Error('ITEM_NOT_IN_CART: Item not found in cart.');

    const listing = await Listing.findById(listingId);
    if (!listing || listing.status === 'archived') {
      throw new Error('ITEM_UNAVAILABLE: Item is no longer active.');
    }

    const availableStock = listing.availableStock !== undefined ? listing.availableStock : 1;
    if (parsedQty > availableStock) {
      throw new Error(`INSUFFICIENT_STOCK: Only ${availableStock} unit(s) available.`);
    }

    item.quantity = Math.min(parsedQty, COMMERCE_CONFIG.MAX_QTY_PER_ITEM);
  }

  cart.lastActiveAt = new Date();
  await cart.save();

  return getCart({ userId, guestId });
}

/**
 * Removes item from cart.
 */
export async function removeFromCart({ userId = null, guestId = null, listingId }) {
  return updateCartItem({ userId, guestId, listingId, quantity: 0 });
}

/**
 * Clears the cart completely.
 */
export async function clearCart({ userId = null, guestId = null }) {
  const query = userId ? { user: userId } : { guestId };
  await Cart.updateOne(query, { $set: { items: [], lastActiveAt: new Date() } }).catch(() => {});
  return { success: true };
}

/**
 * Merges a guest cart into the authenticated user's cart on login.
 */
export async function mergeGuestCart({ userId, guestId }) {
  if (!userId || !guestId) return getCart({ userId });

  const guestCart = await Cart.findOne({ guestId });
  if (!guestCart || !guestCart.items || guestCart.items.length === 0) {
    return getCart({ userId });
  }

  let userCart = await Cart.findOne({ user: userId });
  if (!userCart) {
    userCart = new Cart({
      user: userId,
      items: [],
    });
  }

  const warnings = [];

  for (const guestItem of guestCart.items) {
    const listing = await Listing.findById(guestItem.listing);
    if (!listing || listing.status === 'archived' || listing.status === 'sold') {
      warnings.push(`Item "${guestItem.sku}" is no longer available and was excluded.`);
      continue;
    }

    const availableStock = listing.availableStock !== undefined ? listing.availableStock : 1;
    if (availableStock <= 0) {
      warnings.push(`Item "${listing.title}" is out of stock and was excluded.`);
      continue;
    }

    const existingIndex = userCart.items.findIndex(
      (item) => item.listing.toString() === guestItem.listing.toString()
    );

    const priceSnapshotPaise =
      listing.pricePaise || (typeof listing.price === 'number' ? Math.round(listing.price * 100) : 0);

    if (existingIndex >= 0) {
      const mergedQty = Math.min(
        userCart.items[existingIndex].quantity + guestItem.quantity,
        availableStock,
        COMMERCE_CONFIG.MAX_QTY_PER_ITEM
      );
      userCart.items[existingIndex].quantity = mergedQty;
      userCart.items[existingIndex].priceSnapshotPaise = priceSnapshotPaise;
    } else {
      const mergedQty = Math.min(
        guestItem.quantity,
        availableStock,
        COMMERCE_CONFIG.MAX_QTY_PER_ITEM
      );
      userCart.items.push({
        listing: guestItem.listing,
        sku: listing.sku || guestItem.sku,
        quantity: mergedQty,
        priceSnapshotPaise,
      });
    }
  }

  userCart.lastActiveAt = new Date();
  await userCart.save();

  // Clear or remove guest cart after merge
  await Cart.deleteOne({ _id: guestCart._id }).catch(() => {});

  const fullCart = await getCart({ userId });
  return {
    ...fullCart,
    mergeWarnings: warnings,
  };
}

export default {
  calculateAuthoritativeCartTotals,
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  mergeGuestCart,
};
