import axios, { AxiosError } from 'axios';
import { API_CONFIG, STORAGE_KEYS } from '../config';

interface ApiKeyLoginResponse {
  Token: string;
  Result: boolean;
  Messages: string[];
  ExceptionId: number;
}

interface TokenData {
  token: string;
  timestamp: number;
}

// Custom error class for API errors with detailed information
export class ApiError extends Error {
  code: string;
  statusCode?: number;
  details?: string;
  hint?: string;

  constructor(message: string, code: string, statusCode?: number, details?: string, hint?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.hint = hint;
  }
}

// Error codes for easy identification
export const API_ERROR_CODES = {
  INVALID_API_KEY: 'INVALID_API_KEY',
  EXPIRED_API_KEY: 'EXPIRED_API_KEY',
  FORBIDDEN: 'FORBIDDEN',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  SERVER_ERROR: 'SERVER_ERROR',
  SERVER_UNAVAILABLE: 'SERVER_UNAVAILABLE',
  UNKNOWN: 'UNKNOWN',
  NO_TOKEN_RECEIVED: 'NO_TOKEN_RECEIVED',
};

// Create a separate axios instance for token requests to avoid circular dependency
const tokenClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to build versioned API path
const getLoginPath = () => `/api/v${API_CONFIG.API_VERSION}/login`;

export const tokenService = {
  /**
   * Get stored token data from localStorage
   */
  getStoredTokenData(): TokenData | null {
    const token = localStorage.getItem(STORAGE_KEYS.API_TOKEN);
    const timestamp = localStorage.getItem(STORAGE_KEYS.TOKEN_TIMESTAMP);

    if (!token || !timestamp) {
      return null;
    }

    return {
      token,
      timestamp: parseInt(timestamp, 10),
    };
  },

  /**
   * Store token and timestamp in localStorage
   */
  storeToken(token: string): void {
    const timestamp = Math.floor(Date.now() / 1000);
    localStorage.setItem(STORAGE_KEYS.API_TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.TOKEN_TIMESTAMP, timestamp.toString());
  },

  /**
   * Clear stored token data
   */
  clearToken(): void {
    localStorage.removeItem(STORAGE_KEYS.API_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_TIMESTAMP);
  },

  /**
   * Check if the stored token is still valid
   * Returns true if token exists and hasn't expired (with buffer)
   */
  isTokenValid(): boolean {
    const tokenData = this.getStoredTokenData();
    if (!tokenData) {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    const tokenAge = now - tokenData.timestamp;
    const bufferExpiry = API_CONFIG.TOKEN_EXPIRY_SECONDS - API_CONFIG.TOKEN_BUFFER_SECONDS;

    return tokenAge < bufferExpiry;
  },

  /**
   * Get the number of seconds until token expires
   */
  getSecondsUntilExpiry(): number {
    const tokenData = this.getStoredTokenData();
    if (!tokenData) {
      return 0;
    }

    const now = Math.floor(Date.now() / 1000);
    const tokenAge = now - tokenData.timestamp;
    const secondsRemaining = API_CONFIG.TOKEN_EXPIRY_SECONDS - tokenAge;

    return Math.max(0, secondsRemaining);
  },

  /**
   * Fetch a new token from the API using the API key
   */
  async fetchNewToken(): Promise<string> {
    try {
      const response = await tokenClient.post<ApiKeyLoginResponse>(
        getLoginPath(),
        { ApiKey: API_CONFIG.API_KEY }
      );

      if (response.data.Result && response.data.Token) {
        this.storeToken(response.data.Token);
        return response.data.Token;
      }

      // API returned success but no token
      const messages = response.data.Messages?.join(', ') || 'No token in response';
      throw new ApiError(
        'Authentication failed: No token received from server',
        API_ERROR_CODES.NO_TOKEN_RECEIVED,
        200,
        messages,
        'The API key may be invalid or the server response format has changed.'
      );
    } catch (error) {
      console.error('Failed to fetch API token:', error);

      // If it's already our custom ApiError, rethrow it
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle Axios errors with specific messages
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ Message?: string; Messages?: string[] }>;

        // Network error (no response received)
        if (!axiosError.response) {
          if (axiosError.code === 'ECONNABORTED' || axiosError.message.includes('timeout')) {
            throw new ApiError(
              'Request timed out',
              API_ERROR_CODES.TIMEOUT,
              undefined,
              'The server took too long to respond.',
              'The LMS server may be busy or experiencing issues. Try again in a few minutes.'
            );
          }

          throw new ApiError(
            'Cannot reach the LMS server',
            API_ERROR_CODES.NETWORK_ERROR,
            undefined,
            axiosError.message,
            'Please check your network connection. If you are accessing from outside the network, ensure VPN is connected.'
          );
        }

        const status = axiosError.response.status;
        const serverMessage = axiosError.response.data?.Message ||
                              axiosError.response.data?.Messages?.join(', ') ||
                              axiosError.response.statusText;

        // 401 Unauthorized - Invalid or expired API key
        if (status === 401) {
          throw new ApiError(
            'API key authentication failed',
            API_ERROR_CODES.INVALID_API_KEY,
            401,
            serverMessage,
            'The API key is invalid or has expired. Please contact your administrator to obtain a new API key.'
          );
        }

        // 403 Forbidden - API key doesn't have permission
        if (status === 403) {
          throw new ApiError(
            'Access denied',
            API_ERROR_CODES.FORBIDDEN,
            403,
            serverMessage,
            'The API key does not have permission to access this resource. Contact your administrator.'
          );
        }

        // 500 Internal Server Error
        if (status === 500) {
          throw new ApiError(
            'LMS server error',
            API_ERROR_CODES.SERVER_ERROR,
            500,
            serverMessage,
            'The LMS server encountered an internal error. Please try again later or contact support.'
          );
        }

        // 502, 503, 504 - Server unavailable
        if (status === 502 || status === 503 || status === 504) {
          throw new ApiError(
            'LMS server is unavailable',
            API_ERROR_CODES.SERVER_UNAVAILABLE,
            status,
            serverMessage,
            'The LMS server is temporarily unavailable. Please try again in a few minutes.'
          );
        }

        // Other HTTP errors
        throw new ApiError(
          `Server returned error ${status}`,
          API_ERROR_CODES.UNKNOWN,
          status,
          serverMessage,
          'An unexpected error occurred. Please try again or contact support.'
        );
      }

      // Unknown error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new ApiError(
        'An unexpected error occurred',
        API_ERROR_CODES.UNKNOWN,
        undefined,
        errorMessage,
        'Please try again. If the problem persists, contact support.'
      );
    }
  },

  /**
   * Get a valid token, refreshing if necessary
   */
  async getValidToken(): Promise<string> {
    if (this.isTokenValid()) {
      const tokenData = this.getStoredTokenData();
      return tokenData!.token;
    }

    // Token expired or doesn't exist, fetch a new one
    return this.fetchNewToken();
  },

  /**
   * Get the current token without validation (for immediate use)
   */
  getCurrentToken(): string | null {
    const tokenData = this.getStoredTokenData();
    return tokenData?.token || null;
  },
};
