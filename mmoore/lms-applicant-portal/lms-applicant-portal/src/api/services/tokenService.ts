import axios from 'axios';
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

      throw new Error('Login failed: No token received');
    } catch (error) {
      console.error('Failed to fetch API token:', error);
      throw error;
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
