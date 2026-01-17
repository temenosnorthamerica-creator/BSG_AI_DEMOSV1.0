/**
 * Services Index
 * Export all services for easy importing
 */

export { default as apiClient } from './apiClient';
export type { APIResponse, APIError } from './apiClient';

export {
  createCustomer,
  getCustomer,
  getDefaultCustomerData,
  generateRandomFirstName,
  generateRandomLastName,
} from './customerService';

export {
  createAccount,
  getAccount,
  getDefaultAccountData,
} from './accountService';

export {
  runHealthCheck,
  quickPing,
} from './healthCheckService';
export type { HealthCheckResult, EndpointHealth } from './healthCheckService';
