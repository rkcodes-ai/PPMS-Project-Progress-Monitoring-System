import axios, { AxiosError } from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;
let calculatedBaseUrl = '/api/v1';

if (rawBaseUrl && typeof rawBaseUrl === 'string' && rawBaseUrl.trim() !== '') {
  const trimmed = rawBaseUrl.trim().replace(/\/+$/, '');
  calculatedBaseUrl = trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`;
}

export const BASE_URL = calculatedBaseUrl;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach bearer token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('ppms_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor for unified error extraction and 401 handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string | Array<{ msg: string }> }>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ppms_token');
      localStorage.removeItem('ppms_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // Extract formatted message
    let message = 'An unexpected error occurred.';
    if (error.response?.data?.detail) {
      const detail = error.response.data.detail;
      if (typeof detail === 'string') {
        message = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        message = detail.map((d) => d.msg).join(', ');
      }
    } else if (error.message) {
      message = error.message;
    }

    return Promise.reject(new Error(message));
  }
);
