import { useState, useEffect } from 'react'
import { Code2, Radio, Database as DatabaseIcon, Loader2 } from 'lucide-react'
import { apiService } from '../services/api'
import type { ComponentId, DemoConfig, DemoSession } from '../types'
import { DatabaseRecords } from './DatabaseRecords'
import { ObservabilityDemo } from './observability/ObservabilityDemo'
import { IntegrationDemo } from './IntegrationDemo'

interface DemoFrameProps {
  componentId: ComponentId
}

export function DemoFrame({ componentId }: DemoFrameProps) {
  // Use specialized component for observability
  if (componentId === 'observability') {
    return <ObservabilityDemo />
  }

  // Use integration demo for integration component
  if (componentId === 'integration') {
    return <IntegrationDemo />
  }

  // Only show Data Architecture specific content for data-architecture component
  if (componentId === 'data-architecture') {
    return (
      <div className="space-y-6">
        {/* Top Tier - APIs and Events */}
        <div className="grid grid-cols-2 gap-6">
          {/* APIs Section */}
          <div className="card min-h-[400px] flex flex-col">
            <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-gray-200">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Code2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#283054]">APIs</h3>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Code2 className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p className="text-sm">API content will appear here</p>
              </div>
            </div>
          </div>

          {/* Events Section */}
          <div className="card min-h-[400px] flex flex-col">
            <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-gray-200">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <Radio className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#283054]">Events</h3>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Radio className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Event content will appear here</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Tier - Database Records */}
        <div className="card min-h-[500px] flex flex-col">
          <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-gray-200">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <DatabaseIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-[#283054]">Database Records</h3>
          </div>
          <div className="flex-1">
            <DatabaseRecords componentId={componentId} />
          </div>
        </div>
      </div>
    )
  }

  // For other components, try to load demo config
  const [_demoConfig, setDemoConfig] = useState<DemoConfig | null>(null)
  const [_session, _setSession] = useState<DemoSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [_connecting, _setConnecting] = useState(false)
  const [_error, _setError] = useState<string | null>(null)

  useEffect(() => {
    loadDemoConfig()
  }, [componentId])

  useEffect(() => {
    return () => {
      // Cleanup: disconnect on unmount
      if (_session?.session_id) {
        apiService.disconnectDemo(componentId, _session.session_id).catch(console.error)
      }
    }
  }, [_session, componentId])

  const loadDemoConfig = async () => {
    try {
      setLoading(true)
      _setError(null)
      const response = await apiService.getDemoConfig(componentId)
      setDemoConfig(response.data) // setDemoConfig is used
    } catch (err: any) {
      // If demo config doesn't exist, that's okay - show placeholder
      _setError(null)
    } finally {
      setLoading(false)
    }
  }

  // Demo connection functions - reserved for future use
  // const connectDemo = async () => { ... }
  // const disconnectDemo = async () => { ... }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  // For all other components, show a generic demo placeholder
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center text-gray-400">
        <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <Code2 className="w-12 h-12 opacity-30" />
        </div>
        <p className="text-lg font-medium text-gray-500 mb-2">Demo Coming Soon</p>
        <p className="text-sm">Interactive demo content will be available here</p>
      </div>
    </div>
  )
}
