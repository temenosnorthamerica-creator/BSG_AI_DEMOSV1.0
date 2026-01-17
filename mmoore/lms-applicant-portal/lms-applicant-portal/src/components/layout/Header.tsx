import { useAuth } from '../../hooks';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-primary text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/SECU-logo.png"
              alt="State Employees' Credit Union"
              className="h-10"
            />
            <span className="hidden sm:block text-lg font-heading font-semibold tracking-wide">
              Applicant Portal
            </span>
          </div>

          {user && (
            <div className="flex items-center gap-6">
              <span className="text-sm font-medium">
                Welcome, <span className="font-semibold">{user.firstName}</span>
              </span>
              <button
                onClick={handleLogout}
                className="text-sm font-medium px-4 py-2 rounded border border-white/30 hover:bg-white/10 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
