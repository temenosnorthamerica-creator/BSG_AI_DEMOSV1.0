import { useState } from 'react';
import { Wallet, RefreshCw, Loader2 } from 'lucide-react';
import { Account } from '../types';
import { AccountCard } from './AccountSelector';
import { apiService } from '../services/api';

interface BalanceDisplayProps {
  accounts: Account[];
  onRefresh: () => void;
}

export function BalanceDisplay({ accounts, onRefresh }: BalanceDisplayProps) {
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleCheckBalance = async (account: Account) => {
    setSelectedAccount(account);
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await apiService.balanceInquiry(account.id);
      if (response.success) {
        setMessage(`Balance inquiry recorded. Event ID: ${response.transaction?.event_id.slice(0, 8)}...`);
        onRefresh();
      }
    } catch (error) {
      setMessage('Failed to record balance inquiry');
    } finally {
      setIsLoading(false);
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div className="space-y-6">
      {/* Total Balance Card */}
      <div className="bg-gradient-to-r from-[#283054] to-[#0066CC] rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Wallet className="w-8 h-8" />
            <span className="text-lg font-medium">Total Balance</span>
          </div>
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
        <div className="text-4xl font-bold">
          ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
        <p className="text-sm text-white/70 mt-2">Across {accounts.length} accounts</p>
      </div>

      {/* Account List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Accounts</h3>
        <div className="space-y-3">
          {accounts.map((account) => (
            <div key={account.id} className="relative">
              <AccountCard
                account={account}
                isSelected={selectedAccount?.id === account.id}
                onClick={() => handleCheckBalance(account)}
              />
              {selectedAccount?.id === account.id && isLoading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                  <Loader2 className="w-6 h-6 animate-spin text-[#283054]" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
          {message}
        </div>
      )}

      <p className="text-xs text-gray-500 text-center">
        Click on an account to record a balance inquiry event
      </p>
    </div>
  );
}
