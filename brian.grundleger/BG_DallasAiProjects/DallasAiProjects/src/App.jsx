import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import SystemPage from './pages/SystemPage'
import ClientConfigPage from './pages/ClientConfigPage'
import SolutionMapPage from './pages/SolutionMapPage'
import AppLandingPage from './pages/AppLandingPage'
import { ClientConfigProvider, useClientConfig } from './context/ClientConfigContext'
import systemsData from './data/systems.json'

function AppContent() {
  const [currentPage, setCurrentPage] = useState('home')
  const [currentSystem, setCurrentSystem] = useState(null)
  const [currentDemoApp, setCurrentDemoApp] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const { systems, teamDemos } = systemsData
  const { config, getEnabledSystems } = useClientConfig()

  const enabledSystems = getEnabledSystems()
  const selectedSystem = systems.find(s => s.id === currentSystem)

  const handleHomeClick = () => {
    setCurrentPage('home')
    setCurrentSystem(null)
    setCurrentDemoApp(null)
  }

  const handleSystemChange = (systemId) => {
    setCurrentSystem(systemId)
    setCurrentPage('system')
  }

  const handleConfigClick = () => {
    setCurrentPage('config')
    setCurrentSystem(null)
  }

  const handleSolutionMapClick = () => {
    setCurrentPage('solutionmap')
    setCurrentSystem(null)
  }

  const handleFilterChange = (filter) => {
    setActiveFilter(filter)
  }

  const handleDemoAppClick = (demo) => {
    setCurrentDemoApp(demo)
    setCurrentPage('demo-landing')
  }

  // Dynamic theming based on client config
  const themeStyles = {
    '--primary-color': config.primaryColor,
    '--secondary-color': config.secondaryColor,
  }

  // Render AppLandingPage in full-screen mode (without sidebar/header)
  if (currentPage === 'demo-landing' && currentDemoApp) {
    return (
      <AppLandingPage
        appId={currentDemoApp.id}
        appData={currentDemoApp}
        onBack={handleHomeClick}
      />
    )
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#1a2035] via-[#151b2e] to-[#0f1422]"
      style={themeStyles}
    >
      <Sidebar
        systems={systems}
        enabledSystems={enabledSystems}
        currentSystem={currentSystem}
        currentPage={currentPage}
        onSystemChange={handleSystemChange}
        onHomeClick={handleHomeClick}
        onConfigClick={handleConfigClick}
        onSolutionMapClick={handleSolutionMapClick}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        clientConfig={config}
      />

      <main className="transition-all duration-300 min-h-screen p-8" style={{ marginLeft: '5rem' }}>
        <Header
          onConfigClick={handleConfigClick}
          clientConfig={config}
        />

        {currentPage === 'config' ? (
          <ClientConfigPage
            systems={systems}
            onBack={handleHomeClick}
          />
        ) : currentPage === 'solutionmap' ? (
          <SolutionMapPage
            systems={enabledSystems}
            onBack={handleHomeClick}
          />
        ) : currentSystem ? (
          <SystemPage
            system={selectedSystem}
            onBack={handleHomeClick}
            activeFilter={activeFilter}
          />
        ) : (
          <HomePage
            systems={enabledSystems}
            teamDemos={teamDemos}
            onSelectSystem={handleSystemChange}
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
            onDemoAppClick={handleDemoAppClick}
          />
        )}
      </main>
    </div>
  )
}

function App() {
  const { systems } = systemsData

  return (
    <ClientConfigProvider systems={systems}>
      <AppContent />
    </ClientConfigProvider>
  )
}

export default App
