import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Layers, ArrowRight, Database, Cloud, Server, RefreshCw, ChevronRight, Play, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'

interface IntegrationMapping {
  eventFile: string;
  apiFile: string;
}

interface ApiConfig {
  contentType: string;
  authType: string;
  username: string;
  password: string;
  companyId: string;
  endpoints: Record<string, string>;
}

interface EventItem {
  eventId: string;
  type: string;
  time: string;
  subject: string;
  data: any;
  status: 'pending' | 'pulling' | 'mapping' | 'sending' | 'success' | 'failed';
  transactionId?: string;
  error?: string;
}

function MiddlewarePage() {
  const navigate = useNavigate()
  const [mappings, setMappings] = useState<IntegrationMapping[]>([])
  const [apiConfig, setApiConfig] = useState<ApiConfig | null>(null)
  const [selectedMapping, setSelectedMapping] = useState<IntegrationMapping | null>(null)
  const [eventStructure, setEventStructure] = useState<any>(null)
  const [apiStructure, setApiStructure] = useState<any>(null)
  const [events, setEvents] = useState<EventItem[]>([])
  const [isLoadingConfig, setIsLoadingConfig] = useState(false)
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentProcessingEvent, setCurrentProcessingEvent] = useState<string | null>(null)
  const [processedCount, setProcessedCount] = useState(0)
  const [animationStep, setAnimationStep] = useState(0)
  const [isRefreshingConfig, setIsRefreshingConfig] = useState(false)
  const [lastConfigLoad, setLastConfigLoad] = useState<string>('')

  // Load integration mappings and API config on mount
  useEffect(() => {
    loadConfiguration()
  }, [])

  const loadConfiguration = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshingConfig(true)
    try {
      // Add cache-busting timestamp to prevent browser caching
      const cacheBuster = `?t=${Date.now()}`

      // Load Integration-Mapping.txt from backend API (reads from source folder)
      const mappingResponse = await fetch(`/api/config/Integration-Mapping.txt${cacheBuster}`)
      const mappingText = await mappingResponse.text()
      const parsedMappings = parseMappings(mappingText)
      setMappings(parsedMappings)

      // Load api.properties from backend API
      const apiResponse = await fetch(`/api/config/api.properties${cacheBuster}`)
      const apiText = await apiResponse.text()
      const parsedApi = parseApiProperties(apiText)
      setApiConfig(parsedApi)

      setLastConfigLoad(new Date().toLocaleTimeString())

      // Reset selection if current mapping no longer exists
      if (selectedMapping && !parsedMappings.find(m => m.eventFile === selectedMapping.eventFile)) {
        setSelectedMapping(null)
        setEventStructure(null)
        setApiStructure(null)
        setEvents([])
      }
    } catch (error) {
      console.error('Error loading configuration:', error)
    } finally {
      if (showRefresh) setIsRefreshingConfig(false)
    }
  }

  const parseMappings = (text: string): IntegrationMapping[] => {
    const lines = text.trim().split('\n')
    return lines.map(line => {
      const match = line.match(/EVENT:(.+)=API:(.+)/)
      if (match) {
        return { eventFile: match[1], apiFile: match[2] }
      }
      return null
    }).filter(Boolean) as IntegrationMapping[]
  }

  const parseApiProperties = (text: string): ApiConfig => {
    const lines = text.trim().split('\n')
    const config: ApiConfig = {
      contentType: '',
      authType: '',
      username: '',
      password: '',
      companyId: '',
      endpoints: {}
    }

    lines.forEach(line => {
      const [key, ...valueParts] = line.split(':')
      const value = valueParts.join(':').trim()

      if (key.includes('Content-Type')) config.contentType = value
      else if (key.includes('Auth Type')) config.authType = value
      else if (key.includes('Username')) config.username = value
      else if (key.includes('Password')) config.password = value
      else if (key.includes('companyId')) config.companyId = value
      else if (key.startsWith('URL_')) {
        config.endpoints[key.replace('URL_', '')] = value
      }
    })

    return config
  }

  const loadEventAndApiStructure = async (mapping: IntegrationMapping) => {
    setIsLoadingConfig(true)
    setSelectedMapping(mapping)
    setEvents([])
    setProcessedCount(0)

    try {
      // Add cache-busting timestamp
      const cacheBuster = `?t=${Date.now()}`

      const [eventResponse, apiResponse] = await Promise.all([
        fetch(`/api/config/${mapping.eventFile}${cacheBuster}`),
        fetch(`/api/config/${mapping.apiFile}${cacheBuster}`)
      ])

      const eventJson = await eventResponse.json()
      const apiJson = await apiResponse.json()

      setEventStructure(eventJson)
      setApiStructure(apiJson)

      // Now load actual events from Event Hub
      await loadEventsFromEventHub(eventJson.type)
    } catch (error) {
      console.error('Error loading event/api files:', error)
    } finally {
      setIsLoadingConfig(false)
    }
  }

  const loadEventsFromEventHub = async (eventType: string) => {
    setIsLoadingEvents(true)
    try {
      const response = await fetch(`/api/middleware/events/${encodeURIComponent(eventType)}`)
      const result = await response.json()

      if (result.success) {
        setEvents(result.events)
      }
    } catch (error) {
      console.error('Error loading events from Event Hub:', error)
    } finally {
      setIsLoadingEvents(false)
    }
  }

  const flattenObject = (obj: any, prefix = ''): { path: string; value: any }[] => {
    const result: { path: string; value: any }[] = []

    for (const key in obj) {
      const fullPath = prefix ? `${prefix}.${key}` : key

      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        result.push(...flattenObject(obj[key], fullPath))
      } else if (Array.isArray(obj[key])) {
        result.push({ path: fullPath, value: `[Array: ${obj[key].length} items]` })
        if (obj[key].length > 0 && typeof obj[key][0] === 'object') {
          result.push(...flattenObject(obj[key][0], `${fullPath}[0]`))
        }
      } else {
        result.push({ path: fullPath, value: obj[key] })
      }
    }

    return result
  }

  const getEventType = () => {
    return eventStructure?.type || 'Select an event'
  }

  const getApiEndpoint = () => {
    if (!selectedMapping || !apiConfig) return 'N/A'
    const eventType = selectedMapping.eventFile
    if (eventType.includes('customer')) return apiConfig.endpoints['CreateCustomer'] || 'N/A'
    if (eventType.includes('account')) return apiConfig.endpoints['CreateAccount'] || 'N/A'
    return 'N/A'
  }

  // Field mapping connections (predefined mappings)
  const fieldMappings: Record<string, Record<string, string>> = {
    'cloudevent-createcustomer.json': {
      'data.personalDetails.firstName': 'body.givenName',
      'data.personalDetails.lastName': 'body.lastName',
      'data.personalDetails.nationality': 'body.nationalityId',
      'data.personalDetails.dateOfBirth': 'body.dateOfBirth',
      'data.contactDetails.email': 'body.communicationDevices[0].emailId',
      'data.addresses[0].country': 'body.addressLine1'
    },
    'cloudevent-createaccount.json': {
      'data.customerId': 'body.customerId',
      'data.accountType': 'body.accountType',
      'data.currency': 'body.currencyId',
      'data.branchCode': 'body.branchId',
      'data.productCode': 'body.productId',
      'data.openedDate': 'body.openingDate',
      'data.balance.available': 'body.initialDeposit.amount',
      'data.interest.rate': 'body.interestDetails.rate',
      'data.interest.rateType': 'body.interestDetails.rateType'
    }
  }

  const getCurrentMappings = () => {
    if (!selectedMapping) return {}
    return fieldMappings[selectedMapping.eventFile] || {}
  }

  const processAllEvents = async () => {
    if (!selectedMapping || events.length === 0) return

    setIsProcessing(true)
    setProcessedCount(0)

    const mappings = getCurrentMappings()
    const apiEndpoint = getApiEndpoint()

    for (let i = 0; i < events.length; i++) {
      const event = events[i]
      setCurrentProcessingEvent(event.eventId)

      // Step 1: Pulling
      setAnimationStep(1)
      updateEventStatus(event.eventId, 'pulling')
      await sleep(400)

      // Step 2: Mapping
      setAnimationStep(2)
      updateEventStatus(event.eventId, 'mapping')
      await sleep(400)

      // Step 3: Sending
      setAnimationStep(3)
      updateEventStatus(event.eventId, 'sending')

      try {
        const response = await fetch('/api/middleware/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: event.eventId,
            eventType: event.type,
            eventData: event.data,
            apiEndpoint: apiEndpoint,
            fieldMappings: mappings
          })
        })

        const result = await response.json()

        if (result.success) {
          updateEventStatus(event.eventId, 'success', result.apiResponse?.transactionId)
        } else {
          updateEventStatus(event.eventId, 'failed', undefined, result.message)
        }
      } catch (error) {
        updateEventStatus(event.eventId, 'failed', undefined, (error as Error).message)
      }

      setProcessedCount(i + 1)
      await sleep(200)
    }

    setIsProcessing(false)
    setCurrentProcessingEvent(null)
    setAnimationStep(0)
  }

  const updateEventStatus = (eventId: string, status: EventItem['status'], transactionId?: string, error?: string) => {
    setEvents(prev => prev.map(e =>
      e.eventId === eventId
        ? { ...e, status, transactionId, error }
        : e
    ))
  }

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const getStatusIcon = (status: EventItem['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-gray-400" />
      case 'pulling': return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
      case 'mapping': return <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
      case 'sending': return <Loader2 className="w-4 h-4 text-green-400 animate-spin" />
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />
    }
  }

  const getStatusText = (status: EventItem['status']) => {
    switch (status) {
      case 'pending': return 'Pending'
      case 'pulling': return 'Pulling...'
      case 'mapping': return 'Mapping...'
      case 'sending': return 'Sending...'
      case 'success': return 'Success'
      case 'failed': return 'Failed'
    }
  }

  return (
    <div className="min-h-screen p-8">
      <button
        onClick={() => navigate('/')}
        className="btn-secondary flex items-center gap-2 mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </button>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-orange-500 w-16 h-16 rounded-lg flex items-center justify-center text-white">
              <Layers className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">MIDDLEWARE</h1>
              <p className="text-[#94a3b8]">Event to API Integration Layer</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {lastConfigLoad && (
              <span className="text-xs text-[#94a3b8]">
                Config loaded: {lastConfigLoad}
              </span>
            )}
            <button
              onClick={() => loadConfiguration(true)}
              disabled={isRefreshingConfig || isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
              title="Reload configuration files (Integration-Mapping.txt, api.properties, JSON files)"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshingConfig ? 'animate-spin' : ''}`} />
              Refresh Config
            </button>
          </div>
        </div>

        {/* ROW 1: Source, Event Type, Destination, API Payload */}
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700 mb-6">
          <div className="grid grid-cols-4 gap-4">
            {/* Source System (EVENT) */}
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-2">
                <Cloud className="w-4 h-4 inline mr-2" />
                Source System (EVENT)
              </label>
              <select
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={selectedMapping?.eventFile || ''}
                onChange={(e) => {
                  const mapping = mappings.find(m => m.eventFile === e.target.value)
                  if (mapping) loadEventAndApiStructure(mapping)
                }}
                disabled={isProcessing}
              >
                <option value="">Select Event...</option>
                {mappings.map((mapping, idx) => (
                  <option key={idx} value={mapping.eventFile}>
                    {mapping.eventFile.replace('cloudevent-', '').replace('.json', '')}
                  </option>
                ))}
              </select>
            </div>

            {/* Event Type */}
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-2">
                <Database className="w-4 h-4 inline mr-2" />
                Event Type
              </label>
              <div className="px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-md text-orange-400 font-mono text-sm">
                {getEventType()}
              </div>
            </div>

            {/* Destination System (API) */}
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-2">
                <Server className="w-4 h-4 inline mr-2" />
                Destination System (API)
              </label>
              <div className="px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-md text-white">
                {selectedMapping?.apiFile.replace('api-', '').replace('.json', '') || 'N/A'}
              </div>
            </div>

            {/* API Endpoint */}
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-2">
                API Endpoint
              </label>
              <div className="px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-md text-green-400 font-mono text-xs truncate" title={getApiEndpoint()}>
                {getApiEndpoint()}
              </div>
            </div>
          </div>

          {/* Events List Section */}
          {selectedMapping && (
            <div className="mt-6 pt-6 border-t border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-400" />
                  Events from Event Hub
                  {events.length > 0 && (
                    <span className="text-sm text-[#94a3b8] font-normal">
                      ({events.length} events found)
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-3">
                  {isProcessing && (
                    <span className="text-sm text-orange-400">
                      Processing {processedCount}/{events.length}...
                    </span>
                  )}
                  <button
                    onClick={processAllEvents}
                    disabled={isProcessing || events.length === 0 || isLoadingEvents}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    {isProcessing ? 'Processing...' : 'Run All'}
                  </button>
                </div>
              </div>

              {isLoadingEvents ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-2" />
                  <p className="text-[#94a3b8]">Loading events from Event Hub...</p>
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-8 bg-slate-900/50 rounded-lg">
                  <p className="text-[#94a3b8]">No events found for this type</p>
                </div>
              ) : (
                <div className="bg-slate-900/50 rounded-lg border border-slate-700 max-h-48 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-800">
                      <tr>
                        <th className="text-left px-4 py-2 text-[#94a3b8] font-medium">Event ID</th>
                        <th className="text-left px-4 py-2 text-[#94a3b8] font-medium">Subject</th>
                        <th className="text-left px-4 py-2 text-[#94a3b8] font-medium">Time</th>
                        <th className="text-left px-4 py-2 text-[#94a3b8] font-medium">Status</th>
                        <th className="text-left px-4 py-2 text-[#94a3b8] font-medium">Transaction ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((event) => (
                        <tr
                          key={event.eventId}
                          className={`border-t border-slate-700 ${
                            currentProcessingEvent === event.eventId ? 'bg-orange-900/20' : ''
                          }`}
                        >
                          <td className="px-4 py-2 text-white font-mono text-xs">{event.eventId.slice(0, 8)}...</td>
                          <td className="px-4 py-2 text-white">{event.subject}</td>
                          <td className="px-4 py-2 text-[#94a3b8]">{new Date(event.time).toLocaleString()}</td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(event.status)}
                              <span className={`${
                                event.status === 'success' ? 'text-green-400' :
                                event.status === 'failed' ? 'text-red-400' :
                                event.status === 'pending' ? 'text-gray-400' :
                                'text-orange-400'
                              }`}>
                                {getStatusText(event.status)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-green-400 font-mono text-xs">
                            {event.transactionId || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ROW 2: BPM Mapping (70%) + Animation (30%) */}
        <div className="grid grid-cols-10 gap-6">
          {/* Column 1: BPM-like Mapping Interface (70%) */}
          <div className="col-span-7 bg-slate-800/50 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-orange-500" />
              Field Mapping (Event → API)
            </h3>

            {!selectedMapping ? (
              <div className="text-center py-12 text-[#94a3b8]">
                <Layers className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Select an event from above to view field mappings</p>
              </div>
            ) : isLoadingConfig ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
                <p className="text-[#94a3b8]">Loading mapping configuration...</p>
              </div>
            ) : (
              <div className="flex gap-4">
                {/* Event Structure (Left) */}
                <div className="flex-1 bg-slate-900/50 rounded-lg p-4 border border-blue-500/30">
                  <h4 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
                    <Cloud className="w-4 h-4" />
                    Event Structure
                  </h4>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {eventStructure && flattenObject(eventStructure).map((field, idx) => {
                      const mappings = getCurrentMappings()
                      const isMapped = Object.keys(mappings).includes(field.path)
                      return (
                        <div
                          key={idx}
                          className={`flex items-center justify-between px-2 py-1 rounded text-xs ${
                            isMapped
                              ? 'bg-blue-900/30 border border-blue-500/50'
                              : 'bg-slate-800/50'
                          }`}
                        >
                          <span className={`font-mono ${isMapped ? 'text-blue-300' : 'text-[#94a3b8]'}`}>
                            {field.path}
                          </span>
                          {isMapped && (
                            <ChevronRight className="w-4 h-4 text-orange-500" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Mapping Lines (Center) */}
                <div className="w-24 flex flex-col items-center justify-center">
                  <div className="relative w-full h-64">
                    {Object.entries(getCurrentMappings()).map((_, idx) => (
                      <div
                        key={idx}
                        className="absolute w-full flex items-center"
                        style={{ top: `${(idx * 28) + 10}px` }}
                      >
                        <div className={`flex-1 border-t-2 border-dashed ${
                          isProcessing && animationStep === 2 ? 'border-orange-500 animate-pulse' : 'border-orange-500/50'
                        }`} />
                        <ArrowRight className={`w-4 h-4 -ml-1 ${
                          isProcessing && animationStep === 2 ? 'text-orange-500' : 'text-orange-500/50'
                        }`} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* API Structure (Right) */}
                <div className="flex-1 bg-slate-900/50 rounded-lg p-4 border border-green-500/30">
                  <h4 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
                    <Server className="w-4 h-4" />
                    API Structure
                  </h4>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {apiStructure && flattenObject(apiStructure).map((field, idx) => {
                      const mappings = getCurrentMappings()
                      const isMapped = Object.values(mappings).includes(field.path)
                      return (
                        <div
                          key={idx}
                          className={`flex items-center px-2 py-1 rounded text-xs ${
                            isMapped
                              ? 'bg-green-900/30 border border-green-500/50'
                              : 'bg-slate-800/50'
                          }`}
                        >
                          <span className={`font-mono ${isMapped ? 'text-green-300' : 'text-[#94a3b8]'}`}>
                            {field.path}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Mapping Legend */}
            {selectedMapping && !isLoadingConfig && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <h5 className="text-sm font-medium text-[#94a3b8] mb-2">Active Mappings:</h5>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(getCurrentMappings()).map(([source, target], idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-900/50 px-3 py-2 rounded">
                      <span className="text-blue-400 font-mono">{source}</span>
                      <ArrowRight className="w-3 h-3 text-orange-500" />
                      <span className="text-green-400 font-mono">{target}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Column 2: Visual Animation (30%) */}
          <div className="col-span-3 bg-slate-800/50 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Data Flow</h3>

            <div className="flex flex-col items-center justify-center h-80 relative">
              {/* Event Hub */}
              <div className={`w-32 h-20 rounded-lg flex flex-col items-center justify-center transition-all duration-300 ${
                isProcessing && animationStep >= 1 ? 'bg-blue-600 scale-110 shadow-lg shadow-blue-500/50' : 'bg-blue-900/50'
              }`}>
                <Cloud className="w-8 h-8 text-white mb-1" />
                <span className="text-xs text-white font-medium">Event Hub</span>
              </div>

              {/* Arrow 1 */}
              <div className="h-8 flex items-center">
                <div className={`w-0.5 h-full transition-all duration-300 ${
                  isProcessing && animationStep >= 1 ? 'bg-blue-500' : 'bg-slate-600'
                }`} />
              </div>

              {/* Data Packet Animation */}
              <div className={`w-16 h-8 rounded flex items-center justify-center transition-all duration-300 ${
                isProcessing && animationStep >= 1 ? 'bg-orange-500 animate-bounce shadow-lg shadow-orange-500/50' : 'bg-slate-700'
              }`}>
                <span className="text-xs text-white font-mono">
                  {isProcessing ? '{ }' : '...'}
                </span>
              </div>

              {/* Arrow 2 */}
              <div className="h-8 flex items-center">
                <div className={`w-0.5 h-full transition-all duration-300 ${
                  isProcessing && animationStep >= 2 ? 'bg-orange-500' : 'bg-slate-600'
                }`} />
              </div>

              {/* Middleware */}
              <div className={`w-32 h-20 rounded-lg flex flex-col items-center justify-center transition-all duration-300 ${
                isProcessing && animationStep >= 2 ? 'bg-orange-600 scale-110 shadow-lg shadow-orange-500/50' : 'bg-orange-900/50'
              }`}>
                <Layers className="w-8 h-8 text-white mb-1" />
                <span className="text-xs text-white font-medium">Middleware</span>
              </div>

              {/* Arrow 3 */}
              <div className="h-8 flex items-center">
                <div className={`w-0.5 h-full transition-all duration-300 ${
                  isProcessing && animationStep >= 3 ? 'bg-green-500' : 'bg-slate-600'
                }`} />
              </div>

              {/* Transact */}
              <div className={`w-32 h-20 rounded-lg flex flex-col items-center justify-center transition-all duration-300 ${
                isProcessing && animationStep >= 3 ? 'bg-green-600 scale-110 shadow-lg shadow-green-500/50' : 'bg-green-900/50'
              }`}>
                <Server className="w-8 h-8 text-white mb-1" />
                <span className="text-xs text-white font-medium">Transact</span>
              </div>

              {/* Status Text */}
              <div className="mt-4 text-center">
                <p className={`text-sm font-medium ${
                  isProcessing ? 'text-orange-400' : 'text-[#94a3b8]'
                }`}>
                  {!isProcessing && !selectedMapping && 'Select an event to start'}
                  {!isProcessing && selectedMapping && events.length === 0 && 'No events to process'}
                  {!isProcessing && selectedMapping && events.length > 0 && 'Click "Run All" to process'}
                  {isProcessing && animationStep === 1 && 'Pulling from Event Hub...'}
                  {isProcessing && animationStep === 2 && 'Mapping to API format...'}
                  {isProcessing && animationStep === 3 && 'Sending to Transact...'}
                </p>
              </div>
            </div>

            {/* Processing Stats */}
            {selectedMapping && events.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <h5 className="text-xs font-medium text-[#94a3b8] mb-2">Processing Stats:</h5>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between bg-slate-900/50 px-3 py-2 rounded">
                    <span className="text-[#94a3b8]">Total:</span>
                    <span className="text-white">{events.length}</span>
                  </div>
                  <div className="flex justify-between bg-slate-900/50 px-3 py-2 rounded">
                    <span className="text-[#94a3b8]">Processed:</span>
                    <span className="text-green-400">{events.filter(e => e.status === 'success').length}</span>
                  </div>
                  <div className="flex justify-between bg-slate-900/50 px-3 py-2 rounded">
                    <span className="text-[#94a3b8]">Failed:</span>
                    <span className="text-red-400">{events.filter(e => e.status === 'failed').length}</span>
                  </div>
                  <div className="flex justify-between bg-slate-900/50 px-3 py-2 rounded">
                    <span className="text-[#94a3b8]">Pending:</span>
                    <span className="text-gray-400">{events.filter(e => e.status === 'pending').length}</span>
                  </div>
                </div>
              </div>
            )}

            {/* API Config Info */}
            {apiConfig && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <h5 className="text-xs font-medium text-[#94a3b8] mb-2">API Configuration:</h5>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#94a3b8]">Auth:</span>
                    <span className="text-white">{apiConfig.authType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94a3b8]">Company:</span>
                    <span className="text-white">{apiConfig.companyId}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MiddlewarePage
