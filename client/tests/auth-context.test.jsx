import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { AuthProvider, useAuth } from '../src/context/AuthContext.jsx';
import apiClient from '../src/services/apiClient.js';

// In-memory mock localStorage implementation for Node test environment
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

describe('AuthContext Hardening: Insecure Fallback Elimination & Mock Purging', () => {
  let mockStorage;
  let originalLocalStorage;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockStorage = new MockLocalStorage();
    originalLocalStorage = globalThis.localStorage;
    globalThis.localStorage = mockStorage;
  });

  afterEach(() => {
    globalThis.localStorage = originalLocalStorage;
  });

  function renderAuth() {
    let contextValue = null;
    function Consumer() {
      contextValue = useAuth();
      return null;
    }
    renderToString(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );
    return contextValue;
  }

  it('purges legacy mock JWT tokens and mock users from localStorage on initialization', () => {
    mockStorage.setItem('thriftsync_token', 'mock_jwt_token_1740000000000');
    mockStorage.setItem(
      'thriftsync_user',
      JSON.stringify({
        id: 'usr-admin',
        name: 'Mock Admin',
        email: 'admin@thriftsync.campus',
        role: 'admin',
      })
    );

    const auth = renderAuth();

    // Mock session MUST NOT be trusted or authenticated
    expect(auth.isAuthenticated).toBe(false);
    expect(auth.isAdmin).toBe(false);
    expect(auth.token).toBeNull();
    expect(auth.user).toBeNull();

    // Insecure artifacts must be cleaned up from storage
    expect(mockStorage.getItem('thriftsync_token')).toBeNull();
    expect(mockStorage.getItem('thriftsync_user')).toBeNull();
  });

  it('purges non-JWT corrupted tokens on initialization', () => {
    mockStorage.setItem('thriftsync_token', 'not-a-valid-jwt-token');
    mockStorage.setItem(
      'thriftsync_user',
      JSON.stringify({
        id: 'usr-student',
        email: 'student@campus.edu',
        role: 'student',
      })
    );

    const auth = renderAuth();

    expect(auth.isAuthenticated).toBe(false);
    expect(auth.token).toBeNull();
    expect(auth.user).toBeNull();
    expect(mockStorage.getItem('thriftsync_token')).toBeNull();
  });

  it('returns explicit failure and does NOT create mock session when login fails', async () => {
    const auth = renderAuth();

    vi.spyOn(apiClient, 'post').mockRejectedValueOnce({
      statusCode: 401,
      message: 'Invalid email or password.',
    });

    const result = await auth.login('admin@thriftsync.campus', 'WrongPassword123');

    // Must return explicit failure result
    expect(result.success).toBe(false);
    expect(result.message).toContain('Invalid email or password');

    // Must never generate a mock token or mock admin user
    expect(result.user).toBeUndefined();
    expect(mockStorage.getItem('thriftsync_token')).toBeNull();
    expect(mockStorage.getItem('thriftsync_user')).toBeNull();
  });

  it('never infers admin role from email address when backend login fails', async () => {
    const auth = renderAuth();

    vi.spyOn(apiClient, 'post').mockRejectedValueOnce(new Error('Network error'));

    const result = await auth.login('superadmin@thriftsync.campus', 'secret');

    expect(result.success).toBe(false);
    expect(result.user).toBeUndefined();
    expect(auth.isAdmin).toBe(false);
    expect(auth.isAuthenticated).toBe(false);
  });

  it('returns explicit failure and does NOT create mock session when registration fails', async () => {
    const auth = renderAuth();

    vi.spyOn(apiClient, 'post').mockRejectedValueOnce({
      statusCode: 409,
      message: 'Email address is already registered on campus.',
    });

    const result = await auth.register({
      name: 'New Student',
      email: 'existing@campus.edu',
      password: 'SecurePassword123',
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain('already registered');
    expect(result.user).toBeUndefined();
    expect(mockStorage.getItem('thriftsync_token')).toBeNull();
    expect(mockStorage.getItem('thriftsync_user')).toBeNull();
  });

  it('preserves legitimate profile, default delivery location, and addresses', () => {
    const auth = renderAuth();

    expect(auth.deliveryLocation).toBeDefined();
    expect(auth.deliveryLocation.campus).toBe('North Campus Hub');
    expect(auth.deliveryLocation.pickupSpot).toBe('Central Library Steps');
  });
});
