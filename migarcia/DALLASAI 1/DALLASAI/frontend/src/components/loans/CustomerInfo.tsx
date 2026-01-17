import React from 'react';
import { User, Mail, Phone, MapPin, CreditCard, Package, X, FileText, Calendar, Loader2 } from 'lucide-react';
import type { Customer, LoanSummary } from '../../types/loans';
import { DOCUMENT_TYPE_LABELS, LOAN_STATUS_LABELS } from '../../types/loans';

interface CustomerInfoProps {
  customer: Customer;
  onClear: () => void;
  loans?: LoanSummary[];
  isLoadingLoans?: boolean;
  onViewSchedule?: (loanId: string) => void;
}

const CustomerInfo: React.FC<CustomerInfoProps> = ({
  customer,
  onClear,
  loans = [],
  isLoadingLoans = false,
  onViewSchedule
}) => {
  const toNumber = (value: number | string | undefined): number => {
    if (value === undefined) return 0;
    return typeof value === 'string' ? parseFloat(value) : value;
  };

  const formatCurrency = (value: number | string | undefined): string => {
    const numValue = toNumber(value);
    return numValue.toLocaleString('es-MX');
  };

  const getCreditScoreColor = (score: number) => {
    if (score >= 750) return 'text-green-600 bg-green-100';
    if (score >= 700) return 'text-green-500 bg-green-50';
    if (score >= 650) return 'text-yellow-600 bg-yellow-100';
    if (score >= 600) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getCreditScoreLabel = (score: number) => {
    if (score >= 750) return 'Excelente';
    if (score >= 700) return 'Muy Bueno';
    if (score >= 650) return 'Bueno';
    if (score >= 600) return 'Regular';
    return 'Bajo';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          Informacion del Cliente
        </h2>
        <button
          onClick={onClear}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
          title="Cambiar cliente"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Info */}
        <div className="space-y-3">
          <div>
            <p className="text-2xl font-bold text-gray-800">{customer.full_name}</p>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <CreditCard className="w-4 h-4" />
              {DOCUMENT_TYPE_LABELS[customer.document_type]}: {customer.document_number}
            </p>
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <Mail className="w-4 h-4" />
            <span>{customer.email}</span>
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <Phone className="w-4 h-4" />
            <span>{customer.phone}</span>
          </div>

          <div className="flex items-start gap-2 text-gray-600">
            <MapPin className="w-4 h-4 mt-1" />
            <span>
              {customer.address.street} {customer.address.exterior_number}
              {customer.address.interior_number && `, Int. ${customer.address.interior_number}`}
              <br />
              {customer.address.neighborhood}, {customer.address.city}
              <br />
              {customer.address.state}, C.P. {customer.address.postal_code}
            </span>
          </div>
        </div>

        {/* Credit Score & Products */}
        <div className="space-y-4">
          {/* Credit Score */}
          {customer.credit_score && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Score Crediticio</p>
              <div className="flex items-center gap-3">
                <span
                  className={`text-3xl font-bold px-3 py-1 rounded-lg ${getCreditScoreColor(
                    customer.credit_score
                  )}`}
                >
                  {customer.credit_score}
                </span>
                <span className={`text-sm font-medium ${getCreditScoreColor(customer.credit_score).split(' ')[0]}`}>
                  {getCreditScoreLabel(customer.credit_score)}
                </span>
              </div>
            </div>
          )}

          {/* Active Products */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
              <Package className="w-4 h-4" />
              Productos Activos ({customer.active_products.length})
            </p>
            {customer.active_products.length > 0 ? (
              <div className="space-y-2">
                {customer.active_products.map((product) => (
                  <div
                    key={product.product_id}
                    className="flex justify-between items-center text-sm bg-white p-2 rounded border border-gray-200"
                  >
                    <div>
                      <p className="font-medium text-gray-700">{product.product_name}</p>
                      <p className="text-xs text-gray-500">{product.product_type}</p>
                    </div>
                    {product.balance !== undefined && (
                      <p className="font-medium text-gray-800">
                        ${formatCurrency(product.balance)} {product.currency}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Sin productos activos</p>
            )}
          </div>
        </div>
      </div>

      {/* Customer Loans Section */}
      <div className="mt-6 pt-6 border-t">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Solicitudes de Credito ({loans.length})
        </h3>

        {isLoadingLoans ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-500">Cargando solicitudes...</span>
          </div>
        ) : loans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loans.map((loan) => (
              <div
                key={loan.loan_id}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-mono text-sm font-medium text-gray-700">
                      {loan.loan_id}
                    </p>
                    <p className="text-xs text-gray-500">
                      {loan.loan_type === 'PERSONAL' ? 'Préstamo Personal' : 'Préstamo Automotriz'}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      loan.status === 'ACTIVE' || loan.status === 'DISBURSED'
                        ? 'bg-green-100 text-green-800'
                        : loan.status === 'PENDING' || loan.status === 'APPROVED'
                        ? 'bg-yellow-100 text-yellow-800'
                        : loan.status === 'REJECTED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {LOAN_STATUS_LABELS[loan.status]}
                  </span>
                </div>

                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Monto:</span>
                    <span className="font-medium">${formatCurrency(loan.amount)} {loan.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Saldo:</span>
                    <span className="font-medium">${formatCurrency(loan.remaining_balance)} {loan.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mensualidad:</span>
                    <span className="font-medium text-blue-600">${formatCurrency(loan.monthly_payment)}</span>
                  </div>
                  {loan.next_payment_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Próximo pago:</span>
                      <span className="font-medium">
                        {new Date(loan.next_payment_date).toLocaleDateString('es-MX')}
                      </span>
                    </div>
                  )}
                </div>

                {onViewSchedule && (
                  <button
                    onClick={() => onViewSchedule(loan.loan_id)}
                    className="mt-3 w-full flex items-center justify-center gap-1 px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    Ver Calendario de Pagos
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Este cliente no tiene solicitudes de crédito previas</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerInfo;
