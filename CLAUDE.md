# Americas BSG Bank Ecosystem Integration Demo

A unified platform showcasing Temenos banking integration capabilities through multiple demo applications.

## Project Overview

This monorepo contains 5 interconnected applications demonstrating various aspects of banking ecosystem integration with Temenos products, plus 1 embedded demo (Creditos).

---

## IMPORTANT: Development Guidelines

> **STRICT RULES FOR CONTRIBUTORS**

### DO NOT MODIFY:
- **Navigation Structure** - The sitemap and routing structure of each application MUST remain unchanged
- **Port Assignments** - Each application's assigned ports are fixed and must not be altered
- **Inter-app Navigation** - The Landing Page (3000) serves as the central hub; do not change how apps connect to it
- **Existing Route Paths** - All documented routes (`/`, `/dashboard`, `/login`, etc.) must remain intact
- **Sidebar/Header Navigation** - Core navigation components must maintain their current structure

### ALLOWED MODIFICATIONS:
- **Add New Pages/Features** - You MAY add new pages, components, or functionality WITHIN each sub-application
- **Extend Existing Pages** - You MAY add new sections, features, or UI elements to existing pages
- **Add New API Endpoints** - You MAY create new backend endpoints without removing existing ones
- **Add New Components** - You MAY create new reusable components within each app
- **Enhance Styling** - You MAY improve UI/UX as long as navigation structure is preserved
- **Add New Event Types** - You MAY add new CloudEvent types for middleware integration
- **Add New Demo Cards** - You MAY add new demo applications to the Landing Page

### Examples:
```
ALLOWED:
  - Adding a new tab inside the CRM Simulator page
  - Creating a new /reports page in BSG Demo Platform
  - Adding transaction filters to Debit Cards Dashboard
  - Creating new loan product types in LMS Portal
  - Adding new event handlers in ESB
  - Adding new demo cards to Landing Page (like Creditos)

NOT ALLOWED:
  - Removing the /api-reference route from CRM Simulator
  - Changing Landing Page from port 3000 to another port
  - Removing Banking Systems section from Landing Page
  - Changing /login to /signin in LMS Portal
  - Removing sidebar navigation from any application
```

---

## Page Names Reference

| Page Name | Location | File(s) | Description |
|-----------|----------|---------|-------------|
| **Home Page** | Landing Page (3000) | `HomePage.jsx` | Main dashboard with Team Demo Applications cards |
| **App Landing Page** | Click on demo card | `AppLandingPage.jsx`, `AppLandingTemplate.jsx` | Sub-page with Overview, Components, Architecture, API Docs tabs |
| **Demo View** | Click "Show Demo" | Inside `AppLandingTemplate.jsx` | iframe showing the actual demo application |
| **System Page** | Click on Banking System | `SystemPage.jsx` | Banking system detail view with APIs |
| **Client Config** | Sidebar → Client Environment | `ClientConfigPage.jsx` | Client branding configuration |

---

## Applications & Port Assignments

| Application | Frontend Port | Backend Port | Owner |
|------------|---------------|--------------|-------|
| Landing Page | 3000 | - | brian.grundleger@temenos.com |
| CRM Banking Simulator | 3001 | - | alwin@temenos.com |
| BSG Demo Platform | 3002 | 8002 | migarcia@temenos.com |
| Debit Cards Demo | 3003 | 8003 | sweekruth.somaraju@temenos.com |
| LMS Applicant Portal | 3004 | - | mmoore@temenos.com |
| Creditos (embedded) | 3002 | 8002 | migarcia@temenos.com |
| ESB | 3016 | 8006 | m.mahaboobhussain@temenos.com |

---

## 1. Landing Page (Port 3000)

**Path:** `brian.grundleger/BG_DallasAiProjects/DallasAiProjects`

### Tech Stack
| Layer | Technology |
|-------|------------|
| Framework | React 18.3 |
| Build Tool | Vite 6.0 |
| Styling | Tailwind CSS 3.4 |
| Icons | Lucide React |
| Navigation | useState (state-based) |
| Utilities | clsx |

