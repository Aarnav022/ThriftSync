import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../../services/apiClient.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('thriftsync_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('thriftsync_token') || null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Validate session on load
  useEffect(() => {
    async function verifySession() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiClient.get('/auth/me');
        if (response.data?.user) {
          setUser(response.data.user);
          localStorage.setItem('thriftsync_user', JSON.stringify(response.data.user));
        }
      } catch (err) {
        logout();
      } finally {
        setIsLoading(false);
      }
    }

    verifySession();
  }, [token]);

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { user: authedUser, token: authToken } = response.data;
      setUser(authedUser);
      setToken(authToken);
      localStorage.setItem('thriftsync_token', authToken);
      localStorage.setItem('thriftsync_user', JSON.stringify(authedUser));
      return { success: true, user: authedUser };
    } catch (err) {
      const msg = err.message || 'Login failed. Please check your credentials.';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  const register = async ({ name, email, password, campus }) => {
    setError(null);
    try {
      const response = await apiClient.post('/auth/register', {
        name,
        email,
        password,
        campus: campus || 'Main Campus',
      });
      const { user: registeredUser, token: authToken } = response.data;
      setUser(registeredUser);
      setToken(authToken);
      localStorage.setItem('thriftsync_token', authToken);
      localStorage.setItem('thriftsync_user', JSON.stringify(registeredUser));
      return { success: true, user: registeredUser };
    } catch (err) {
      const msg = err.message || 'Registration failed. Please check your details.';
      setError(msg);
      return { success: false, message: msg, errors: err.errors };
    }
  };

  const updateUserData = (updatedFields) => {
    setUser((prev) => {
      const nextUser = { ...prev, ...updatedFields };
      try {
        localStorage.setItem('thriftsync_user', JSON.stringify(nextUser));
      } catch {}
      return nextUser;
    });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setError(null);
    try {
      localStorage.removeItem('thriftsync_token');
      localStorage.removeItem('thriftsync_user');
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        register,
        logout,
        updateUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
