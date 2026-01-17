import React, { useState, useEffect } from 'react';
import { Wallet, AlertCircle, CheckCircle } from 'lucide-react';
import type {
  PersonalLoanRequest,
  LoanPurpose,
  EmploymentType,
  LoanSimulationResponse,
  ValidationResult,
} from '../../types/loans';
import {
  LOAN_PURPOSE_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  PERSONAL_LOAN_TERMS,
} from '../../types/loans';
import { loanService } from '../../services/loanService';
import LoanSimulator from './LoanSimulator';

interface PersonalLoanFormProps {
  customerId: string;
  onSubmit: (loan: PersonalLoanRequest) => void;
  onCancel: () => void;
}

const PersonalLoanForm: React.FC<PersonalLoanFormProps> = ({
  customerId,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<PersonalLoanRequest>({
    customer_id: customerId,
    amount: 50000,
    term_months: 24,
    purpose: 'OTHER',
    monthly_income: 0,
    employment_type: 'SALARIED',
    employment_months: 0,
  });

  const [simulation, setSimulation] = useState<LoanSimulationResponse | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Simulate loan when amount or term changes
  useEffect(() => {
    const simulateLoan = async () => {
      if (formData.amount < 5000) return;

      setIsSimulating(true);
      try {
        const result = await loanService.simulateLoan({
          loan_type: 'PERSONAL',
          amount: formData.amount,
          term_months: formData.term_months,
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
  }, [formData.amount, formData.term_months]);

  // Validate loan when income changes
  useEffect(() => {
    const validateLoan = async () => {
      if (formData.monthly_income <= 0) {
        setValidation(null);
        return;
      }

      setIsValidating(true);
      try {
        const result = await loanService.validatePersonalLoan(formData);
        setValidation(result);
      } catch (error) {
        console.error('Validation error:', error);
      } finally {
        setIsValidating(false);
      }
    };

    const debounce = setTimeout(validateLoan, 500);
    return () => clearTimeout(debounce);
  }, [formData.monthly_income, formData.amount, formData.term_months]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'amount' ||
        name === 'term_months' ||
        name === 'monthly_income' ||
        name === 'employment_months'
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validation?.eligible) {
      onSubmit(formData);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX').format(value);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
        <Wallet className="w-6 h-6 text-blue-600" />
        Solicitud de Prestamo Personal
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          {/* Loan Details Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-700 border-b pb-2">
              Datos del Prestamo
            </h3>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto Solicitado
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  min={5000}
                  max={500000}
                  step={1000}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Min: $5,000 - Max: $500,000 MXN
              </p>
              <input
                type="range"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                min={5000}
                max={500000}
                step={5000}
                className="w-full mt-2"
              />
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {PERSONAL_LOAN_TERMS.map((term) => (
                  <option key={term} value={term}>
                    {term} meses ({Math.floor(term / 12)} anio
                    {term >= 24 ? 's' : ''} {term % 12 > 0 ? `${term % 12} meses` : ''})
                  </option>
                ))}
              </select>
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destino del Credito
              </label>
              <select
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.entries(LOAN_PURPOSE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Employment Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-700 border-b pb-2">
              Informacion Laboral
            </h3>

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
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Employment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Empleo
              </label>
              <select
                name="employment_type"
                value={formData.employment_type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Employment Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Antiguedad Laboral (meses)
              </label>
              <input
                type="number"
                name="employment_months"
                value={formData.employment_months || ''}
                onChange={handleChange}
                min={0}
                placeholder="Meses en empleo actual"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
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
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default PersonalLoanForm;
