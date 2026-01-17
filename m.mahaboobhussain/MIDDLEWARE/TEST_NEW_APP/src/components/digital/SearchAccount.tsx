import { useState } from 'react';

interface AccountData {
  accountId: string;
  accountNumber: string;
  accountType: string;
  currency: string;
  status: string;
  customerId: string;
  openedDate: string;
  branchCode: string;
  productCode: string;
  balance: {
    available: number;
    ledger: number;
  };
  interest: {
    rate: number;
    rateType: string;
  };
  createdAt?: string;
}

export default function SearchAccount() {
  const [accountId, setAccountId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{ success: boolean; message?: string; account?: AccountData; source?: string } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId.trim()) return;

    setIsSearching(true);
    setSearchResult(null);

    try {
      const response = await fetch(`/api/account/${encodeURIComponent(accountId)}`);
      const result = await response.json();

      if (result.success) {
        setSearchResult({
          success: true,
          account: result.account,
          source: result.source
        });
      } else {
        setSearchResult({
          success: false,
          message: result.message || 'Account not found'
        });
      }
    } catch (error) {
      setSearchResult({
        success: false,
        message: 'Network error: ' + (error as Error).message
      });
    } finally {
      setIsSearching(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Search Account</h2>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="Enter Account ID (e.g., ACC-987654321)"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !accountId.trim()}
            className="px-6 py-3 bg-[#0066CC] hover:bg-[#0052a3] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Search Result */}
      {searchResult && (
        <div className="mt-6">
          {searchResult.success && searchResult.account ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-green-400">Account Found</h3>
                <span className="text-sm text-gray-400">
                  Source: {searchResult.source === 'memory' ? 'Memory Cache' : 'Event Hub'}
                </span>
              </div>

              {/* Account Info */}
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <h4 className="text-lg font-semibold text-[#00A3E0] mb-3">Account Information</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Account ID</p>
                    <p className="text-white font-mono">{searchResult.account.accountId}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Account Number</p>
                    <p className="text-white font-mono">{searchResult.account.accountNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Account Type</p>
                    <p className="text-white">{searchResult.account.accountType}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Status</p>
                    <span className={`inline-block px-2 py-1 rounded text-sm ${
                      searchResult.account.status === 'ACTIVE' ? 'bg-green-900/50 text-green-400' :
                      searchResult.account.status === 'INACTIVE' ? 'bg-yellow-900/50 text-yellow-400' :
                      searchResult.account.status === 'DORMANT' ? 'bg-orange-900/50 text-orange-400' :
                      'bg-red-900/50 text-red-400'
                    }`}>
                      {searchResult.account.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer & Branch */}
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <h4 className="text-lg font-semibold text-[#00A3E0] mb-3">Customer & Branch Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Customer ID</p>
                    <p className="text-white font-mono">{searchResult.account.customerId}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Opened Date</p>
                    <p className="text-white">{searchResult.account.openedDate}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Branch Code</p>
                    <p className="text-white">{searchResult.account.branchCode}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Product Code</p>
                    <p className="text-white">{searchResult.account.productCode}</p>
                  </div>
                </div>
              </div>

              {/* Balance */}
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <h4 className="text-lg font-semibold text-[#00A3E0] mb-3">Balance ({searchResult.account.currency})</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Available Balance</p>
                    <p className="text-white text-2xl font-semibold">
                      {formatCurrency(searchResult.account.balance.available, searchResult.account.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Ledger Balance</p>
                    <p className="text-white text-2xl font-semibold">
                      {formatCurrency(searchResult.account.balance.ledger, searchResult.account.currency)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Interest */}
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <h4 className="text-lg font-semibold text-[#00A3E0] mb-3">Interest Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Interest Rate</p>
                    <p className="text-white text-xl">{searchResult.account.interest.rate}%</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Rate Type</p>
                    <p className="text-white">{searchResult.account.interest.rateType}</p>
                  </div>
                </div>
              </div>

              {searchResult.account.createdAt && (
                <div className="text-sm text-gray-400 text-right">
                  Created: {new Date(searchResult.account.createdAt).toLocaleString()}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-red-900/50 border border-red-500 rounded-lg p-4">
              <p className="text-red-400">{searchResult.message}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
