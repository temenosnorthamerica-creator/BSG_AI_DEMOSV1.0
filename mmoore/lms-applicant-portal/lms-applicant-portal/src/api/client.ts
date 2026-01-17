import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';
import { API_CONFIG, STORAGE_KEYS } from './config';
import { tokenService } from './services/tokenService';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Skip token for login endpoint
    if (config.url?.includes('/login')) {
      return config;
    }

    try {
      // Get a valid token (will auto-refresh if expired)
      const token = await tokenService.getValidToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Failed to get valid token:', error);
    }

    // Replace version placeholder in URL
    if (config.url) {
      config.url = config.url.replace('{version}', API_CONFIG.API_VERSION);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - try to refresh once
      const originalRequest = error.config;

      if (!originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Clear old token and fetch new one
          tokenService.clearToken();
          const newToken = await tokenService.fetchNewToken();
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh failed - clear storage and redirect to login
          tokenService.clearToken();
          localStorage.removeItem(STORAGE_KEYS.USER_DATA);
          localStorage.removeItem(STORAGE_KEYS.USER_SSN);
          localStorage.removeItem(STORAGE_KEYS.USER_APPLICATIONS);
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const endpoints = {
  login: '/api/v{version}/login',
  verifyApplicant: '/api/v{version}/verifyapplicant',
  application: {
    search: '/api/v{version}/application/search',
    get: (id: string) => `/api/v{version}/application/${id}`,
    create: '/api/v{version}/application',
    update: (id: string) => `/api/v{version}/application/${id}`,
  },
  applicants: {
    list: (appId: string) => `/api/v{version}/application/${appId}/applicants`,
    get: (appId: string, applicantId: string) =>
      `/api/v{version}/application/${appId}/applicants/${applicantId}`,
  },
  products: {
    list: '/api/v{version}/Products/products',
    subProducts: '/api/v{version}/SubProducts',
  },
  prescreen: {
    getOffers: (tin: string) => `/api/v{version}/ExperianPrescreen/${tin}/GetPrescreenOffers`,
  },
};
