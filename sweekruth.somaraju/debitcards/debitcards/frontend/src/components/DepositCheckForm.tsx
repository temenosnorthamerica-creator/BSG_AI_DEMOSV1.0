import { useState } from 'react';
import { FileText, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Account, TransactionResponse } from '../types';
import { AccountSelector } from './AccountSelector';
import { apiService } from '../services/api';

interface DepositCheckFormProps {
  accounts: Account[];
  onSuccess: () => void;
}

export function DepositCheckForm({ accounts, onSuccess }: DepositCheckFormProps) {
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [checkNumber, setCheckNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TransactionResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId || !amount || !checkNumber) return;

    setIsLoading(true);
    setResult(null);

    try {
      const response = await apiService.depositCheck(
        selectedAccountId,
        parseFloat(amount),
        checkNumber
      );
      setResult(response);
      if (response.success) {
        onSuccess();
        setAmount('');
        setCheckNumber('');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResult({
        success: false,
        message: `Failed to process check deposit: ${errorMessage}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Deposit Check</h2>
          <p className="text-sm text-gray-500">Deposit a check to your account</p>
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

        {/* Check Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Check Number</label>
          <input
            type="text"
            value={checkNumber}
            onChange={(e) => setCheckNumber(e.target.value)}
            placeholder="Enter check number"
            className="input-field"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Check Amount</label>
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

        {/* Info Box */}
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <p className="text-sm text-purple-800">
            <strong>Note:</strong> Check deposits may take 1-2 business days to clear.
            Funds will be available after verification.
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!selectedAccountId || !amount || !checkNumber || isLoading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg
                   font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <span>Deposit Check</span>
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
