import { useState, useRef } from 'react'
import {
  ArrowLeft,
  Upload,
  Palette,
  Check,
  X,
  RefreshCw,
  Save,
  CreditCard,
  FileCheck,
  Smartphone,
  Landmark,
  Database,
  BarChart3,
  Building,
  Shield,
  Link2,
  Zap,
  Clock,
  FileInput,
  MessageSquare,
  Webhook
} from 'lucide-react'
import { clsx } from 'clsx'
import { useClientConfig, integrationOptions } from '../context/ClientConfigContext'

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

const integrationIcons = {
  'api': Link2,
  'batch': Clock,
  'realtime': Zap,
  'webhook': Webhook,
  'file': FileInput,
  'message': MessageSquare,
}

const presetColors = [
  { name: 'Blue', primary: '#3B82F6', secondary: '#1E40AF' },
  { name: 'Purple', primary: '#8B5CF6', secondary: '#6D28D9' },
  { name: 'Green', primary: '#22C55E', secondary: '#15803D' },
  { name: 'Red', primary: '#EF4444', secondary: '#B91C1C' },
  { name: 'Orange', primary: '#F59E0B', secondary: '#D97706' },
  { name: 'Teal', primary: '#14B8A6', secondary: '#0D9488' },
  { name: 'Pink', primary: '#EC4899', secondary: '#BE185D' },
  { name: 'Indigo', primary: '#6366F1', secondary: '#4338CA' },
]

