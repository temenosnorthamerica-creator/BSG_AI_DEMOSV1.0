// LMS API Configuration
export const API_CONFIG = {
  // Use empty string for dev (proxy handles it), full URL for production
  BASE_URL: '',
  API_VERSION: '1',
  API_KEY: 'xKHCjZOXMACk1xGmTPmYD2y3ov3BANyGI/thJB0YOCDntzw9LVsfx3IjRWJqwoPZ0pPhATz8YtyR6qn+aLjomve5GU7BktkOBhf1cH88+KS78/ujIPmsztVVQ0l7xdQubgmj3I+9T40YUFZjSLgcP4hUM0dRxPJALHRYlbKtptY=',
  TOKEN_EXPIRY_SECONDS: 900,      // 15 minutes
  TOKEN_BUFFER_SECONDS: 60,       // Refresh 1 minute before expiry
};

// localStorage keys
export const STORAGE_KEYS = {
  API_TOKEN: 'lms_api_token',
  TOKEN_TIMESTAMP: 'lms_token_timestamp',
  USER_SSN: 'user_ssn',
  USER_DATA: 'user_data',
  USER_APPLICATIONS: 'user_applications',
};
