import apiClient from '../../services/apiClient.js';

export async function fetchAdminMetrics() {
  const response = await apiClient.get('/admin/metrics');
  return response.data.metrics;
}

export async function fetchAdminUsers(params = {}) {
  const response = await apiClient.get('/admin/users', { params });
  return response.data;
}

export async function updateAdminUserStatus(id, isActive) {
  const response = await apiClient.patch(`/admin/users/${id}/status`, { isActive });
  return response.data.user;
}

export async function fetchAdminListings(params = {}) {
  const response = await apiClient.get('/admin/listings', { params });
  return response.data;
}

export async function updateAdminListingStatus(id, status) {
  const response = await apiClient.patch(`/admin/listings/${id}/status`, { status });
  return response.data.listing;
}

export async function submitReport(reportData) {
  const response = await apiClient.post('/admin/reports', reportData);
  return response.data.report;
}

export async function fetchAdminReports(params = {}) {
  const response = await apiClient.get('/admin/reports', { params });
  return response.data;
}

export async function resolveAdminReport(id, resolutionData) {
  const response = await apiClient.patch(`/admin/reports/${id}`, resolutionData);
  return response.data.report;
}

export async function fetchAdminOrders(params = {}) {
  const response = await apiClient.get('/admin/orders', { params });
  return response.data;
}

export async function updateAdminOrderFulfillment(id, fulfillmentData) {
  const response = await apiClient.patch(`/admin/orders/${id}/fulfillment`, fulfillmentData);
  return response.data.order;
}

export default {
  fetchAdminMetrics,
  fetchAdminUsers,
  updateAdminUserStatus,
  fetchAdminListings,
  updateAdminListingStatus,
  submitReport,
  fetchAdminReports,
  resolveAdminReport,
  fetchAdminOrders,
  updateAdminOrderFulfillment,
};
