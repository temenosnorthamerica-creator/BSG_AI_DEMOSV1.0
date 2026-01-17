import { useState, useEffect } from 'react';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { SessionInfo } from './types';
import { apiService } from './services/api';

function App() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Check for existing session on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('debitcard_session');
    if (savedSession) {
      try {
        const parsedSession = JSON.parse(savedSession) as SessionInfo;
        apiService.setSessionToken(parsedSession.sessionToken);
        // Validate session
        apiService.validateSession().then((isValid) => {
          if (isValid) {
            setSession(parsedSession);
          } else {
            localStorage.removeItem('debitcard_session');
            apiService.setSessionToken(null);
          }
        });
      } catch {
        localStorage.removeItem('debitcard_session');
      }
    }
  }, []);

  const handleLogin = async (cardNumber: string, pin: string) => {
    setIsLoading(true);
    setError(undefined);

    try {
      const response = await apiService.authenticatePin(cardNumber, pin);

      if (response.success && response.session_token) {
        const newSession: SessionInfo = {
          cardMasked: response.card_masked || '**** **** **** ****',
          holderName: response.holder_name || 'Customer',
          sessionToken: response.session_token,
        };

        apiService.setSessionToken(response.session_token);
        localStorage.setItem('debitcard_session', JSON.stringify(newSession));
        setSession(newSession);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to connect to server. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    }

    localStorage.removeItem('debitcard_session');
    apiService.setSessionToken(null);
    setSession(null);
    setError(undefined);
  };

  if (!session) {
    return <LoginPage onLogin={handleLogin} error={error} isLoading={isLoading} />;
  }

  return <DashboardPage session={session} onLogout={handleLogout} />;
}

export default App;
