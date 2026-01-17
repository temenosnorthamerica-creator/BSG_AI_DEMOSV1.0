# AmrBSGBankEcoIntDemo

Americas BSG Bank Ecosystem Integration Demo - A unified platform showcasing Temenos banking integration capabilities.

## Project Structure

```
AmrBSGBankEcoIntDemo/
├── brian.grundleger/           # Landing Page (Port 3000)
│   └── BG_DallasAiProjects/
├── alwin/                      # CRM Banking Simulator (Port 3001)
│   └── crm-banking-simulator_v2/
├── migarcia/                   # BSG Demo Platform (Port 3002, API: 8002)
│   └── DALLASAI 1/
├── sweekruth.somaraju/         # Debit Cards Demo (Port 3003, API: 8003)
│   └── debitcards/
├── mmoore/                     # LMS Applicant Portal (Port 3004)
│   └── lms-applicant-portal/
├── m.mahaboobhussain/          # Middleware Integration (Port 3005, API: 8005)
│   └── MIDDLEWARE/
├── projects.config.json        # Configuration file
├── startup-all.ps1             # PowerShell startup script
├── install-all.ps1             # Dependencies installation script
├── start.bat                   # Windows batch launcher
└── README.md                   # This file
```

## Port Assignments

| Project | Owner | Frontend Port | Backend Port |
|---------|-------|---------------|--------------|
| Landing Page | brian.grundleger@temenos.com | 3000 | - |
| CRM Banking Simulator | alwin@temenos.com | 3001 | - |
| BSG Demo Platform | migarcia@temenos.com | 3002 | 8002 |
| Debit Cards Demo | sweekruth.somaraju@temenos.com | 3003 | 8003 |
| LMS Applicant Portal | mmoore@temenos.com | 3004 | - |
| Middleware Integration | m.mahaboobhussain@temenos.com | 3005 | 8005 |

## Prerequisites

- Node.js (v18 or higher recommended)
- npm (v9 or higher)
- Python 3.11+ (for backend projects)
- pip (for Python dependencies)

## Quick Start

### 1. Install Dependencies

Run the install script to install all npm and pip dependencies:

```powershell
.\install-all.ps1
```

Or manually install for each project:

```powershell
# NPM projects
cd brian.grundleger\BG_DallasAiProjects\DallasAiProjects && npm install
cd alwin\crm-banking-simulator_v2\crm-banking-simulator_v2 && npm install
cd migarcia\DALLASAI 1\DALLASAI\frontend && npm install
cd sweekruth.somaraju\debitcards\debitcards\frontend && npm install
cd mmoore\lms-applicant-portal\lms-applicant-portal && npm install
cd m.mahaboobhussain\MIDDLEWARE\TEST_NEW_APP && npm install

# Python backends
cd migarcia\DALLASAI 1\DALLASAI\backend && pip install -r requirements.txt
cd sweekruth.somaraju\debitcards\debitcards\backend && pip install -r requirements.txt
```

### 2. Start All Projects

**Option A: Double-click start.bat**

**Option B: Run PowerShell script**

```powershell
.\startup-all.ps1
```

**Option C: Start individual projects**

```powershell
# Start landing page only
.\startup-all.ps1 -LandingOnly

# Start a specific project
.\startup-all.ps1 -Project landing
.\startup-all.ps1 -Project crm
.\startup-all.ps1 -Project bsg-frontend
.\startup-all.ps1 -Project middleware
```

## Project Details

### Landing Page (brian.grundleger)
- **URL**: http://localhost:3000
- **Tech Stack**: React, Vite, Tailwind CSS
- **Description**: Main landing page with cards linking to all demo applications

### CRM Banking Simulator (alwin)
- **URL**: http://localhost:3001
- **Tech Stack**: React, Vite, TypeScript, Tailwind CSS
- **Description**: Customer relationship management banking simulator

### BSG Demo Platform (migarcia)
- **Frontend URL**: http://localhost:3002
- **Backend API**: http://localhost:8002
- **Tech Stack**: React/Vite (frontend), FastAPI/Python (backend)
- **Description**: Full-stack BSG demo platform with MongoDB integration

### Debit Cards Demo (sweekruth.somaraju)
- **Frontend URL**: http://localhost:3003
- **Backend API**: http://localhost:8003
- **Tech Stack**: React/Vite (frontend), FastAPI/Python (backend)
- **Description**: Debit card management demonstration

### LMS Applicant Portal (mmoore)
- **URL**: http://localhost:3004
- **Tech Stack**: React, Vite, TypeScript, TanStack Query
- **Description**: Loan Management System applicant portal

### Middleware Integration (m.mahaboobhussain)
- **Frontend URL**: http://localhost:3005
- **Backend API**: http://localhost:8005
- **Tech Stack**: React/Vite (frontend), Express.js (backend), Azure Event Hubs
- **Description**: Azure Event Hubs middleware integration demo

## Usage

1. Start all projects using the startup script
2. Open the landing page at http://localhost:3000
3. Click on any team demo card to open that application in a new browser tab
4. Each project runs independently on its assigned port

## Troubleshooting

### Port Already in Use
If a port is already in use, you can find and kill the process:
```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Dependencies Not Found
Make sure to run the install script first:
```powershell
.\install-all.ps1
```

### Python Backend Not Starting
Ensure you have Python 3.11+ installed and in your PATH:
```powershell
python --version
pip --version
```

## Team Contacts

- Brian Grundleger: brian.grundleger@temenos.com
- Alwin: alwin@temenos.com
- Miguel Garcia: migarcia@temenos.com
- Sweekruth Somaraju: sweekruth.somaraju@temenos.com
- Matthew Moore: mmoore@temenos.com
- Mahaboob Hussain: m.mahaboobhussain@temenos.com
