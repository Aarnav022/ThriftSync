import apiClient from '../../services/apiClient.js';

/**
 * Fetch authenticated student's full profile
 */
export async function fetchMyProfile() {
  const response = await apiClient.get('/users/profile');
  return response.data.user;
}

/**
 * Update authenticated student's profile details
 * @param {object} profileData - { name, campus, avatar }
 */
export async function updateMyProfile(profileData) {
  const response = await apiClient.put('/users/profile', profileData);
  return response.data.user;
}

/**
 * Change password with current password verification
 * @param {object} passwordData - { currentPassword, newPassword }
 */
export async function changePassword(passwordData) {
  const response = await apiClient.patch('/users/password', passwordData);
  return response;
}

/**
 * Fetch public profile of a campus peer
 * @param {string} userId
 */
export async function fetchPublicProfile(userId) {
  const response = await apiClient.get(`/users/${userId}/public`);
  return response.data.user;
}

export default {
  fetchMyProfile,
  updateMyProfile,
  changePassword,
  fetchPublicProfile,
};
