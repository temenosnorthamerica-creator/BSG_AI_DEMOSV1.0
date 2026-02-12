import { useState, useEffect, useCallback } from 'react'
import {
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Server,
  Monitor,
  Link2,
  ExternalLink,
  Clock,
  Wifi,
  WifiOff,
  Play,
  Square,
  RotateCcw,
  Loader2,
  PlayCircle,
  RefreshCcw,
  FileText,
  X,
  Trash2
} from 'lucide-react'
import { clsx } from 'clsx'
import { services, integrations, getBackends, getFrontends } from '../data/services'

const CONFIG_API_URL = 'http://localhost:3010'

// Status types
const STATUS = {
  CHECKING: 'checking',
  ONLINE: 'online',
  OFFLINE: 'offline',
  ERROR: 'error'
}

// Check single service health
async function checkServiceHealth(service) {
  const startTime = Date.now()
  const url = `http://localhost:${service.port}${service.healthEndpoint || ''}`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    const response = await fetch(url, {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal
    })

    clearTimeout(timeoutId)
    const responseTime = Date.now() - startTime

    // no-cors mode always returns opaque response, so we assume success if no error
    return {
      status: STATUS.ONLINE,
      responseTime,
      lastChecked: new Date()
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      return {
        status: STATUS.OFFLINE,
        error: 'Timeout',
        lastChecked: new Date()
      }
    }
    return {
      status: STATUS.OFFLINE,
      error: error.message,
      lastChecked: new Date()
    }
  }
}

// Check Config API specifically (has CORS enabled)
async function checkConfigApi() {
  const startTime = Date.now()

  try {
    const response = await fetch(`${CONFIG_API_URL}/health`, {
      method: 'GET'
    })

    const responseTime = Date.now() - startTime

    if (response.ok) {
      const data = await response.json()
      return {
        status: STATUS.ONLINE,
        responseTime,
        data,
        lastChecked: new Date()
      }
    } else {
      return {
        status: STATUS.ERROR,
        error: `HTTP ${response.status}`,
        lastChecked: new Date()
      }
    }
  } catch (error) {
    return {
      status: STATUS.OFFLINE,
      error: error.message,
      lastChecked: new Date()
    }
  }
}

