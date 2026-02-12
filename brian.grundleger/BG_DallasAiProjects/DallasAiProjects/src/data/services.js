/**
 * Service definitions for health check monitoring and control
 */

export const services = [
  // Backends
  {
    id: 'config-api',
    name: 'Config API Server',
    port: 3010,
    type: 'backend',
    category: 'config',
    healthEndpoint: '/health',
    description: 'Integration configuration API',
    path: 'brian.grundleger\\BG_DallasAiProjects\\DallasAiProjects',
    startCmd: 'npm run config-server',
    runtime: 'node'
  },
  {
    id: 'bsg-backend',
    name: 'BSG Demo - Backend',
    port: 8002,
    type: 'backend',
    category: 'demo',
    healthEndpoint: '/docs',
    description: 'BSG Demo Platform API',
    path: 'migarcia\\DALLASAI 1\\DALLASAI\\backend',
    startCmd: 'python -m uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload',
    runtime: 'python'
  },
  {
    id: 'debitcards-backend',
    name: 'Debit Cards - Backend',
    port: 8003,
    type: 'backend',
    category: 'demo',
    healthEndpoint: '/docs',
    description: 'Debit Cards API',
    path: 'sweekruth.somaraju\\debitcards\\debitcards\\backend',
    startCmd: 'python -m uvicorn app.main:app --host 0.0.0.0 --port 8003 --reload',
    runtime: 'python'
  },
  {
    id: 'esb-backend',
    name: 'ESB - Backend',
    port: 8006,
    type: 'backend',
    category: 'demo',
    healthEndpoint: '/api/health',
    description: 'Enterprise Service Bus API',
    path: 'm.mahaboobhussain\\ESB\\ESB_V1.0\\backend',
    startCmd: 'npm run dev',
    runtime: 'node'
  },

  // Frontends
  {
    id: 'landing',
    name: 'Landing Page',
    port: 3000,
    type: 'frontend',
    category: 'main',
    description: 'Main landing page and navigation hub',
    path: 'brian.grundleger\\BG_DallasAiProjects\\DallasAiProjects',
    startCmd: 'npm run dev',
    runtime: 'node'
  },
  {
    id: 'crm',
    name: 'CRM Banking Simulator',
    port: 3001,
    type: 'frontend',
    category: 'demo',
    description: 'Customer relationship management demo',
    path: 'alwin\\crm-banking-simulator_v2\\crm-banking-simulator_v2',
    startCmd: 'npm run dev',
    runtime: 'node'
  },
  {
    id: 'bsg-frontend',
    name: 'BSG Demo - Frontend',
    port: 3002,
    type: 'frontend',
    category: 'demo',
    description: 'BSG Demo Platform UI',
    path: 'migarcia\\DALLASAI 1\\DALLASAI\\frontend',
    startCmd: 'npm run dev',
    runtime: 'node'
  },
  {
    id: 'debitcards-frontend',
    name: 'Debit Cards - Frontend',
    port: 3003,
    type: 'frontend',
    category: 'demo',
    description: 'Debit Cards Demo UI',
    path: 'sweekruth.somaraju\\debitcards\\debitcards\\frontend',
    startCmd: 'npm run dev',
    runtime: 'node'
  },
  {
    id: 'lms',
    name: 'LMS Applicant Portal',
    port: 3004,
    type: 'frontend',
    category: 'demo',
    description: 'Loan Management System Portal',
    path: 'mmoore\\lms-applicant-portal\\lms-applicant-portal',
    startCmd: 'npm run dev',
    runtime: 'node'
  },
  {
    id: 'esb-frontend',
    name: 'ESB - Frontend',
    port: 3016,
    type: 'frontend',
    category: 'demo',
    description: 'Enterprise Service Bus UI',
    path: 'm.mahaboobhussain\\ESB\\ESB_V1.0\\frontend',
    startCmd: 'npm run dev',
    runtime: 'node'
  }
]

// Integration services
export const integrations = [
  {
    id: 'file-watcher',
    name: 'File Watcher',
    type: 'integration',
    description: 'Watches apps_integration_info.txt for changes',
    checkType: 'config-api'
  },
  {
    id: 'config-editor',
    name: 'Config Editor',
    type: 'integration',
    description: 'In-app configuration editor',
    checkType: 'config-api',
    dependsOn: 'config-api'
  }
]

// Get services by type
export const getServicesByType = (type) => services.filter(s => s.type === type)

// Get backends
export const getBackends = () => getServicesByType('backend')

// Get frontends
export const getFrontends = () => getServicesByType('frontend')

// Get service by ID
export const getServiceById = (id) => services.find(s => s.id === id)

export default services
