import apiClient from '../../services/apiClient.js';

export async function submitReview({
  targetUserId,
  listingId,
  transactionType,
  transactionId,
  rating,
  reviewText,
  itemConditionAsDescribed = true,
  punctualHandover = true,
  communication = 5,
}) {
  const response = await apiClient.post('/reviews', {
    targetUserId,
    listingId,
    transactionType,
    transactionId,
    rating,
    reviewText,
    itemConditionAsDescribed,
    punctualHandover,
    communication,
  });
  return response.data.review;
}

export async function fetchUserTrustMetrics(userId) {
  const response = await apiClient.get(`/reviews/user/${userId}`);
  return response.data;
}

export async function fetchListingReviews(listingId) {
  const response = await apiClient.get(`/reviews/listing/${listingId}`);
  return response.data.reviews || [];
}

export async function fetchMySubmittedReviews() {
  const response = await apiClient.get('/reviews/mine');
  return response.data.reviews || [];
}
