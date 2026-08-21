import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('skillforge_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('skillforge_token');
      localStorage.removeItem('skillforge_user');
    }
    return Promise.reject(error);
  }
);

/**
 * unwrapError
 * Extracts a user-facing message from the { success, data, error }
 * envelope returned by the backend, falling back to a generic message.
 */
export function unwrapError(err) {
  return (
    err?.response?.data?.error ||
    err?.response?.data?.details?.[0]?.message ||
    err?.message ||
    'Something went wrong. Please try again.'
  );
}

export default api;
