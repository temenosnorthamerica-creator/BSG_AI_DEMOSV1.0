/**
 * Loan Service - API client for loan operations
 */
import axios from 'axios';
import type {
  Customer,
  CustomerSearchQuery,
  CustomerCreate,
  PersonalLoanRequest,
  AutoLoanRequest,
  LoanResponse,
  LoanSimulationRequest,
  LoanSimulationResponse,
  LoanSummary,
  LoanDetail,
  PaymentSchedule,
  ValidationResult,
} from '../types/loans';

// Get API base URL from config or default
const getApiBaseUrl = (): string => {
  // Check if running on Azure Static Web Apps
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('azurestaticapps.net')) {
      return 'https://bsg-demo-platform-app.azurewebsites.net/api/v1';
    }
  }
  // Default to relative path for local development
  return '/api/v1';
};

// Create axios instance for loan service
const loanApi = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth token if needed
loanApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Loan Service API
 */
export const loanService = {
  // Customer Operations
  searchCustomers: async (query: CustomerSearchQuery): Promise<Customer[]> => {
    const params = new URLSearchParams();
    if (query.document_number) params.append('document_number', query.document_number);
    if (query.name) params.append('name', query.name);
    if (query.account_number) params.append('account_number', query.account_number);
    if (query.phone) params.append('phone', query.phone);

    const response = await loanApi.get<Customer[]>(`/loans/customers/search?${params.toString()}`);
    return response.data;
  },

  getCustomer: async (customerId: string): Promise<Customer> => {
    const response = await loanApi.get<Customer>(`/loans/customers/${customerId}`);
    return response.data;
  },

  createCustomer: async (customer: CustomerCreate): Promise<Customer> => {
    const response = await loanApi.post<Customer>('/loans/customers', customer);
    return response.data;
  },

  // Loan Validation
  validatePersonalLoan: async (loan: PersonalLoanRequest): Promise<ValidationResult> => {
    const response = await loanApi.post<ValidationResult>('/loans/personal/validate', loan);
    return response.data;
  },

  validateAutoLoan: async (loan: AutoLoanRequest): Promise<ValidationResult> => {
    const response = await loanApi.post<ValidationResult>('/loans/auto/validate', loan);
    return response.data;
  },

  // Loan Creation
  createPersonalLoan: async (loan: PersonalLoanRequest): Promise<LoanResponse> => {
    const response = await loanApi.post<LoanResponse>('/loans/personal', loan);
    return response.data;
  },

  createAutoLoan: async (loan: AutoLoanRequest): Promise<LoanResponse> => {
    const response = await loanApi.post<LoanResponse>('/loans/auto', loan);
    return response.data;
  },

  // Loan Queries
  getLoan: async (loanId: string): Promise<LoanDetail> => {
    const response = await loanApi.get<LoanDetail>(`/loans/${loanId}`);
    return response.data;
  },

  getCustomerLoans: async (customerId: string): Promise<LoanSummary[]> => {
    const response = await loanApi.get<LoanSummary[]>(`/loans/customer/${customerId}`);
    return response.data;
  },

  // Simulation
  simulateLoan: async (simulation: LoanSimulationRequest): Promise<LoanSimulationResponse> => {
    const response = await loanApi.post<LoanSimulationResponse>('/loans/simulate', simulation);
    return response.data;
  },

  // Payment Schedule
  getPaymentSchedule: async (loanId: string): Promise<PaymentSchedule> => {
    const response = await loanApi.get<PaymentSchedule>(`/loans/${loanId}/schedule`);
    return response.data;
  },
};

export default loanService;
