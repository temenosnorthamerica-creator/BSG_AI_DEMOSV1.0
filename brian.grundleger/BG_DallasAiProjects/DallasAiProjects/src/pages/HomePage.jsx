import { useState } from 'react'
import {
  Users,
  Server,
  ExternalLink,
  Cpu,
  CreditCard,
  Landmark,
  Banknote,
  GitBranch
} from 'lucide-react'
import { clsx } from 'clsx'

const systemIcons = {
  'crm': Users,
  'platform': Server,
  'middleware': Cpu,
  'card-services': CreditCard,
  'lending': Banknote,
  'esb': GitBranch,
}

const systemColors = {
  'crm': { bg: 'bg-emerald-500', gradient: 'from-emerald-500 to-emerald-600', hover: 'hover:border-emerald-400/50', ring: 'ring-emerald-500/20' },
  'platform': { bg: 'bg-indigo-500', gradient: 'from-indigo-500 to-indigo-600', hover: 'hover:border-indigo-400/50', ring: 'ring-indigo-500/20' },
  'middleware': { bg: 'bg-violet-500', gradient: 'from-violet-500 to-violet-600', hover: 'hover:border-violet-400/50', ring: 'ring-violet-500/20' },
  'card-services': { bg: 'bg-blue-500', gradient: 'from-blue-500 to-blue-600', hover: 'hover:border-blue-400/50', ring: 'ring-blue-500/20' },
  'lending': { bg: 'bg-teal-500', gradient: 'from-teal-500 to-teal-600', hover: 'hover:border-teal-400/50', ring: 'ring-teal-500/20' },
  'esb': { bg: 'bg-sky-500', gradient: 'from-sky-500 to-sky-600', hover: 'hover:border-sky-400/50', ring: 'ring-sky-500/20' },
}

export function HomePage({ teamDemos = [], onDemoAppClick }) {
  const [hoveredDemo, setHoveredDemo] = useState(null)

  const handleDemoClick = (demo) => {
    if (onDemoAppClick) {
      onDemoAppClick(demo)
    } else {
      window.open(demo.url, '_blank')
    }
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
        </div>
      )}

    </div>
  )
}

export default HomePage
