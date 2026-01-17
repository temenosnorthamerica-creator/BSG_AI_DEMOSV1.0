import React, { useState } from 'react';
import { Search, User, Phone, CreditCard, Loader2 } from 'lucide-react';
import type { Customer, CustomerSearchQuery } from '../../types/loans';
import { loanService } from '../../services/loanService';

interface CustomerSearchProps {
  onCustomerSelect: (customer: Customer) => void;
}

type SearchType = 'document' | 'name' | 'phone';

const CustomerSearch: React.FC<CustomerSearchProps> = ({ onCustomerSelect }) => {
  const [searchType, setSearchType] = useState<SearchType>('document');
  const [searchValue, setSearchValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Customer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      setError('Ingrese un valor para buscar');
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    const query: CustomerSearchQuery = {};
    switch (searchType) {
      case 'document':
        query.document_number = searchValue;
        break;
      case 'name':
        query.name = searchValue;
        break;
      case 'phone':
        query.phone = searchValue;
        break;
    }

    try {
      const customers = await loanService.searchCustomers(query);
      setResults(customers);
      if (customers.length === 0) {
        setError('No se encontraron clientes con los criterios de busqueda');
      }
    } catch (err) {
      setError('Error al buscar clientes. Intente nuevamente.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Search className="w-5 h-5 text-blue-600" />
        Busqueda de Cliente
      </h2>

      {/* Search Type Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => setSearchType('document')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            searchType === 'document'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <CreditCard className="w-4 h-4 inline-block mr-1" />
          Por Identificacion
        </button>
        <button
          onClick={() => setSearchType('name')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            searchType === 'name'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <User className="w-4 h-4 inline-block mr-1" />
          Por Nombre
        </button>
        <button
          onClick={() => setSearchType('phone')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            searchType === 'phone'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Phone className="w-4 h-4 inline-block mr-1" />
          Por Telefono
        </button>
      </div>

      {/* Search Input */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={
            searchType === 'document'
              ? 'Ingrese numero de INE o pasaporte'
              : searchType === 'name'
              ? 'Ingrese nombre del cliente'
              : 'Ingrese numero de telefono'
          }
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          Buscar
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-600">Resultados:</h3>
          {results.map((customer) => (
            <div
              key={customer.id}
              onClick={() => onCustomerSelect(customer)}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-800">{customer.full_name}</p>
                  <p className="text-sm text-gray-500">
                    {customer.document_type}: {customer.document_number}
                  </p>
                  <p className="text-sm text-gray-500">{customer.email}</p>
                </div>
                {customer.credit_score && (
                  <div className="text-right">
                    <span className="text-xs text-gray-500">Score</span>
                    <p
                      className={`font-bold ${
                        customer.credit_score >= 700
                          ? 'text-green-600'
                          : customer.credit_score >= 600
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {customer.credit_score}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {hasSearched && results.length === 0 && !error && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No se encontraron clientes</p>
        </div>
      )}
    </div>
  );
};

export default CustomerSearch;
