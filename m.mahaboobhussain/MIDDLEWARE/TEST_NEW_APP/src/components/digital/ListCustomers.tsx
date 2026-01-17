import { useState, useEffect } from 'react';
import { RefreshCw, Eye, X, Wallet } from 'lucide-react';

interface Customer {
  eventId: string;
  eventTime: string;
  customerId: string;
  customerType: string;
  status: string;
  createdAt: string;
  personalDetails: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    nationality: string;
  };
  contactDetails: {
    email: string;
    mobile: string;
  };
  kyc: {
    kycStatus: string;
    kycLevel: string;
  };
}

interface Account {
  eventId: string;
  accountId: string;
  accountNumber: string;
  accountType: string;
  currency: string;
  status: string;
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
}

export default function ListCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerAccounts, setCustomerAccounts] = useState<Account[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [showAccountsModal, setShowAccountsModal] = useState(false);

  const fetchCustomers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/eventhub/customers');
      const result = await response.json();

      if (result.success) {
        setCustomers(result.customers);
      } else {
        setError(result.message || 'Failed to fetch customers');
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomerAccounts = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsLoadingAccounts(true);
    setShowAccountsModal(true);
    setCustomerAccounts([]);

    try {
      const response = await fetch(`/api/eventhub/customer/${customer.customerId}/accounts`);
      const result = await response.json();

      if (result.success) {
        setCustomerAccounts(result.accounts);
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">List Customers</h2>
        <button
          onClick={fetchCustomers}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-[#0066CC] hover:bg-[#0052a3] text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <p className="text-[#94a3b8] mb-4">
        Fetching customers from Event Hub by type: <code className="bg-slate-800 px-2 py-1 rounded text-[#00A3E0]">com.bank.customer.created</code>
      </p>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-900/50 border border-red-500">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-[#00A3E0] mx-auto mb-4" />
          <p className="text-[#94a3b8]">Loading customers from Event Hub...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/50 rounded-lg border border-slate-700">
          <p className="text-[#94a3b8]">No customers found in Event Hub</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-700">
                <th className="text-left px-4 py-3 text-[#94a3b8] font-medium">Customer ID</th>
                <th className="text-left px-4 py-3 text-[#94a3b8] font-medium">Name</th>
                <th className="text-left px-4 py-3 text-[#94a3b8] font-medium">Email</th>
                <th className="text-left px-4 py-3 text-[#94a3b8] font-medium">Type</th>
                <th className="text-left px-4 py-3 text-[#94a3b8] font-medium">Status</th>
                <th className="text-left px-4 py-3 text-[#94a3b8] font-medium">KYC</th>
                <th className="text-left px-4 py-3 text-[#94a3b8] font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.eventId} className="border-b border-slate-700 hover:bg-slate-800/30">
                  <td className="px-4 py-3 text-white font-mono text-sm">{customer.customerId}</td>
                  <td className="px-4 py-3 text-white">
                    {customer.personalDetails?.firstName} {customer.personalDetails?.lastName}
                  </td>
                  <td className="px-4 py-3 text-[#94a3b8]">{customer.contactDetails?.email}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-purple-900/50 text-purple-400 rounded text-sm">
                      {customer.customerType}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-sm ${
                      customer.status === 'ACTIVE'
                        ? 'bg-green-900/50 text-green-400'
                        : 'bg-yellow-900/50 text-yellow-400'
                    }`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-sm ${
                      customer.kyc?.kycStatus === 'VERIFIED'
                        ? 'bg-green-900/50 text-green-400'
                        : 'bg-orange-900/50 text-orange-400'
                    }`}>
                      {customer.kyc?.kycStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => fetchCustomerAccounts(customer)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-[#00A3E0] hover:bg-[#0090c7] text-white rounded transition-colors text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      View Accounts
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 text-sm text-[#94a3b8]">
        Total: {customers.length} customer(s) found
      </div>

      {/* Accounts Modal */}
      {showAccountsModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-lg border border-slate-700 w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <Wallet className="w-6 h-6 text-[#00A3E0]" />
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Accounts for {selectedCustomer.personalDetails?.firstName} {selectedCustomer.personalDetails?.lastName}
                  </h3>
                  <p className="text-sm text-[#94a3b8]">Customer ID: {selectedCustomer.customerId}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAccountsModal(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[#94a3b8]" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <p className="text-[#94a3b8] mb-4">
                Fetching accounts by type: <code className="bg-slate-800 px-2 py-1 rounded text-[#00A3E0]">com.bank.account.created</code>
              </p>

              {isLoadingAccounts ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin text-[#00A3E0] mx-auto mb-4" />
                  <p className="text-[#94a3b8]">Loading accounts from Event Hub...</p>
                </div>
              ) : customerAccounts.length === 0 ? (
                <div className="text-center py-8 bg-slate-800/50 rounded-lg">
                  <p className="text-[#94a3b8]">No accounts found for this customer</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {customerAccounts.map((account) => (
                    <div key={account.eventId} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-white font-semibold">{account.accountNumber}</h4>
                          <p className="text-sm text-[#94a3b8]">Account ID: {account.accountId}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-sm ${
                          account.status === 'ACTIVE'
                            ? 'bg-green-900/50 text-green-400'
                            : 'bg-yellow-900/50 text-yellow-400'
                        }`}>
                          {account.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-[#94a3b8]">Type</p>
                          <p className="text-white">{account.accountType}</p>
                        </div>
                        <div>
                          <p className="text-[#94a3b8]">Currency</p>
                          <p className="text-white">{account.currency}</p>
                        </div>
                        <div>
                          <p className="text-[#94a3b8]">Available Balance</p>
                          <p className="text-white font-mono">{account.balance?.available?.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-[#94a3b8]">Interest Rate</p>
                          <p className="text-white">{account.interest?.rate}% ({account.interest?.rateType})</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 text-sm text-[#94a3b8]">
                Total: {customerAccounts.length} account(s) found
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
