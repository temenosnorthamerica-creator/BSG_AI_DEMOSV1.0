/**
 * Account Service
 * Handles account creation and management via Temenos APIs
 */

import apiClient from './apiClient';
import { apiConfig } from '../config/api.config';
import {
  AccountCreationRequest,
  AccountCreationResponse,
  APICallResult,
} from '../types/onboarding.types';

// Default account data template
export const getDefaultAccountData = (customerId: string): AccountCreationRequest => ({
  header: {
    override: {
      overrideDetails: [
        {
          code: 'O-12549',
          description: 'Bucket Override O-12549',
          id: 'AA.INT.SRC.TYP.AND.PAY.MET.MISMATCH',
          type: 'Override',
        },
      ],
    },
  },
  body: {
    customerIds: [
      {
        customerId: customerId,
      },
    ],
    activityId: 'ACCOUNTS-NEW-ARRANGEMENT',
    currencyId: 'USD',
    productId: 'CONS.CHECKING',
    officers: {
      primaryOfficer: 3,
    },
    balance: {
      shortTitle: 'Investor Checking Account',
      fdicClassCode: 3,
      fdicOwnershipCode: 'S',
      purposeCode: 5,
      accountType: 'CHECKING',
    },
    statement: {
      statement1Frequency: 'M0131',
      attributeNamevalue: 'Print.Option',
      fqu1PrintAttrValue1: 'ESTATEMENT',
    },
    schedule: [
      {
        payment: [
          {
            paymentType: 'INTEREST',
            paymentMethod: 'DUE',
          },
          {
            paymentType: 'CHARGE',
            paymentMethod: 'DUE',
          },
          {
            paymentType: 'PERIODICCHARGE',
            paymentMethod: 'DUE',
          },
        ],
      },
    ],
  },
});

/**
 * Create a new consumer account via Temenos API
 */
export const createAccount = async (
  customerId: string,
  accountData?: Partial<AccountCreationRequest['body']>
): Promise<APICallResult<AccountCreationResponse>> => {
  try {
    const defaultData = getDefaultAccountData(customerId);
    const requestData: AccountCreationRequest = {
      header: defaultData.header,
      body: {
        ...defaultData.body,
        ...accountData,
        customerIds: [{ customerId }], // Always ensure customerId is set
      },
    };

    console.log('[Account Service] Creating account for customer:', customerId);
    console.log('[Account Service] Request data:', JSON.stringify(requestData, null, 2));

    const response = await apiClient.post<AccountCreationResponse>(
      apiConfig.endpoints.accountCreation,
      requestData
    );

    console.log('[Account Service] Account created successfully:', response.data);

    return {
      success: true,
      data: response.data,
      rawResponse: response,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[Account Service] Error creating account:', errorMessage);

    return {
      success: false,
      error: errorMessage,
      rawResponse: error,
    };
  }
};

/**
 * Get account by ID (placeholder for future implementation)
 */
export const getAccount = async (accountId: string): Promise<APICallResult<unknown>> => {
  try {
    console.log('[Account Service] Fetching account:', accountId);

    // Note: This endpoint might need adjustment based on actual API spec
    const response = await apiClient.get(
      `${apiConfig.endpoints.accountCreation}/${accountId}`
    );

    return {
      success: true,
      data: response.data,
      rawResponse: response,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[Account Service] Error fetching account:', errorMessage);

    return {
      success: false,
      error: errorMessage,
      rawResponse: error,
    };
  }
};

export default {
  createAccount,
  getAccount,
  getDefaultAccountData,
};
