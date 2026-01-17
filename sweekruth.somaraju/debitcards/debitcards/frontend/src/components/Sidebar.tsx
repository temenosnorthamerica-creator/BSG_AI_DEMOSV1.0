import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  FileText,
  ArrowLeftRight,
  History,
} from 'lucide-react';
import { MenuOption } from '../types';
import clsx from 'clsx';

interface SidebarProps {
  currentOption: MenuOption;
  onOptionChange: (option: MenuOption) => void;
}

const menuItems: { id: MenuOption; label: string; icon: typeof Wallet; color: string }[] = [
  { id: 'balance', label: 'Check Balance', icon: Wallet, color: 'bg-blue-500' },
  { id: 'withdraw', label: 'Withdraw', icon: ArrowUpCircle, color: 'bg-red-500' },
  { id: 'deposit-cash', label: 'Deposit Cash', icon: ArrowDownCircle, color: 'bg-green-500' },
  { id: 'deposit-check', label: 'Deposit Check', icon: FileText, color: 'bg-purple-500' },
  { id: 'transfer', label: 'Transfer', icon: ArrowLeftRight, color: 'bg-orange-500' },
  { id: 'history', label: 'History', icon: History, color: 'bg-gray-500' },
];

export function Sidebar({ currentOption, onOptionChange }: SidebarProps) {
  return (
    <aside className="w-64 bg-white shadow-lg rounded-lg p-4">
      <h2 className="text-lg font-semibold text-[#283054] mb-4 px-2">Transactions</h2>
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentOption === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onOptionChange(item.id)}
              className={clsx(
                'w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-[#283054] text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <div
                className={clsx(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  isActive ? 'bg-white/20' : item.color
                )}
              >
                <Icon className={clsx('w-5 h-5', isActive ? 'text-white' : 'text-white')} />
              </div>
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
