import apiClient from '../../services/apiClient.js';

export async function fetchAddresses() {
  const response = await apiClient.get('/addresses');
  return response.data.addresses;
}

export async function createAddress(addressData) {
  const response = await apiClient.post('/addresses', addressData);
  return response.data.address;
}

export async function updateAddress(id, addressData) {
  const response = await apiClient.patch(`/addresses/${id}`, addressData);
  return response.data.address;
}

export async function deleteAddress(id) {
  const response = await apiClient.delete(`/addresses/${id}`);
  return response.data;
}

export default {
  fetchAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
};
