import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { authService, tokenService } from '../api/services';
import type { LoginRequest } from '../types';

interface User {
  userId: string;
  firstName: string;
  lastName: string;
  tin?: string;
  ssn?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const token = authService.getToken();
    const userData = authService.getUserData();
    if (token && userData) {
      setUser(userData as User);
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginRequest) => {
    const response = await authService.login(credentials);
    authService.setToken(response.Token);

    // For demo purposes, extract user info from credentials
    // In production, this would come from the API response
    const userData: User = {
      userId: response.UserId,
      firstName: credentials.Username.split('@')[0],
      lastName: '',
    };
    authService.setUserData(userData);
    setUser(userData);
  };

  const logout = () => {
    authService.logout();
    tokenService.clearToken();
    localStorage.removeItem('user_ssn');
    localStorage.removeItem('user_applications');
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
