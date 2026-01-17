# Project Structure

This document describes the organization of the BSG Demo Platform repository.

## Root Directory Structure

```
bsg-demo-platform/
├── backend/              # FastAPI backend application
│   ├── app/             # Main application code
│   │   ├── api/         # API route handlers
│   │   ├── services/    # Business logic services
│   │   ├── models/      # Pydantic data models
│   │   ├── adapters/    # External service adapters (Database, RAG)
│   │   ├── middleware/  # Request/response middleware
│   │   ├── core/        # Core configuration and utilities
│   │   └── utils/       # Utility functions
│   ├── scripts/         # Backend utility scripts
│   ├── uploads/         # File uploads (videos, etc.)
│   └── requirements.txt # Python dependencies
│
├── frontend/            # React frontend application
│   ├── src/            # Source code
│   │   ├── components/ # React components
│   │   ├── pages/      # Page components
│   │   ├── services/   # API service layer
│   │   └── types/      # TypeScript type definitions
│   ├── public/         # Static assets
│   ├── dist/           # Build output (git-ignored)
│   └── package.json    # Node.js dependencies
│
├── infrastructure/      # Deployment infrastructure
│   ├── .github/        # GitHub Actions workflows
│   └── *.sh, *.ps1     # Deployment scripts
│
├── docs/               # Documentation
│   ├── ARCHITECTURE.md # System architecture documentation
│   ├── USAGE.md        # Usage guide
│   └── *.md            # Other documentation files
│
├── scripts/            # Root-level utility scripts
│   ├── start-*.bat     # Windows start scripts
│   ├── start-*.ps1     # PowerShell start scripts
│   ├── start-*.sh      # Linux/Mac start scripts
│   └── restart-*.bat   # Restart scripts
│
├── tools/              # Development tools
│   ├── update_*.py     # Catalog update scripts
│   └── test-*.py       # Test scripts
│
├── design/             # Design files
│   └── components/     # Component specifications
│
├── logs/               # Application logs (git-ignored)
│
├── README.md           # Main project README
├── .gitignore          # Git ignore rules
└── .cursor/            # Cursor IDE configuration
```

## Directory Details

### `/backend`

Contains the FastAPI backend application:
- **`app/`**: Main application code with API routes, services, models, and adapters
- **`scripts/`**: Backend-specific utility scripts for data management
- **`uploads/`**: User-uploaded files (videos, etc.)
- **`requirements.txt`**: Python package dependencies

### `/frontend`

Contains the React frontend application:
- **`src/`**: Source code with components, pages, and services
- **`public/`**: Static assets (images, HTML files)
- **`dist/`**: Build output directory (excluded from git)
- **`package.json`**: Node.js package configuration

### `/infrastructure`

Contains deployment and infrastructure scripts:
- **`.github/workflows/`**: GitHub Actions workflows for CI/CD
- **`*.sh`, `*.ps1`**: Infrastructure setup scripts

### `/docs`

Contains all project documentation:
- **`ARCHITECTURE.md`**: Detailed system architecture documentation
- **`USAGE.md`**: Comprehensive usage guide
- **`CHECK_TOKEN_SETUP.md`**: JWT token configuration guide
- **`.claude/claude.md`**: Development context (synced with .cursor/rules)
- Other documentation files for specific features

### `/scripts`

Contains root-level utility scripts for managing the application:
- **Start scripts**: `start.bat`, `start.ps1`, `start.sh` - Start all services
- **Restart scripts**: `restart-all.bat`, `restart-all.ps1` - Restart all services
- **Stop scripts**: `stop.bat`, `stop.sh` - Stop all services
- **Sync scripts**: `sync.ps1`, `sync.sh` - Sync with git repository

### `/tools`

Contains development tools and utilities:
- **`update_*.py`**: Scripts for updating content catalogs
- **`test-*.py`**: Test and validation scripts

### `/logs`

Contains application logs (excluded from git):
- **`app-logs/`**: Application log files
- **`*.zip`**: Archived log files

## File Organization Principles

1. **Documentation**: All `.md` files (except `README.md`) are in `/docs`
2. **Scripts**: Root-level scripts for service management are in `/scripts`
3. **Tools**: Development tools and utilities are in `/tools`
4. **Logs**: All log files are in `/logs` (git-ignored)
5. **Source Code**: Application code stays in `/backend` and `/frontend`

## Navigation

- **Getting Started**: See [README.md](../README.md)
- **Architecture**: See [docs/ARCHITECTURE.md](./ARCHITECTURE.md)
- **Usage**: See [docs/USAGE.md](./USAGE.md)
- **Development**: See `.claude/claude.md` or `.cursor/rules`

---

**Last Updated**: November 2025  
**Maintained By**: BSG Team

