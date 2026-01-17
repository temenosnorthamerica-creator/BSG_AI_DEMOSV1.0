import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Download,
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import type { PaymentSchedule, Payment, PaymentStatus } from '../../types/loans';
import { PAYMENT_STATUS_LABELS } from '../../types/loans';
import { loanService } from '../../services/loanService';

interface PaymentScheduleViewerProps {
  loanId?: string;
  schedule?: PaymentSchedule;
}

const PaymentScheduleViewer: React.FC<PaymentScheduleViewerProps> = ({
  loanId: initialLoanId,
  schedule: initialSchedule,
}) => {
  const [loanId, setLoanId] = useState(initialLoanId || '');
  const [schedule, setSchedule] = useState<PaymentSchedule | null>(initialSchedule || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'ALL'>('ALL');

  const itemsPerPage = 12;

  useEffect(() => {
    if (initialSchedule) {
      setSchedule(initialSchedule);
    }
  }, [initialSchedule]);

  const handleSearch = async () => {
    if (!loanId.trim()) {
      setError('Ingrese un numero de prestamo');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await loanService.getPaymentSchedule(loanId);
      setSchedule(result);
      setCurrentPage(1);
    } catch (err) {
      setError('No se encontro el calendario de pagos');
      setSchedule(null);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPayments = schedule?.payments.filter(
    (payment) => statusFilter === 'ALL' || payment.status === statusFilter
  ) || [];

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'OVERDUE':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-blue-100 text-blue-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-blue-600" />
        Calendario de Pagos
      </h2>

      {/* Search */}
      {!initialSchedule && (
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={loanId}
            onChange={(e) => setLoanId(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Numero de prestamo (ej: PL12345678)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Buscar
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-4">
          {error}
        </div>
      )}

      {/* Schedule Content */}
      {schedule && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-500">Total Pagos</p>
              <p className="text-xl font-bold text-gray-800">
                {schedule.summary.total_payments}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-sm text-gray-500">Pagados</p>
              <p className="text-xl font-bold text-green-600">
                {schedule.summary.payments_made}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-gray-500">Pendientes</p>
              <p className="text-xl font-bold text-blue-600">
                {schedule.summary.payments_pending}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-sm text-gray-500">Vencidos</p>
              <p className="text-xl font-bold text-red-600">
                {schedule.summary.payments_overdue}
              </p>
            </div>
          </div>

          {/* Next Payment Highlight */}
          {schedule.summary.next_payment_date && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-blue-600">Proximo Pago</p>
                  <p className="text-lg font-semibold text-blue-800">
                    {formatDate(schedule.summary.next_payment_date)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-600">Monto</p>
                  <p className="text-xl font-bold text-blue-800">
                    {schedule.summary.next_payment_amount &&
                      formatCurrency(schedule.summary.next_payment_amount)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Filters and Export */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as PaymentStatus | 'ALL');
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Todos los estados</option>
                <option value="PAID">Pagados</option>
                <option value="PENDING">Pendientes</option>
                <option value="OVERDUE">Vencidos</option>
              </select>
            </div>
            <button
              onClick={() => {
                // Export to CSV functionality
                const csv = [
                  ['#', 'Fecha', 'Capital', 'Interes', 'IVA', 'Total', 'Saldo', 'Estado'],
                  ...schedule.payments.map((p) => [
                    p.payment_number,
                    p.due_date,
                    p.principal,
                    p.interest,
                    p.tax,
                    p.total_payment,
                    p.remaining_balance,
                    p.status,
                  ]),
                ]
                  .map((row) => row.join(','))
                  .join('\n');

                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `calendario_pagos_${schedule.loan_id}.csv`;
                a.click();
              }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>

          {/* Payments Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-2 text-left font-medium text-gray-600">#</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">
                    Fecha Vencimiento
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">Capital</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">Interes</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">IVA</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">
                    Pago Total
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">
                    Saldo Insoluto
                  </th>
                  <th className="px-3 py-2 text-center font-medium text-gray-600">Estado</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPayments.map((payment) => (
                  <tr
                    key={payment.payment_number}
                    className={`border-b hover:bg-gray-50 ${
                      payment.status === 'OVERDUE' ? 'bg-red-50' : ''
                    }`}
                  >
                    <td className="px-3 py-3 font-medium">{payment.payment_number}</td>
                    <td className="px-3 py-3">{formatDate(payment.due_date)}</td>
                    <td className="px-3 py-3 text-right">{formatCurrency(payment.principal)}</td>
                    <td className="px-3 py-3 text-right">{formatCurrency(payment.interest)}</td>
                    <td className="px-3 py-3 text-right">{formatCurrency(payment.tax)}</td>
                    <td className="px-3 py-3 text-right font-medium">
                      {formatCurrency(payment.total_payment)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {formatCurrency(payment.remaining_balance)}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          payment.status
                        )}`}
                      >
                        {getStatusIcon(payment.status)}
                        {PAYMENT_STATUS_LABELS[payment.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} -{' '}
                {Math.min(currentPage * itemsPerPage, filteredPayments.length)} de{' '}
                {filteredPayments.length} pagos
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-4 py-2 text-sm">
                  Pagina {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Capital</p>
                <p className="font-semibold">
                  {formatCurrency(schedule.summary.total_principal)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Intereses</p>
                <p className="font-semibold">
                  {formatCurrency(schedule.summary.total_interest)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total IVA</p>
                <p className="font-semibold">{formatCurrency(schedule.summary.total_tax)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total a Pagar</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatCurrency(schedule.summary.total_amount)}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {!schedule && !isLoading && !error && (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="w-16 h-16 mx-auto mb-3 opacity-50" />
          <p>Ingrese un numero de prestamo para ver el calendario de pagos</p>
        </div>
      )}
    </div>
  );
};

export default PaymentScheduleViewer;
