import { useState } from 'react'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { clsx } from 'clsx'
import { getAppUrl } from '../../utils/urlResolver'

export function AppLandingTemplate({
  app,
  navItems,
  onBack,
  IntegrationDiagram
}) {
  const [activeNav, setActiveNav] = useState(navItems[0]?.id || 'overview')

  const activeContent = navItems.find(item => item.id === activeNav)

  return (
    <div className="min-h-screen h-screen flex flex-col bg-gradient-to-br from-[#1a2035] via-[#151b2e] to-[#0f1422] overflow-hidden">
      {/* Top Navigation Section - Auto height based on content */}
      <div className="flex-shrink-0 flex flex-col">
        {/* Header with back button and app title */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-700/50">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </button>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: app.color + '20', border: `2px solid ${app.color}` }}
            >
              {app.iconComponent && <app.iconComponent className="w-5 h-5" style={{ color: app.color }} />}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{app.name}</h1>
              <p className="text-sm text-slate-400">{app.owner}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
              Port: {app.port}
            </span>
            {app.backendPort && (
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                Backend: {app.backendPort}
              </span>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-center px-6 py-4">
          <div className="flex gap-2 flex-wrap justify-center">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeNav === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className={clsx(
                    "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 text-sm",
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 scale-105"
                      : "bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-700/60 border border-slate-700/50"
                  )}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom Section - 70% height */}
      <div className="flex-1 flex gap-4 p-4 min-h-0">
        {/* Left Panel - Detail Section (65% width) */}
        <div className="w-[65%] bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 flex flex-col overflow-hidden min-h-0">
          {/* Detail Content View */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">{activeContent?.title || 'Overview'}</h2>
              <a
                href={getAppUrl(app)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-all duration-300 hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${app.color}, ${app.color}dd)`,
                  boxShadow: `0 4px 15px ${app.color}40`
                }}
              >
                <ExternalLink className="w-4 h-4" />
                Open Demo in new Tab
              </a>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
              <div className="text-slate-300 leading-relaxed space-y-4">
                {activeContent?.content}
              </div>

              {/* Features List if available */}
              {activeContent?.features && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Key Features</h3>
                  <ul className="grid grid-cols-2 gap-3">
                    {activeContent.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-lg bg-slate-700/30 border border-slate-600/30"
                      >
                        <div
                          className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                          style={{ backgroundColor: app.color }}
                        />
                        <span className="text-sm text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Technical Details if available */}
              {activeContent?.technicalDetails && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Technical Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {activeContent.technicalDetails.map((detail, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/30"
                      >
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{detail.label}</p>
                        <p className="text-sm font-medium text-white">{detail.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Technical Integration Diagram (35% width) */}
        <div className="w-[35%] bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 flex flex-col overflow-hidden">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            Integration Flow
          </h2>
          <div className="flex-1 flex items-center justify-center">
            {IntegrationDiagram ? (
              <IntegrationDiagram color={app.color} />
            ) : (
              <div className="text-slate-500 text-center">
                <p>Integration diagram</p>
                <p className="text-sm">coming soon</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppLandingTemplate
