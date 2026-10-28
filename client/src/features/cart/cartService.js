import apiClient from '../../services/apiClient.js';

export function getOrCreateGuestId() {
  try {
    let guestId = localStorage.getItem('thriftsync_guest_id');
    if (!guestId) {
      guestId = `gst_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;
      localStorage.setItem('thriftsync_guest_id', guestId);
    }
    return guestId;
  } catch {
    return 'guest_fallback_id';
  }
}

function getCartHeaders() {
  const token = localStorage.getItem('thriftsync_token');
  if (!token) {
    return { 'x-guest-id': getOrCreateGuestId() };
  }
  return {};
}

export async function fetchCart() {
  const response = await apiClient.get('/cart', {
    headers: getCartHeaders(),
  });
  return response.data;
}

export async function addItemToCart(listingId, quantity = 1) {
  const response = await apiClient.post(
    '/cart/items',
    { listingId, quantity },
    { headers: getCartHeaders() }
  );
  return response.data;
}

export async function updateCartItemQuantity(listingId, quantity) {
  const response = await apiClient.patch(
    '/cart/items',
    { listingId, quantity },
    { headers: getCartHeaders() }
  );
  return response.data;
}

export async function removeItemFromCart(listingId) {
  const response = await apiClient.delete(`/cart/items/${listingId}`, {
    headers: getCartHeaders(),
  });
  return response.data;
}

export async function clearCart() {
  const response = await apiClient.delete('/cart', {
    headers: getCartHeaders(),
  });
  return response.data;
}

export async function mergeGuestCart() {
  try {
    const guestId = localStorage.getItem('thriftsync_guest_id');
    if (!guestId) return null;

    const response = await apiClient.post('/cart/merge', { guestId });
    localStorage.removeItem('thriftsync_guest_id');
    return response.data;
  } catch (err) {
    console.warn('[Cart Merge Warning]:', err.message);
    return null;
  }
}

export default {
  fetchCart,
  addItemToCart,
  updateCartItemQuantity,
  removeItemFromCart,
  clearCart,
  mergeGuestCart,
};
