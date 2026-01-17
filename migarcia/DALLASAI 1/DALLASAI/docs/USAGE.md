# BSG Demo Platform - Usage Guide

## Quick Start

### Prerequisites

- **Python 3.11+** installed
- **Node.js 20+** and npm installed
- **Git** for version control
- **Azure CLI** (optional, for Azure deployments)
- **PowerShell** (Windows) or **Bash** (Linux/Mac)

### Initial Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/georgasa/bsg-demo-platform.git
   cd bsg-demo-platform
   ```

2. **Set up Backend:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Set up Frontend:**
   ```bash
   cd frontend
   npm install
   ```

4. **Configure Environment Variables:**
   
   Create `backend/.env` file:
   ```env
   DATABASE_URL=your_mongodb_connection_string_here
   DATABASE_NAME=bsg_demo
   ENVIRONMENT=development
   DEBUG=True
   RAG_JWT_TOKEN=your_jwt_token_here
   RAG_API_URL=https://tbsg.temenos.com
   ```

## Running the Application

### Option 1: Using Batch Scripts (Windows)

**Start all services:**
```cmd
restart-all.bat
```

This will:
- Stop any running services
- Start backend on port 8000
- Start frontend on port 3000

### Option 2: Manual Start

**Start Backend:**
```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Start Frontend (in a new terminal):**
```bash
cd frontend
npm run dev
```

### Option 3: Using PowerShell Scripts

**Start Backend:**
```powershell
cd backend
.\start-backend.ps1
```

**Start Frontend:**
```powershell
cd frontend
npm run dev
```

## Accessing the Application

Once both services are running:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/v1/health

## Using the Platform

### Navigation

The platform is organized into **components**, each focusing on a specific Temenos domain:

1. **Integration** - APIs, Events, and Integration patterns
2. **Data Architecture** - Data models, flows, and architecture
3. **Deployment** - Cloud deployments and Azure analysis
4. **Security** - Security documentation and best practices
5. **Observability** - Monitoring and observability tools
6. **Design Time** - Design-time tools and workflows

### Component Features

Each component provides:

- **Content Tab**: Slides, documents, and technical content
- **Demo Tab**: Interactive demonstrations (if available)
- **BSG-Guru Tab**: AI-powered chatbot for component-specific questions

### Deployment Analyzer

The **Deployment** component includes an Azure Deployment Analyzer:

1. Click on **Deployment** component
2. Go to **Demo** tab
3. Click **Connect to Azure**
4. Select your Azure subscription
5. Choose resource groups to analyze
6. View identified Temenos components with detailed information

**Features:**
- Automatic Temenos component identification
- RAG-powered component information
- Azure resource analysis
- Kubernetes namespace discovery (local development only - see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for Azure App Service limitations)

### BSG-Guru Chatbot

Access the AI chatbot from any component:

1. Navigate to a component
2. Click **BSG-Guru** tab
3. Ask questions about the component
4. Get answers powered by Temenos RAG knowledge base

**Example Questions:**
- "What are the Temenos cloud architecture models?"
- "How does Temenos support cloud-native deployments?"
- "What are the best practices for deploying Temenos components on Azure?"

## API Usage

### Authentication

**Register a new user:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword",
    "name": "John Doe"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword"
  }'
```

**Use token in requests:**
```bash
curl -X GET http://localhost:8000/api/v1/components \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Component Content

**Get component content:**
```bash
curl -X GET "http://localhost:8000/api/v1/components/deployment/content?page=1&page_size=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Get specific content item:**
```bash
curl -X GET "http://localhost:8000/api/v1/components/deployment/content/content-id-123" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Azure Deployment Analysis

**Connect to Azure subscription:**
```bash
curl -X POST http://localhost:8000/api/v1/deployment/azure/connect \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "subscription_id": "your-subscription-id"
  }'
```

**Get resource groups:**
```bash
curl -X GET "http://localhost:8000/api/v1/deployment/azure/resource-groups?subscriptionId=your-subscription-id" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Analyze services:**
```bash
curl -X POST http://localhost:8000/api/v1/deployment/temenos/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "services": [...],
    "selected_namespaces": ["default", "temenos"]
  }'
