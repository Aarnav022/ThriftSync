import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  fetchMyProfile,
  updateMyProfile,
  changePassword,
  fetchPublicProfile,
} from '../src/features/users/userService.js';
import apiClient from '../src/services/apiClient.js';

vi.mock('../src/services/apiClient.js', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('Account Settings & Profile Client Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches authenticated user profile', async () => {
    const mockUser = {
      _id: 'usr_1',
      name: 'Aarav Sharma',
      email: 'aarav@campus.edu',
      campus: 'Hostel 4',
      role: 'student',
    };
    apiClient.get.mockResolvedValueOnce({ success: true, data: { user: mockUser } });

    const result = await fetchMyProfile();
    expect(apiClient.get).toHaveBeenCalledWith('/users/profile');
    expect(result.name).toBe('Aarav Sharma');
    expect(result.campus).toBe('Hostel 4');
  });

  it('updates authenticated user profile details', async () => {
    const updatedUser = {
      _id: 'usr_1',
      name: 'Aarav S.',
      campus: 'Hostel 7 Block B',
      avatar: 'https://example.com/aarav.png',
    };
    apiClient.put.mockResolvedValueOnce({ success: true, data: { user: updatedUser } });

    const result = await updateMyProfile({
      name: 'Aarav S.',
      campus: 'Hostel 7 Block B',
      avatar: 'https://example.com/aarav.png',
    });

    expect(apiClient.put).toHaveBeenCalledWith('/users/profile', {
      name: 'Aarav S.',
      campus: 'Hostel 7 Block B',
      avatar: 'https://example.com/aarav.png',
    });
    expect(result.name).toBe('Aarav S.');
  });

  it('dispatches password change request with current and new password', async () => {
    apiClient.patch.mockResolvedValueOnce({
      success: true,
      message: 'Password updated successfully.',
    });

    const result = await changePassword({
      currentPassword: 'OldPassword123!',
      newPassword: 'NewPassword456!',
    });

    expect(apiClient.patch).toHaveBeenCalledWith('/users/password', {
      currentPassword: 'OldPassword123!',
      newPassword: 'NewPassword456!',
    });
    expect(result.message).toBe('Password updated successfully.');
  });

  it('fetches sanitized public profile of a peer', async () => {
    const mockPeer = {
      _id: 'peer_99',
      name: 'Neha Gupta',
      campus: 'South Campus',
    };
    apiClient.get.mockResolvedValueOnce({ success: true, data: { user: mockPeer } });

    const result = await fetchPublicProfile('peer_99');
    expect(apiClient.get).toHaveBeenCalledWith('/users/peer_99/public');
    expect(result.name).toBe('Neha Gupta');
  });
});
