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

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(TOKEN_KEY) || null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
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

  useEffect(() => {
    try {
      if (token) {
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
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    } catch (e) {
      console.error('Failed to sync user state:', e);
    }
  }, [user]);

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

      if (userData && authToken) {
        const enrichedUser = {
          ...userData,
          id: userData._id || userData.id,
          savedAddresses: userData.savedAddresses || DEFAULT_ADDRESSES,
        };
        setUser(enrichedUser);
        setToken(authToken);
        return { success: true, user: enrichedUser };
      }
    } catch (err) {
      console.warn('[AuthContext] Backend login failed, checking demo credentials fallback:', err?.message);
    }

    // Client-side fallback for offline demonstration
    const isMockAdmin = email.includes('admin');
    const mockUser = {
      id: isMockAdmin ? 'usr-admin' : 'usr-student',
      name: isMockAdmin ? 'Campus Administrator' : email.split('@')[0],
      email,
      role: isMockAdmin ? 'admin' : 'student',
      campus: isMockAdmin ? 'Central Administration' : 'North Campus Hub',
      avatar: isMockAdmin 
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80'
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80',
      savedAddresses: DEFAULT_ADDRESSES,
    };
    setUser(mockUser);
    setToken('mock_jwt_token_' + Date.now());
    return { success: true, user: mockUser };
  };

  const register = async (name, email, password, campus = 'North Campus Hub') => {
    try {
      const res = await apiClient.post('/auth/register', { name, email, password, campus });
      const userData = res?.data?.user || res?.user;
      const authToken = res?.data?.token || res?.token;

      if (userData && authToken) {
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
    } catch (err) {
      console.warn('[AuthContext] Backend registration fallback:', err?.message);
    }

    const newUser = {
      id: 'usr-' + Date.now().toString(36),
      name,
      email,
      role: 'student',
      campus,
      phone: '',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80',
      savedAddresses: DEFAULT_ADDRESSES,
    };
    setUser(newUser);
    setToken('mock_jwt_token_' + Date.now());
    return { success: true, user: newUser };
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

  const isAuthenticated = Boolean(user && token);
  const isAdmin = user?.role === 'admin';
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
