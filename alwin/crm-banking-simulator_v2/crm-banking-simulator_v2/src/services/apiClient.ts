/**
 * Axios API Client Configuration
 * Provides a configured axios instance with interceptors for Temenos APIs
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { apiConfig, getAuthHeader } from '../config/api.config';

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: apiConfig.baseUrl,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': apiConfig.headers.contentType,
    'companyId': apiConfig.headers.companyId,
  },
});

// Request interceptor - adds authentication headers
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add authorization header
    config.headers.Authorization = getAuthHeader();

    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handles errors and logging
apiClient.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error: AxiosError) => {
    // Handle specific error cases
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          console.error('[API Error] Unauthorized - Check credentials');
          break;
        case 403:
          console.error('[API Error] Forbidden - Insufficient permissions');
          break;
        case 404:
          console.error('[API Error] Resource not found');
          break;
        case 500:
          console.error('[API Error] Internal server error');
          break;
        default:
          console.error(`[API Error] Status: ${status}`, data);
      }
    } else if (error.request) {
      console.error('[API Error] No response received - Network issue');
    } else {
      console.error('[API Error]', error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// Export types for API responses
export interface APIResponse<T> {
  header: Record<string, unknown>;
  body: T;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
