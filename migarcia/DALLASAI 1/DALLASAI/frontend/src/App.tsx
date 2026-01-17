import { useState, useEffect } from 'react'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { SettingsModal } from './components/SettingsModal'
import { ComingSoonModal } from './components/ComingSoonModal'
import { HomePage } from './pages/HomePage'
import { ComponentPage } from './pages/ComponentPage'
import { BranchLoanPage } from './components/loans'
import type { ComponentId } from './types'

function App() {
  const [currentComponent, setCurrentComponent] = useState<ComponentId | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [pendingFeature, setPendingFeature] = useState<string | null>(null)

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') as 'light' | 'dark' | null
    if (savedTheme) {
      setTheme(savedTheme)
      applyTheme(savedTheme)
    } else {
      applyTheme('dark') // Default to dark
    }
  }, [])

  // Apply theme to document
  const applyTheme = (newTheme: 'light' | 'dark') => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
      document.body.classList.add('dark-theme')
    } else {
      document.documentElement.classList.remove('dark')
      document.body.classList.remove('dark-theme')
    }
  }

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme)
    localStorage.setItem('app-theme', newTheme)
    applyTheme(newTheme)
  }

  const handleComponentChange = (componentId: ComponentId) => {
    setCurrentComponent(componentId)
  }

  const handleHomeClick = () => {
    setCurrentComponent(null)
  }

  return (
    <div className={`min-h-screen flex ${theme === 'dark' ? 'bg-[#0f172a]' : 'bg-[#F8FAFC]'}`}>
      {/* Sidebar */}
      <Sidebar
        currentComponent={currentComponent}
        onComponentChange={handleComponentChange}
        onHomeClick={handleHomeClick}
        onSettingsClick={() => setSettingsOpen(true)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        currentTheme={theme}
        onThemeChange={handleThemeChange}
      />
      <ComingSoonModal
        isOpen={Boolean(pendingFeature)}
        featureName={pendingFeature || ''}
        onClose={() => setPendingFeature(null)}
      />

      {/* Main Content Area */}
      <main className={`flex-1 ml-20 relative overflow-hidden transition-all duration-300 ${theme === 'dark' ? 'bg-[#0f172a]' : 'bg-[#F8FAFC]'}`}>
        {/* Background Watermark */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-[400px] font-light select-none opacity-30 ${theme === 'dark' ? 'text-[#1e293b]' : 'text-[#D1D5DB]'}`}>
              BSG
            </span>
          </div>
          {/* Gradient Curve from Bottom Right */}
          <div className={`absolute bottom-0 right-0 w-[800px] h-[600px] bg-gradient-to-tl rounded-full blur-3xl opacity-40 ${
            theme === 'dark'
              ? 'from-[#283054] via-[#283054]/20 to-transparent'
              : 'from-[#283054] via-[#283054]/10 to-transparent'
          }`}></div>
        </div>

        {/* Content Container */}
        <div className="relative z-10 px-8 py-8 h-full overflow-y-auto">
          <Header />

          <div className="max-w-7xl">
            {currentComponent === 'branch-loans' ? (
              <BranchLoanPage />
            ) : currentComponent ? (
              <ComponentPage componentId={currentComponent} />
            ) : (
              <HomePage onSelectComponent={handleComponentChange} />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App

