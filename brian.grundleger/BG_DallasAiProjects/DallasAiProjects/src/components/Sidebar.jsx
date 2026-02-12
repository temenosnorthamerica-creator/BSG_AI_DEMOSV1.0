import {
  Home,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Activity
} from 'lucide-react'
import { clsx } from 'clsx'
import { useState, useEffect } from 'react'

export function Sidebar({
  currentPage,
  onHomeClick,
  onSolutionDiagramClick,
  onHealthCheckClick,
  clientConfig
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const isExpanded = !isCollapsed

  useEffect(() => {
    document.body.setAttribute('data-sidebar', isExpanded ? 'expanded' : 'collapsed')
  }, [isExpanded])

  return (
    <aside
      className={clsx(
        "fixed left-0 top-0 h-full flex flex-col z-50 transition-all duration-300",
        "bg-gradient-to-b from-[#1e2a4a] via-[#1a2340] to-[#151c32]",
        "border-r border-slate-700/30 shadow-2xl",
        isExpanded ? "w-72" : "w-20"
      )}
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


      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col px-3 py-4 space-y-1 overflow-y-auto">
        {/* Home Button */}
        <button
          onClick={onHomeClick}
          className={clsx(
            "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
            currentPage === 'home'
              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50",
            !isExpanded && "justify-center px-2"
          )}
          title="Home"
        >
          <Home className="w-5 h-5 flex-shrink-0" />
          {isExpanded && <span className="text-sm font-medium">Home</span>}
        </button>

        {/* Solution Diagram Button */}
        <button
          onClick={onSolutionDiagramClick}
          className={clsx(
            "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
            currentPage === 'solutiondiagram'
              ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50",
            !isExpanded && "justify-center px-2"
          )}
          title="Solution Diagram"
        >
          <GitBranch className="w-5 h-5 flex-shrink-0" />
          {isExpanded && <span className="text-sm font-medium">Solution Diagram</span>}
        </button>

        {/* Health Check Button */}
        <button
          onClick={onHealthCheckClick}
          className={clsx(
            "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
            currentPage === 'healthcheck'
              ? "bg-green-500/10 text-green-400 border border-green-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50",
            !isExpanded && "justify-center px-2"
          )}
          title="Health Check"
        >
          <Activity className="w-5 h-5 flex-shrink-0" />
          {isExpanded && <span className="text-sm font-medium">Health Check</span>}
        </button>

      </nav>
    </aside>
  )
}

export default Sidebar
