import { useState } from 'react';

interface AccountFormData {
  accountNumber: string;
  accountType: string;
  currency: string;
  status: string;
  customerId: string;
  openedDate: string;
  branchCode: string;
  productCode: string;
  availableBalance: string;
  ledgerBalance: string;
  interestRate: string;
  rateType: string;
}

const initialFormData: AccountFormData = {
  accountNumber: '',
  accountType: 'SAVINGS',
  currency: 'USD',
  status: 'ACTIVE',
  customerId: '',
  openedDate: new Date().toISOString().split('T')[0],
  branchCode: '',
  productCode: '',
  availableBalance: '0.00',
  ledgerBalance: '0.00',
  interestRate: '3.5',
  rateType: 'FIXED'
};

export default function CreateAccount() {
  const [formData, setFormData] = useState<AccountFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string; accountId?: string; eventId?: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const response = await fetch('/api/account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitResult({
          success: true,
          message: 'Account created successfully!',
          accountId: result.accountId,
          eventId: result.eventId
        });
        setFormData(initialFormData);
      } else {
        setSubmitResult({
          success: false,
          message: result.message || 'Failed to create account'
        });
      }
    } catch (error) {
      setSubmitResult({
        success: false,
        message: 'Network error: ' + (error as Error).message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Create Account</h2>

      {submitResult && (
        <div className={`mb-6 p-4 rounded-lg ${submitResult.success ? 'bg-green-900/50 border border-green-500' : 'bg-red-900/50 border border-red-500'}`}>
          <p className={submitResult.success ? 'text-green-400' : 'text-red-400'}>
            {submitResult.message}
          </p>
          {submitResult.accountId && (
            <p className="text-green-300 mt-2">Account ID: <span className="font-mono">{submitResult.accountId}</span></p>
          )}
          {submitResult.eventId && (
            <p className="text-green-300">Event ID: <span className="font-mono text-sm">{submitResult.eventId}</span></p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account Information */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <h3 className="text-lg font-semibold text-[#00A3E0] mb-4">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Account Number *</label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                required
                placeholder="001234567890"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Account Type *</label>
              <select
                name="accountType"
                value={formData.accountType}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
              >
                <option value="SAVINGS">Savings</option>
                <option value="CURRENT">Current</option>
                <option value="FIXED_DEPOSIT">Fixed Deposit</option>
                <option value="RECURRING_DEPOSIT">Recurring Deposit</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Currency *</label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
                <option value="AED">AED</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="DORMANT">Dormant</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Customer & Branch */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <h3 className="text-lg font-semibold text-[#00A3E0] mb-4">Customer & Branch Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Customer ID *</label>
              <input
                type="text"
                name="customerId"
                value={formData.customerId}
                onChange={handleChange}
                required
                placeholder="CUST-123456789"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Opened Date *</label>
              <input
                type="date"
                name="openedDate"
                value={formData.openedDate}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Branch Code *</label>
              <input
                type="text"
                name="branchCode"
                value={formData.branchCode}
                onChange={handleChange}
                required
                placeholder="001"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Product Code *</label>
              <input
                type="text"
                name="productCode"
                value={formData.productCode}
                onChange={handleChange}
                required
                placeholder="SB-STD"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
              />
            </div>
          </div>
        </div>

        {/* Balance */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <h3 className="text-lg font-semibold text-[#00A3E0] mb-4">Balance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Available Balance</label>
              <input
                type="number"
                name="availableBalance"
                value={formData.availableBalance}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Ledger Balance</label>
              <input
                type="number"
                name="ledgerBalance"
                value={formData.ledgerBalance}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
              />
            </div>
          </div>
        </div>

        {/* Interest */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <h3 className="text-lg font-semibold text-[#00A3E0] mb-4">Interest Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Interest Rate (%)</label>
              <input
                type="number"
                name="interestRate"
                value={formData.interestRate}
                onChange={handleChange}
                step="0.01"
                min="0"
                max="100"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Rate Type</label>
              <select
                name="rateType"
                value={formData.rateType}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
              >
                <option value="FIXED">Fixed</option>
                <option value="FLOATING">Floating</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-[#0066CC] hover:bg-[#0052a3] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </div>
      </form>
    </div>
  );
}
