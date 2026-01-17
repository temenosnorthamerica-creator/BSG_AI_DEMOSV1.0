import {
  Home,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Network,
  Database,
  Cloud,
  Shield,
  Eye,
  Palette,
  Building2,
  type LucideIcon,
} from 'lucide-react'
import { ComponentId } from '../types'
import { clsx } from 'clsx'
import { useState, useEffect } from 'react'

interface SidebarProps {
  currentComponent: ComponentId | null
  onComponentChange?: (componentId: ComponentId) => void
  onHomeClick?: () => void
  onSettingsClick?: () => void
}

interface ComponentCard {
  id: ComponentId
  name: string
  description: string
  icon: LucideIcon
  color: string
}

const components: ComponentCard[] = [
  {
    id: 'integration',
    name: 'Integration, APIs & Events',
    description: 'Enterprise integration patterns and API design',
    icon: Network,
    color: 'bg-blue-500',
  },
  {
    id: 'data-architecture',
    name: 'Data Architecture',
    description: 'Database design and data modeling',
    icon: Database,
    color: 'bg-green-500',
  },
  {
    id: 'deployment',
    name: 'Deployment & Cloud',
    description: 'Container orchestration and cloud deployments',
    icon: Cloud,
    color: 'bg-purple-500',
  },
  {
    id: 'security',
    name: 'Security',
    description: 'Application security and vulnerability management',
    icon: Shield,
    color: 'bg-red-500',
  },
  {
    id: 'observability',
    name: 'Observability',
    description: 'Monitoring, logging, and distributed tracing',
    icon: Eye,
    color: 'bg-yellow-500',
  },
  {
    id: 'design-time',
    name: 'Design Time',
    description: 'Software design principles and architecture patterns',
    icon: Palette,
    color: 'bg-indigo-500',
  },
  {
    id: 'branch-loans',
    name: 'Sucursal - Creditos',
    description: 'Solicitudes de prestamos personales y automotrices',
    icon: Building2,
    color: 'bg-teal-500',
  },
]

export function Sidebar({ 
  currentComponent, 
  onComponentChange, 
  onHomeClick, 
  onSettingsClick
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [hovered, setHovered] = useState(false)

  // Auto-hide after 5 seconds of inactivity (when mouse leaves)
  useEffect(() => {
    if (!hovered && !isCollapsed) {
      const timer = setTimeout(() => {
        setIsCollapsed(true)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [hovered, isCollapsed])

  const isExpanded = hovered || !isCollapsed

  // Update body data attribute to adjust main content margin
  useEffect(() => {
    document.body.setAttribute('data-sidebar', isExpanded ? 'expanded' : 'collapsed')
  }, [isExpanded])

  return (
    <aside 
      className={clsx(
        "fixed left-0 top-0 h-full bg-[#283054] flex flex-col py-6 z-50 shadow-xl transition-all duration-300",
        isExpanded ? "w-80" : "w-20"
      )}
      onMouseEnter={() => {
        setHovered(true)
        setIsCollapsed(false)
      }}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 bg-[#283054] text-white p-1 rounded-full shadow-lg hover:bg-[#1e2438] transition-colors z-10 border-2 border-blue-800/50"
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isExpanded ? (
          <ChevronLeft className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>

      {/* Logo */}
      <div className={clsx("px-6 mb-8 transition-opacity", isExpanded ? "opacity-100" : "opacity-0")}>
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xl">BSG</span>
          </div>
          {isExpanded && (
            <div className="flex flex-col">
              <span className="text-white font-bold text-lg">BSG Demo</span>
              <span className="text-blue-300 text-xs">Platform</span>
            </div>
          )}
        </div>
      </div>

      {/* Compact Logo (when collapsed) */}
      {!isExpanded && (
        <div className="px-6 mb-8 flex justify-center">
          <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xl">BSG</span>
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col px-4 space-y-3 overflow-y-auto">
        {/* Home Button */}
        <button
          onClick={onHomeClick}
          className={clsx(
            "text-white hover:text-blue-300 hover:bg-blue-900/30 transition-colors p-3 rounded-lg flex items-center",
            isExpanded ? "space-x-3" : "justify-center"
          )}
          title="Home - Return to component selection"
        >
          <Home className="w-5 h-5 flex-shrink-0" />
          {isExpanded && <span className="text-sm font-medium">Home</span>}
        </button>
        
        {/* Component Cards */}
        <div className={clsx("space-y-3", !isExpanded && "space-y-2")}>
          {isExpanded && (
            <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider px-3 mb-2">
              Components
            </p>
          )}
          {components.map((component) => {
            const Icon = component.icon
            const isActive = currentComponent === component.id
            return (
              <button
                key={component.id}
                onClick={() => onComponentChange?.(component.id)}
                className={clsx(
                  "w-full rounded-lg transition-all duration-200 text-left",
                  isExpanded 
                    ? clsx(
                        "p-4 border",
                        isActive
                          ? "bg-blue-900/30 border-blue-700/50 text-blue-400"
                          : "bg-blue-900/10 border-blue-800/30 text-white hover:bg-blue-900/20 hover:border-blue-700/50"
                      )
                    : clsx(
                        "p-3 flex justify-center",
                        isActive
                          ? "bg-blue-900/30 text-blue-400"
                          : "text-white hover:bg-blue-900/20"
                      )
                )}
                title={component.name}
              >
                {isExpanded ? (
                  <div className="flex items-start space-x-3">
                    <div className={clsx("w-10 h-10", component.color, "rounded-lg flex items-center justify-center flex-shrink-0")}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1">{component.name}</h4>
                      <p className="text-xs text-blue-200/80 line-clamp-2">{component.description}</p>
                    </div>
                  </div>
                ) : (
                  <div className={clsx("w-10 h-10", component.color, "rounded-lg flex items-center justify-center")}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="flex flex-col space-y-2 pt-4 px-4">
        <button
          onClick={onSettingsClick}
          className={clsx(
            "w-full text-white hover:text-blue-300 hover:bg-blue-900/20 transition-colors p-3 rounded-lg flex items-center",
            isExpanded ? "space-x-3" : "justify-center"
          )}
          title="Settings"
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {isExpanded && <span className="text-sm font-medium">Settings</span>}
        </button>
        <button
          className={clsx(
            "w-full text-white hover:text-blue-300 hover:bg-blue-900/20 transition-colors p-3 rounded-lg flex items-center",
            isExpanded ? "space-x-3" : "justify-center"
          )}
          title="Logout"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {isExpanded && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  )
}
