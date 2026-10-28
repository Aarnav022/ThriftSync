import apiClient from '../../services/apiClient.js';

export async function createOrder({
  listingId,
  pickupLocation = 'Campus Student Center',
  meetupNotes = '',
  paymentMethod = 'CAMPUS_HANDOVER',
}) {
  const response = await apiClient.post('/orders', {
    listingId,
    pickupLocation,
    meetupNotes,
    paymentMethod,
  });
  return response.data.order;
}

export async function fetchUserOrders(params = {}) {
  const response = await apiClient.get('/orders', { params });
  return response.data.orders || [];
}

export async function fetchOrderById(id) {
  const response = await apiClient.get(`/orders/${id}`);
  return response.data.order;
}

export async function confirmOrder(id, { pickupLocation, meetupNotes = '' } = {}) {
  const response = await apiClient.patch(`/orders/${id}/confirm`, {
    pickupLocation,
    meetupNotes,
  });
  return response.data.order;
}

export async function confirmOrderHandover(id, { note = '' } = {}) {
  const response = await apiClient.patch(`/orders/${id}/handover`, { note });
  return response.data.order;
}

export async function cancelOrder(id, reason = '') {
  const response = await apiClient.patch(`/orders/${id}/cancel`, { reason });
  return response.data.order;
}

export async function disputeOrder(id, reason) {
  const response = await apiClient.patch(`/orders/${id}/dispute`, { reason });
  return response.data.order;
}
