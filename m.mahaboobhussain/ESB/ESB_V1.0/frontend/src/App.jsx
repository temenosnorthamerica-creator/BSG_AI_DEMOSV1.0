import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Database, GitMerge, Play, Home, FormInput, Radio, Variable, History, ArrowRight, ChevronLeft, ChevronRight, Globe, Users, FileSpreadsheet, Activity } from 'lucide-react';
import SampleDataManagement from './pages/SampleDataManagement';
import Configuration from './pages/Configuration';
import Demo from './pages/Demo';
import FormGenerator from './pages/FormGenerator';
import Digital from './pages/Digital';
import EventHubConfig from './pages/EventHubConfig';
import EnvironmentVariables from './pages/EnvironmentVariables';
import ExecutionHistory from './pages/ExecutionHistory';
import CSVProcessing from './pages/CSVProcessing';
import Monitor from './pages/Monitor';
import './App.css';

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  return (
    <BrowserRouter>
      <div className={`app ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <nav className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="logo">
            <h1>ESB</h1>
            {!sidebarCollapsed && <span>Enterprise Service Bus</span>}
          </div>

          <button
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          <ul className="nav-links">
            <li>
              <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''} title="Home">
                <Home size={20} />
                <span>Home</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/samples" className={({ isActive }) => isActive ? 'active' : ''} title="Load Sample Data">
                <Database size={20} />
                <span>Load Sample Data</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/configuration" className={({ isActive }) => isActive ? 'active' : ''} title="Mappings">
                <GitMerge size={20} />
                <span>Mappings</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/crm" className={({ isActive }) => isActive ? 'active' : ''} title="CRM">
                <Users size={20} />
                <span>CRM</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/digital" className={({ isActive }) => isActive ? 'active' : ''} title="DIGITAL">
                <Globe size={20} />
                <span>DIGITAL</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/demo" className={({ isActive }) => isActive ? 'active' : ''} title="Process Events">
                <Play size={20} />
                <span>Process Events</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/csv-processing" className={({ isActive }) => isActive ? 'active' : ''} title="Process CSV">
                <FileSpreadsheet size={20} />
                <span>Process CSV</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/execution-history" className={({ isActive }) => isActive ? 'active' : ''} title="Execution History">
                <History size={20} />
                <span>Execution History</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/monitor" className={({ isActive }) => isActive ? 'active' : ''} title="Health Check">
                <Activity size={20} />
                <span>Health Check</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/environment-variables" className={({ isActive }) => isActive ? 'active' : ''} title="Environment Variables">
                <Variable size={20} />
                <span>Environment Variables</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''} title="Event Hub Config">
                <Radio size={20} />
                <span>Event Hub Config</span>
              </NavLink>
            </li>
          </ul>
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/samples" element={<SampleDataManagement />} />
            <Route path="/configuration" element={<Configuration />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/csv-processing" element={<CSVProcessing />} />
            <Route path="/crm" element={<FormGenerator />} />
            <Route path="/digital" element={<Digital />} />
            <Route path="/environment-variables" element={<EnvironmentVariables />} />
            <Route path="/settings" element={<EventHubConfig />} />
            <Route path="/execution-history" element={<ExecutionHistory />} />
            <Route path="/monitor" element={<Monitor />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

function HomePage() {
  return (
    <div className="home-page-new">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-dots">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <h1><span>Enterprise Service Bus</span></h1>
        <p className="hero-subtitle">
          Seamlessly integrate event sources with API destinations through visual mapping and real-time processing
        </p>
      </div>

      {/* Main Workflow */}
      <div className="workflow-section">
        <h2 className="section-title">How It Works</h2>

        {/* Phase 1: Setup */}
        <div className="phase-container phase-setup">
          <div className="phase-header">
            <div className="phase-title-row">
              <span className="phase-badge phase-1-badge">Phase 1</span>
              <h3>Setup</h3>
            </div>
            <p>Configure your data structures and field mappings</p>
          </div>

          <div className="phase-content">
            <div className="setup-steps">
              {/* Step 1: Load Samples */}
              <div className="setup-step">
                <div className="step-icon-wrapper step-1">
                  <Database size={24} />
                  <span className="step-number">1</span>
                </div>
                <div className="step-info">
                  <h4>Load Sample Data</h4>
                  <p>Upload JSON samples to define data structures</p>
                  <ul className="step-features">
                    <li><span>Event Samples</span> - CloudEvents, webhooks</li>
                    <li><span>API Samples</span> - Request/Response templates</li>
                  </ul>
                  <NavLink to="/samples" className="btn btn-primary btn-sm">
                    <Database size={14} />
                    Load Samples
                  </NavLink>
                </div>
              </div>

              <div className="setup-arrow">
                <ArrowRight size={24} />
              </div>

              {/* Step 2: Create Mappings */}
              <div className="setup-step">
                <div className="step-icon-wrapper step-2">
                  <GitMerge size={24} />
                  <span className="step-number">2</span>
                </div>
                <div className="step-info">
                  <h4>Create Mappings</h4>
                  <p>Map source fields to API parameters</p>
                  <ul className="step-features">
                    <li><span>Field Mapping</span> - Source → Destination</li>
                    <li><span>Variables</span> - Use {"{{variables}}"} syntax</li>
                  </ul>
                  <NavLink to="/configuration" className="btn btn-primary btn-sm">
                    <GitMerge size={14} />
                    Create Mappings
                  </NavLink>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Phase Connector */}
        <div className="phase-connector">
          <div className="connector-line-vertical"></div>
          <div className="connector-label">Then choose your path</div>
          <div className="connector-line-vertical"></div>
        </div>

        {/* Phase 2: Execute */}
        <div className="phase-container phase-execute">
          <div className="phase-header">
            <div className="phase-title-row">
              <span className="phase-badge phase-2-badge">Phase 2</span>
              <h3>Execute</h3>
            </div>
            <p>Choose your integration path based on your use case</p>
          </div>

          <div className="phase-content">
            <div className="execution-tracks-grid">
              {/* CRM Track */}
              <div className="execution-track crm-track">
                <div className="track-header">
                  <Users size={16} />
                  <span>CRM Path</span>
                  <span className="track-subtitle">Event-Driven Integration</span>
                </div>

                <div className="track-flow-horizontal">
                  <div className="track-step">
                    <div className="track-step-icon crm-icon">
                      <Users size={14} />
                    </div>
                    <span className="track-step-name">CRM</span>
                    <span className="track-step-desc">Send events</span>
                    <NavLink to="/crm" className="btn btn-outline btn-xs">Open</NavLink>
                  </div>

                  <div className="track-arrow-right">→</div>

                  <div className="track-step">
                    <div className="track-step-icon eventhub-icon">
                      <Radio size={14} />
                    </div>
                    <span className="track-step-name">Event Hub</span>
                    <span className="track-step-desc">Queue</span>
                  </div>

                  <div className="track-arrow-right">→</div>

                  <div className="track-step">
                    <div className="track-step-icon process-icon">
                      <Play size={14} />
                    </div>
                    <span className="track-step-name">Process</span>
                    <span className="track-step-desc">Map & call</span>
                    <NavLink to="/demo" className="btn btn-outline btn-xs">Open</NavLink>
                  </div>

                  <div className="track-arrow-right">→</div>

                  <div className="track-step track-step-destination">
                    <div className="track-step-icon history-icon">
                      <History size={14} />
                    </div>
                    <span className="track-step-name">History</span>
                    <span className="track-step-desc">Executions</span>
                    <NavLink to="/execution-history" className="btn btn-outline btn-xs">View</NavLink>
                  </div>
                </div>
              </div>

              {/* Digital Track */}
              <div className="execution-track digital-track">
                <div className="track-header">
                  <Globe size={16} />
                  <span>Digital Path</span>
                  <span className="track-subtitle">Direct API Integration</span>
                </div>

                <div className="track-flow-horizontal">
                  <div className="track-step">
                    <div className="track-step-icon digital-icon">
                      <Globe size={14} />
                    </div>
                    <span className="track-step-name">Digital</span>
                    <span className="track-step-desc">API forms</span>
                    <NavLink to="/digital" className="btn btn-outline btn-xs">Open</NavLink>
                  </div>

                  <div className="track-arrow-right">→</div>

                  <div className="track-step">
                    <div className="track-step-icon api-icon">
                      <Play size={14} />
                    </div>
                    <span className="track-step-name">External API</span>
                    <span className="track-step-desc">HTTP calls</span>
                  </div>

                  <div className="track-arrow-right">→</div>

                  <div className="track-step">
                    <div className="track-step-icon capture-icon">
                      <Variable size={14} />
                    </div>
                    <span className="track-step-name">Capture</span>
                    <span className="track-step-desc">Save vars</span>
                  </div>

                  <div className="track-arrow-right">→</div>

                  <div className="track-step track-step-destination">
                    <div className="track-step-icon history-icon">
                      <History size={14} />
                    </div>
                    <span className="track-step-name">History</span>
                    <span className="track-step-desc">API logs</span>
                    <NavLink to="/execution-history" className="btn btn-outline btn-xs">View</NavLink>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Supporting Tools */}
      <div className="tools-section">
        <h2 className="section-title">Supporting Tools</h2>
        <div className="tools-grid">
          <div className="tool-card">
            <Variable size={24} />
            <h4>Environment Variables</h4>
            <p>Manage global variables and captured response values</p>
            <NavLink to="/environment-variables" className="btn btn-primary btn-sm">Open</NavLink>
          </div>
          <div className="tool-card">
            <Radio size={24} />
            <h4>Event Hub Config</h4>
            <p>Configure Azure Event Hub connection for CRM event processing</p>
            <NavLink to="/settings" className="btn btn-primary btn-sm">Open</NavLink>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
