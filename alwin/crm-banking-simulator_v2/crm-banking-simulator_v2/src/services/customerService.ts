/**
 * Customer Service
 * Handles customer creation and management via Temenos APIs
 */

import apiClient from './apiClient';
import { apiConfig } from '../config/api.config';
import {
  CustomerCreationRequest,
  CustomerCreationResponse,
  APICallResult,
} from '../types/onboarding.types';

// Generate random name helpers
const firstNames = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles',
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

export const generateRandomFirstName = (): string => {
  return firstNames[Math.floor(Math.random() * firstNames.length)];
};

export const generateRandomLastName = (): string => {
  return lastNames[Math.floor(Math.random() * lastNames.length)];
};

// Default customer data template
export const getDefaultCustomerData = (): CustomerCreationRequest => ({
  givenName: generateRandomFirstName(),
  middleName: 'A',
  lastName: generateRandomLastName(),
  nationalityId: 'US',
  dateOfBirth: '1983-05-01',
  sectorId: 1001,
  communicationDevices: [
    {
      emailId: 'test@test.com',
    },
  ],
  languageId: 1,
  addressLine1: 'asasa',
});

/**
 * Create a new customer via Temenos API
 */
export const createCustomer = async (
  customerData?: Partial<CustomerCreationRequest>
): Promise<APICallResult<CustomerCreationResponse>> => {
  try {
    const requestData = {
      header: {},
      body: {
        ...getDefaultCustomerData(),
        ...customerData,
      },
    };

    console.log('[Customer Service] Creating customer:', requestData);

    const response = await apiClient.post<CustomerCreationResponse>(
      apiConfig.endpoints.customerCreation,
      requestData
    );

    console.log('[Customer Service] Customer created successfully:', response.data);

    return {
      success: true,
      data: response.data,
      rawResponse: response,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[Customer Service] Error creating customer:', errorMessage);

    return {
      success: false,
      error: errorMessage,
      rawResponse: error,
    };
  }
};

/**
 * Get customer by ID (placeholder for future implementation)
 */
export const getCustomer = async (customerId: string): Promise<APICallResult<unknown>> => {
  try {
    console.log('[Customer Service] Fetching customer:', customerId);

    // Note: This endpoint might need adjustment based on actual API spec
    const response = await apiClient.get(
      `${apiConfig.endpoints.customerCreation}/${customerId}`
    );

    return {
      success: true,
      data: response.data,
      rawResponse: response,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[Customer Service] Error fetching customer:', errorMessage);

    return {
      success: false,
      error: errorMessage,
      rawResponse: error,
    };
  }
};

export default {
  createCustomer,
  getCustomer,
  getDefaultCustomerData,
  generateRandomFirstName,
  generateRandomLastName,
};
