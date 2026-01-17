import { CreditCard, LogOut } from 'lucide-react';

interface HeaderProps {
  cardMasked?: string;
  holderName?: string;
  onLogout?: () => void;
  isAuthenticated: boolean;
}

export function Header({ cardMasked, holderName, onLogout, isAuthenticated }: HeaderProps) {
  return (
    <header className="bg-[#283054] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <CreditCard className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold">Debit Card Management</h1>
              <p className="text-xs text-gray-300">Banking Simulator</p>
            </div>
          </div>

          {isAuthenticated && (
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm font-medium">{holderName}</p>
                <p className="text-xs text-gray-300">{cardMasked}</p>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg
                         bg-white/10 hover:bg-white/20 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
