/**
 * API Configuration for Temenos Banking APIs
 * This file contains all endpoint URLs, credentials, and API settings
 */

export interface APIConfig {
  baseUrl: string;
  endpoints: {
    customerCreation: string;
    accountCreation: string;
  };
  headers: {
    contentType: string;
    companyId: string;
  };
  auth: {
    type: 'basic' | 'bearer';
    username: string;
    password: string;
  };
}

// Use proxy in development to avoid CORS issues
const isDev = import.meta.env.DEV;
const proxyBaseUrl = '/api/temenos';
const directBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://americasbsgprd.temenos.com';

// Default configuration - can be overridden by environment variables
export const apiConfig: APIConfig = {
  // In development, use the Vite proxy; in production, use direct URL
  baseUrl: isDev ? proxyBaseUrl : directBaseUrl,
  endpoints: {
    customerCreation: import.meta.env.VITE_CUSTOMER_ENDPOINT || '/irf-provider-container/api/v4.1.0/party/us/customers/individuals',
    accountCreation: import.meta.env.VITE_ACCOUNT_ENDPOINT || '/irf-provider-container/api/v6.1.0/holdings/us/accounts/consumerAccounts',
  },
  headers: {
    contentType: 'application/json',
    companyId: import.meta.env.VITE_COMPANY_ID || 'US0010001',
  },
  auth: {
    type: 'basic',
    username: import.meta.env.VITE_API_USERNAME || 'userProviderApi',
    password: import.meta.env.VITE_API_PASSWORD || 'Temenos@123!',
  },
};

// Helper function to get full endpoint URL
export const getEndpointUrl = (endpoint: keyof APIConfig['endpoints']): string => {
  return `${apiConfig.baseUrl}${apiConfig.endpoints[endpoint]}`;
};

// Helper function to get auth header
export const getAuthHeader = (): string => {
  if (apiConfig.auth.type === 'basic') {
    const credentials = btoa(`${apiConfig.auth.username}:${apiConfig.auth.password}`);
    return `Basic ${credentials}`;
  }
  return '';
};

// Helper function to get common headers
export const getCommonHeaders = (): Record<string, string> => {
  return {
    'Content-Type': apiConfig.headers.contentType,
    'companyId': apiConfig.headers.companyId,
    'Authorization': getAuthHeader(),
  };
};
