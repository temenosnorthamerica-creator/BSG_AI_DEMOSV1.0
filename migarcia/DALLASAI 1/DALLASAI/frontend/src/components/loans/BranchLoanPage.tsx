import React, { useState, useEffect } from 'react';
import {
  Building2,
  Wallet,
  Car,
  Calendar,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import type {
  Customer,
  LoanType,
  PersonalLoanRequest,
  AutoLoanRequest,
  LoanResponse,
  LoanSummary,
} from '../../types/loans';
import { loanService } from '../../services/loanService';
import CustomerSearch from './CustomerSearch';
import CustomerInfo from './CustomerInfo';
import LoanTypeSelector from './LoanTypeSelector';
import PersonalLoanForm from './PersonalLoanForm';
import AutoLoanForm from './AutoLoanForm';
import PaymentScheduleViewer from './PaymentScheduleViewer';
import LoanConfirmation from './LoanConfirmation';

type ViewMode = 'search' | 'loan-form' | 'schedule';
type Step = 'customer' | 'loan-type' | 'form' | 'confirmation';

const BranchLoanPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('search');
  const [step, setStep] = useState<Step>('customer');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedLoanType, setSelectedLoanType] = useState<LoanType | null>(null);
  const [createdLoan, setCreatedLoan] = useState<LoanResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduleLoanId, setScheduleLoanId] = useState<string>('');
  const [customerLoans, setCustomerLoans] = useState<LoanSummary[]>([]);
  const [isLoadingLoans, setIsLoadingLoans] = useState(false);

  // Fetch customer loans when customer is selected
  useEffect(() => {
    const fetchCustomerLoans = async () => {
      if (!selectedCustomer) {
        setCustomerLoans([]);
        return;
      }

      setIsLoadingLoans(true);
      try {
        const loans = await loanService.getCustomerLoans(selectedCustomer.id);
        setCustomerLoans(loans);
      } catch (err) {
        console.error('Error fetching customer loans:', err);
        setCustomerLoans([]);
      } finally {
        setIsLoadingLoans(false);
      }
    };

    fetchCustomerLoans();
  }, [selectedCustomer]);

  // Refresh loans after creating a new one
  const refreshCustomerLoans = async () => {
    if (!selectedCustomer) return;

    try {
      const loans = await loanService.getCustomerLoans(selectedCustomer.id);
      setCustomerLoans(loans);
    } catch (err) {
      console.error('Error refreshing customer loans:', err);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setStep('loan-type');
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setSelectedLoanType(null);
    setCustomerLoans([]);
    setStep('customer');
  };

  const handleLoanTypeSelect = (type: LoanType) => {
    setSelectedLoanType(type);
    setStep('form');
  };

  const handleCancelForm = () => {
    setSelectedLoanType(null);
    setStep('loan-type');
  };

  const handlePersonalLoanSubmit = async (loan: PersonalLoanRequest) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await loanService.createPersonalLoan(loan);
      setCreatedLoan(result);
      setStep('confirmation');
      // Refresh customer loans to include the new one
      await refreshCustomerLoans();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al crear el prestamo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoLoanSubmit = async (loan: AutoLoanRequest) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await loanService.createAutoLoan(loan);
      setCreatedLoan(result);
      setStep('confirmation');
      // Refresh customer loans to include the new one
      await refreshCustomerLoans();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al crear el prestamo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewSchedule = (loanId: string) => {
    setScheduleLoanId(loanId);
    setViewMode('schedule');
  };

  const handleNewLoan = () => {
    setCreatedLoan(null);
    setSelectedLoanType(null);
    setStep('loan-type');
  };

  const resetAll = () => {
    setSelectedCustomer(null);
    setSelectedLoanType(null);
    setCreatedLoan(null);
    setCustomerLoans([]);
    setStep('customer');
    setViewMode('search');
    setError(null);
  };

  const getStepNumber = () => {
    switch (step) {
      case 'customer':
        return 1;
      case 'loan-type':
        return 2;
      case 'form':
        return 3;
      case 'confirmation':
        return 4;
      default:
        return 1;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  Sucursal Bancaria
                </h1>
                <p className="text-sm text-gray-500">
                  Sistema de Solicitudes de Credito
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Navigation Tabs */}
              <nav className="flex gap-2">
                <button
                  onClick={() => {
                    setViewMode('search');
                    if (!selectedCustomer) setStep('customer');
                  }}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    viewMode === 'search' || viewMode === 'loan-form'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  Solicitar Credito
                </button>
                <button
                  onClick={() => setViewMode('schedule')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    viewMode === 'schedule'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Consultar Pagos
                </button>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {viewMode === 'schedule' ? (
          <PaymentScheduleViewer loanId={scheduleLoanId} />
        ) : (
          <>
            {/* Progress Steps */}
            {step !== 'confirmation' && (
              <div className="mb-6">
                <div className="flex items-center justify-center gap-2">
                  {/* Step 1 */}
                  <div
                    className={`flex items-center gap-2 ${
                      getStepNumber() >= 1 ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        getStepNumber() >= 1
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      1
                    </div>
                    <span className="hidden sm:inline text-sm font-medium">
                      Cliente
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />

                  {/* Step 2 */}
                  <div
                    className={`flex items-center gap-2 ${
                      getStepNumber() >= 2 ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        getStepNumber() >= 2
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      2
                    </div>
                    <span className="hidden sm:inline text-sm font-medium">
                      Tipo de Prestamo
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />

                  {/* Step 3 */}
                  <div
                    className={`flex items-center gap-2 ${
                      getStepNumber() >= 3 ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        getStepNumber() >= 3
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      3
                    </div>
                    <span className="hidden sm:inline text-sm font-medium">
                      Solicitud
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {/* Loading Overlay */}
            {isSubmitting && (
              <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 flex items-center gap-4">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="font-medium">Procesando solicitud...</span>
                </div>
              </div>
            )}

            {/* Step Content */}
            <div className="space-y-6">
              {/* Customer Section - Always show when customer is selected */}
              {selectedCustomer && step !== 'customer' && (
                <CustomerInfo
                  customer={selectedCustomer}
                  onClear={handleClearCustomer}
                  loans={customerLoans}
                  isLoadingLoans={isLoadingLoans}
                  onViewSchedule={handleViewSchedule}
                />
              )}

              {/* Step: Customer Search */}
              {step === 'customer' && (
                <CustomerSearch onCustomerSelect={handleCustomerSelect} />
              )}

              {/* Step: Loan Type Selection */}
              {step === 'loan-type' && (
                <LoanTypeSelector
                  selectedType={selectedLoanType}
                  onSelect={handleLoanTypeSelect}
                />
              )}

              {/* Step: Loan Form */}
              {step === 'form' && selectedCustomer && (
                <>
                  {selectedLoanType === 'PERSONAL' && (
                    <PersonalLoanForm
                      customerId={selectedCustomer.id}
                      onSubmit={handlePersonalLoanSubmit}
                      onCancel={handleCancelForm}
                    />
                  )}
                  {selectedLoanType === 'AUTO' && (
                    <AutoLoanForm
                      customerId={selectedCustomer.id}
                      onSubmit={handleAutoLoanSubmit}
                      onCancel={handleCancelForm}
                    />
                  )}
                </>
              )}

              {/* Step: Confirmation */}
              {step === 'confirmation' && createdLoan && selectedCustomer && (
                <LoanConfirmation
                  loan={createdLoan}
                  customer={selectedCustomer}
                  onClose={resetAll}
                  onViewSchedule={handleViewSchedule}
                  onNewLoan={handleNewLoan}
                />
              )}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-center text-sm text-gray-500">
            Sistema de Creditos - Powered by Temenos Transact API
          </p>
        </div>
      </footer>
    </div>
  );
};

export default BranchLoanPage;
