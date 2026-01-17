/**
 * Onboarding Hook
 * Custom hook for managing customer onboarding flow with Temenos APIs
 */

import { useState, useCallback } from 'react';
import { createCustomer, getDefaultCustomerData } from '../services/customerService';
import { createAccount, getDefaultAccountData } from '../services/accountService';
import {
  OnboardingState,
  CustomerCreationRequest,
  CustomerCreationResponse,
  AccountCreationResponse,
  APICallResult,
} from '../types/onboarding.types';

export interface UseOnboardingReturn {
  state: OnboardingState;
  // Actions
  handleCreateCustomer: (customerData?: Partial<CustomerCreationRequest>) => Promise<APICallResult<CustomerCreationResponse>>;
  handleCreateAccount: (customerId: string) => Promise<APICallResult<AccountCreationResponse>>;
  runFullOnboarding: (customerData?: Partial<CustomerCreationRequest>) => Promise<{
    customer: APICallResult<CustomerCreationResponse>;
    account: APICallResult<AccountCreationResponse> | null;
  }>;
  reset: () => void;
  // Helpers
  getDefaultCustomerData: () => CustomerCreationRequest;
  getDefaultAccountData: typeof getDefaultAccountData;
  // API Response tracking
  lastCustomerResponse: CustomerCreationResponse | null;
  lastAccountResponse: AccountCreationResponse | null;
}

const initialState: OnboardingState = {
  customerId: null,
  accountId: null,
  status: 'idle',
  error: null,
  customerData: null,
  accountData: null,
};

export const useOnboarding = (): UseOnboardingReturn => {
  const [state, setState] = useState<OnboardingState>(initialState);
  const [lastCustomerResponse, setLastCustomerResponse] = useState<CustomerCreationResponse | null>(null);
  const [lastAccountResponse, setLastAccountResponse] = useState<AccountCreationResponse | null>(null);

  // Create Customer
  const handleCreateCustomer = useCallback(
    async (customerData?: Partial<CustomerCreationRequest>): Promise<APICallResult<CustomerCreationResponse>> => {
      setState((prev) => ({
        ...prev,
        status: 'creating_customer',
        error: null,
      }));

      const result = await createCustomer(customerData);

      if (result.success && result.data) {
        const customerId = result.data.body?.customerId || 'UNKNOWN';
        setState((prev) => ({
          ...prev,
          customerId,
          status: 'idle',
          customerData: { ...getDefaultCustomerData(), ...customerData },
        }));
        setLastCustomerResponse(result.data);
      } else {
        setState((prev) => ({
          ...prev,
          status: 'error',
          error: result.error || 'Failed to create customer',
        }));
      }

      return result;
    },
    []
  );

  // Create Account
  const handleCreateAccount = useCallback(
    async (customerId: string): Promise<APICallResult<AccountCreationResponse>> => {
      setState((prev) => ({
        ...prev,
        status: 'creating_account',
        error: null,
      }));

      const result = await createAccount(customerId);

      if (result.success && result.data) {
        const accountId = result.data.body?.accountId || result.data.body?.arrangementId || 'UNKNOWN';
        setState((prev) => ({
          ...prev,
          accountId,
          status: 'completed',
          accountData: getDefaultAccountData(customerId),
        }));
        setLastAccountResponse(result.data);
      } else {
        setState((prev) => ({
          ...prev,
          status: 'error',
          error: result.error || 'Failed to create account',
        }));
      }

      return result;
    },
    []
  );

  // Run full onboarding flow
  const runFullOnboarding = useCallback(
    async (customerData?: Partial<CustomerCreationRequest>) => {
      // Step 1: Create Customer
      const customerResult = await handleCreateCustomer(customerData);

      if (!customerResult.success || !customerResult.data) {
        return {
          customer: customerResult,
          account: null,
        };
      }

      // Step 2: Create Account for the new customer
      const customerId = customerResult.data.body?.customerId;
      if (!customerId) {
        return {
          customer: customerResult,
          account: {
            success: false,
            error: 'Customer ID not found in response',
          },
        };
      }

      const accountResult = await handleCreateAccount(customerId);

      return {
        customer: customerResult,
        account: accountResult,
      };
    },
    [handleCreateCustomer, handleCreateAccount]
  );

  // Reset state
  const reset = useCallback(() => {
    setState(initialState);
    setLastCustomerResponse(null);
    setLastAccountResponse(null);
  }, []);

  return {
    state,
    handleCreateCustomer,
    handleCreateAccount,
    runFullOnboarding,
    reset,
    getDefaultCustomerData,
    getDefaultAccountData,
    lastCustomerResponse,
    lastAccountResponse,
  };
};

export default useOnboarding;
