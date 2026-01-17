import { useState } from 'react';
import { ArrowDownCircle, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Account, TransactionResponse } from '../types';
import { AccountSelector } from './AccountSelector';
import { apiService } from '../services/api';

interface DepositCashFormProps {
  accounts: Account[];
  onSuccess: () => void;
}

export function DepositCashForm({ accounts, onSuccess }: DepositCashFormProps) {
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TransactionResponse | null>(null);

  const quickAmounts = [50, 100, 200, 500, 1000, 2000];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId || !amount) return;

    setIsLoading(true);
    setResult(null);

    try {
      const response = await apiService.depositCash(selectedAccountId, parseFloat(amount));
      setResult(response);
      if (response.success) {
        onSuccess();
        setAmount('');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResult({
        success: false,
        message: `Failed to process deposit: ${errorMessage}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
          <ArrowDownCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Deposit Cash</h2>
          <p className="text-sm text-gray-500">Add cash to your account</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <AccountSelector
          accounts={accounts}
          selectedId={selectedAccountId}
          onChange={setSelectedAccountId}
          label="To Account"
        />

        {/* Quick Amount Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Quick Select</label>
          <div className="grid grid-cols-3 gap-2">
            {quickAmounts.map((qa) => (
              <button
                key={qa}
                type="button"
                onClick={() => setAmount(qa.toString())}
                className={`py-2 px-4 rounded-lg border transition-colors ${
                  amount === qa.toString()
                    ? 'bg-green-600 text-white border-green-600'
                    : 'border-gray-300 hover:border-green-600'
                }`}
              >
                ${qa}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount (or enter custom)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0.01"
              max="10000"
              step="0.01"
              className="input-field pl-8"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!selectedAccountId || !amount || isLoading}
          className="w-full btn-success py-3 flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <span>Deposit ${amount || '0.00'}</span>
          )}
        </button>
      </form>

      {/* Result */}
      {result && (
        <div
          className={`p-4 rounded-lg flex items-start space-x-3 ${
            result.success
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {result.success ? (
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
          )}
          <div>
            <p className={result.success ? 'text-green-800' : 'text-red-800'}>{result.message}</p>
            {result.success && result.new_balance !== undefined && (
              <p className="text-sm text-green-600 mt-1">
                New Balance: ${result.new_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            )}
            {result.transaction && (
              <p className="text-xs text-gray-500 mt-1">
                Event ID: {result.transaction.event_id.slice(0, 8)}...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
