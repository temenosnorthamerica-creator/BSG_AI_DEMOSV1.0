import axios, { AxiosInstance } from 'axios';
import {
  Account,
  AccountBalance,
  PinAuthResponse,
  TransactionResponse,
  TransactionHistoryResponse,
} from '../types';

class ApiService {
  private client: AxiosInstance;
  private sessionToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: '/api/v1',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth header interceptor
    this.client.interceptors.request.use((config) => {
      if (this.sessionToken) {
        config.headers.Authorization = `Bearer ${this.sessionToken}`;
      }
      return config;
    });
  }

  setSessionToken(token: string | null) {
    this.sessionToken = token;
  }

  getSessionToken(): string | null {
    return this.sessionToken;
  }

  // Auth
  async authenticatePin(cardNumber: string, pin: string): Promise<PinAuthResponse> {
    const response = await this.client.post<PinAuthResponse>('/auth/pin', {
      card_number: cardNumber,
      pin: pin,
    });
    return response.data;
  }

  async logout(): Promise<void> {
    await this.client.post('/auth/logout');
    this.sessionToken = null;
  }

  async validateSession(): Promise<boolean> {
    try {
      await this.client.get('/auth/validate');
      return true;
    } catch {
      return false;
    }
  }

  // Accounts
  async getAccounts(): Promise<Account[]> {
    const response = await this.client.get<{ success: boolean; data: Account[] }>('/accounts');
    return response.data.data;
  }

  async getAccountBalance(accountId: string): Promise<AccountBalance> {
    const response = await this.client.get<AccountBalance>(`/accounts/${accountId}/balance`);
    return response.data;
  }

  // Transactions
  async withdraw(accountId: string, amount: number): Promise<TransactionResponse> {
    const response = await this.client.post<TransactionResponse>('/transactions/withdraw', {
      account_id: accountId,
      amount: amount,
    });
    return response.data;
  }

  async depositCash(accountId: string, amount: number): Promise<TransactionResponse> {
    const response = await this.client.post<TransactionResponse>('/transactions/deposit/cash', {
      account_id: accountId,
      amount: amount,
    });
    return response.data;
  }

  async depositCheck(
    accountId: string,
    amount: number,
    checkNumber: string
  ): Promise<TransactionResponse> {
    const response = await this.client.post<TransactionResponse>('/transactions/deposit/check', {
      account_id: accountId,
      amount: amount,
      check_number: checkNumber,
    });
    return response.data;
  }

  async transfer(
    sourceAccountId: string,
    destinationAccountId: string,
    amount: number
  ): Promise<TransactionResponse> {
    const response = await this.client.post<TransactionResponse>('/transactions/transfer', {
      source_account_id: sourceAccountId,
      destination_account_id: destinationAccountId,
      amount: amount,
    });
    return response.data;
  }

  async balanceInquiry(accountId: string): Promise<TransactionResponse> {
    const response = await this.client.post<TransactionResponse>('/transactions/balance-inquiry', {
      account_id: accountId,
    });
    return response.data;
  }

  async getTransactionHistory(limit: number = 10): Promise<TransactionHistoryResponse> {
    const response = await this.client.get<TransactionHistoryResponse>(
      `/transactions/history?limit=${limit}`
    );
    return response.data;
  }
}

export const apiService = new ApiService();
