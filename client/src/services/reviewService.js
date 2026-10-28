import apiClient from './apiClient';

export async function submitReview(reviewPayload) {
  const res = await apiClient.post('/reviews', reviewPayload);
  return res?.data?.review || res?.data || res;
}

export async function fetchReviews(params = {}) {
  const res = await apiClient.get('/reviews', { params });
  return res?.data?.reviews || res?.reviews || res?.data || [];
}
