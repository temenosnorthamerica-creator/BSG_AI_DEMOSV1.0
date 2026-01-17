import { Sun, Moon, BookOpen, Home, Activity } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  onHealthCheck?: () => void;
}

export default function Header({ darkMode, setDarkMode, onHealthCheck }: HeaderProps) {
  const location = useLocation();

  return (
    <header className="bg-primary text-white h-16 flex items-center justify-between px-6 shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-temenos-accent rounded-lg flex items-center justify-center">
            <span className="text-xl font-bold">T</span>
          </div>
          <div>
            <h1 className="text-xl font-bold">CRM Banking Simulator</h1>
            <p className="text-xs text-gray-300">Temenos Integration Demo</p>
          </div>
        </div>
      </div>

      <nav className="flex items-center gap-4">
        <Link
          to="/"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            location.pathname === '/'
              ? 'bg-primary-dark'
              : 'hover:bg-primary-dark/50'
          }`}
        >
          <Home size={18} />
          <span>Simulator</span>
        </Link>
        <Link
          to="/api-reference"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            location.pathname === '/api-reference'
              ? 'bg-primary-dark'
              : 'hover:bg-primary-dark/50'
          }`}
        >
          <BookOpen size={18} />
          <span>API Reference</span>
        </Link>

        <div className="w-px h-8 bg-gray-500 mx-2" />

        <button
          onClick={onHealthCheck}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary-dark transition-colors bg-green-600/20 border border-green-500/30"
          title="API Health Check"
        >
          <Activity size={18} className="text-green-400" />
          <span className="text-sm">Health</span>
        </button>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg hover:bg-primary-dark transition-colors"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </nav>
    </header>
  );
}