export function ClientConfigPage({ systems, onBack }) {
  const {
    config,
    updateConfig,
    toggleSystem,
    setIntegrationMethod,
    resetConfig,
  } = useClientConfig()

  const [activeTab, setActiveTab] = useState('systems')
  const [saveStatus, setSaveStatus] = useState(null)
  const fileInputRef = useRef(null)

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        updateConfig({ clientLogo: reader.result })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = () => {
    setSaveStatus('saving')
    setTimeout(() => {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus(null), 2000)
    }, 500)
  }

  const enabledCount = Object.values(config.enabledSystems).filter(Boolean).length

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={onBack}
          className="group flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Home</span>
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-3 text-white tracking-tight">
              Client Environment Variables
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl">
              Configure client systems, integrations, and branding to customize the experience
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={resetConfig}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm font-medium">Reset</span>
            </button>
            <button
              onClick={handleSave}
              className={clsx(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium transition-all",
                saveStatus === 'saved'
                  ? "bg-green-500"
                  : "bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg hover:shadow-blue-500/25"
              )}
            >
              {saveStatus === 'saved' ? (
                <>
                  <Check className="w-4 h-4" />
                  <span className="text-sm">Saved</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span className="text-sm">Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-800/60 rounded-xl w-fit">
        {[
          { id: 'systems', label: 'Systems & Integrations' },
          { id: 'branding', label: 'Branding' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "px-5 py-2.5 rounded-lg text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Systems & Integrations Tab */}
      {activeTab === 'systems' && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <p className="text-sm text-slate-300">
              <span className="text-white font-semibold">{enabledCount}</span> of {systems.length} systems enabled
            </p>
          </div>

          {/* Systems Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {systems.map((system) => {
              const Icon = systemIcons[system.icon] || Database
              const isEnabled = config.enabledSystems[system.id]
              const currentMethod = config.integrationMethods[system.id]?.method || 'api'

              return (
                <div
                  key={system.id}
                  className={clsx(
                    "p-5 rounded-2xl border transition-all duration-300",
                    isEnabled
                      ? "bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50"
                      : "bg-slate-900/50 border-slate-800/50 opacity-60"
                  )}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={clsx(
                          "w-11 h-11 rounded-xl flex items-center justify-center transition-all",
                          isEnabled ? "bg-gradient-to-br from-blue-500 to-blue-600" : "bg-slate-700"
                        )}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{system.name}</h3>
                        <p className="text-xs text-slate-400">{system.apis?.length || 0} APIs available</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleSystem(system.id)}
                      className={clsx(
                        "w-12 h-7 rounded-full transition-all duration-200 flex items-center",
                        isEnabled ? "bg-blue-500 justify-end" : "bg-slate-700 justify-start"
                      )}
                    >
                      <div className="w-5 h-5 mx-1 rounded-full bg-white shadow-md" />
                    </button>
                  </div>

                  {isEnabled && (
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Integration Method
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {integrationOptions.map((option) => {
                          const IntIcon = integrationIcons[option.id] || Link2
                          const isSelected = currentMethod === option.id
                          return (
                            <button
                              key={option.id}
                              onClick={() => setIntegrationMethod(system.id, option.id)}
                              className={clsx(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                isSelected
                                  ? "text-white shadow-md"
                                  : "bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50 border border-slate-700/30"
                              )}
                              style={isSelected ? { backgroundColor: option.color } : {}}
                            >
                              <IntIcon className="w-3 h-3" />
                              {option.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Branding Tab */}
      {activeTab === 'branding' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Client Info */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-5">Client Information</h3>

            {/* Client Name */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Client Name
              </label>
              <input
                type="text"
                value={config.clientName}
                onChange={(e) => updateConfig({ clientName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25 transition-all"
                placeholder="Enter client name"
              />
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Client Logo
              </label>
              <div className="flex items-center gap-4">
                <div
                  className={clsx(
                    "w-20 h-20 rounded-xl flex items-center justify-center overflow-hidden",
                    config.clientLogo ? "bg-white" : "bg-slate-800/50 border-2 border-dashed border-slate-700"
                  )}
                >
                  {config.clientLogo ? (
                    <img
                      src={config.clientLogo}
                      alt="Client Logo"
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <Upload className="w-6 h-6 text-slate-500" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-lg bg-slate-700/50 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
                  >
                    Upload Logo
                  </button>
                  {config.clientLogo && (
                    <button
                      onClick={() => updateConfig({ clientLogo: null })}
                      className="px-4 py-2 rounded-lg text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Color Theme */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
              <Palette className="w-5 h-5 text-blue-400" />
              Color Theme
            </h3>

            {/* Preset Colors */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-400 mb-3">
                Preset Themes
              </label>
              <div className="grid grid-cols-4 gap-2">
                {presetColors.map((preset) => {
                  const isSelected = config.primaryColor === preset.primary
                  return (
                    <button
                      key={preset.name}
                      onClick={() => updateConfig({
                        primaryColor: preset.primary,
                        secondaryColor: preset.secondary
                      })}
                      className={clsx(
                        "relative p-3 rounded-xl transition-all",
                        isSelected
                          ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900"
                          : "hover:scale-105"
                      )}
                      style={{ backgroundColor: preset.primary }}
                    >
                      <span className="text-xs font-medium text-white">{preset.name}</span>
                      {isSelected && (
                        <Check className="absolute top-1 right-1 w-3 h-3 text-white" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Custom Colors */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Primary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) => updateConfig({ primaryColor: e.target.value })}
                    className="w-12 h-12 rounded-lg cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={config.primaryColor}
                    onChange={(e) => updateConfig({ primaryColor: e.target.value })}
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white font-mono text-sm focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Secondary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={config.secondaryColor}
                    onChange={(e) => updateConfig({ secondaryColor: e.target.value })}
                    className="w-12 h-12 rounded-lg cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={config.secondaryColor}
                    onChange={(e) => updateConfig({ secondaryColor: e.target.value })}
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white font-mono text-sm focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-5">Live Preview</h3>
            <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-700/30">
              <div className="flex items-center gap-4 mb-6">
                {config.clientLogo ? (
                  <img
                    src={config.clientLogo}
                    alt="Preview Logo"
                    className="w-12 h-12 rounded-lg object-contain bg-white p-1"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    <span className="text-white font-bold text-lg">
                      {config.clientName.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-white">{config.clientName}</h4>
                  <p className="text-sm text-slate-400">Banking Ecosystem Demo</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  className="px-5 py-2.5 rounded-xl text-white font-medium"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  Primary Button
                </button>
                <button
                  className="px-5 py-2.5 rounded-xl text-white font-medium"
                  style={{ backgroundColor: config.secondaryColor }}
                >
                  Secondary Button
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClientConfigPage
