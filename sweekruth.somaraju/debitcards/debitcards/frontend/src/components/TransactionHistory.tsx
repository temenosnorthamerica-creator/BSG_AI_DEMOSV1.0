import { useState, useEffect } from 'react';
import {
  History,
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowLeftRight,
  Wallet,
  FileText,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { apiService } from '../services/api';
import clsx from 'clsx';

export function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getTransactionHistory(20);
      if (response.success) {
        setTransactions(response.transactions);
        setTotalCount(response.total_count);
      }
    } catch (error) {
      console.error('Failed to fetch transaction history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case 'WITHDRAWAL':
        return <ArrowUpCircle className="w-5 h-5 text-red-500" />;
      case 'CASH_DEPOSIT':
        return <ArrowDownCircle className="w-5 h-5 text-green-500" />;
      case 'CHECK_DEPOSIT':
        return <FileText className="w-5 h-5 text-purple-500" />;
      case 'TRANSFER':
        return <ArrowLeftRight className="w-5 h-5 text-orange-500" />;
      case 'BALANCE_INQUIRY':
        return <Wallet className="w-5 h-5 text-blue-500" />;
      default:
        return <History className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTransactionLabel = (type: TransactionType) => {
    switch (type) {
      case 'WITHDRAWAL':
        return 'Withdrawal';
      case 'CASH_DEPOSIT':
        return 'Cash Deposit';
      case 'CHECK_DEPOSIT':
        return 'Check Deposit';
      case 'TRANSFER':
        return 'Transfer';
      case 'BALANCE_INQUIRY':
        return 'Balance Inquiry';
      default:
        return type;
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-500 rounded-lg flex items-center justify-center">
            <History className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
            <p className="text-sm text-gray-500">{totalCount} total transactions</p>
          </div>
        </div>
        <button
          onClick={fetchHistory}
          disabled={isLoading}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={clsx('w-5 h-5', isLoading && 'animate-spin')} />
        </button>
      </div>

      {/* Transaction List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#283054]" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12">
          <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No transactions yet</p>
          <p className="text-sm text-gray-400">Your transaction history will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div key={tx.id} className="transaction-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    {getTransactionIcon(tx.transaction_type)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {getTransactionLabel(tx.transaction_type)}
                    </p>
                    <p className="text-sm text-gray-500">{tx.account_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={clsx(
                      'font-bold',
                      tx.transaction_type === 'WITHDRAWAL' || tx.transaction_type === 'TRANSFER'
                        ? 'text-red-600'
                        : tx.transaction_type === 'BALANCE_INQUIRY'
                        ? 'text-gray-600'
                        : 'text-green-600'
                    )}
                  >
                    {tx.transaction_type === 'WITHDRAWAL' || tx.transaction_type === 'TRANSFER'
                      ? '-'
                      : tx.transaction_type === 'BALANCE_INQUIRY'
                      ? ''
                      : '+'}
                    {tx.amount > 0
                      ? `$${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                      : ''}
                  </p>
                  <p className="text-xs text-gray-400">{formatDate(tx.timestamp)}</p>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span
                  className={clsx(
                    'px-2 py-1 rounded-full',
                    tx.status === 'SUCCESS'
                      ? 'bg-green-100 text-green-700'
                      : tx.status === 'FAILED'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  )}
                >
                  {tx.status}
                </span>
                <span>Event: {tx.event_id.slice(0, 8)}...</span>
              </div>

              {/* Transfer details */}
              {tx.transaction_type === 'TRANSFER' && tx.metadata.destinationAccountName && (
                <div className="mt-2 text-xs text-gray-500">
                  To: {tx.metadata.destinationAccountName}
                </div>
              )}

              {/* Check number */}
              {tx.transaction_type === 'CHECK_DEPOSIT' && tx.metadata.checkNumber && (
                <div className="mt-2 text-xs text-gray-500">
                  Check #: {tx.metadata.checkNumber}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
