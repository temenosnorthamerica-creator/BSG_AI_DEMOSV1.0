import React from 'react';
import { Wallet, Car } from 'lucide-react';
import type { LoanType } from '../../types/loans';

interface LoanTypeSelectorProps {
  selectedType: LoanType | null;
  onSelect: (type: LoanType) => void;
}

const LoanTypeSelector: React.FC<LoanTypeSelectorProps> = ({ selectedType, onSelect }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Seleccione el Tipo de Prestamo</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Personal Loan Card */}
        <button
          onClick={() => onSelect('PERSONAL')}
          className={`p-6 rounded-lg border-2 transition-all duration-200 text-left ${
            selectedType === 'PERSONAL'
              ? 'border-blue-600 bg-blue-50 shadow-md'
              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-4 mb-3">
            <div
              className={`p-3 rounded-full ${
                selectedType === 'PERSONAL' ? 'bg-blue-600' : 'bg-blue-100'
              }`}
            >
              <Wallet
                className={`w-8 h-8 ${
                  selectedType === 'PERSONAL' ? 'text-white' : 'text-blue-600'
                }`}
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Prestamo Personal</h3>
              <p className="text-sm text-gray-500">Credito para uso libre</p>
            </div>
          </div>
          <ul className="text-sm text-gray-600 space-y-1 ml-16">
            <li>Monto: $5,000 - $500,000 MXN</li>
            <li>Plazo: 6 a 60 meses</li>
            <li>Sin garantia requerida</li>
            <li>Tasa desde 12.50% anual</li>
          </ul>
        </button>

        {/* Auto Loan Card */}
        <button
          onClick={() => onSelect('AUTO')}
          className={`p-6 rounded-lg border-2 transition-all duration-200 text-left ${
            selectedType === 'AUTO'
              ? 'border-green-600 bg-green-50 shadow-md'
              : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-4 mb-3">
            <div
              className={`p-3 rounded-full ${
                selectedType === 'AUTO' ? 'bg-green-600' : 'bg-green-100'
              }`}
            >
              <Car
                className={`w-8 h-8 ${
                  selectedType === 'AUTO' ? 'text-white' : 'text-green-600'
                }`}
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Prestamo Automotriz</h3>
              <p className="text-sm text-gray-500">Financiamiento de vehiculos</p>
            </div>
          </div>
          <ul className="text-sm text-gray-600 space-y-1 ml-16">
            <li>Financiamiento hasta 90%</li>
            <li>Plazo: 12 a 72 meses</li>
            <li>Vehiculos nuevos y seminuevos</li>
            <li>Tasa desde 8.50% anual</li>
          </ul>
        </button>
      </div>
    </div>
  );
};

export default LoanTypeSelector;
