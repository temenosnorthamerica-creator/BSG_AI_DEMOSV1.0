# BSG Demo Platform

## Overview

The **BSG Demo Platform** serves as the central hub for demonstrating Temenos products and capabilities.  
It provides a unified environment where architecture, deployments, presentations, videos, and technical documentation are consolidated and maintained in one place.  

This repository is designed to support the **Business Solution Group (BSG)** in preparing and delivering high-quality demonstrations and proof-of-concepts that highlight the full range of Temenos technologies, from **Transact** and **Infinity** to supporting microservices and integration layers.

---

## Objectives

- Consolidate all demo artifacts and reference environments into a single, structured repository.  
- Streamline deployment and configuration processes across multiple environments and cloud platforms.  
- Provide reusable materials such as architecture diagrams, technical presentations, and recorded sessions.  
- Document best practices, reference architectures, and integration patterns.  
- Facilitate collaboration among BSG members through shared and versioned resources.

---

## Repository Structure

```
bsg-demo-platform/
├── backend/              # FastAPI backend application
├── frontend/             # React frontend application
├── infrastructure/       # Azure deployment infrastructure
├── docs/                 # Documentation files
├── scripts/              # Start/Stop all scripts
├── tools/                # Development tools and utilities
├── .claude/              # Claude AI context (synced with .cursor/rules)
├── design/               # Design files and component specs
└── logs/                 # Application logs (git-ignored)
```

### Key Directories

| Directory | Description |
|-----------|-------------|
| `backend/` | FastAPI backend with API routes, services, adapters, and models |
| `frontend/` | React frontend with components, pages, and services |
| `infrastructure/` | Azure deployment scripts, GitHub Actions workflows |
| `docs/` | All documentation including ARCHITECTURE.md, USAGE.md, and guides |
| `scripts/` | Start/Stop/Restart all services scripts only |
| `tools/` | Development tools, utilities, and other scripts |
| `.claude/` | Claude AI development context (synced with .cursor/rules) |

For detailed structure, see [docs/PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md).

---

## Architecture

### Current Deployment

**LOCAL (Windows Machine):**

- **Frontend (React/Vite)**
  - Port: 3000
  - Process: Node.js
  - Type: Development server running directly on your machine
  - URL: http://localhost:3000

- **Backend (FastAPI)**
  - Port: 8000
  - Process: Python
  - Command: `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
  - Type: Python process running directly (not in container)
  - URL: http://localhost:8000
  - API Docs: http://localhost:8000/docs

**CLOUD (Azure):**

- **MongoDB Database (Azure Cosmos DB)**
  - Account: bsg-demo-platform-mongodb
  - Host: bsg-demo-platform-mongodb.mongo.cosmos.azure.com:10255
  - Database: bsg_demo
  - Resource Group: bsg-demo-platform
  - Status: Cloud-hosted, accessible via connection string
  - Type: Fully managed MongoDB service in Azure

**MongoDB Collections:**
- `users` - User accounts and authentication
- `user_sessions` - Active user sessions
- `components` - Component definitions
- `content` - Component content
- `videos` - Video metadata and references
- `security_docs` - Security documentation
- `presentations` - Presentation materials

For detailed documentation, see:
- [Architecture Documentation](./docs/ARCHITECTURE.md)
- [Usage Guide](./docs/USAGE.md)
- [Azure Services Explained](./docs/AZURE_SERVICES_EXPLAINED.md) - Learn about Static Web Apps vs App Service
- [Azure Configuration Guide](./docs/AZURE_CONFIGURATION.md)
- [Troubleshooting Guide](./docs/TROUBLESHOOTING.md)

---

## Getting Started

```bash
git clone https://github.com/georgasa/bsg-demo-platform.git
cd bsg-demo-platform
