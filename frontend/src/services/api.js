import axios from 'axios';
import authStorage from '../utils/authStorage';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach bearer token
api.interceptors.request.use(
  (config) => {
    const token = authStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Development servers and hosted databases can take a moment to wake up.
    // Retry only read requests, never writes such as checkout or form submits.
    const retryableStatuses = [500, 502, 503, 504];
    const isRetryableGet =
      originalRequest?.method?.toLowerCase() === 'get' &&
      (!error.response || retryableStatuses.includes(error.response.status));

    if (isRetryableGet && (originalRequest._transientRetryCount || 0) < 2) {
      originalRequest._transientRetryCount = (originalRequest._transientRetryCount || 0) + 1;
      const delay = originalRequest._transientRetryCount * 500;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return api(originalRequest);
    }

    // Check if error is 401 and not already retried
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/refresh-token')
    ) {
      originalRequest._retry = true;
      const refreshToken = authStorage.getRefreshToken();

      if (refreshToken) {
        try {
          const res = await axios.post('/api/auth/refresh-token', { refreshToken });
          if (res.data.success && res.data.accessToken) {
            authStorage.setAccessToken(res.data.accessToken);
            originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
            return api(originalRequest);
          }
        } catch (refreshErr) {
          // If refresh token fails or expired, log out user
          authStorage.clearSession();
          window.location.href = '/login';
          return Promise.reject(refreshErr);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
