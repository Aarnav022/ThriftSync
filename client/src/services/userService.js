import apiClient from './apiClient';

/**
 * Fetch authenticated user profile details from backend
 */
export async function fetchProfile() {
  const res = await apiClient.get('/users/profile');
  return res?.data?.data?.user || res?.data?.user || res?.user;
}

/**
 * Update authenticated user profile details
 * @param {Object} profileData - { name, campus, avatar, phone, savedAddresses }
 */
export async function updateProfile(profileData) {
  const res = await apiClient.put('/users/profile', profileData);
  return res?.data?.data?.user || res?.data?.user || res?.user;
}

/**
 * Change authenticated user password
 */
export async function changePassword(currentPassword, newPassword) {
  const res = await apiClient.patch('/users/password', {
    currentPassword,
    newPassword,
  });
  return res?.data;
}
