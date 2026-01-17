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
  Server
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

  'middleware-demo': {
    navItems: [
      {
        id: 'overview',
        label: 'Overview',
        icon: Info,
        title: 'Middleware Integration Overview',
        content: (
          <div className="space-y-4">
            <p>
              The Middleware Integration demo showcases how Azure Event Hubs enables seamless
              event-driven integration between banking systems. This application demonstrates
              the complete event lifecycle from creation to consumption.
            </p>
            <p>
              Built with React and Express.js, it provides a visual interface for understanding
              how CloudEvents flow through the middleware layer to connect source systems with
              Temenos Transact.
            </p>
          </div>
        ),
        features: [
          'Event Hub connectivity',
          'CloudEvents format support',
          'Customer event creation',
          'Account event creation',
          'Event mapping visualization',
          'API transformation demo'
        ],
        technicalDetails: [
          { label: 'Frontend', value: 'React + Vite' },
          { label: 'Backend', value: 'Express.js' },
          { label: 'Events', value: 'Azure Event Hubs' },
          { label: 'Ports', value: '3005 / 8005' }
        ]
      },
      {
        id: 'events',
        label: 'Events',
        icon: Cpu,
        title: 'Event Processing',
        content: (
          <div className="space-y-4">
            <p>
              The middleware processes events using the CloudEvents specification, ensuring
              interoperability and standardization across systems.
            </p>
            <div className="bg-slate-700/30 rounded-lg p-4 mt-4">
              <p className="text-sm text-slate-300 mb-2">Supported Event Types:</p>
              <ul className="text-sm text-slate-400 list-disc list-inside space-y-1">
                <li>com.bank.customer.created</li>
                <li>com.bank.account.created</li>
                <li>com.bank.transaction.processed</li>
              </ul>
            </div>
          </div>
        ),
        features: [
          'Event publishing',
          'Event consumption',
          'Event replay',
          'Dead letter handling',
          'Event schema validation',
          'Correlation tracking'
        ]
      },
      {
        id: 'mapping',
        label: 'Mapping',
        icon: Layers,
        title: 'Field Mapping',
        content: (
          <div className="space-y-4">
            <p>
              The middleware provides configurable field mapping to transform events from
              source format to Temenos Transact API format.
            </p>
          </div>
        ),
        features: [
          'Source to target mapping',
          'Field transformation rules',
          'Data type conversion',
          'Default value handling',
          'Conditional mapping',
          'Array handling'
        ]
      },
      {
        id: 'api',
        label: 'API Flow',
        icon: Server,
        title: 'API Integration Flow',
        content: (
          <div className="space-y-4">
            <p>
              Events are transformed and sent to Temenos Transact APIs using the configured
              mappings and transformation rules.
            </p>
            <div className="bg-slate-700/30 rounded-lg p-4 mt-4">
              <p className="text-sm text-slate-300 mb-2">Flow: PULL → MAP → SEND</p>
              <ol className="text-sm text-slate-400 list-decimal list-inside space-y-1">
                <li>Pull event from Event Hub</li>
                <li>Map fields to API format</li>
                <li>Send to Transact API</li>
                <li>Handle response</li>
              </ol>
            </div>
          </div>
        ),
        features: [
          'Pull events from queue',
          'Transform to API format',
          'Call Transact API',
          'Handle success/failure'
        ],
        technicalDetails: [
          { label: 'Pattern', value: 'Pull-Map-Send' },
          { label: 'Retry', value: '3 attempts' },
          { label: 'Timeout', value: '30 seconds' },
          { label: 'DLQ', value: 'Enabled' }
        ]
      }
    ]
  },

  'credit-cards-demo': {
    navItems: [
      {
        id: 'overview',
        label: 'Overview',
        icon: Info,
        title: 'Credit Cards Demo Overview',
        content: (
          <div className="space-y-4">
            <p>
              The Credit Cards Demo application showcases comprehensive credit card management
              capabilities including card products, rewards programs, credit limit management,
              and statement processing.
            </p>
            <p>
              This full-stack application demonstrates how credit card services integrate with
              core banking systems, featuring a modern React frontend and a Python FastAPI backend.
            </p>
          </div>
        ),
        features: [
          'Credit card product management',
          'Rewards and loyalty programs',
          'Credit limit adjustments',
          'Statement generation',
          'Payment processing',
          'Credit bureau integration'
        ],
        technicalDetails: [
          { label: 'Frontend', value: 'React + Vite + TypeScript' },
          { label: 'Backend', value: 'FastAPI (Python)' },
          { label: 'Database', value: 'PostgreSQL' },
          { label: 'Ports', value: '3006 / 8006' }
        ]
      },
      {
        id: 'features',
        label: 'Features',
        icon: CreditCard,
        title: 'Credit Card Features',
        content: (
          <div className="space-y-4">
            <p>
              Explore the complete lifecycle of credit card management from application
              to rewards redemption.
            </p>
          </div>
        ),
        features: [
          'New card applications',
          'Credit limit management',
          'Rewards points accrual',
          'Points redemption',
          'Statement viewing',
          'Payment scheduling',
          'Spending analytics',
          'Fraud alerts'
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
              The Credit Cards Demo integrates with Temenos credit card APIs and third-party
              services for rewards and credit bureau reporting.
            </p>
            <div className="bg-slate-700/30 rounded-lg p-4 mt-4">
              <p className="text-sm text-slate-300 mb-2">Key Integrations:</p>
              <ul className="text-sm text-slate-400 list-disc list-inside space-y-1">
                <li>Credit Card Products API</li>
                <li>Rewards Program API</li>
                <li>Credit Bureau Reporting</li>
                <li>Statement Generation API</li>
              </ul>
            </div>
          </div>
        ),
        features: [
          'REST API integration',
          'Third-party rewards partners',
          'Credit bureau connectivity',
          'Real-time authorization'
        ],
        technicalDetails: [
          { label: 'API Style', value: 'REST' },
          { label: 'Format', value: 'JSON' },
          { label: 'Auth', value: 'OAuth 2.0' },
          { label: 'Docs', value: '/docs' }
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
              The Credit Cards Demo can be configured to support different card products,
              reward structures, and integration endpoints.
            </p>
          </div>
        ),
        features: [
          'Card product configuration',
          'Rewards program setup',
          'Credit limit policies',
          'Statement templates',
          'Environment switching'
        ]
      }
    ]
  }
}

export default appLandingConfigs
