import React from 'react';
import { Calculator, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import type { LoanSimulationResponse } from '../../types/loans';

interface LoanSimulatorProps {
  simulation: LoanSimulationResponse | null;
  isLoading: boolean;
}

const LoanSimulator: React.FC<LoanSimulatorProps> = ({ simulation, isLoading }) => {
  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(numValue);
  };

  const toNumber = (value: number | string): number => {
    return typeof value === 'string' ? parseFloat(value) : value;
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-blue-200 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          <div className="h-12 bg-blue-200 rounded"></div>
          <div className="h-8 bg-blue-200 rounded"></div>
          <div className="h-8 bg-blue-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!simulation) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Simulador de Prestamo
        </h3>
        <div className="text-center py-8 text-gray-500">
          <Calculator className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Complete los datos del prestamo para ver la simulacion</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
        <Calculator className="w-5 h-5" />
        Simulacion del Prestamo
      </h3>

      {/* Monthly Payment - Highlighted */}
      <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
        <p className="text-sm text-gray-500 mb-1">Mensualidad Estimada</p>
        <p className="text-3xl font-bold text-blue-600">
          {formatCurrency(simulation.monthly_payment)}
        </p>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/70 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <DollarSign className="w-4 h-4" />
            Monto
          </div>
          <p className="font-semibold text-gray-800">{formatCurrency(simulation.amount)}</p>
        </div>

        <div className="bg-white/70 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Calendar className="w-4 h-4" />
            Plazo
          </div>
          <p className="font-semibold text-gray-800">{simulation.term_months} meses</p>
        </div>

        <div className="bg-white/70 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <TrendingUp className="w-4 h-4" />
            Tasa Anual
          </div>
          <p className="font-semibold text-gray-800">{toNumber(simulation.interest_rate).toFixed(2)}%</p>
        </div>

        <div className="bg-white/70 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <DollarSign className="w-4 h-4" />
            Total a Pagar
          </div>
          <p className="font-semibold text-gray-800">{formatCurrency(simulation.total_payment)}</p>
        </div>
      </div>

      {/* Total Interest */}
      <div className="mt-3 bg-yellow-50 rounded-lg p-3 border border-yellow-200">
        <div className="flex justify-between items-center">
          <span className="text-sm text-yellow-700">Intereses Totales:</span>
          <span className="font-semibold text-yellow-800">
            {formatCurrency(simulation.total_interest)}
          </span>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-3 text-center">
        * Los valores son estimados y pueden variar segun la evaluacion crediticia
      </p>
    </div>
  );
};

export default LoanSimulator;
