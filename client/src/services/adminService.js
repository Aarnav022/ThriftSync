import apiClient from './apiClient';

export async function fetchAdminMetrics() {
  const res = await apiClient.get('/admin/metrics');
  return res?.data?.metrics || res?.data || {
    totalUsers: 0,
    activeListings: 0,
    pendingApprovals: 0,
    totalOrders: 0,
    totalRevenuePaise: 0
  };
}

export async function fetchAdminListings(params = {}) {
  const res = await apiClient.get('/admin/listings', { params });
  return res?.data?.listings || res?.listings || res?.data || [];
}

export async function updateAdminListingStatus(id, status) {
  const res = await apiClient.patch(`/admin/listings/${id}/status`, { status });
  return res?.data?.listing || res?.data;
}

export async function fetchAdminOrders(params = {}) {
  const res = await apiClient.get('/admin/orders', { params });
  return res?.data?.orders || res?.orders || res?.data || [];
}

export async function updateAdminOrderFulfillment(id, fulfillmentStatus, notes = '') {
  const res = await apiClient.patch(`/admin/orders/${id}/fulfillment`, { fulfillmentStatus, notes });
  return res?.data?.order || res?.data;
}

export async function fetchAdminUsers(params = {}) {
  const res = await apiClient.get('/admin/users', { params });
  return res?.data?.users || res?.users || res?.data || [];
}

export async function updateAdminUserStatus(id, isActive) {
  const res = await apiClient.patch(`/admin/users/${id}/status`, { isActive });
  return res?.data?.user || res?.data;
}
