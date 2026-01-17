import {
  Home,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileCheck,
  Smartphone,
  Landmark,
  Database,
  BarChart3,
  Building,
  Shield,
  Filter,
  Layers,
  Building2,
  Map,
  Cog
} from 'lucide-react'
import { clsx } from 'clsx'
import { useState, useEffect } from 'react'

const systemIcons = {
  'card-services': CreditCard,
  'item-processing': FileCheck,
  'digital': Smartphone,
  'lending': Landmark,
  'core': Database,
  'backoffice': BarChart3,
  'branch': Building,
  'compliance': Shield,
}

const systemColors = {
  'card-services': 'bg-blue-500',
  'item-processing': 'bg-emerald-500',
  'digital': 'bg-violet-500',
  'lending': 'bg-amber-500',
  'core': 'bg-indigo-500',
  'backoffice': 'bg-pink-500',
  'branch': 'bg-teal-500',
  'compliance': 'bg-red-500',
}

const filterOptions = [
  { id: 'all', label: 'All', icon: Layers, color: 'bg-slate-500' },
  { id: 'temenos', label: 'Temenos', icon: Database, color: 'bg-blue-500' },
  { id: '3rdparty', label: '3rd Party', icon: Building2, color: 'bg-purple-500' },
]

export function Sidebar({
  systems,
  enabledSystems,
  currentSystem,
  currentPage,
  onSystemChange,
  onHomeClick,
  onConfigClick,
  onSolutionMapClick,
  activeFilter,
  onFilterChange,
  clientConfig
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    if (!hovered && !isCollapsed) {
      const timer = setTimeout(() => {
        setIsCollapsed(true)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [hovered, isCollapsed])

  const isExpanded = hovered || !isCollapsed

  useEffect(() => {
    document.body.setAttribute('data-sidebar', isExpanded ? 'expanded' : 'collapsed')
  }, [isExpanded])

  // Get API counts for a system
  const getApiCounts = (system) => {
    if (!system.apis) return { temenos: 0, thirdParty: 0 }
    const temenos = system.apis.filter(api => api.type === 'temenos').length
    const thirdParty = system.apis.filter(api => api.type === '3rdparty').length
    return { temenos, thirdParty }
  }

  return (
    <aside
      className={clsx(
        "fixed left-0 top-0 h-full flex flex-col z-50 transition-all duration-300",
        "bg-gradient-to-b from-[#1e2a4a] via-[#1a2340] to-[#151c32]",
        "border-r border-slate-700/30 shadow-2xl",
        isExpanded ? "w-72" : "w-20"
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
        className={clsx(
          "absolute -right-3 top-20 p-1.5 rounded-full z-10",
          "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
          "shadow-lg shadow-blue-500/25",
          "hover:from-blue-400 hover:to-blue-500 transition-all duration-200",
          "border-2 border-slate-800"
        )}
        style={clientConfig?.primaryColor ? {
          background: `linear-gradient(to right, ${clientConfig.primaryColor}, ${clientConfig.secondaryColor || clientConfig.primaryColor})`
        } : {}}
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isExpanded ? (
          <ChevronLeft className="w-3.5 h-3.5" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Logo Section */}
      <div className="px-5 py-6 border-b border-slate-700/30">
        <div className="flex items-center gap-3">
          {clientConfig?.clientLogo ? (
            <div className="flex-shrink-0 w-11 h-11 rounded-xl overflow-hidden bg-white p-1">
              <img
                src={clientConfig.clientLogo}
                alt="Client Logo"
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div
              className={clsx(
                "flex-shrink-0 rounded-xl flex items-center justify-center shadow-lg",
                isExpanded ? "w-11 h-11" : "w-10 h-10"
              )}
              style={{
                background: clientConfig?.primaryColor
                  ? `linear-gradient(to bottom right, ${clientConfig.primaryColor}, ${clientConfig.secondaryColor || clientConfig.primaryColor})`
                  : 'linear-gradient(to bottom right, #60a5fa, #3b82f6)'
              }}
            >
              <span className="text-white font-bold text-lg">
                {clientConfig?.clientName?.charAt(0) || 'B'}
              </span>
            </div>
          )}
          {isExpanded && (
            <div className="flex flex-col min-w-0">
              <span className="text-white font-semibold text-base truncate">
                {clientConfig?.clientName || 'Banking'}
              </span>
              <span className="text-blue-300/70 text-xs">Ecosystem Demo</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter Section */}
      {isExpanded && (
        <div className="px-4 py-4 border-b border-slate-700/30">
          <div className="flex items-center gap-2 mb-3 text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span className="text-xs font-medium uppercase tracking-wider">Filter</span>
          </div>
          <div className="flex gap-1.5">
            {filterOptions.map((option) => {
              const Icon = option.icon
              const isActive = activeFilter === option.id
              return (
                <button
                  key={option.id}
                  onClick={() => onFilterChange(option.id)}
                  className={clsx(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all duration-200",
                    isActive
                      ? "text-white shadow-md"
                      : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-300 border border-slate-700/30"
                  )}
                  style={isActive && clientConfig?.primaryColor ? {
                    background: `linear-gradient(to right, ${clientConfig.primaryColor}, ${clientConfig.secondaryColor || clientConfig.primaryColor})`
                  } : isActive ? {
                    background: 'linear-gradient(to right, #3b82f6, #2563eb)'
                  } : {}}
                  title={option.label}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">{option.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Collapsed Filter Indicator */}
      {!isExpanded && (
        <div className="px-4 py-3 border-b border-slate-700/30 flex justify-center">
          <div className={clsx(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            activeFilter === 'all' && "bg-slate-700/50 text-slate-400",
            activeFilter === 'temenos' && "bg-blue-500/20 text-blue-400",
            activeFilter === '3rdparty' && "bg-purple-500/20 text-purple-400"
          )}>
            {activeFilter === 'all' && <Layers className="w-4 h-4" />}
            {activeFilter === 'temenos' && <Database className="w-4 h-4" />}
            {activeFilter === '3rdparty' && <Building2 className="w-4 h-4" />}
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col px-3 py-4 space-y-1 overflow-y-auto">
        {/* Home Button */}
        <button
          onClick={onHomeClick}
          className={clsx(
            "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
            currentPage === 'home' && !currentSystem
              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50",
            !isExpanded && "justify-center px-2"
          )}
          title="Home"
        >
          <Home className="w-5 h-5 flex-shrink-0" />
          {isExpanded && <span className="text-sm font-medium">Home</span>}
        </button>

        {/* Solution Map Button */}
        <button
          onClick={onSolutionMapClick}
          className={clsx(
            "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
            currentPage === 'solutionmap'
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50",
            !isExpanded && "justify-center px-2"
          )}
          title="Solution Map"
        >
          <Map className="w-5 h-5 flex-shrink-0" />
          {isExpanded && <span className="text-sm font-medium">Solution Map</span>}
        </button>

        {/* Section Label */}
        {isExpanded && (
          <div className="pt-4 pb-2 px-3">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
              Banking Systems
            </p>
          </div>
        )}

        {/* System Cards - Only show enabled systems */}
        <div className="space-y-1">
          {(enabledSystems || systems).map((system) => {
            const Icon = systemIcons[system.icon] || CreditCard
            const colorClass = systemColors[system.icon] || 'bg-blue-500'
            const isActive = currentSystem === system.id
            const counts = getApiCounts(system)

            return (
              <button
                key={system.id}
                onClick={() => onSystemChange?.(system.id)}
                className={clsx(
                  "w-full rounded-xl transition-all duration-200 text-left group",
                  isExpanded
                    ? clsx(
                        "p-3",
                        isActive
                          ? "bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/30 text-white"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                      )
                    : clsx(
                        "p-2.5 flex justify-center",
                        isActive
                          ? "bg-blue-500/10 text-blue-400"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                      )
                )}
                title={system.name}
              >
                {isExpanded ? (
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105",
                      colorClass
                    )}>
                      <Icon className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{system.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {counts.temenos > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] text-blue-400">
                            <Database className="w-2.5 h-2.5" />
                            {counts.temenos}
                          </span>
                        )}
                        {counts.thirdParty > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] text-purple-400">
                            <Building2 className="w-2.5 h-2.5" />
                            {counts.thirdParty}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={clsx(
                    "w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105",
                    colorClass
                  )}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-slate-700/30 p-3 space-y-1">
        {/* Client Environment Variables */}
        <button
          onClick={onConfigClick}
          className={clsx(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
            currentPage === 'config'
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50",
            !isExpanded && "justify-center px-2"
          )}
          title="Client Environment Variables"
        >
          <Cog className="w-5 h-5 flex-shrink-0" />
          {isExpanded && <span className="text-sm font-medium">Client Environment</span>}
        </button>

        <button
          className={clsx(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
            "text-slate-400 hover:text-white hover:bg-slate-800/50",
            !isExpanded && "justify-center px-2"
          )}
          title="Settings"
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {isExpanded && <span className="text-sm font-medium">Settings</span>}
        </button>

        <button
          className={clsx(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
            "text-slate-400 hover:text-red-400 hover:bg-red-500/10",
            !isExpanded && "justify-center px-2"
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

export default Sidebar
