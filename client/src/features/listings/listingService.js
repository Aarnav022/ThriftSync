import apiClient from '../../services/apiClient.js';

export async function fetchListings(params = {}) {
  const response = await apiClient.get('/listings', { params });
  return response.data;
}

export async function fetchListingById(id) {
  const response = await apiClient.get(`/listings/${id}`);
  return response.data.listing;
}

export async function fetchMyListings() {
  const response = await apiClient.get('/listings/mine');
  return response.data.listings;
}

export async function createListing(listingData) {
  const response = await apiClient.post('/listings', listingData);
  return response.data.listing;
}

export async function updateListing(id, listingData) {
  const response = await apiClient.put(`/listings/${id}`, listingData);
  return response.data.listing;
}

export async function deleteListing(id) {
  const response = await apiClient.delete(`/listings/${id}`);
  return response.data.listing;
}
