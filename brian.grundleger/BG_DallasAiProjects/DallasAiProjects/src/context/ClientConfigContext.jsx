import { createContext, useContext, useState, useEffect } from 'react'

const ClientConfigContext = createContext(null)

const defaultConfig = {
  clientName: 'Demo Bank',
  clientLogo: null,
  primaryColor: '#3B82F6',
  secondaryColor: '#8B5CF6',
  accentColor: '#22C55E',
  enabledSystems: {},
  integrationMethods: {},
}

const integrationOptions = [
  { id: 'api', label: 'API Integration', color: '#3B82F6' },
  { id: 'batch', label: 'Batch Processing', color: '#F59E0B' },
  { id: 'realtime', label: 'Real-time Streaming', color: '#22C55E' },
  { id: 'webhook', label: 'Webhooks', color: '#8B5CF6' },
  { id: 'file', label: 'File Transfer', color: '#EC4899' },
  { id: 'message', label: 'Message Queue', color: '#14B8A6' },
]

export function ClientConfigProvider({ children, systems }) {
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('clientConfig')
    if (saved) {
      return JSON.parse(saved)
    }
    // Initialize with all systems enabled by default
    const initialEnabled = {}
    const initialMethods = {}
    systems.forEach(system => {
      initialEnabled[system.id] = true
      initialMethods[system.id] = {
        method: 'api',
        connections: []
      }
    })
    return {
      ...defaultConfig,
      enabledSystems: initialEnabled,
      integrationMethods: initialMethods
    }
  })

  useEffect(() => {
    localStorage.setItem('clientConfig', JSON.stringify(config))
  }, [config])

  const updateConfig = (updates) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  const toggleSystem = (systemId) => {
    setConfig(prev => ({
      ...prev,
      enabledSystems: {
        ...prev.enabledSystems,
        [systemId]: !prev.enabledSystems[systemId]
      }
    }))
  }

  const setIntegrationMethod = (systemId, method) => {
    setConfig(prev => ({
      ...prev,
      integrationMethods: {
        ...prev.integrationMethods,
        [systemId]: {
          ...prev.integrationMethods[systemId],
          method
        }
      }
    }))
  }

  const setSystemConnection = (sourceId, targetId, method) => {
    setConfig(prev => {
      const currentConnections = prev.integrationMethods[sourceId]?.connections || []
      const existingIndex = currentConnections.findIndex(c => c.targetId === targetId)

      let newConnections
      if (existingIndex >= 0) {
        if (method === null) {
          // Remove connection
          newConnections = currentConnections.filter(c => c.targetId !== targetId)
        } else {
          // Update existing
          newConnections = [...currentConnections]
          newConnections[existingIndex] = { targetId, method }
        }
      } else if (method !== null) {
        // Add new connection
        newConnections = [...currentConnections, { targetId, method }]
      } else {
        newConnections = currentConnections
      }

      return {
        ...prev,
        integrationMethods: {
          ...prev.integrationMethods,
          [sourceId]: {
            ...prev.integrationMethods[sourceId],
            connections: newConnections
          }
        }
      }
    })
  }

  const resetConfig = () => {
    const initialEnabled = {}
    const initialMethods = {}
    systems.forEach(system => {
      initialEnabled[system.id] = true
      initialMethods[system.id] = {
        method: 'api',
        connections: []
      }
    })
    setConfig({
      ...defaultConfig,
      enabledSystems: initialEnabled,
      integrationMethods: initialMethods
    })
  }

  const getEnabledSystems = () => {
    return systems.filter(system => config.enabledSystems[system.id])
  }

  return (
    <ClientConfigContext.Provider value={{
      config,
      updateConfig,
      toggleSystem,
      setIntegrationMethod,
      setSystemConnection,
      resetConfig,
      getEnabledSystems,
      integrationOptions
    }}>
      {children}
    </ClientConfigContext.Provider>
  )
}

export function useClientConfig() {
  const context = useContext(ClientConfigContext)
  if (!context) {
    throw new Error('useClientConfig must be used within a ClientConfigProvider')
  }
  return context
}

export { integrationOptions }
