import { useState } from 'react';
import { CreditCard, Delete, Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface PinEntryProps {
  onSubmit: (cardNumber: string, pin: string) => Promise<void>;
  error?: string;
  isLoading?: boolean;
}

export function PinEntry({ onSubmit, error, isLoading }: PinEntryProps) {
  const [pin, setPin] = useState('');
  const [cardNumber] = useState('4242424242424242'); // Demo card

  const handleKeyPress = (key: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + key);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  const handleSubmit = async () => {
    if (pin.length === 4) {
      await onSubmit(cardNumber, pin);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#283054] to-[#1e243f] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Card Display */}
        <div className="bg-gradient-to-r from-[#283054] to-[#0066CC] rounded-xl p-6 mb-8 text-white">
          <div className="flex items-center justify-between mb-8">
            <CreditCard className="w-10 h-10" />
            <span className="text-sm opacity-80">Debit Card</span>
          </div>
          <div className="text-xl tracking-widest mb-4">
            **** **** **** {cardNumber.slice(-4)}
          </div>
          <div className="text-sm opacity-80">JOHN DOE</div>
        </div>

        {/* PIN Entry */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-[#283054] mb-2">Enter Your PIN</h2>
          <p className="text-gray-500 text-sm">Enter your 4-digit PIN to continue</p>
        </div>

        {/* PIN Display */}
        <div className="flex justify-center space-x-4 mb-6">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={clsx(
                'w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all',
                pin.length > index
                  ? 'bg-[#283054] border-[#283054]'
                  : 'border-gray-300'
              )}
            >
              {pin.length > index && (
                <div className="w-3 h-3 bg-white rounded-full" />
              )}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((key) => (
            <button
              key={key}
              onClick={() => handleKeyPress(key)}
              disabled={isLoading || pin.length >= 4}
              className="keypad-btn"
            >
              {key}
            </button>
          ))}
          <button
            onClick={handleClear}
            disabled={isLoading}
            className="keypad-btn text-gray-500 text-sm"
          >
            Clear
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            disabled={isLoading || pin.length >= 4}
            className="keypad-btn"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading || pin.length === 0}
            className="keypad-btn text-gray-500"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={pin.length !== 4 || isLoading}
          className="w-full btn-primary py-4 text-lg font-semibold flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            <span>Continue</span>
          )}
        </button>

        {/* Demo Hint */}
        <p className="mt-4 text-center text-xs text-gray-400">
          Demo PIN: 1234
        </p>
      </div>
    </div>
  );
}
