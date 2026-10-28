import apiClient from '../../services/apiClient.js';

export async function proposeSwap({ offeredListingId, requestedListingId, message }) {
  const response = await apiClient.post('/swaps', {
    offeredListingId,
    requestedListingId,
    message,
  });
  return response.data.swap;
}

export async function fetchUserSwaps(params = {}) {
  const response = await apiClient.get('/swaps', { params });
  return response.data;
}

export async function fetchSwapById(id) {
  const response = await apiClient.get(`/swaps/${id}`);
  return response.data.swap;
}

export async function counterSwap(id, { offeredListingId, requestedListingId, message }) {
  const response = await apiClient.post(`/swaps/${id}/counter-offers`, {
    offeredListingId,
    requestedListingId,
    message,
  });
  return response.data.swap;
}

export async function acceptSwap(id) {
  const response = await apiClient.post(`/swaps/${id}/accept`);
  return response.data.swap;
}

export async function rejectSwap(id, reason = '') {
  const response = await apiClient.post(`/swaps/${id}/reject`, { reason });
  return response.data.swap;
}

export async function withdrawSwap(id) {
  const response = await apiClient.post(`/swaps/${id}/withdraw`);
  return response.data.swap;
}

export async function cancelSwap(id, reason = '') {
  const response = await apiClient.post(`/swaps/${id}/cancel`, { reason });
  return response.data.swap;
}

export async function confirmHandover(id) {
  const response = await apiClient.post(`/swaps/${id}/confirm-handover`);
  return response.data.swap;
}
