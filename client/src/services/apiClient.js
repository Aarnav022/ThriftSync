import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Automatically inject JWT Bearer token into outgoing requests
apiClient.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('thriftsync_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // localStorage may fail in restricted/private browsing modes
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Standardize API response and error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorResponse = {
      status: error.response?.data?.status || 'error',
      statusCode: error.response?.status || 500,
      message: error.response?.data?.message || error.message || 'An unexpected network error occurred.',
      errors: error.response?.data?.errors || null,
    };

    // Auto-clear invalid or expired token on 401
    if (error.response?.status === 401) {
      try {
        localStorage.removeItem('thriftsync_token');
        localStorage.removeItem('thriftsync_user');
      } catch (e) {}
    }

    return Promise.reject(errorResponse);
  }
);

export default apiClient;