### Sitemap
```
http://localhost:3000/
│
├── HOME PAGE (Default) - accessible via Sidebar → Home
│   │
│   ├── Header Section
│   │   └── Client Logo/Name (customizable via Client Config)
│   │
│   └── Team Demo Applications Section (5 cards + embedded demos)
│       ├── CRM Banking Simulator Card → App Landing Page (port 3001)
│       ├── BSG Demo Platform Card → App Landing Page (port 3002)
│       ├── Debit Cards Demo Card → App Landing Page (port 3003)
│       ├── LMS Applicant Portal Card → App Landing Page (port 3004)
│       ├── Creditos Card → App Landing Page (embedded BSG port 3002)
│       └── ESB Card → App Landing Page (port 3016)
│
├── APP LANDING PAGE (Full-screen, no sidebar/header)
│   ├── Top Section
│   │   ├── Back to Home button
│   │   ├── App icon, name, owner, port badges
│   │   └── Navigation Tabs (demo-specific)
│   │
│   ├── Bottom Section (70% height, 2-panel layout)
│   │   ├── Left Panel (65%) - Tab content + "Show Demo" button
│   │   └── Right Panel (35%) - Integration Flow diagram
│   │
│   └── Demo View (iframe) - shown after clicking "Show Demo"
│
│   Navigation tabs per demo:
│   ├── CRM Banking Simulator: Overview | Features | Integration | Configuration
│   ├── BSG Demo Platform: Overview | Components | Architecture | API Docs
│   ├── Debit Cards Demo: Overview | Features | Events | API
│   ├── LMS Applicant Portal: Overview | Workflow | Integration | Products
│   ├── Creditos: Overview | Components | Architecture | API Docs
│   └── ESB: Overview | Features | Mapping | API Flow
│
├── SYSTEM PAGE (Banking System Detail)
│   ├── System Overview (name, description, icon)
│   ├── APIs Section (filterable: All | Temenos | 3rd Party)
│   ├── Documentation Links
│   └── Demo Environment Links
│
└── CLIENT CONFIG PAGE - accessible via context/ClientConfigContext
    ├── Client Name input
    ├── Client Logo upload
    ├── Primary/Secondary Color pickers
    └── System Enable/Disable toggles

SIDEBAR (Collapsible via toggle button, expanded by default):
├── Logo/Client branding
├── Home button
├── Solution Diagram button
└── Health Check button
```

### Key Files
- `src/App.jsx` - Main routing and state management
- `src/components/Sidebar.jsx` - Navigation sidebar
- `src/pages/HomePage.jsx` - Main dashboard with demo cards
- `src/pages/AppLandingPage/AppLandingPage.jsx` - Demo app landing template
- `src/components/AppLandingTemplate/AppLandingTemplate.jsx` - Template for app landing pages
- `src/pages/SystemPage.jsx` - Banking system detail view
- `src/data/systems.json` - Banking systems, APIs, and demo apps data
- `src/data/appLandingData.jsx` - Demo app tab configurations (Overview, Components, etc.)

### Adding a New Demo Card
1. Add entry to `src/data/systems.json` under `teamDemos` array
2. Add configuration to `src/data/appLandingData.jsx` with navItems
3. Add icon mapping in `src/pages/HomePage.jsx` (systemIcons, systemColors)
4. Add icon mapping in `src/pages/AppLandingPage/AppLandingPage.jsx` (appIcons, integrationDiagrams)

---

## 2. CRM Banking Simulator (Port 3001)

**Path:** `alwin/crm-banking-simulator_v2/crm-banking-simulator_v2`

### Tech Stack
| Layer | Technology |
|-------|------------|
| Framework | React 18.2 |
| Language | TypeScript 5.3 |
| Build Tool | Vite 5.0 |
| Styling | Tailwind CSS 3.4 |
| Routing | React Router DOM 6.21 |
| HTTP Client | Axios 1.6 |
| Icons | Lucide React |

### Sitemap
```
http://localhost:3001/
│
├── / (Simulator Page - Default)
│   ├── Header
│   │   ├── Theme Toggle (Light/Dark)
│   │   └── Health Check Panel
│   │
│   ├── Sidebar (Collapsible)
│   │   └── Application Selection
│   │
│   └── Main Content
│       └── Banking Simulator Interface
│           ├── Customer Profile Management
│           ├── Account Balance Display
│           ├── Transaction History
│           └── Customer 360 View
│
└── /api-reference
    └── API Reference Page
        └── Temenos API Documentation

API Proxy: /api/temenos → americasbsgprd.temenos.com
```

### Key Files
- `src/App.tsx` - Main app with routing
- `src/pages/SimulatorPage.tsx` - CRM simulator interface
- `src/pages/APIReferencePage.tsx` - API documentation
- `src/components/Header.tsx` - App header with theme toggle
- `src/components/Sidebar.tsx` - Navigation sidebar
- `src/components/HealthCheckPanel.tsx` - System health checker