```

## Environment Variables

### Backend Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | MongoDB connection string | Yes | - |
| `DATABASE_NAME` | Database name | No | `bsg_demo` |
| `ENVIRONMENT` | Environment (dev/staging/production) | No | `development` |
| `DEBUG` | Debug mode | No | `False` |
| `RAG_JWT_TOKEN` | JWT token for Temenos RAG API | No | - |
| `RAG_API_URL` | Temenos RAG API base URL | No | `https://tbsg.temenos.com` |
| `JWT_SECRET_KEY` | Secret key for JWT signing | No | Auto-generated |
| `PORT` | Backend port | No | `8000` |

### Frontend Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_API_URL` | Backend API URL | No | `/api/v1` |

**Note**: In production, `VITE_API_URL` is set during build to point to Azure App Service.

## Troubleshooting

### Backend Won't Start

**Check Python version:**
```bash
python --version  # Should be 3.11+
```

**Check dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

**Check environment variables:**
```bash
# Windows PowerShell
$env:DATABASE_URL
$env:DATABASE_NAME
```

**Check port availability:**
```bash
# Windows
netstat -ano | findstr :8000

# Linux/Mac
lsof -i :8000
```

### Frontend Won't Start

**Check Node.js version:**
```bash
node --version  # Should be 20+
```

**Clear node_modules and reinstall:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Check port availability:**
```bash
# Windows
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000
```

### Database Connection Issues

**Test MongoDB connection:**
```bash
# Using MongoDB shell
mongo "mongodb://connection-string"

# Check backend logs for connection errors
```

**Verify connection string format:**
- Must include SSL parameters for Azure Cosmos DB
- Check for special characters in password
- Ensure replica set is specified

### RAG API Issues

**Check JWT token:**
- Token must be valid and not expired
- Token should be set in `backend/.env` as `RAG_JWT_TOKEN`

**Test RAG connection:**
```bash
curl -X POST http://localhost:8000/api/v1/deployment/temenos/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is Temenos Transact?",
    "region": "global",
    "RAGmodelId": "ModularBanking"
  }'
```

### CORS Errors

**Check backend CORS configuration:**
- Backend allows `http://localhost:3000` by default
- For production, ensure Azure Static Web Apps domain is in CORS origins
- Check `backend/app/core/config.py` for CORS settings

## Development Workflow

### Making Changes

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes:**
   - Frontend: Edit files in `frontend/src/`
   - Backend: Edit files in `backend/app/`

3. **Test locally:**
   - Start both services
   - Test your changes
   - Check for errors in console/logs

4. **Commit changes:**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

5. **Push and create PR:**
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Standards

**Python (Backend):**
- Follow PEP 8
- Use type hints
- Write docstrings
- Use Pydantic v2 for validation

**TypeScript (Frontend):**
- Follow ESLint configuration
- Use TypeScript types
- Write JSDoc comments
- Use Tailwind CSS for styling

## Production Deployment

### Azure Deployment

The platform is automatically deployed to Azure via GitHub Actions:

- **Frontend**: Deploys to Azure Static Web Apps on push to `develop`
- **Backend**: Deploys to Azure App Service on push to `develop`

**Manual deployment:**
- See `.github/workflows/` for workflow definitions
- Ensure GitHub Secrets are configured:
  - `AZURE_STATIC_WEB_APPS_API_TOKEN`
  - `AZURE_CREDENTIALS`
  - `RAG_JWT_TOKEN`
  - `DATABASE_URL`

### Environment Configuration

**Azure App Service Settings:**
- Set environment variables in Azure Portal
- Or use Azure CLI:
  ```bash
  az webapp config appsettings set \
    --name bsg-demo-platform-app \
    --resource-group bsg-demo-platform \
    --settings DATABASE_URL="..." RAG_JWT_TOKEN="..."
  ```

## Getting Help

- **API Documentation**: http://localhost:8000/docs (when backend is running)
- **Architecture Documentation**: See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Component Documentation**: See component-specific README files
- **Issues**: Create an issue on GitHub

---

**Last Updated**: November 2025  
**Maintained By**: BSG Team

