/**
 * Types for Customer Onboarding APIs
 */

// Communication Device for Customer
export interface CommunicationDevice {
  emailId?: string;
  phoneNumber?: string;
}

// Customer Creation Request Payload
export interface CustomerCreationRequest {
  givenName: string;
  middleName?: string;
  lastName: string;
  nationalityId: string;
  dateOfBirth: string; // Format: YYYY-MM-DD
  sectorId: number;
  communicationDevices?: CommunicationDevice[];
  languageId: number;
  addressLine1: string;
}

// Customer Creation Response
export interface CustomerCreationResponse {
  header: Record<string, unknown>;
  body: {
    customerId: string;
    status?: string;
    [key: string]: unknown;
  };
}

// Override Details for Account Creation
export interface OverrideDetail {
  code: string;
  description: string;
  id: string;
  type: string;
}

// Payment Schedule
export interface PaymentSchedule {
  paymentType: string;
  paymentMethod: string;
}

// Schedule Item
export interface ScheduleItem {
  payment: PaymentSchedule[];
}

// Officers for Account
export interface AccountOfficers {
  primaryOfficer: number;
}

// Balance Details
export interface BalanceDetails {
  shortTitle: string;
  fdicClassCode: number;
  fdicOwnershipCode: string;
  purposeCode: number;
  accountType: string;
}

// Statement Configuration
export interface StatementConfig {
  statement1Frequency: string;
  attributeNamevalue: string;
  fqu1PrintAttrValue1: string;
}

// Account Creation Request Payload
export interface AccountCreationRequest {
  header?: {
    override?: {
      overrideDetails: OverrideDetail[];
    };
  };
  body: {
    customerIds: { customerId: string }[];
    activityId: string;
    currencyId: string;
    productId: string;
    officers: AccountOfficers;
    balance: BalanceDetails;
    statement: StatementConfig;
    schedule: ScheduleItem[];
  };
}

// Account Creation Response
export interface AccountCreationResponse {
  header: Record<string, unknown>;
  body: {
    accountId: string;
    arrangementId?: string;
    status?: string;
    [key: string]: unknown;
  };
}

// Onboarding Flow State
export interface OnboardingState {
  customerId: string | null;
  accountId: string | null;
  status: 'idle' | 'creating_customer' | 'creating_account' | 'completed' | 'error';
  error: string | null;
  customerData: CustomerCreationRequest | null;
  accountData: AccountCreationRequest | null;
}

// API Call Result
export interface APICallResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  rawResponse?: unknown;
}
