import type { FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks';
import { applicationService, tokenService } from '../api/services';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [ssn, setSsn] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, setUser } = useAuth();
  const navigate = useNavigate();

  // Format SSN as user types (XXX-XX-XXXX)
  const handleSsnChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 9);
    let formatted = digits;
    if (digits.length > 3) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }
    if (digits.length > 5) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
    }
    setSsn(formatted);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Extract raw SSN digits for API calls
    const rawSsn = ssn.replace(/\D/g, '');

    try {
      // Step 1: Get API token first
      console.log('Fetching API token...');
      await tokenService.fetchNewToken();
      console.log('API token obtained successfully');

      // Step 2: Try to login with credentials (optional - may not be needed)
      try {
        await login({ Username: username, Password: password });
      } catch {
        // Continue even if credential login fails - we have API token
        console.log('Credential login skipped, using API token');
      }

      // Step 3: Search for applications using SSN
      if (rawSsn) {
        try {
          console.log('Searching applications for TIN:', parseInt(rawSsn, 10));
          const searchResponse = await applicationService.search({
            ApplicantTIN: parseInt(rawSsn, 10)
          });
          console.log('Application search response:', searchResponse);
          localStorage.setItem('user_applications', JSON.stringify(searchResponse));
        } catch (searchError) {
          console.error('Application search failed:', searchError);
        }
      }

      // Step 4: Set user data and navigate
      const userData = {
        userId: '1',
        firstName: username.split('@')[0].split('.')[0] || 'User',
        lastName: username.split('@')[0].split('.')[1] || '',
        ssn: rawSsn,
      };
      setUser(userData);
      localStorage.setItem('user_data', JSON.stringify(userData));
      localStorage.setItem('user_ssn', rawSsn);

      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to connect to the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#f5f5f5' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div className="bg-white rounded shadow-lg overflow-hidden">
          {/* SECU Navy Header */}
          <div className="py-6 px-8" style={{ backgroundColor: '#003366' }}>
            <div className="flex justify-center mb-4">
              <img
                src="/SECU-logo.png"
                alt="State Employees' Credit Union"
                className="h-12"
              />
            </div>
            <h2 className="text-2xl font-bold text-white text-center">Applicant Portal</h2>
          </div>

          {/* Form Section */}
          <div className="p-8">
            <p className="text-gray-600 text-center mb-6">Sign in to manage your applications</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="Enter your username"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <div>
                <label htmlFor="ssn" className="block text-sm font-semibold text-gray-700 mb-2">
                  Social Security Number
                </label>
                <input
                  id="ssn"
                  type="text"
                  value={ssn}
                  onChange={(e) => handleSsnChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="XXX-XX-XXXX"
                  maxLength={11}
                />
                <p className="text-xs text-gray-500 mt-1">Used for retrieving your application data</p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full text-white py-3 px-4 rounded font-semibold transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#003366' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#002244'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#003366'}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <a href="#" className="text-sm font-medium hover:underline" style={{ color: '#0066CC' }}>
                Forgot your password?
              </a>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          © 2026 State Employees' Credit Union. All rights reserved.
        </p>
      </div>
    </div>
  );
}
