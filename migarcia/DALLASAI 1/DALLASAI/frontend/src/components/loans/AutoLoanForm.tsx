import React, { useState, useEffect } from 'react';
import { Car, AlertCircle, CheckCircle } from 'lucide-react';
import type {
  AutoLoanRequest,
  VehicleType,
  LoanSimulationResponse,
  ValidationResult,
} from '../../types/loans';
import { VEHICLE_TYPE_LABELS, AUTO_LOAN_TERMS } from '../../types/loans';
import { loanService } from '../../services/loanService';
import LoanSimulator from './LoanSimulator';

interface AutoLoanFormProps {
  customerId: string;
  onSubmit: (loan: AutoLoanRequest) => void;
  onCancel: () => void;
}

const AutoLoanForm: React.FC<AutoLoanFormProps> = ({
  customerId,
  onSubmit,
  onCancel,
}) => {
  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState<AutoLoanRequest>({
    customer_id: customerId,
    vehicle_price: 300000,
    down_payment: 30000,
    term_months: 48,
    vehicle_info: {
      brand: '',
      model: '',
      year: currentYear,
      vehicle_type: 'NEW',
    },
    monthly_income: 0,
  });

  const [simulation, setSimulation] = useState<LoanSimulationResponse | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const financedAmount = formData.vehicle_price - formData.down_payment;
  const minDownPayment = formData.vehicle_price * 0.1;

  // Simulate loan when amount or term changes
  useEffect(() => {
    const simulateLoan = async () => {
      if (financedAmount <= 0) return;

      setIsSimulating(true);
      try {
        const result = await loanService.simulateLoan({
          loan_type: 'AUTO',
          amount: financedAmount,
          term_months: formData.term_months,
          vehicle_type: formData.vehicle_info.vehicle_type,
        });
        setSimulation(result);
      } catch (error) {
        console.error('Simulation error:', error);
      } finally {
        setIsSimulating(false);
      }
    };

    const debounce = setTimeout(simulateLoan, 500);
    return () => clearTimeout(debounce);
  }, [financedAmount, formData.term_months, formData.vehicle_info.vehicle_type]);

  // Validate loan when income changes
  useEffect(() => {
    const validateLoan = async () => {
      if (formData.monthly_income <= 0 || financedAmount <= 0) {
        setValidation(null);
        return;
      }

      setIsValidating(true);
      try {
        const result = await loanService.validateAutoLoan(formData);
        setValidation(result);
      } catch (error) {
        console.error('Validation error:', error);
      } finally {
        setIsValidating(false);
      }
    };

    const debounce = setTimeout(validateLoan, 500);
    return () => clearTimeout(debounce);
  }, [formData, financedAmount]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name.startsWith('vehicle_')) {
      const vehicleField = name.replace('vehicle_', '');
      setFormData((prev) => ({
        ...prev,
        vehicle_info: {
          ...prev.vehicle_info,
          [vehicleField]: vehicleField === 'year' ? Number(value) : value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]:
          name === 'vehicle_price' ||
          name === 'down_payment' ||
          name === 'term_months' ||
          name === 'monthly_income'
            ? Number(value)
            : value,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validation?.eligible) {
      onSubmit(formData);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
        <Car className="w-6 h-6 text-green-600" />
        Solicitud de Prestamo Automotriz
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          {/* Vehicle Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-700 border-b pb-2">
              Informacion del Vehiculo
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Vehicle Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Vehiculo
                </label>
                <select
                  name="vehicle_vehicle_type"
                  value={formData.vehicle_info.vehicle_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  {Object.entries(VEHICLE_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Anio
                </label>
                <select
                  name="vehicle_year"
                  value={formData.vehicle_info.year}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  {Array.from({ length: 10 }, (_, i) => currentYear - i).map(
                    (year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Brand */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marca
                </label>
                <input
                  type="text"
                  name="vehicle_brand"
                  value={formData.vehicle_info.brand}
                  onChange={handleChange}
                  placeholder="Ej: Toyota, Honda, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Modelo
                </label>
                <input
                  type="text"
                  name="vehicle_model"
                  value={formData.vehicle_info.model}
                  onChange={handleChange}
                  placeholder="Ej: Corolla, Civic, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            {/* VIN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numero de Serie (VIN) - Opcional
              </label>
              <input
                type="text"
                name="vehicle_vin"
                value={formData.vehicle_info.vin || ''}
                onChange={handleChange}
                placeholder="17 caracteres"
                maxLength={17}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          {/* Financial Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-700 border-b pb-2">
              Datos Financieros
            </h3>

            {/* Vehicle Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio del Vehiculo
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  name="vehicle_price"
                  value={formData.vehicle_price}
                  onChange={handleChange}
                  min={50000}
                  step={10000}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            {/* Down Payment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enganche
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  name="down_payment"
                  value={formData.down_payment}
                  onChange={handleChange}
                  min={minDownPayment}
                  step={5000}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Minimo 10%: {formatCurrency(minDownPayment)}
              </p>
              <input
                type="range"
                name="down_payment"
                value={formData.down_payment}
                onChange={handleChange}
                min={minDownPayment}
                max={formData.vehicle_price * 0.5}
                step={5000}
                className="w-full mt-2"
              />
            </div>

            {/* Financed Amount Display */}
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Monto a Financiar:</span>
                <span className="text-lg font-bold text-green-700">
                  {formatCurrency(financedAmount)}
                </span>
              </div>
            </div>

            {/* Term */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plazo (meses)
              </label>
              <select
                name="term_months"
                value={formData.term_months}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {AUTO_LOAN_TERMS.map((term) => (
                  <option key={term} value={term}>
                    {term} meses ({Math.floor(term / 12)} anio
                    {term >= 24 ? 's' : ''})
                  </option>
                ))}
              </select>
            </div>

            {/* Monthly Income */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ingreso Mensual
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  name="monthly_income"
                  value={formData.monthly_income || ''}
                  onChange={handleChange}
                  min={0}
                  placeholder="Ingrese su ingreso mensual"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          </div>

          {/* Validation Messages */}
          {validation && (
            <div className="space-y-2">
              {validation.errors.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700 font-medium mb-1">
                    <AlertCircle className="w-4 h-4" />
                    Errores de Validacion
                  </div>
                  <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                    {validation.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              {validation.warnings.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-700 font-medium mb-1">
                    <AlertCircle className="w-4 h-4" />
                    Advertencias
                  </div>
                  <ul className="list-disc list-inside text-sm text-yellow-600 space-y-1">
                    {validation.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              {validation.eligible && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">Cliente elegible para este prestamo</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!validation?.eligible}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuar con Solicitud
            </button>
          </div>
        </form>

        {/* Simulator */}
        <div className="lg:col-span-1">
          <LoanSimulator simulation={simulation} isLoading={isSimulating} />
        </div>
      </div>
    </div>
  );
};

export default AutoLoanForm;
