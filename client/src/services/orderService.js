import apiClient from './apiClient';

export async function createOrder(orderPayload) {
  const res = await apiClient.post('/orders', orderPayload);
  return res?.data?.order || res?.data || res;
}

export async function fetchMyOrders() {
  const res = await apiClient.get('/orders');
  return res?.data?.orders || res?.orders || res?.data || [];
}

export async function fetchSellerOrders() {
  const res = await apiClient.get('/orders?role=seller');
  return res?.data?.orders || res?.orders || res?.data || [];
}

export async function fetchOrderById(id) {
  const res = await apiClient.get(`/orders/${id}`);
  return res?.data?.order || res?.order || res?.data;
}

export async function cancelOrder(id, reason = 'Buyer requested cancellation') {
  const res = await apiClient.patch(`/orders/${id}/cancel`, { reason });
  return res?.data?.order || res?.data;
}

export async function confirmOrder(id, { pickupLocation, meetupNotes } = {}) {
  const res = await apiClient.patch(`/orders/${id}/confirm`, { pickupLocation, meetupNotes });
  return res?.data?.order || res?.data;
}

export async function confirmHandover(id, note = 'Handover completed') {
  const res = await apiClient.patch(`/orders/${id}/handover`, { note });
  return res?.data?.order || res?.data;
}
