import { useState, useEffect } from 'react';
import {
  CreditCard,
  Smartphone,
  ArrowLeftRight,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Layers
} from 'lucide-react';
import { ApplicationType } from '../types';
import { bankingApplications } from '../data/bankingApps';

interface SidebarProps {
  selectedApp: ApplicationType | null;
  setSelectedApp: (app: ApplicationType | null) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  CreditCard: <CreditCard size={24} />,
  Smartphone: <Smartphone size={24} />,
  ArrowLeftRight: <ArrowLeftRight size={24} />,
  UserPlus: <UserPlus size={24} />
};

export default function Sidebar({ selectedApp, setSelectedApp, collapsed, setCollapsed }: SidebarProps) {
  const [autoCollapse, setAutoCollapse] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!collapsed) {
      const timer = setTimeout(() => {
        setCollapsed(true);
      }, 10000);
      setAutoCollapse(timer);
    }

    return () => {
      if (autoCollapse) {
        clearTimeout(autoCollapse);
      }
    };
  }, [collapsed]);

  const handleMouseEnter = () => {
    if (autoCollapse) {
      clearTimeout(autoCollapse);
    }
    if (collapsed) {
      setCollapsed(false);
    }
  };

  return (
    <aside
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-primary text-white transition-all duration-300 z-40 ${
        collapsed ? 'w-20' : 'w-80'
      }`}
      onMouseEnter={handleMouseEnter}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 w-6 h-6 bg-primary border-2 border-temenos-accent rounded-full flex items-center justify-center hover:bg-primary-dark transition-colors"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className="p-4">
        {!collapsed && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Banking Applications
            </h2>
          </div>
        )}

        <nav className="space-y-2">
          {bankingApplications.map((app) => (
            <button
              key={app.id}
              onClick={() => setSelectedApp(app.id as ApplicationType)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                selectedApp === app.id
                  ? 'bg-temenos-accent text-white'
                  : 'hover:bg-primary-dark text-gray-300 hover:text-white'
              }`}
              title={collapsed ? app.name : undefined}
            >
              <div
                className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${app.color}20` }}
              >
                <span style={{ color: app.color }}>
                  {iconMap[app.icon]}
                </span>
              </div>
              {!collapsed && (
                <div className="text-left">
                  <p className="font-medium">{app.name}</p>
                  <p className="text-xs text-gray-400">{app.journeySteps.length} steps</p>
                </div>
              )}
            </button>
          ))}
        </nav>

        {!collapsed && (
          <div className="mt-8 p-4 bg-primary-dark rounded-lg">
            <div className="flex items-center gap-2 text-temenos-accent mb-2">
              <Layers size={18} />
              <span className="font-medium">Integration Status</span>
            </div>
            <p className="text-xs text-gray-400">
              CRM APIs connected to Temenos Core Banking via REST/Events
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-green-400">Connected</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
