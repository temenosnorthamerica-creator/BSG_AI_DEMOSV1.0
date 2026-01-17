import React from 'react';
import { CheckCircle, FileText, Calendar, X, Printer } from 'lucide-react';
import type { LoanResponse, Customer } from '../../types/loans';
import { LOAN_STATUS_LABELS } from '../../types/loans';

interface LoanConfirmationProps {
  loan: LoanResponse;
  customer: Customer;
  onClose: () => void;
  onViewSchedule: (loanId: string) => void;
  onNewLoan: () => void;
}

const LoanConfirmation: React.FC<LoanConfirmationProps> = ({
  loan,
  customer,
  onClose,
  onViewSchedule,
  onNewLoan,
}) => {
  const toNumber = (value: number | string | undefined): number => {
    if (value === undefined) return 0;
    return typeof value === 'string' ? parseFloat(value) : value;
  };

  const formatCurrency = (value: number | string | undefined) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(toNumber(value));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-green-600 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Solicitud Creada</h2>
                <p className="text-green-100">El prestamo ha sido procesado exitosamente</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Loan ID */}
          <div className="text-center bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">Numero de Prestamo</p>
            <p className="text-2xl font-bold text-gray-800 font-mono">{loan.loan_id}</p>
            <p className="text-xs text-gray-400 mt-1">
              Arrangement ID: {loan.arrangement_id}
            </p>
          </div>

          {/* Customer Info */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Cliente</h3>
            <p className="font-semibold text-gray-800">{customer.full_name}</p>
            <p className="text-sm text-gray-500">{customer.document_number}</p>
          </div>

          {/* Loan Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Tipo de Prestamo</p>
              <p className="font-semibold">
                {loan.loan_type === 'PERSONAL' ? 'Personal' : 'Automotriz'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Estado</p>
              <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                {LOAN_STATUS_LABELS[loan.status]}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Monto</p>
              <p className="font-semibold text-lg">{formatCurrency(loan.amount)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Plazo</p>
              <p className="font-semibold">{loan.term_months} meses</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tasa Anual</p>
              <p className="font-semibold">{toNumber(loan.interest_rate).toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Mensualidad</p>
              <p className="font-semibold text-blue-600">
                {formatCurrency(loan.monthly_payment)}
              </p>
            </div>
          </div>

          {/* Total */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total a Pagar:</span>
              <span className="text-xl font-bold text-blue-700">
                {formatCurrency(loan.total_payment)}
              </span>
            </div>
          </div>

          {/* Timestamp */}
          <div className="text-center text-sm text-gray-400">
            Creado: {formatDate(loan.created_at)}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t p-4 bg-gray-50 rounded-b-lg">
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
            <button
              onClick={() => onViewSchedule(loan.loan_id)}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50"
            >
              <Calendar className="w-4 h-4" />
              Ver Pagos
            </button>
            <button
              onClick={onNewLoan}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FileText className="w-4 h-4" />
              Nuevo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanConfirmation;
