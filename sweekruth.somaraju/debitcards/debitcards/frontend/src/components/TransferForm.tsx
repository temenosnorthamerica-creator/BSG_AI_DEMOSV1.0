import { useState } from 'react';
import { ArrowLeftRight, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Account, TransactionResponse } from '../types';
import { AccountSelector } from './AccountSelector';
import { apiService } from '../services/api';

interface TransferFormProps {
  accounts: Account[];
  onSuccess: () => void;
}

export function TransferForm({ accounts, onSuccess }: TransferFormProps) {
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [destAccountId, setDestAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TransactionResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceAccountId || !destAccountId || !amount) return;

    setIsLoading(true);
    setResult(null);

    try {
      const response = await apiService.transfer(sourceAccountId, destAccountId, parseFloat(amount));
      setResult(response);
      if (response.success) {
        onSuccess();
        setAmount('');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResult({
        success: false,
        message: `Failed to process transfer: ${errorMessage}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sourceAccount = accounts.find((a) => a.id === sourceAccountId);
  const destAccount = accounts.find((a) => a.id === destAccountId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
          <ArrowLeftRight className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Transfer Funds</h2>
          <p className="text-sm text-gray-500">Move money between your accounts</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Source Account */}
        <AccountSelector
          accounts={accounts}
          selectedId={sourceAccountId}
          onChange={(id) => {
            setSourceAccountId(id);
            if (id === destAccountId) setDestAccountId('');
          }}
          label="From Account"
        />

        {sourceAccount && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Available:{' '}
              <span className="font-semibold text-[#283054]">
                ${sourceAccount.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </p>
          </div>
        )}

        {/* Transfer Arrow */}
        <div className="flex justify-center">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <ArrowLeftRight className="w-5 h-5 text-orange-600" />
          </div>
        </div>

        {/* Destination Account */}
        <AccountSelector
          accounts={accounts}
          selectedId={destAccountId}
          onChange={setDestAccountId}
          label="To Account"
          excludeId={sourceAccountId}
        />

        {destAccount && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Current Balance:{' '}
              <span className="font-semibold text-[#283054]">
                ${destAccount.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </p>
          </div>
        )}

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Transfer Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0.01"
              max="50000"
              step="0.01"
              className="input-field pl-8"
            />
          </div>
        </div>

        {/* Transfer Preview */}
        {sourceAccount && destAccount && amount && (
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-800">
              Transfer <strong>${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>{' '}
              from <strong>{sourceAccount.name}</strong> to <strong>{destAccount.name}</strong>
            </p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!sourceAccountId || !destAccountId || !amount || isLoading}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg
                   font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <span>Transfer Funds</span>
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