---

## 3. BSG Demo Platform (Ports 3002/8002)

**Path:** `migarcia/DALLASAI 1/DALLASAI`

### Tech Stack - Frontend
| Layer | Technology |
|-------|------------|
| Framework | React 18.2 |
| Language | TypeScript 5.3 |
| Build Tool | Vite 5.0 |
| Styling | Tailwind CSS 3.4 |
| Routing | React Router DOM 6.21 |
| HTTP Client | Axios 1.6 |
| Animation | Framer Motion 12.23 |
| Icons | Lucide React |

### Tech Stack - Backend
| Layer | Technology |
|-------|------------|
| Framework | FastAPI 0.109 |
| Language | Python 3.x |
| Server | Uvicorn 0.27 |
| Database | MongoDB (Motor 3.3.2 async driver) |
| Cloud DB | Azure Cosmos DB (MongoDB API) |
| SQL DB | MSSQL (pyodbc 5.3) |
| Auth | JWT (python-jose), bcrypt |
| Caching | Redis 5.0 |
| Monitoring | Prometheus, OpenTelemetry |
| Azure SDK | azure-identity, azure-mgmt-* |

### Embed Mode (for Landing Page integration)
BSG Demo Platform supports embed mode for displaying specific components in an iframe:

**URL Parameters:**
- `?component=<component-id>` - Navigate directly to a component (e.g., `branch-loans`)
- `?embed=true` - Enable embed mode (removes sidebar, header, watermark, margin)

**Example:** `http://localhost:3002?component=branch-loans&embed=true`

**Embed mode behavior:**
- Sidebar is removed
- Header is hidden
- Background watermark is removed
- `data-sidebar` attribute removed from body (prevents margin-left CSS)
- Content uses full width with minimal padding

### Sitemap
```
http://localhost:3002/
│
├── HOME PAGE (Default)
│   ├── Header
│   ├── Sidebar (Icon-based)
│   │   ├── Home
│   │   ├── Integration
│   │   ├── Data Architecture
│   │   ├── Deployment
│   │   ├── Security
│   │   ├── Observability
│   │   ├── Design Time
│   │   ├── Sucursal - Creditos (Branch Loans)
│   │   └── Settings
│   │
│   └── Component Cards Grid
│       └── Click → Component Page
│
├── COMPONENT PAGE (Dynamic)
│   ├── Integration (APIs & Events)
│   ├── Data Architecture
│   ├── Deployment & Cloud
│   ├── Security
│   ├── Observability
│   └── Design Time
│
├── BRANCH LOANS PAGE (Sucursal - Creditos)
│   ├── Header with Navigation (Solicitar Credito | Consultar Pagos)
│   ├── Customer Search (Por Identificacion | Por Nombre | Por Telefono)
│   ├── Loan Application Workflow (3 steps)
│   ├── Payment Schedule Viewer
│   └── Loan Confirmation
│
└── SETTINGS MODAL
    └── Theme Toggle (Light/Dark)

BACKEND API: http://localhost:8002
├── /docs - Swagger/OpenAPI Documentation
├── /api/v1/components - Component management
├── /api/v1/content - Content management
├── /api/v1/videos - Video management
├── /api/v1/demos - Demo configurations
├── /api/v1/chat - AI Chatbot sessions
└── /api/v1/auth - Authentication
```

### Key Files - Frontend
- `frontend/src/App.tsx` - Main app with state-based routing and embed mode support
- `frontend/src/pages/HomePage.tsx` - Component grid
- `frontend/src/pages/ComponentPage.tsx` - Dynamic component viewer
- `frontend/src/components/Sidebar.tsx` - Navigation (sets data-sidebar attribute)
- `frontend/src/components/loans/BranchLoanPage.tsx` - Sucursal - Creditos (loan management)
- `frontend/src/types/index.ts` - TypeScript definitions
- `frontend/src/index.css` - Global styles including sidebar margin rules

### Key Files - Backend
- `backend/app/main.py` - FastAPI application
- `backend/app/api/` - API route handlers
- `backend/app/models/` - Pydantic models
- `backend/app/services/` - Business logic
- `backend/requirements.txt` - Python dependencies

---

## 4. Debit Cards Demo (Ports 3003/8003)

**Path:** `sweekruth.somaraju/debitcards/debitcards`

