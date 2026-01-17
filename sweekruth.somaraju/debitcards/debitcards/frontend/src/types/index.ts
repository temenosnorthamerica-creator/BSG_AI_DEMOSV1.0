export interface Account {
  id: string;
  account_number: string;
  name: string;
  account_type: 'checking' | 'savings' | 'investment';
  balance: number;
  currency: string;
  is_active: boolean;
}

export interface AccountBalance {
  account_id: string;
  account_name: string;
  balance: number;
  currency: string;
  available_balance: number;
}

export interface PinAuthResponse {
  success: boolean;
  message: string;
  session_token?: string;
  card_masked?: string;
  holder_name?: string;
}

export interface Transaction {
  id: string;
  event_id: string;
  transaction_type: TransactionType;
  card_number: string;
  account_id: string;
  account_name: string;
  amount: number;
  currency: string;
  balance_before: number;
  balance_after: number;
  status: TransactionStatus;
  timestamp: string;
  metadata: Record<string, string>;
}

export type TransactionType =
  | 'WITHDRAWAL'
  | 'CASH_DEPOSIT'
  | 'CHECK_DEPOSIT'
  | 'TRANSFER'
  | 'BALANCE_INQUIRY';

export type TransactionStatus = 'SUCCESS' | 'FAILED' | 'PENDING';

export interface TransactionResponse {
  success: boolean;
  message: string;
  transaction?: Transaction;
  new_balance?: number;
}

export interface TransactionHistoryResponse {
  success: boolean;
  transactions: Transaction[];
  total_count: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export type MenuOption =
  | 'balance'
  | 'withdraw'
  | 'deposit-cash'
  | 'deposit-check'
  | 'transfer'
  | 'history';

export interface SessionInfo {
  cardMasked: string;
  holderName: string;
  sessionToken: string;
}
