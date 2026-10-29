import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { updateProfile as updateProfileApi } from '../services/userService';

const AuthContext = createContext(null);

const TOKEN_KEY = 'thriftsync_token';
const USER_KEY = 'thriftsync_user';
const LOCATION_KEY = 'thriftsync_location';

const DEFAULT_ADDRESSES = [
  {
    id: 'addr-hostel',
    name: 'Campus Hostel Delivery',
    line1: 'Hostel 3, Room 402, North Campus',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110007',
    phone: '+91 98765 43210',
    isDefault: true,
    pickupSpot: 'Central Library Steps',
  }
];

const DEFAULT_LOCATION = {
  recipientName: 'Campus Member',
  campus: 'North Campus Hub',
  city: 'New Delhi',
  pincode: '110007',
  pickupSpot: 'Central Library Steps',
};

function isCorruptedOrMockToken(token) {
  if (!token || typeof token !== 'string') return true;
  if (token.startsWith('mock_')) return true;
  // A standard JWT has three base64url segments separated by dots
  const parts = token.split('.');
  return parts.length !== 3;
}

function isCorruptedOrMockUser(user) {
  if (!user || typeof user !== 'object') return true;
  if (user.id === 'usr-admin' || user.id === 'usr-student') return true;
  return false;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken || isCorruptedOrMockToken(storedToken)) {
        localStorage.removeItem(TOKEN_KEY);
        return null;
      }
      return storedToken;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken || isCorruptedOrMockToken(storedToken)) {
        localStorage.removeItem(USER_KEY);
        return null;
      }
      const stored = localStorage.getItem(USER_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      if (isCorruptedOrMockUser(parsed)) {
        localStorage.removeItem(USER_KEY);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const [deliveryLocation, setDeliveryLocation] = useState(() => {
    try {
      const stored = localStorage.getItem(LOCATION_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_LOCATION;
    } catch {
      return DEFAULT_LOCATION;
    }
  });

  // Verify session on mount if token exists
  useEffect(() => {
    let isMounted = true;
    async function verifySession() {
      if (!token || isCorruptedOrMockToken(token)) return;
      try {
        const res = await apiClient.get('/auth/me');
        const userData = res?.data?.user || res?.user;
        if (userData && isMounted) {
          const enrichedUser = {
            ...userData,
            id: userData._id || userData.id,
            savedAddresses: userData.savedAddresses || DEFAULT_ADDRESSES,
          };
          setUser(enrichedUser);
          try {
            localStorage.setItem(USER_KEY, JSON.stringify(enrichedUser));
          } catch {}
        }
      } catch (err) {
        // Clear session if server explicitly rejects token with 401
        if (err?.statusCode === 401 || err?.status === 401) {
          if (isMounted) {
            setUser(null);
            setToken(null);
            try {
              localStorage.removeItem(TOKEN_KEY);
              localStorage.removeItem(USER_KEY);
            } catch {}
          }
        }
      }
    }

    verifySession();
    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    try {
      if (token && !isCorruptedOrMockToken(token)) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch (e) {
      console.error('Failed to sync auth token:', e);
    }
  }, [token]);

  useEffect(() => {
    try {
      if (user && token && !isCorruptedOrMockUser(user)) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    } catch (e) {
      console.error('Failed to sync user state:', e);
    }
  }, [user, token]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCATION_KEY, JSON.stringify(deliveryLocation));
    } catch (e) {
      console.error('Failed to sync location:', e);
    }
  }, [deliveryLocation]);

  const login = async (email, password) => {
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const userData = res?.data?.user || res?.user;
      const authToken = res?.data?.token || res?.token;

      if (userData && authToken && !isCorruptedOrMockToken(authToken)) {
        const enrichedUser = {
          ...userData,
          id: userData._id || userData.id,
          savedAddresses: userData.savedAddresses || DEFAULT_ADDRESSES,
        };
        setUser(enrichedUser);
        setToken(authToken);
        return { success: true, user: enrichedUser };
      }
      return {
        success: false,
        message: res?.message || 'Authentication failed. Please verify credentials.',
      };
    } catch (err) {
      console.warn('[AuthContext] Backend login failed:', err?.message);
      return {
        success: false,
        message: err?.message || 'Login failed. Please check your credentials.',
      };
    }
  };

  const register = async (nameOrData, email, password, campus = 'North Campus Hub') => {
    try {
      let payload;
      if (typeof nameOrData === 'object' && nameOrData !== null) {
        payload = {
          name: nameOrData.name,
          email: nameOrData.email,
          password: nameOrData.password,
          campus: nameOrData.campus || 'North Campus Hub',
        };
      } else {
        payload = {
          name: nameOrData,
          email,
          password,
          campus: campus || 'North Campus Hub',
        };
      }

      const res = await apiClient.post('/auth/register', payload);
      const userData = res?.data?.user || res?.user;
      const authToken = res?.data?.token || res?.token;

      if (userData && authToken && !isCorruptedOrMockToken(authToken)) {
        const enrichedUser = {
          ...userData,
          id: userData._id || userData.id,
          phone: userData.phone || '',
          savedAddresses: userData.savedAddresses || DEFAULT_ADDRESSES,
        };
        setUser(enrichedUser);
        setToken(authToken);
        return { success: true, user: enrichedUser };
      }
      return {
        success: false,
        message: res?.message || 'Registration failed. Please check details.',
      };
    } catch (err) {
      console.warn('[AuthContext] Backend registration failed:', err?.message);
      return {
        success: false,
        message: err?.message || 'Registration failed. Email may already be in use.',
        errors: err?.errors || null,
      };
    }
  };

  const updateUserProfile = async (profileData) => {
    try {
      const updatedBackendUser = await updateProfileApi(profileData);
      if (updatedBackendUser) {
        const merged = {
          ...user,
          ...updatedBackendUser,
          id: updatedBackendUser._id || updatedBackendUser.id || user?.id,
          savedAddresses: updatedBackendUser.savedAddresses || profileData.savedAddresses || user?.savedAddresses || DEFAULT_ADDRESSES,
        };
        setUser(merged);
        try {
          localStorage.setItem(USER_KEY, JSON.stringify(merged));
        } catch {}
        return { success: true, user: merged };
      }
    } catch (err) {
      console.warn('[AuthContext] Backend profile update fallback, saving locally:', err?.message);
    }

    // Client-side local persistence fallback
    const merged = {
      ...user,
      ...profileData,
      id: user?.id,
      savedAddresses: profileData.savedAddresses || user?.savedAddresses || DEFAULT_ADDRESSES,
    };
    setUser(merged);
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(merged));
    } catch {}
    return { success: true, user: merged };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {}
  };

  const updateDeliveryLocation = (locationUpdates) => {
    setDeliveryLocation((prev) => ({
      ...prev,
      ...locationUpdates,
    }));
  };

  const isAuthenticated = Boolean(user && token && !isCorruptedOrMockToken(token));
  const isAdmin = Boolean(isAuthenticated && user?.role === 'admin');
  const isSeller = true; // All authenticated users have access to seller studio and listing capabilities

  const value = {
    user,
    token,
    isAuthenticated,
    isAdmin,
    isSeller,
    deliveryLocation,
    login,
    register,
    logout,
    updateDeliveryLocation,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