### Tech Stack - Frontend
| Layer | Technology |
|-------|------------|
| Framework | React 18.2 |
| Language | TypeScript 5.3 |
| Build Tool | Vite 5.0 |
| Styling | Tailwind CSS 3.4 |
| HTTP Client | Axios 1.6 |
| Icons | Lucide React |

### Tech Stack - Backend
| Layer | Technology |
|-------|------------|
| Framework | FastAPI 0.109 |
| Language | Python 3.x |
| Server | Uvicorn 0.27 |
| Events | Azure Event Hubs 5.11 |
| Auth | JWT (python-jose) |
| Validation | Pydantic 2.5 |

### Sitemap
```
http://localhost:3003/
│
├── LOGIN PAGE (Default when unauthenticated)
│   ├── Card Number Input
│   ├── PIN Input
│   └── Login Button
│
└── DASHBOARD PAGE (After authentication)
    ├── Session Info Header
    │   ├── Masked Card Number
    │   ├── Cardholder Name
    │   └── Logout Button
    │
    └── Card Management Interface
        ├── Card Balance Display
        ├── Transaction History
        ├── Card Status Management
        ├── PIN Management
        └── Card Actions (Block/Unblock)

BACKEND API: http://localhost:8003
├── /docs - API Documentation
├── /api/auth/pin - PIN authentication
├── /api/auth/logout - Session logout
├── /api/auth/validate - Session validation
├── /api/cards - Card operations
└── /api/transactions - Transaction history

EVENT TYPES (Azure Event Hubs):
├── card.issued
├── card.activated
├── transaction.processed
└── card.blocked
```

### Key Files - Frontend
- `frontend/src/App.tsx` - Auth state and routing
- `frontend/src/pages/LoginPage.tsx` - Card login
- `frontend/src/pages/DashboardPage.tsx` - Card management
- `frontend/src/services/api.ts` - API service layer

### Key Files - Backend
- `backend/app/main.py` - FastAPI application
- `backend/requirements.txt` - Python dependencies

---

## 5. LMS Applicant Portal (Port 3004)

**Path:** `mmoore/lms-applicant-portal/lms-applicant-portal`

### Tech Stack
| Layer | Technology |
|-------|------------|
| Framework | React 19.2 |
| Language | TypeScript 5.9 |
| Build Tool | Vite 7.2 |
| Styling | Tailwind CSS 4.1 |
| Routing | React Router DOM 7.12 |
| State/Cache | TanStack React Query 5.90 |
| HTTP Client | Axios 1.13 |

### Sitemap
```
http://localhost:3004/
│
├── /login (Public)
│   └── Login Page
│       ├── Email Input
│       ├── Password Input
│       └── Login Button
│
├── /dashboard (Protected)
│   └── Portal Dashboard
│       ├── Application Summary Cards
│       ├── Recent Applications List
│       ├── Quick Actions
│       └── Notifications
│
├── /application/:id (Protected)
│   └── Application Details
│       ├── Application Status
│       ├── Submitted Information
│       ├── Document Uploads
│       ├── Decision Status
│       └── Action Buttons
│
├── /products (Protected)
│   └── Product Catalog
│       ├── Personal Loans
│       ├── Auto Loans
│       ├── Home Equity Lines
│       ├── Small Business Loans
│       ├── Student Loans
│       └── Debt Consolidation
│
└── /* (Redirect to /dashboard)

API Integration: lmsdemo1.temenos.com/LendingAPI
├── Loan Origination
├── Credit Decision Engine
├── Document Management
└── Workflow Orchestration
```

### Key Files
- `src/App.tsx` - Routing with protected routes
- `src/pages/LoginPage.tsx` - Authentication
- `src/pages/PortalDashboard.tsx` - Main dashboard
- `src/pages/ApplicationDetails.tsx` - Application viewer
- `src/pages/ProductCatalog.tsx` - Loan products
- `src/hooks/useAuth.ts` - Authentication hook
- `src/api/` - API service layer

---

## 6. Creditos (Embedded Demo)

**Path:** Uses BSG Demo Platform (`migarcia/DALLASAI 1/DALLASAI`)

### Description
Creditos is an embedded demo that displays the "Sucursal - Creditos" (Branch Loans) page from BSG Demo Platform directly in the Landing Page's demo iframe.

### URL
`http://localhost:3002?component=branch-loans&embed=true`