// Log Viewer Modal Component
function LogViewerModal({ service, onClose }) {
  const [logs, setLogs] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const fetchLogs = useCallback(async () => {
    try {
      const response = await fetch(`${CONFIG_API_URL}/api/services/${service.id}/logs?lines=200`)
      const data = await response.json()
      if (data.exists) {
        setLogs(data.content)
      } else {
        setLogs('No logs available yet. Start the service to generate logs.')
      }
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [service.id])

  const clearLogs = async () => {
    try {
      await fetch(`${CONFIG_API_URL}/api/services/${service.id}/logs`, { method: 'DELETE' })
      fetchLogs()
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 2000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, fetchLogs])

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">{service.name} - Logs</h2>
            <span className="text-xs text-slate-500 font-mono">:{service.port}</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-3 h-3"
              />
              Auto-refresh
            </label>
            <button
              onClick={fetchLogs}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
              title="Refresh logs"
            >
              <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
            </button>
            <button
              onClick={clearLogs}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-all"
              title="Clear logs"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Log Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-red-400 text-center">{error}</div>
          ) : (
            <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap bg-slate-900 rounded-lg p-4 min-h-[300px]">
              {logs || 'No logs available'}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}

// Service Card Component with Controls
function ServiceCard({ service, health, onOpenService, onAction, onViewLogs, actionLoading }) {
  const isOnline = health?.status === STATUS.ONLINE
  const isChecking = health?.status === STATUS.CHECKING
  const isOffline = health?.status === STATUS.OFFLINE || health?.status === STATUS.ERROR
  const isConfigApi = service.id === 'config-api'
  const isActionLoading = actionLoading === service.id

  return (
    <div
      className={clsx(
        "p-4 rounded-xl border transition-all duration-300",
        isOnline && "bg-green-500/10 border-green-500/30",
        isChecking && "bg-amber-500/10 border-amber-500/30",
        isOffline && "bg-red-500/10 border-red-500/30",
        !health && "bg-slate-800/50 border-slate-700/50"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Status Indicator */}
          <div className={clsx(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            isOnline && "bg-green-500/20",
            isChecking && "bg-amber-500/20",
            isOffline && "bg-red-500/20",
            !health && "bg-slate-700/50"
          )}>
            {isChecking ? (
              <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
            ) : isOnline ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : isOffline ? (
              <XCircle className="w-5 h-5 text-red-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-slate-500" />
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">{service.name}</h3>
            <p className="text-xs text-slate-400">{service.description}</p>
          </div>
        </div>

        {/* Port Badge & Actions */}
        <div className="flex items-center gap-2">
          <span className={clsx(
            "px-2 py-1 rounded-lg text-xs font-mono",
            isOnline ? "bg-green-500/20 text-green-400" : "bg-slate-700 text-slate-400"
          )}>
            :{service.port}
          </span>

          {isOnline && (
            <button
              onClick={() => onOpenService(service)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Status Details */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs">
          {/* Status Text */}
          <span className={clsx(
            "flex items-center gap-1",
            isOnline && "text-green-400",
            isChecking && "text-amber-400",
            isOffline && "text-red-400"
          )}>
            {isOnline ? (
              <>
                <Wifi className="w-3 h-3" />
                Online
              </>
            ) : isChecking ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                Offline
              </>
            )}
          </span>

          {/* Response Time */}
          {health?.responseTime && (
            <span className="text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {health.responseTime}ms
            </span>
          )}

          {/* Error Message */}
          {health?.error && (
            <span className="text-red-400 truncate" title={health.error}>
              {health.error}
            </span>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-1">
          {isActionLoading ? (
            <div className="px-3 py-1 flex items-center gap-1 text-xs text-amber-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Working...</span>
            </div>
          ) : (
            <>
              {/* Start Button - show when offline */}
              {isOffline && (
                <button
                  onClick={() => onAction(service.id, 'start')}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all"
                  title="Start service"
                >
                  <Play className="w-3 h-3" />
                  <span>Start</span>
                </button>
              )}

              {/* Stop Button - show when online (except for config-api) */}
              {isOnline && !isConfigApi && (
                <button
                  onClick={() => onAction(service.id, 'stop')}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                  title="Stop service"
                >
                  <Square className="w-3 h-3" />
                  <span>Stop</span>
                </button>
              )}

              {/* Restart Button - show when online (except for config-api) */}
              {isOnline && !isConfigApi && (
                <button
                  onClick={() => onAction(service.id, 'restart')}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all"
                  title="Restart service"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restart</span>
                </button>
              )}

              {/* Config API indicator */}
              {isOnline && isConfigApi && (
                <span className="px-2 py-1 text-xs text-slate-500 italic">
                  Required
                </span>
              )}

              {/* Logs Button - show for all services except config-api */}
              {!isConfigApi && (
                <button
                  onClick={() => onViewLogs(service)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white transition-all"
                  title="View logs"
                >
                  <FileText className="w-3 h-3" />
                  <span>Logs</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Integration Status Card
function IntegrationCard({ integration, configApiHealth }) {
  const isOnline = configApiHealth?.status === STATUS.ONLINE

  return (
    <div className={clsx(
      "p-3 rounded-lg border flex items-center justify-between",
      isOnline ? "bg-blue-500/10 border-blue-500/30" : "bg-slate-800/50 border-slate-700/50"
    )}>
      <div className="flex items-center gap-3">
        <div className={clsx(
          "w-8 h-8 rounded-lg flex items-center justify-center",
          isOnline ? "bg-blue-500/20" : "bg-slate-700/50"
        )}>
          <Link2 className={clsx("w-4 h-4", isOnline ? "text-blue-400" : "text-slate-500")} />
        </div>
        <div>
          <h4 className="text-sm font-medium text-white">{integration.name}</h4>
          <p className="text-xs text-slate-400">{integration.description}</p>
        </div>
      </div>
      <span className={clsx(
        "text-xs font-medium",
        isOnline ? "text-blue-400" : "text-slate-500"
      )}>
        {isOnline ? 'Active' : 'Inactive'}
      </span>
    </div>
  )
}

// Notification Toast Component
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={clsx(
      "fixed bottom-4 right-4 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-slide-up z-50",
      type === 'success' && "bg-green-500/90 text-white",
      type === 'error' && "bg-red-500/90 text-white",
      type === 'info' && "bg-blue-500/90 text-white"
    )}>
      {type === 'success' && <CheckCircle className="w-5 h-5" />}
      {type === 'error' && <XCircle className="w-5 h-5" />}
      {type === 'info' && <AlertCircle className="w-5 h-5" />}
      <span className="text-sm font-medium">{message}</span>
    </div>
  )
}

export function HealthCheckPage() {
  const [healthStatus, setHealthStatus] = useState({})
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastFullCheck, setLastFullCheck] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const [bulkActionLoading, setBulkActionLoading] = useState(null)
  const [toast, setToast] = useState(null)
  const [logViewerService, setLogViewerService] = useState(null)

  const backends = getBackends()
  const frontends = getFrontends()

  // View logs handler
  const handleViewLogs = useCallback((service) => {
    setLogViewerService(service)
  }, [])

  // Show toast notification
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type })
  }, [])

  // Service action handler
  const handleServiceAction = useCallback(async (serviceId, action) => {
    setActionLoading(serviceId)
    try {
      const response = await fetch(`${CONFIG_API_URL}/api/services/${serviceId}/${action}`, {
        method: 'POST'
      })
      const data = await response.json()

      if (response.ok && data.success) {
        showToast(data.message, 'success')
        // Refresh status after action
        setTimeout(() => checkAllServices(), 1000)
      } else {
        showToast(data.error || `Failed to ${action} service`, 'error')
      }
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error')
    } finally {
      setActionLoading(null)
    }
  }, [showToast])

  // Bulk action handler (start all / restart all)
  const handleBulkAction = useCallback(async (action) => {
    setBulkActionLoading(action)
    try {
      const response = await fetch(`${CONFIG_API_URL}/api/services/${action}`, {
        method: 'POST'
      })
      const data = await response.json()

      if (response.ok && data.success) {
        const successCount = data.results.filter(r => r.success).length
        const failCount = data.results.filter(r => !r.success).length
        showToast(
          `${action === 'start-all' ? 'Started' : 'Restarted'} ${successCount} services${failCount > 0 ? `, ${failCount} failed` : ''}`,
          failCount > 0 ? 'info' : 'success'
        )
        // Refresh status after action
        setTimeout(() => checkAllServices(), 2000)
      } else {
        showToast(data.error || `Failed to ${action}`, 'error')
      }
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error')
    } finally {
      setBulkActionLoading(null)
    }
  }, [showToast])

  // Check all services
  const checkAllServices = useCallback(async () => {
    setIsRefreshing(true)

    const newStatus = {}

    // Set all to checking
    services.forEach(service => {
      newStatus[service.id] = { status: STATUS.CHECKING }
    })
    setHealthStatus(newStatus)

    // Check Config API first (has proper CORS)
    const configApiResult = await checkConfigApi()
    newStatus['config-api'] = configApiResult
    setHealthStatus({ ...newStatus })

    // Check other services in parallel
    const otherServices = services.filter(s => s.id !== 'config-api')
    const results = await Promise.all(
      otherServices.map(async (service) => {
        const result = await checkServiceHealth(service)
        return { id: service.id, result }
      })
    )

    results.forEach(({ id, result }) => {
      newStatus[id] = result
    })

    setHealthStatus({ ...newStatus })
    setLastFullCheck(new Date())
    setIsRefreshing(false)
  }, [])

  // Initial check and auto-refresh
  useEffect(() => {
    checkAllServices()

    if (autoRefresh) {
      const interval = setInterval(checkAllServices, 10000) // 10 seconds
      return () => clearInterval(interval)
    }
  }, [checkAllServices, autoRefresh])

  // Count statuses
  const onlineCount = Object.values(healthStatus).filter(h => h?.status === STATUS.ONLINE).length
  const offlineCount = Object.values(healthStatus).filter(h => h?.status === STATUS.OFFLINE || h?.status === STATUS.ERROR).length
  const checkingCount = Object.values(healthStatus).filter(h => h?.status === STATUS.CHECKING).length
  const totalCount = services.length

  // Open service in new tab
  const handleOpenService = (service) => {
    window.open(`http://localhost:${service.port}`, '_blank')
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-3 text-white tracking-tight flex items-center gap-3">
            <Activity className="w-8 h-8 text-green-400" />
            Health Check Dashboard
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl">
            Real-time status monitoring and control for all demo applications
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Start All Button */}
          <button
            onClick={() => handleBulkAction('start-all')}
            disabled={bulkActionLoading !== null}
            className={clsx(
              "flex items-center gap-2 px-3 py-2 rounded-xl transition-all",
              "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30",
              bulkActionLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            {bulkActionLoading === 'start-all' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <PlayCircle className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">Start All</span>
          </button>

          {/* Restart All Button */}
          <button
            onClick={() => handleBulkAction('restart-all')}
            disabled={bulkActionLoading !== null}
            className={clsx(
              "flex items-center gap-2 px-3 py-2 rounded-xl transition-all",
              "bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30",
              bulkActionLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            {bulkActionLoading === 'restart-all' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCcw className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">Restart All</span>
          </button>

          {/* Divider */}
          <div className="w-px h-8 bg-slate-700 mx-1"></div>

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={clsx(
              "flex items-center gap-2 px-3 py-2 rounded-xl transition-all",
              autoRefresh
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-slate-800/60 text-slate-400"
            )}
          >
            <RefreshCw className={clsx("w-4 h-4", autoRefresh && "animate-spin")} />
            <span className="text-sm font-medium">Auto</span>
          </button>

          {/* Manual Refresh */}
          <button
            onClick={checkAllServices}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-all disabled:opacity-50"
          >
            <RefreshCw className={clsx("w-4 h-4", isRefreshing && "animate-spin")} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Server className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalCount}</p>
              <p className="text-xs text-slate-400">Total Services</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-green-900/30 to-green-950/30 border border-green-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">{onlineCount}</p>
              <p className="text-xs text-slate-400">Online</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-red-900/30 to-red-950/30 border border-red-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">{offlineCount}</p>
              <p className="text-xs text-slate-400">Offline</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-900/30 to-amber-950/30 border border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <AlertCircle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">{checkingCount}</p>
              <p className="text-xs text-slate-400">Checking</p>
            </div>
          </div>
        </div>
      </div>

      {/* Last Check Time */}
      {lastFullCheck && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Clock className="w-4 h-4" />
          Last check: {lastFullCheck.toLocaleTimeString()}
          {autoRefresh && <span className="text-slate-500">(auto-refresh every 10s)</span>}
        </div>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Frontends */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Frontends</h2>
            <span className="text-xs text-slate-500">({frontends.length} services)</span>
          </div>

          <div className="space-y-3">
            {frontends.map(service => (
              <ServiceCard
                key={service.id}
                service={service}
                health={healthStatus[service.id]}
                onOpenService={handleOpenService}
                onAction={handleServiceAction}
                onViewLogs={handleViewLogs}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        </div>

        {/* Backends */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Backends</h2>
            <span className="text-xs text-slate-500">({backends.length} services)</span>
          </div>

          <div className="space-y-3">
            {backends.map(service => (
              <ServiceCard
                key={service.id}
                service={service}
                health={healthStatus[service.id]}
                onOpenService={handleOpenService}
                onAction={handleServiceAction}
                onViewLogs={handleViewLogs}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Integrations */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Integrations</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {integrations.map(integration => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              configApiHealth={healthStatus['config-api']}
            />
          ))}
        </div>
      </div>

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Log Viewer Modal */}
      {logViewerService && (
        <LogViewerModal
          service={logViewerService}
          onClose={() => setLogViewerService(null)}
        />
      )}

      {/* CSS for animation */}
      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

export default HealthCheckPage
