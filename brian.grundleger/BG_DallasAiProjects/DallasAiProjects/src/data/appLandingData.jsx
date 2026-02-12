import {
  Info,
  Layers,
  Code,
  Settings,
  Users,
  CreditCard,
  Database,
  Cpu,
  FileText,
  Landmark,
  Server,
  GitBranch,
  Workflow
} from 'lucide-react'

export const appLandingConfigs = {
  'crm-banking-simulator': {
    navItems: [
      {
        id: 'overview',
        label: 'Overview',
        icon: Info,
        title: 'CRM Banking Simulator Overview',
        content: (
          <div className="space-y-4">
            <p>
              The CRM Banking Simulator is a comprehensive customer relationship management tool designed
              specifically for banking integration demonstrations. It showcases how Temenos solutions integrate
              with modern CRM systems to provide a seamless banking experience.
            </p>
            <p>
              This simulator allows you to explore customer management workflows, account interactions,
              and real-time data synchronization between CRM and core banking systems.
            </p>
          </div>
        ),
        features: [
          'Customer profile management',
          'Real-time account balance display',
          'Transaction history visualization',
          'Integration with Temenos Transact APIs',
          'Customer 360-degree view',
          'Automated workflow triggers'
        ],
        technicalDetails: [
          { label: 'Framework', value: 'React + Vite' },
          { label: 'Language', value: 'TypeScript' },
          { label: 'Styling', value: 'Tailwind CSS' },
          { label: 'Port', value: '3001' }
        ]
      },
      {
        id: 'features',
        label: 'Features',
        icon: Layers,
        title: 'Key Features',
        content: (
          <div className="space-y-4">
            <p>
              Explore the powerful features that make this CRM simulator an essential tool for
              demonstrating banking integration capabilities.
            </p>
          </div>
        ),
        features: [
          'Customer onboarding workflow simulation',
          'KYC verification process demo',
          'Account opening and management',
          'Product recommendations engine',
          'Service request management',
          'Communication history tracking',
          'Task and follow-up management',
          'Sales pipeline visualization'
        ]
      },
      {
        id: 'integration',
        label: 'Integration',
        icon: Code,
        title: 'API Integration',
        content: (
          <div className="space-y-4">
            <p>
              The CRM Banking Simulator integrates directly with Temenos Transact APIs through
              a proxy configuration, enabling real-time data exchange with the core banking system.
            </p>
            <div className="bg-slate-700/30 rounded-lg p-4 mt-4">
              <p className="text-sm font-mono text-slate-300">
                API Proxy: /api/temenos → americasbsgprd.temenos.com
              </p>
            </div>
          </div>
        ),
        features: [
          'REST API integration',
          'Real-time data synchronization',
          'Secure proxy configuration',
          'Error handling and retry logic'
        ],
        technicalDetails: [
          { label: 'API Base', value: 'americasbsgprd.temenos.com' },
          { label: 'Protocol', value: 'HTTPS/REST' },
          { label: 'Auth', value: 'Bearer Token' },
          { label: 'Format', value: 'JSON' }
        ]
      },
      {
        id: 'config',
        label: 'Configuration',
        icon: Settings,
        title: 'Configuration Options',
        content: (
          <div className="space-y-4">
            <p>
              The simulator can be configured to connect to different Temenos environments
              and customize the demo experience based on your requirements.
            </p>
          </div>
        ),
        features: [
          'Environment switching (Dev/UAT/Prod)',
          'API endpoint configuration',
          'Theme customization',
          'Demo data presets'
        ]
      }
    ]
  },

  'bsg-demo-platform': {
    navItems: [
      {
        id: 'overview',
        label: 'Overview',
        icon: Info,
        title: 'BSG Demo Platform Overview',
        content: (
          <div className="space-y-4">
            <p>
              The BSG Demo Platform is a comprehensive full-stack application serving as the central hub
              for demonstrating Temenos products and capabilities. It features a modern React frontend
              paired with a powerful FastAPI backend.
            </p>
            <p>
              This platform provides an interactive showcase of various Temenos banking solutions
              including Integration & APIs, Data Architecture, Deployment, Security, Observability,
              and Design Time capabilities.
            </p>
          </div>
        ),
        features: [
          'Component-based demo architecture',
          'Interactive content presentations',
          'Video demonstrations',
          'AI-powered chatbot assistance',
          'Real-time API documentation',
          'MongoDB cloud integration'
        ],
        technicalDetails: [
          { label: 'Frontend', value: 'React + Vite + TypeScript' },
          { label: 'Backend', value: 'FastAPI (Python)' },
          { label: 'Database', value: 'Azure Cosmos DB' },
          { label: 'Ports', value: '3002 / 8002' }
        ]
      },
      {
        id: 'components',
        label: 'Components',
        icon: Layers,
        title: 'Demo Components',
        content: (
          <div className="space-y-4">
            <p>
              The platform features multiple independent demo components, each showcasing different
              aspects of the Temenos ecosystem.
            </p>
          </div>
        ),
        features: [
          'Integration, APIs and Events',
          'Data Architecture',
          'Deployment and Cloud',
          'Security',
          'Observability',
          'Design Time'
        ]
      },
      {
        id: 'architecture',
        label: 'Architecture',
        icon: Database,
        title: 'System Architecture',
        content: (
          <div className="space-y-4">
            <p>
              The BSG Demo Platform follows a modern microservices architecture with clear separation
              between frontend and backend services, connected through RESTful APIs.
            </p>
            <div className="bg-slate-700/30 rounded-lg p-4 mt-4">
              <p className="text-sm text-slate-300 mb-2">Architecture Highlights:</p>
              <ul className="text-sm text-slate-400 list-disc list-inside space-y-1">
                <li>React SPA with Vite build system</li>
                <li>FastAPI async backend</li>
                <li>Azure Cosmos DB (MongoDB API)</li>
                <li>JWT-based authentication</li>
              </ul>
            </div>
          </div>
        ),
        features: [
          'Microservices architecture',
          'Database adapter pattern',
          'RAG adapter for AI features',
          'CORS-enabled API gateway'
        ],
        technicalDetails: [
          { label: 'API Version', value: 'v1' },
          { label: 'Auth', value: 'JWT (30min/7day)' },
          { label: 'Rate Limit', value: 'Enabled' },
          { label: 'CORS', value: 'Configured' }
        ]
      },
      {
        id: 'api',
        label: 'API Docs',
        icon: Code,
        title: 'API Documentation',
        content: (
          <div className="space-y-4">
            <p>
              The backend provides comprehensive API documentation through OpenAPI/Swagger,
              accessible at the /docs endpoint when the backend is running.
            </p>
            <div className="bg-slate-700/30 rounded-lg p-4 mt-4">
              <p className="text-sm font-mono text-slate-300">
                API Docs: http://localhost:8002/docs
              </p>
            </div>
          </div>
        ),
        features: [
          'OpenAPI/Swagger documentation',
          'Interactive API testing',
          'Request/Response schemas',
          'Authentication examples'
        ]
      }
    ]
  },

  'debitcards-demo': {
    navItems: [
      {
        id: 'overview',
        label: 'Overview',
        icon: Info,
        title: 'Debit Cards Demo Overview',
        content: (
          <div className="space-y-4">
            <p>
              The Debit Cards Demo application showcases comprehensive debit card management
              and transaction capabilities. It demonstrates how card services integrate with
              core banking systems and event-driven architectures.
            </p>
            <p>
              This full-stack application features a modern React frontend and a Python FastAPI
              backend, with real-time event streaming through Azure Event Hubs.
            </p>
          </div>
        ),
        features: [
          'Card issuance workflow',
          'Transaction processing',
          'Balance inquiries',
          'Card status management',
          'Event-driven architecture',
          'Real-time notifications'
        ],
        technicalDetails: [
          { label: 'Frontend', value: 'React + Vite + TypeScript' },
          { label: 'Backend', value: 'FastAPI (Python)' },
          { label: 'Events', value: 'Azure Event Hubs' },
          { label: 'Ports', value: '3003 / 8003' }
        ]
      },
      {
        id: 'features',
        label: 'Features',
        icon: CreditCard,
        title: 'Card Features',
        content: (
          <div className="space-y-4">
            <p>
              Explore the complete lifecycle of debit card management from issuance to
              transaction processing.
            </p>
          </div>
        ),
        features: [
          'New card issuance',
          'Card activation',
          'PIN management',
          'Transaction limits',
          'Card blocking/unblocking',
          'Replacement card requests',
          'Transaction history',
          'Spending analytics'
        ]
      },
      {
        id: 'events',
        label: 'Events',
        icon: Cpu,
        title: 'Event Architecture',
        content: (
          <div className="space-y-4">
            <p>
              The application uses Azure Event Hubs for real-time event streaming, enabling
              asynchronous processing of card transactions and status updates.
            </p>
            <div className="bg-slate-700/30 rounded-lg p-4 mt-4">
              <p className="text-sm text-slate-300 mb-2">Event Types:</p>
              <ul className="text-sm text-slate-400 list-disc list-inside space-y-1">
                <li>card.issued</li>
                <li>card.activated</li>
                <li>transaction.processed</li>
                <li>card.blocked</li>
              </ul>
            </div>
          </div>
        ),
        features: [
          'CloudEvents format',
          'Event producer/consumer',
          'Real-time processing',
          'Event replay capability'
        ]
      },
      {
        id: 'api',
        label: 'API',
        icon: Code,
        title: 'Card Services API',
        content: (
          <div className="space-y-4">
            <p>
              The backend exposes RESTful APIs for all card management operations,
              integrated with Temenos card services.
            </p>
          </div>
        ),
        features: [
          'Card issuance endpoints',
          'Transaction APIs',
          'Status management',
          'Event webhooks'
        ],
        technicalDetails: [
          { label: 'API Style', value: 'REST' },
          { label: 'Format', value: 'JSON' },
          { label: 'Auth', value: 'API Key' },
          { label: 'Docs', value: '/docs' }
        ]
      }
    ]
  },

  'lms-applicant-portal': {
    navItems: [
      {
        id: 'overview',
        label: 'Overview',
        icon: Info,
        title: 'LMS Applicant Portal Overview',
        content: (
          <div className="space-y-4">
            <p>
              The LMS Applicant Portal is a modern loan origination interface that connects
              directly to the Temenos Lending Management System. It provides a seamless
              experience for loan applicants from application to approval.
            </p>
            <p>
              Built with React and TanStack Query, this portal demonstrates best practices
              in building lending front-ends that integrate with Temenos APIs.
            </p>
          </div>
        ),
        features: [
          'Loan application submission',
          'Document upload',
          'Application status tracking',
          'Credit decision display',
          'Loan offer comparison',
          'E-signature integration'
        ],
        technicalDetails: [
          { label: 'Framework', value: 'React + Vite' },
          { label: 'State', value: 'TanStack Query' },
          { label: 'API', value: 'Temenos LendingAPI' },
          { label: 'Port', value: '3004' }
        ]
      },
      {
        id: 'workflow',
        label: 'Workflow',
        icon: Layers,
        title: 'Application Workflow',
        content: (
          <div className="space-y-4">
            <p>
              The loan application follows a structured workflow from initial submission
              through underwriting to final decision.
            </p>
          </div>
        ),
        features: [
          'Personal information collection',
          'Employment verification',
          'Income documentation',
          'Credit check authorization',
          'Loan terms selection',
          'Application review',
          'Decision notification',
          'Loan acceptance'
        ]
      },
      {
        id: 'integration',
        label: 'Integration',
        icon: Landmark,
        title: 'Temenos LMS Integration',
        content: (
          <div className="space-y-4">
            <p>
              The portal integrates directly with the Temenos Lending Management System
              through the LendingAPI endpoints.
            </p>
            <div className="bg-slate-700/30 rounded-lg p-4 mt-4">
              <p className="text-sm font-mono text-slate-300">
                API: lmsdemo1.temenos.com/LendingAPI
              </p>
            </div>
          </div>
        ),
        features: [
          'Loan origination API',
          'Credit decision engine',
          'Document management',
          'Workflow orchestration'
        ],
        technicalDetails: [
          { label: 'API Host', value: 'lmsdemo1.temenos.com' },
          { label: 'Protocol', value: 'HTTPS' },
          { label: 'Auth', value: 'OAuth 2.0' },
          { label: 'Format', value: 'JSON' }
        ]
      },
      {
        id: 'products',
        label: 'Products',
        icon: FileText,
        title: 'Loan Products',
        content: (
          <div className="space-y-4">
            <p>
              The portal supports various loan product types with configurable terms and conditions.
            </p>
          </div>
        ),
        features: [
          'Personal loans',
          'Auto loans',
          'Home equity lines',
          'Small business loans',
          'Student loans',
          'Debt consolidation'
        ]
      }
    ]
  },

  'creditos': {
    navItems: [
      {
        id: 'overview',
        label: 'Overview',
        icon: Info,
        title: 'Creditos - Sistema de Solicitudes Overview',
        content: (
          <div className="space-y-4">
            <p>
              The Creditos application (Sucursal - Creditos) is a comprehensive branch-level credit
              and loan management system. It enables bank branch employees to process loan applications,
              manage payment schedules, and track credit status for personal and automotive loans.
            </p>
            <p>
              This module is part of the BSG Demo Platform and demonstrates how Temenos solutions
              integrate with branch operations to provide seamless credit management workflows.
            </p>
          </div>
        ),
        features: [
          'Loan application submission (Solicitar Credito)',
          'Payment consultation and tracking (Consultar Pagos)',
          'Customer search by loan ID',
          'Payment status overview (Pagados, Pendientes, Vencidos)',
          'Next payment date and amount display',
          'Payment history export functionality'
        ],
        technicalDetails: [
          { label: 'Frontend', value: 'React + Vite + TypeScript' },
          { label: 'Backend', value: 'FastAPI (Python)' },
          { label: 'Database', value: 'Azure Cosmos DB' },
          { label: 'Ports', value: '3002 / 8002' }
        ]
      },
      {
        id: 'components',
        label: 'Components',
        icon: Layers,
        title: 'System Components',
        content: (
          <div className="space-y-4">
            <p>
              The Creditos system is composed of modular components that handle different
              aspects of the credit lifecycle management.
            </p>
          </div>
        ),
        features: [
          'Customer Search Component - Find customers by loan ID',
          'Credit Application Form - Submit new loan requests',
          'Payment Schedule Viewer - View upcoming and past payments',
          'Payment Status Dashboard - Overview of all payment states',
          'Auto Loan Form - Vehicle financing applications',
          'Personal Loan Form - Personal credit applications',
          'Export Module - Generate reports and statements'
        ]
      },
      {
        id: 'architecture',
        label: 'Architecture',
        icon: Database,
        title: 'System Architecture',
        content: (
          <div className="space-y-4">
            <p>
              The Creditos module follows a modern microservices architecture integrated
              within the BSG Demo Platform ecosystem.
            </p>
            <div className="bg-slate-700/30 rounded-lg p-4 mt-4">
              <p className="text-sm text-slate-300 mb-2">Architecture Flow:</p>
              <ol className="text-sm text-slate-400 list-decimal list-inside space-y-1">
                <li>User interacts with React Frontend</li>
                <li>Frontend calls FastAPI Backend services</li>
                <li>Backend queries Azure Cosmos DB</li>
                <li>Data flows to Temenos Integration layer</li>
                <li>Results returned to user interface</li>
              </ol>
            </div>
          </div>
        ),
        features: [
          'React SPA with component-based design',
          'FastAPI async backend services',
          'MongoDB-compatible data layer',
          'RESTful API communication',
          'JWT-based authentication',
          'Real-time data synchronization'
        ],
        technicalDetails: [
          { label: 'Pattern', value: 'Microservices' },
          { label: 'API Style', value: 'REST' },
          { label: 'Auth', value: 'JWT Tokens' },
          { label: 'State', value: 'React Hooks' }
        ]
      },
      {
        id: 'api',
        label: 'API Docs',
        icon: Code,
        title: 'API Documentation',
        content: (
          <div className="space-y-4">
            <p>
              The Creditos module exposes RESTful APIs for loan and payment management
              operations through the BSG Demo Platform backend.
            </p>
            <div className="bg-slate-700/30 rounded-lg p-4 mt-4">
              <p className="text-sm font-mono text-slate-300">
                API Docs: http://localhost:8002/docs
              </p>
            </div>
          </div>
        ),
        features: [
          'Loan simulation endpoint',
          'Customer search API',
          'Payment schedule retrieval',
          'Loan creation endpoints',
          'Payment status queries',
          'Export generation API'
        ],
        technicalDetails: [
          { label: 'Base URL', value: 'localhost:8002/api/v1' },
          { label: 'Format', value: 'JSON' },
          { label: 'Auth', value: 'Bearer Token' },
          { label: 'Docs', value: 'OpenAPI/Swagger' }
        ]
      }
    ]
  },

  'esb-demo': {
    navItems: [
      {
        id: 'overview',
        label: 'Overview',
        icon: Info,
        title: 'ESB - Enterprise Service Bus Overview',
        content: (
          <div className="space-y-4">
            <p>
              The ESB (Enterprise Service Bus) application provides a user-friendly interface for
              integrating file/event sources with API destinations. It features comprehensive
              configuration management, visual data mapping, and interactive demo execution.
            </p>
            <p>
              Built with React and Node.js/Express, this application demonstrates how to build
              flexible integration solutions that connect Azure Event Hubs with Temenos APIs
              through configurable field mappings.
            </p>
          </div>
        ),
        features: [
          'Sample event JSON management',
          'Sample API request/response management',
          'Visual field mapping interface',
          'Configuration save and load',
          'Interactive demo execution',
          'Real-time processing visualization'
        ],
        technicalDetails: [
          { label: 'Frontend', value: 'React 19 + Vite' },
          { label: 'Backend', value: 'Node.js + Express' },
          { label: 'Events', value: 'Azure Event Hubs' },
          { label: 'Ports', value: '3016 / 8006' }
        ]
      },
      {
        id: 'samples',
        label: 'Sample Data',
        icon: Database,
        title: 'Sample Data Management',
        content: (
          <div className="space-y-4">
            <p>
              The ESB application provides dedicated pages for managing sample data that drives
              the integration configuration and demo execution.
            </p>
            <div className="bg-slate-700/30 rounded-lg p-4 mt-4">
              <p className="text-sm text-slate-300 mb-2">Sample Data Types:</p>
              <ul className="text-sm text-slate-400 list-disc list-inside space-y-1">
                <li>Event JSON samples with schema detection</li>
                <li>API request/response JSON pairs</li>
                <li>CSV file definitions for bulk processing</li>
              </ul>
            </div>
          </div>
        ),
        features: [
          'Drag-drop JSON file upload',
          'Automatic schema detection',
          'JSON syntax validation',
          'Request/response pair linking',
          'Sample preview and editing',
          'CSV column mapping'
        ]
      },
      {
        id: 'mapping',
        label: 'Mapping',
        icon: GitBranch,
        title: 'Field Mapping Configuration',
        content: (
          <div className="space-y-4">
            <p>
              The visual mapping interface allows you to connect source fields to API parameters
              using an intuitive drag-and-drop or connection-based interface.
            </p>
          </div>
        ),
        features: [
          'Source to API field mapping',
          'Visual connection interface',
          'Nested field support (dot notation)',
          'Array field handling',
          'Mapping templates',
          'Configuration versioning'
        ],
        technicalDetails: [
          { label: 'UI Library', value: 'React Flow' },
          { label: 'Nested Fields', value: 'Dot notation' },
          { label: 'Arrays', value: '[] syntax' },
          { label: 'Storage', value: 'File-based JSON' }
        ]
      },
      {
        id: 'execution',
        label: 'Execution',
        icon: Workflow,
        title: 'Demo Execution',
        content: (
          <div className="space-y-4">
            <p>
              Execute integrations with real-time visualization showing data flow from source
              through transformation to API destination.
            </p>
            <div className="bg-slate-700/30 rounded-lg p-4 mt-4">
              <p className="text-sm text-slate-300 mb-2">Execution Paths:</p>
              <ol className="text-sm text-slate-400 list-decimal list-inside space-y-1">
                <li>CRM Path: Event Hub → Process Events</li>
                <li>Digital Path: Direct API calls with response capture</li>
                <li>CSV Path: Bulk file processing row by row</li>
              </ol>
            </div>
          </div>
        ),
        features: [
          'Processing animation',
          'Progress tracking',
          'Success/failure status',
          'Response parameter extraction',
          'Variable substitution',
          'Execution history tracking'
        ],
        technicalDetails: [
          { label: 'Variables', value: '{{VAR_NAME}} syntax' },
          { label: 'Capture', value: 'Response path extraction' },
          { label: 'History', value: 'CRM, Digital, CSV tabs' },
          { label: 'Storage', value: 'File-based logs' }
        ]
      }
    ]
  }
}

export default appLandingConfigs
