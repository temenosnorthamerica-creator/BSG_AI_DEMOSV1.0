import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import SimulatorPage from './pages/SimulatorPage';
import APIReferencePage from './pages/APIReferencePage';
import HealthCheckPanel from './components/HealthCheckPanel';
import { ApplicationType } from './types';

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('crm-theme');
    return saved === 'dark';
  });
  const [selectedApp, setSelectedApp] = useState<ApplicationType | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showHealthCheck, setShowHealthCheck] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-theme');
    }
    localStorage.setItem('crm-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return (
    <BrowserRouter basename="/crm-banking-simulator">
      <div className={`min-h-screen ${darkMode ? 'bg-surface-dark text-text-primary-dark' : 'bg-surface-light text-text-primary-light'}`}>
        <Header
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onHealthCheck={() => setShowHealthCheck(true)}
        />
        <HealthCheckPanel
          darkMode={darkMode}
          isOpen={showHealthCheck}
          onClose={() => setShowHealthCheck(false)}
        />
        <div className="flex">
          <Sidebar
            selectedApp={selectedApp}
            setSelectedApp={setSelectedApp}
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
          />
          <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-80'}`}>
            <Routes>
              <Route
                path="/"
                element={
                  <SimulatorPage
                    selectedApp={selectedApp}
                    setSelectedApp={setSelectedApp}
                    darkMode={darkMode}
                  />
                }
              />
              <Route
                path="/api-reference"
                element={<APIReferencePage darkMode={darkMode} />}
              />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
