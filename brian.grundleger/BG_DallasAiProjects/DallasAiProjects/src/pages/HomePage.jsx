import { useState } from 'react'
import {
  CreditCard,
  FileCheck,
  Smartphone,
  Landmark,
  Database,
  BarChart3,
  Building,
  Shield,
  ChevronRight,
  Filter,
  Layers,
  Building2,
  Users,
  Server,
  ExternalLink,
  Cpu
} from 'lucide-react'
import { clsx } from 'clsx'

const systemIcons = {
  'card-services': CreditCard,
  'credit-cards': CreditCard,
  'item-processing': FileCheck,
  'digital': Smartphone,
  'lending': Landmark,
  'core': Database,
  'backoffice': BarChart3,
  'branch': Building,
  'compliance': Shield,
  'crm': Users,
  'platform': Server,
  'middleware': Cpu,
}

const systemColors = {
  'card-services': { bg: 'bg-blue-500', gradient: 'from-blue-500 to-blue-600', hover: 'hover:border-blue-400/50', ring: 'ring-blue-500/20' },
  'credit-cards': { bg: 'bg-cyan-500', gradient: 'from-cyan-500 to-cyan-600', hover: 'hover:border-cyan-400/50', ring: 'ring-cyan-500/20' },
  'item-processing': { bg: 'bg-emerald-500', gradient: 'from-emerald-500 to-emerald-600', hover: 'hover:border-emerald-400/50', ring: 'ring-emerald-500/20' },
  'digital': { bg: 'bg-violet-500', gradient: 'from-violet-500 to-violet-600', hover: 'hover:border-violet-400/50', ring: 'ring-violet-500/20' },
  'lending': { bg: 'bg-amber-500', gradient: 'from-amber-500 to-amber-600', hover: 'hover:border-amber-400/50', ring: 'ring-amber-500/20' },
  'core': { bg: 'bg-indigo-500', gradient: 'from-indigo-500 to-indigo-600', hover: 'hover:border-indigo-400/50', ring: 'ring-indigo-500/20' },
  'backoffice': { bg: 'bg-pink-500', gradient: 'from-pink-500 to-pink-600', hover: 'hover:border-pink-400/50', ring: 'ring-pink-500/20' },
  'branch': { bg: 'bg-teal-500', gradient: 'from-teal-500 to-teal-600', hover: 'hover:border-teal-400/50', ring: 'ring-teal-500/20' },
  'compliance': { bg: 'bg-red-500', gradient: 'from-red-500 to-red-600', hover: 'hover:border-red-400/50', ring: 'ring-red-500/20' },
  'crm': { bg: 'bg-emerald-500', gradient: 'from-emerald-500 to-emerald-600', hover: 'hover:border-emerald-400/50', ring: 'ring-emerald-500/20' },
  'platform': { bg: 'bg-indigo-500', gradient: 'from-indigo-500 to-indigo-600', hover: 'hover:border-indigo-400/50', ring: 'ring-indigo-500/20' },
  'middleware': { bg: 'bg-violet-500', gradient: 'from-violet-500 to-violet-600', hover: 'hover:border-violet-400/50', ring: 'ring-violet-500/20' },
}

const filterOptions = [
  { id: 'all', label: 'All Systems', icon: Layers },
  { id: 'temenos', label: 'Temenos', icon: Database },
  { id: '3rdparty', label: '3rd Party', icon: Building2 },
]

