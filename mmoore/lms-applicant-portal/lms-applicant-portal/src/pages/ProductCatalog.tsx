import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header, Footer } from '../components/layout';
import { Card, Button } from '../components/common';
import { formatCurrency } from '../utils';

// Mock products for demonstration
const mockProducts = [
  {
    ProductId: '1',
    ProductName: 'Personal Loan',
    ProductType: 'Loan',
    Description: 'Flexible personal loans for any purpose with competitive rates.',
    MinAmount: 1000,
    MaxAmount: 50000,
    BaseRate: 7.99,
  },
  {
    ProductId: '2',
    ProductName: 'Auto Loan',
    ProductType: 'Loan',
    Description: 'Finance your new or used vehicle with low rates and flexible terms.',
    MinAmount: 5000,
    MaxAmount: 100000,
    BaseRate: 5.49,
  },
  {
    ProductId: '3',
    ProductName: 'Prestige VISA',
    ProductType: 'CreditCard',
    Description: 'Premium rewards credit card with exclusive benefits and cash back.',
    MinAmount: 500,
    MaxAmount: 25000,
    BaseRate: 14.99,
  },
  {
    ProductId: '4',
    ProductName: 'Home Equity Line of Credit',
    ProductType: 'Loan',
    Description: 'Access the equity in your home for major expenses or renovations.',
    MinAmount: 10000,
    MaxAmount: 500000,
    BaseRate: 6.75,
  },
  {
    ProductId: '5',
    ProductName: 'Secured Credit Card',
    ProductType: 'CreditCard',
    Description: 'Build or rebuild your credit with a secured credit card.',
    MinAmount: 200,
    MaxAmount: 5000,
    BaseRate: 18.99,
  },
];

function ProductIcon({ productType }: { productType: string }) {
  const iconClass = 'w-12 h-12 text-primary';

  if (productType === 'CreditCard') {
    return (
      <svg
        className={iconClass}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth="1.5" />
        <path d="M2 10h20" strokeWidth="1.5" />
        <path d="M6 14h4" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg
      className={iconClass}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
        strokeWidth="1.5"
      />
      <path d="M12 6v2m0 4v2" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
      <path d="M12 6a1 1 0 011 1v4a1 1 0 01-2 0V7a1 1 0 011-1z" fill="currentColor" />
      <circle cx="12" cy="15" r="1" fill="currentColor" />
    </svg>
  );
}

export function ProductCatalog() {
  const [filter, setFilter] = useState<'all' | 'Loan' | 'CreditCard'>('all');

  const filteredProducts =
    filter === 'all'
      ? mockProducts
      : mockProducts.filter((p) => p.ProductType === filter);

  const handleApply = (productId: string) => {
    // In real implementation, navigate to application flow
    console.log('Apply for product:', productId);
    alert(`Starting application for product ${productId}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />

      <main className="flex-grow">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Back to Dashboard Link */}
          <Link
            to="/dashboard"
            className="inline-flex items-center text-primary hover:text-primary-dark font-medium mb-6 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-gray-800 mb-2">
              Our Products
            </h1>
            <p className="text-gray-600">
              Explore our range of financial products designed to meet your needs
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex justify-center gap-2 mb-8">
            {(['all', 'Loan', 'CreditCard'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-colors
                  ${
                    filter === type
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                {type === 'all' ? 'All Products' : type === 'CreditCard' ? 'Credit Cards' : 'Loans'}
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <Card key={product.ProductId} className="flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <ProductIcon productType={product.ProductType} />
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      {product.ProductName}
                    </h2>
                    <p className="text-sm text-gray-500">{product.ProductType}</p>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 flex-grow">
                  {product.Description}
                </p>

                <div className="border-t pt-4 mt-auto">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">Amount Range</span>
                    <span className="font-medium">
                      {formatCurrency(product.MinAmount)} - {formatCurrency(product.MaxAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mb-4">
                    <span className="text-gray-500">Starting Rate</span>
                    <span className="font-medium">{product.BaseRate}% APR</span>
                  </div>

                  <Button
                    variant="orange"
                    className="w-full"
                    onClick={() => handleApply(product.ProductId)}
                  >
                    Apply Now
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
