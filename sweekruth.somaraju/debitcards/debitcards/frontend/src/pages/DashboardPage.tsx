import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { BalanceDisplay } from '../components/BalanceDisplay';
import { WithdrawForm } from '../components/WithdrawForm';
import { DepositCashForm } from '../components/DepositCashForm';
import { DepositCheckForm } from '../components/DepositCheckForm';
import { TransferForm } from '../components/TransferForm';
import { TransactionHistory } from '../components/TransactionHistory';
import { Account, MenuOption, SessionInfo } from '../types';
import { apiService } from '../services/api';

interface DashboardPageProps {
  session: SessionInfo;
  onLogout: () => void;
}

export function DashboardPage({ session, onLogout }: DashboardPageProps) {
  const [currentOption, setCurrentOption] = useState<MenuOption>('balance');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAccounts = async () => {
    try {
      const accountList = await apiService.getAccounts();
      setAccounts(accountList);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleTransactionSuccess = () => {
    fetchAccounts(); // Refresh account balances
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#283054]" />
        </div>
      );
    }

    switch (currentOption) {
      case 'balance':
        return <BalanceDisplay accounts={accounts} onRefresh={fetchAccounts} />;
      case 'withdraw':
        return <WithdrawForm accounts={accounts} onSuccess={handleTransactionSuccess} />;
      case 'deposit-cash':
        return <DepositCashForm accounts={accounts} onSuccess={handleTransactionSuccess} />;
      case 'deposit-check':
        return <DepositCheckForm accounts={accounts} onSuccess={handleTransactionSuccess} />;
      case 'transfer':
        return <TransferForm accounts={accounts} onSuccess={handleTransactionSuccess} />;
      case 'history':
        return <TransactionHistory />;
      default:
        return <BalanceDisplay accounts={accounts} onRefresh={fetchAccounts} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header
        cardMasked={session.cardMasked}
        holderName={session.holderName}
        onLogout={onLogout}
        isAuthenticated={true}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <Sidebar currentOption={currentOption} onOptionChange={setCurrentOption} />

          {/* Main Content */}
          <main className="flex-1">
            <div className="bg-white rounded-lg shadow-lg p-6">{renderContent()}</div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 pb-4 text-center text-xs text-gray-400">
        Debit Card Management Simulator - Banking Ecosystem Demo
      </footer>
    </div>
  );
}
