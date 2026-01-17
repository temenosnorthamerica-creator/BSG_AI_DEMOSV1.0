import { Account } from '../types';
import clsx from 'clsx';

interface AccountSelectorProps {
  accounts: Account[];
  selectedId: string;
  onChange: (accountId: string) => void;
  label?: string;
  excludeId?: string;
}

export function AccountSelector({
  accounts,
  selectedId,
  onChange,
  label = 'Select Account',
  excludeId,
}: AccountSelectorProps) {
  const filteredAccounts = excludeId
    ? accounts.filter((a) => a.id !== excludeId)
    : accounts;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <select
        value={selectedId}
        onChange={(e) => onChange(e.target.value)}
        className="select-field"
      >
        <option value="">Choose an account</option>
        {filteredAccounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name} - ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </option>
        ))}
      </select>
    </div>
  );
}

interface AccountCardProps {
  account: Account;
  isSelected: boolean;
  onClick: () => void;
}

export function AccountCard({ account, isSelected, onClick }: AccountCardProps) {
  const typeColors = {
    checking: 'bg-blue-500',
    savings: 'bg-green-500',
    investment: 'bg-purple-500',
  };

  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full p-4 rounded-lg border-2 transition-all text-left',
        isSelected
          ? 'border-[#283054] bg-[#283054]/5'
          : 'border-gray-200 hover:border-gray-300'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={clsx('w-10 h-10 rounded-lg', typeColors[account.account_type])} />
          <div>
            <p className="font-semibold text-gray-900">{account.name}</p>
            <p className="text-sm text-gray-500 capitalize">{account.account_type}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg text-[#283054]">
            ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500">{account.currency}</p>
        </div>
      </div>
    </button>
  );
}