export function HomePage({ systems, teamDemos = [], onSelectSystem, activeFilter, onFilterChange, onDemoAppClick }) {
  const [hoveredCard, setHoveredCard] = useState(null)
  const [hoveredDemo, setHoveredDemo] = useState(null)

  const handleDemoClick = (demo) => {
    if (onDemoAppClick) {
      onDemoAppClick(demo)
    } else {
      window.open(demo.url, '_blank')
    }
  }

  // Get API counts based on filter
  const getApiCounts = (system) => {
    if (!system.apis) return { temenos: 0, thirdParty: 0, total: 0 }
    const temenos = system.apis.filter(api => api.type === 'temenos').length
    const thirdParty = system.apis.filter(api => api.type === '3rdparty').length
    return { temenos, thirdParty, total: system.apis.length }
  }

  // Get filtered API count for display
  const getFilteredApiCount = (system) => {
    const counts = getApiCounts(system)
    if (activeFilter === 'temenos') return counts.temenos
    if (activeFilter === '3rdparty') return counts.thirdParty
    return counts.total
  }

  // Check if system has APIs for current filter
  const hasApisForFilter = (system) => {
    if (activeFilter === 'all') return true
    if (!system.apis) return false
    return system.apis.some(api => api.type === activeFilter)
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-3 text-white tracking-tight">
          Banking Ecosystem
        </h1>
        <p className="text-lg text-slate-300 max-w-2xl">
          Explore our comprehensive suite of banking solutions and API integrations
        </p>
      </div>

      {/* Team Demos Section */}
      {teamDemos && teamDemos.length > 0 && (
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-4 text-white tracking-tight flex items-center gap-2">
            <Server className="w-6 h-6 text-blue-400" />
            Team Demo Applications
          </h2>
          <p className="text-sm text-slate-400 mb-6">Click on a card to launch the demo application in a new window</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
            {teamDemos.map((demo) => {
              const Icon = systemIcons[demo.icon] || Server
              const colors = systemColors[demo.icon] || systemColors['platform']
              const isHovered = hoveredDemo === demo.id

              return (
                <button
                  key={demo.id}
                  onClick={() => handleDemoClick(demo)}
                  onMouseEnter={() => setHoveredDemo(demo.id)}
                  onMouseLeave={() => setHoveredDemo(null)}
                  className={clsx(
                    "group relative text-left rounded-xl transition-all duration-300",
                    "bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm",
                    "border-2 border-slate-600/50",
                    colors.hover,
                    "p-4 overflow-hidden",
                    "cursor-pointer hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1"
                  )}
                >
                  {/* Gradient overlay on hover */}
                  <div
                    className={clsx(
                      "absolute inset-0 opacity-0 transition-opacity duration-300",
                      "bg-gradient-to-br",
                      colors.gradient,
                      isHovered && "opacity-10"
                    )}
                  />

                  {/* Icon and External Link */}
                  <div className="relative flex items-center justify-between mb-3">
                    <div className={clsx(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      "bg-gradient-to-br shadow-lg",
                      colors.gradient,
                      "ring-2",
                      colors.ring,
                      "group-hover:scale-110 transition-transform duration-300"
                    )}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <ExternalLink className={clsx(
                      "w-4 h-4 text-slate-500 transition-all duration-300",
                      isHovered && "text-white"
                    )} />
                  </div>

                  {/* Content */}
                  <div className="relative">
                    <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-white transition-colors">
                      {demo.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                      {demo.description}
                    </p>

                    {/* Port Badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-green-500/10 text-green-400 border border-green-500/20">
                        Port: {demo.port}
                      </span>
                      {demo.backendPort && (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                          Backend: {demo.backendPort}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Corner accent */}
                  <div className={clsx(
                    "absolute -top-8 -right-8 w-16 h-16 rounded-full opacity-10",
                    "bg-gradient-to-br",
                    colors.gradient,
                    "group-hover:opacity-20 transition-opacity duration-300"
                  )} />
                </button>
              )
            })}
          </div>

          <div className="border-b border-slate-700/50 mb-8"></div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 p-1.5 bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-lg">
          <div className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filter:</span>
          </div>
          <div className="flex gap-1">
            {filterOptions.map((option) => {
              const Icon = option.icon
              const isActive = activeFilter === option.id
              return (
                <button
                  key={option.id}
                  onClick={() => onFilterChange(option.id)}
                  className={clsx(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{option.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Systems Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {systems.map((system) => {
          const Icon = systemIcons[system.icon] || CreditCard
          const colors = systemColors[system.icon] || systemColors['card-services']
          const apiCount = getFilteredApiCount(system)
          const isHovered = hoveredCard === system.id
          const hasApis = hasApisForFilter(system)
          const counts = getApiCounts(system)

          return (
            <button
              key={system.id}
              onClick={() => onSelectSystem(system.id)}
              onMouseEnter={() => setHoveredCard(system.id)}
              onMouseLeave={() => setHoveredCard(null)}
              disabled={!hasApis}
              className={clsx(
                "group relative text-left rounded-2xl transition-all duration-300",
                "bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm",
                "border border-slate-700/50",
                colors.hover,
                "p-6 overflow-hidden",
                hasApis
                  ? "cursor-pointer hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1"
                  : "opacity-40 cursor-not-allowed"
              )}
            >
              {/* Gradient overlay on hover */}
              <div
                className={clsx(
                  "absolute inset-0 opacity-0 transition-opacity duration-300",
                  "bg-gradient-to-br",
                  colors.gradient,
                  isHovered && hasApis && "opacity-5"
                )}
              />

              {/* Icon */}
              <div className={clsx(
                "relative w-14 h-14 rounded-xl flex items-center justify-center mb-5",
                "bg-gradient-to-br shadow-lg",
                colors.gradient,
                "ring-4",
                colors.ring,
                "group-hover:scale-110 transition-transform duration-300"
              )}>
                <Icon className="w-7 h-7 text-white" />
              </div>

              {/* Content */}
              <div className="relative">
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-white transition-colors">
                  {system.name}
                </h3>
                <p className="text-sm text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                  {system.description}
                </p>

                {/* API Count Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {activeFilter === 'all' ? (
                      <>
                        {counts.temenos > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <Database className="w-3 h-3" />
                            {counts.temenos}
                          </span>
                        )}
                        {counts.thirdParty > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            <Building2 className="w-3 h-3" />
                            {counts.thirdParty}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className={clsx(
                        "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md",
                        activeFilter === 'temenos'
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                      )}>
                        {activeFilter === 'temenos' ? <Database className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                        {apiCount} APIs
                      </span>
                    )}
                  </div>

                  {/* Arrow */}
                  <ChevronRight className={clsx(
                    "w-5 h-5 text-slate-500 transition-all duration-300",
                    isHovered && hasApis && "text-white translate-x-1"
                  )} />
                </div>
              </div>

              {/* Corner accent */}
              <div className={clsx(
                "absolute -top-12 -right-12 w-24 h-24 rounded-full opacity-10",
                "bg-gradient-to-br",
                colors.gradient,
                "group-hover:opacity-20 transition-opacity duration-300"
              )} />
            </button>
          )
        })}
      </div>

      {/* Summary Footer */}
      <div className="mt-10 pt-8 border-t border-slate-700/50">
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>
            Showing {systems.length} categories
            {activeFilter !== 'all' && (
              <span className="ml-1">
                filtered by <span className="text-white font-medium">{activeFilter === 'temenos' ? 'Temenos' : '3rd Party'}</span>
              </span>
            )}
          </span>
          <span className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Database className="w-4 h-4 text-blue-400" />
              Temenos APIs
            </span>
            <span className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-purple-400" />
              3rd Party APIs
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}

export default HomePage
