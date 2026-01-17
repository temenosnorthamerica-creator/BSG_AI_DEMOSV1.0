/**
 * Health Check Service
 * Tests connectivity to Temenos APIs and returns status
 */

import apiClient from './apiClient';
import { apiConfig } from '../config/api.config';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  responseTime: number; // in milliseconds
  endpoints: EndpointHealth[];
  summary: string;
}

export interface EndpointHealth {
  name: string;
  url: string;
  status: 'up' | 'down' | 'unknown';
  responseTime: number;
  statusCode?: number;
  error?: string;
}

/**
 * Check health of a single endpoint using OPTIONS or HEAD request
 */
const checkEndpoint = async (name: string, endpoint: string): Promise<EndpointHealth> => {
  const startTime = performance.now();
  const fullUrl = `${apiConfig.baseUrl}${endpoint}`;

  try {
    // Use a simple GET request with a timeout to check connectivity
    // We'll catch any response (even errors) as a sign the server is reachable
    const response = await apiClient.get(endpoint, {
      timeout: 10000, // 10 second timeout
      validateStatus: () => true, // Accept any status code
    });

    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);

    // Consider the endpoint "up" if we got any response
    const isUp = response.status < 500;

    return {
      name,
      url: fullUrl,
      status: isUp ? 'up' : 'down',
      responseTime,
      statusCode: response.status,
    };
  } catch (error) {
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);

    return {
      name,
      url: fullUrl,
      status: 'down',
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Test basic connectivity by making a lightweight request
 */
const checkBasicConnectivity = async (): Promise<EndpointHealth> => {
  const startTime = performance.now();
  const baseUrl = apiConfig.baseUrl;

  try {
    // Try to reach the base URL
    const response = await apiClient.get('/', {
      timeout: 10000,
      validateStatus: () => true,
    });

    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);

    return {
      name: 'Base Connectivity',
      url: baseUrl,
      status: 'up',
      responseTime,
      statusCode: response.status,
    };
  } catch (error) {
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);

    // Check if it's a network error or just an HTTP error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isNetworkError = errorMessage.includes('Network Error') || errorMessage.includes('ECONNREFUSED');

    return {
      name: 'Base Connectivity',
      url: baseUrl,
      status: isNetworkError ? 'down' : 'up',
      responseTime,
      error: errorMessage,
    };
  }
};

/**
 * Run comprehensive health check on all Temenos endpoints
 */
export const runHealthCheck = async (): Promise<HealthCheckResult> => {
  const startTime = performance.now();
  const timestamp = new Date();

  console.log('[Health Check] Starting comprehensive health check...');

  // Check all endpoints in parallel
  const endpointChecks = await Promise.all([
    checkBasicConnectivity(),
    checkEndpoint('Customer API', apiConfig.endpoints.customerCreation),
    checkEndpoint('Account API', apiConfig.endpoints.accountCreation),
  ]);

  const endTime = performance.now();
  const totalResponseTime = Math.round(endTime - startTime);

  // Calculate overall status
  const upCount = endpointChecks.filter((e) => e.status === 'up').length;
  const totalCount = endpointChecks.length;

  let status: HealthCheckResult['status'];
  let summary: string;

  if (upCount === totalCount) {
    status = 'healthy';
    summary = `All ${totalCount} endpoints are healthy`;
  } else if (upCount > 0) {
    status = 'degraded';
    summary = `${upCount}/${totalCount} endpoints are healthy`;
  } else {
    status = 'unhealthy';
    summary = 'All endpoints are unreachable';
  }

  const result: HealthCheckResult = {
    status,
    timestamp,
    responseTime: totalResponseTime,
    endpoints: endpointChecks,
    summary,
  };

  console.log('[Health Check] Complete:', result);

  return result;
};

/**
 * Quick ping check - just tests basic connectivity
 */
export const quickPing = async (): Promise<{ reachable: boolean; responseTime: number }> => {
  const result = await checkBasicConnectivity();
  return {
    reachable: result.status === 'up',
    responseTime: result.responseTime,
  };
};

export default {
  runHealthCheck,
  quickPing,
};
