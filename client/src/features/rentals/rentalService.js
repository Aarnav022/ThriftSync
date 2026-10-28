import apiClient from '../../services/apiClient.js';

export async function requestRental({ listingId, startDate, endDate, notes }) {
  const response = await apiClient.post('/rentals', {
    listingId,
    startDate,
    endDate,
    notes,
  });
  return response.data.rental;
}

export async function fetchUserRentals(params = {}) {
  const response = await apiClient.get('/rentals', { params });
  return response.data.rentals || [];
}

export async function fetchRentalById(id) {
  const response = await apiClient.get(`/rentals/${id}`);
  return response.data.rental;
}

export async function decideRental(id, { decision, reason = '' }) {
  const response = await apiClient.patch(`/rentals/${id}/decision`, {
    decision,
    reason,
  });
  return response.data.rental;
}

export async function confirmHandoverPickup(id, { condition = 'Good', note = '' } = {}) {
  const response = await apiClient.patch(`/rentals/${id}/handover`, {
    condition,
    note,
  });
  return response.data.rental;
}

export async function processReturn(
  id,
  {
    action = 'INITIATE_RETURN',
    conditionAtReturn = 'Good',
    depositAction = 'FULL_REFUND',
    damageDescription = '',
    deductionAmount = 0,
  } = {}
) {
  const response = await apiClient.patch(`/rentals/${id}/return`, {
    action,
    conditionAtReturn,
    depositAction,
    damageDescription,
    deductionAmount,
  });
  return response.data.rental;
}

export async function cancelRental(id, reason = '') {
  const response = await apiClient.patch(`/rentals/${id}/cancel`, { reason });
  return response.data.rental;
}

export async function disputeRental(id, reason) {
  const response = await apiClient.patch(`/rentals/${id}/dispute`, { reason });
  return response.data.rental;
}
