import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Play,
  Code,
  Database,
  Building2,
  Filter
} from 'lucide-react'
import { clsx } from 'clsx'

export function SystemPage({ system, onBack, activeFilter }) {
  if (!system) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">System not found</p>
      </div>
    )
  }

  const { name, description, overview, color, apis, documentation, demoLinks } = system

  // Filter APIs based on activeFilter
  const filteredApis = apis?.filter(api => {
    if (activeFilter === 'all') return true
    return api.type === activeFilter
  }) || []

  // Get counts for display
  const temenosCount = apis?.filter(api => api.type === 'temenos').length || 0
  const thirdPartyCount = apis?.filter(api => api.type === '3rdparty').length || 0

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={onBack}
          className="group flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Systems</span>
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-3 text-white tracking-tight">{name}</h1>
            <p className="text-lg text-slate-300 max-w-2xl">{description}</p>
          </div>
          {/* API Type Badges */}
          <div className="flex items-center gap-3">
            {temenosCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Database className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-400">{temenosCount} Temenos</span>
              </div>
            )}
            {thirdPartyCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <Building2 className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-purple-400">{thirdPartyCount} 3rd Party</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overview Card */}
      {overview && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-700/50">
          <h2 className="text-lg font-semibold mb-3 text-white">Overview</h2>
          <p className="text-slate-300 leading-relaxed">{overview}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* APIs Section */}
        <div className="lg:col-span-2">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-700/50">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Code className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">APIs & Developer Portal</h2>
                  <p className="text-xs text-slate-400">
                    {activeFilter === 'all'
                      ? `${filteredApis.length} APIs available`
                      : `Showing ${filteredApis.length} ${activeFilter === 'temenos' ? 'Temenos' : '3rd Party'} APIs`
                    }
                  </p>
                </div>
              </div>
              {activeFilter !== 'all' && (
                <div className={clsx(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium",
                  activeFilter === 'temenos'
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                )}>
                  <Filter className="w-3 h-3" />
                  {activeFilter === 'temenos' ? 'Temenos' : '3rd Party'}
                </div>
              )}
            </div>

            {filteredApis.length > 0 ? (
              <div className="space-y-3">
                {filteredApis.map((api, index) => (
                  <div
                    key={index}
                    className="group flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/30 hover:border-slate-600/50 hover:bg-slate-800/80 transition-all duration-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className="font-medium text-white">{api.name}</span>
                        {api.version && (
                          <span className="text-xs bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded-md">
                            v{api.version}
                          </span>
                        )}
                        <span className={clsx(
                          "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md",
                          api.type === 'temenos'
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        )}>
                          {api.type === 'temenos' ? <Database className="w-2.5 h-2.5" /> : <Building2 className="w-2.5 h-2.5" />}
                          {api.type === 'temenos' ? 'Temenos' : '3rd Party'}
                        </span>
                      </div>
                      {api.description && (
                        <p className="text-sm text-slate-400">{api.description}</p>
                      )}
                    </div>
                    <a
                      href={api.portalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={clsx(
                        "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                        "bg-gradient-to-r text-white shadow-lg",
                        api.type === 'temenos'
                          ? "from-blue-500 to-blue-600 shadow-blue-500/20 hover:shadow-blue-500/30"
                          : "from-purple-500 to-purple-600 shadow-purple-500/20 hover:shadow-purple-500/30",
                        "hover:scale-105"
                      )}
                    >
                      <span>View in Portal</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                  <Code className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400">No APIs available for the selected filter</p>
                <p className="text-sm text-slate-500 mt-1">Try selecting "All Systems" to see all APIs</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="space-y-6">
          {/* Documentation */}
          {documentation && documentation.length > 0 && (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-700/50">
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-700/50">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base font-semibold text-white">Documentation</h3>
              </div>
              <div className="space-y-2">
                {documentation.map((doc, index) => (
                  <a
                    key={index}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 rounded-xl bg-slate-800/50 border border-slate-700/30 hover:border-amber-500/30 hover:bg-slate-800/80 transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-white group-hover:text-amber-400 transition-colors text-sm block truncate">
                          {doc.title}
                        </span>
                        {doc.description && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{doc.description}</p>
                        )}
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors flex-shrink-0 ml-3" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Demo Links */}
          {demoLinks && demoLinks.length > 0 && (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-700/50">
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-700/50">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <Play className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base font-semibold text-white">Demo Environment</h3>
              </div>
              <div className="space-y-2">
                {demoLinks.map((demo, index) => (
                  <a
                    key={index}
                    href={demo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 rounded-xl bg-slate-800/50 border border-slate-700/30 hover:border-emerald-500/30 hover:bg-slate-800/80 transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-white group-hover:text-emerald-400 transition-colors text-sm block truncate">
                          {demo.title}
                        </span>
                        {demo.description && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{demo.description}</p>
                        )}
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors flex-shrink-0 ml-3" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SystemPage
