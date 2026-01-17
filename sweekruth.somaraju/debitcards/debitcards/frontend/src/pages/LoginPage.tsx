import { PinEntry } from '../components/PinEntry';

interface LoginPageProps {
  onLogin: (cardNumber: string, pin: string) => Promise<void>;
  error?: string;
  isLoading?: boolean;
}

export function LoginPage({ onLogin, error, isLoading }: LoginPageProps) {
  return <PinEntry onSubmit={onLogin} error={error} isLoading={isLoading} />;
}