### Features
- Loan application submission (Solicitar Credito)
- Payment consultation and tracking (Consultar Pagos)
- Customer search by ID, name, or phone
- Payment status overview (Pagados, Pendientes, Vencidos)
- 3-step loan workflow (Cliente → Tipo de Prestamo → Solicitud)

### Configuration Files
- Landing Page: `src/data/systems.json` (teamDemos array)
- Landing Page: `src/data/appLandingData.jsx` (creditos config with Overview, Components, Architecture, API Docs)
- BSG Platform: `frontend/src/components/loans/BranchLoanPage.tsx`

---

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- npm or yarn

### Install All Dependencies
```powershell
# Run from project root
.\install-all.ps1
```

### Start All Applications
```powershell
# Run from project root
.\startup-all.ps1
```

### Start Individual Applications

**Landing Page (Port 3000):**
```bash
cd brian.grundleger/BG_DallasAiProjects/DallasAiProjects
npm run dev
```

**CRM Simulator (Port 3001):**
```bash
cd alwin/crm-banking-simulator_v2/crm-banking-simulator_v2
npm run dev
```

**BSG Demo Platform (Ports 3002/8002):**
```bash
# Frontend
cd migarcia/DALLASAI\ 1/DALLASAI/frontend
npm run dev

# Backend
cd migarcia/DALLASAI\ 1/DALLASAI/backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload
```

**Debit Cards Demo (Ports 3003/8003):**
```bash
# Frontend
cd sweekruth.somaraju/debitcards/debitcards/frontend
npm run dev

# Backend
cd sweekruth.somaraju/debitcards/debitcards/backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8003 --reload
```

**LMS Portal (Port 3004):**
```bash
cd mmoore/lms-applicant-portal/lms-applicant-portal
npm run dev
```

**ESB (Ports 3016/8006):**
```bash
# Frontend
cd m.mahaboobhussain/ESB/ESB_V1.0/frontend
npm run dev

# Backend
cd m.mahaboobhussain/ESB/ESB_V1.0/backend
npm run dev
```

---

## Environment Variables

Create `.env` files in respective application directories:

### BSG Demo Platform Backend
```env
MONGODB_URI=<Azure Cosmos DB connection string>
JWT_SECRET=<your-jwt-secret>
REDIS_URL=<redis-connection-url>
```

### Debit Cards Backend
```env
AZURE_EVENTHUB_CONNECTION_STRING=<event-hub-connection-string>
```

### ESB Backend
```env
AZURE_EVENTHUB_CONNECTION_STRING=<event-hub-connection-string>
EVENTHUB_NAME=test
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Landing Page (3000)                          │
│                    Central Navigation Hub                           │
│         (Home Page, App Landing Pages, System Pages)                │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐    ┌───────────────────┐    ┌─────────────────┐
│ CRM Simulator │    │  BSG Demo Platform │    │  Debit Cards    │
│    (3001)     │    │   (3002/8002)      │    │   (3003/8003)   │
└───────┬───────┘    └─────────┬─────────┘    └────────┬────────┘
        │                      │                       │
        │              ┌───────┴───────┐               │
        │              │               │               │
        │              ▼               │               │
        │      ┌─────────────┐         │               │
        │      │ Cosmos DB   │         │               │
        │      │ (MongoDB)   │         │               │
        │      └─────────────┘         │               │
        │              │               │               │
        │              ▼               │               │
        │      ┌─────────────┐         │               │
        │      │  Creditos   │         │               │
        │      │ (embedded)  │         │               │
        │      └─────────────┘         │               │
        │                              │               │
        ▼                              ▼               ▼
┌───────────────────────────────────────────────────────────────────┐
│                      Temenos Transact APIs                        │
│              americasbsgprd.temenos.com                           │
└───────────────────────────────────────────────────────────────────┘
        ▲                              ▲               ▲
        │                              │               │
┌───────┴───────┐           ┌──────────┴──────────┐   │
│ LMS Portal    │           │  ESB Demo           │   │
│   (3004)      │           │   (3016/8006)       │───┘
└───────────────┘           └──────────┬──────────┘
        │                              │
        ▼                              ▼
┌───────────────┐           ┌─────────────────────┐
│ lmsdemo1.     │           │   Azure Event Hubs  │
│ temenos.com   │           │   (CloudEvents)     │
└───────────────┘           └─────────────────────┘
```

---

## GitHub Repository

**Repository:** https://github.com/temenosnorthamerica-creator/BSG_AI_DEMOSV1.0
**Branch:** baseV1.0
