# Troubleshooting Guide

## Azure Authentication Issues (Azure App Service)

If you see "Unable to connect to Azure" errors when using the web app (not localhost), the backend needs Azure credentials configured.

### Option 1: Enable Managed Identity (Recommended)

1. **Enable Managed Identity in Azure Portal:**
   - Go to: https://portal.azure.com
   - Navigate to: App Services → `bsg-demo-platform-app` → Identity
   - Under "System assigned" tab, click "On" → Save
   - Copy the **Object (principal) ID** (e.g., `12e9c273-f0f7-4e0b-bdf8-bf950544d4db`)

2. **Grant Reader Role to Managed Identity at Subscription Level:**
   
   **Important**: The role must be assigned at the **subscription level**, not the resource group level.
   
   ```bash
   az role assignment create \
     --assignee <principal-id> \
     --role "Reader" \
     --scope /subscriptions/<subscription-id>
   ```
   
   **Example:**
   ```bash
   az role assignment create \
     --assignee 12e9c273-f0f7-4e0b-bdf8-bf950544d4db \
     --role "Reader" \
     --scope /subscriptions/58a91cf0-0f39-45fd-a63e-5a9a28c7072b
   ```
   
   **Verify the assignment:**
   ```bash
   az role assignment list \
     --assignee <principal-id> \
     --scope /subscriptions/<subscription-id> \
     --query "[].{Role:roleDefinitionName, Scope:scope}"
   ```

3. **Restart the App Service:**
   - In Azure Portal: App Services → `bsg-demo-platform-app` → Restart
   - Or via CLI:
     ```bash
     az webapp restart --name bsg-demo-platform-app --resource-group <resource-group-name>
     ```

### Additional Permissions for AKS Access

If you need to discover AKS namespaces and pods, the Managed Identity needs additional permissions:

1. **Azure Kubernetes Service Cluster User Role:**
   ```bash
   az role assignment create \
     --assignee <principal-id> \
     --role "Azure Kubernetes Service Cluster User Role" \
     --scope /subscriptions/<subscription-id>/resourceGroups/<aks-resource-group>/providers/Microsoft.ContainerService/managedClusters/<cluster-name>
   ```

2. **Note on AKS Namespace Discovery:**
   - **Local Development**: Works because `kubectl` and Azure CLI are available
   - **Azure App Service**: Currently requires `kubectl` to be installed (not available by default)
   - **Workaround**: The application will show "No namespaces found" in Azure App Service until `kubectl` is installed or the code is updated to use Kubernetes Python client library

### Option 2: Use Service Principal

If Managed Identity doesn't work, configure Service Principal credentials:

1. **Create Service Principal:**
   ```bash
   az ad sp create-for-rbac --name "bsg-demo-platform-sp" \
     --role "Reader" \
     --scopes /subscriptions/<subscription-id>
   ```

2. **Set App Settings in Azure Portal:**
   - Go to: App Services → `bsg-demo-platform-app` → Configuration → Application settings
   - Add:
     - `AZURE_CLIENT_ID` = (from service principal output)
     - `AZURE_CLIENT_SECRET` = (from service principal output)
     - `AZURE_TENANT_ID` = (from service principal output)

3. **Restart the App Service**

### Verify Configuration

After configuration, test the connection:
```powershell
.\tools\check-backend-status.ps1
```

Then try connecting to Azure from the web app again.

## Network Error - Backend API Not Reachable

If you see "Network Error - Unable to reach the backend API" in the frontend, check the following:

### 1. Verify Backend is Deployed

Check if the backend Azure App Service is running:

```bash
# Using Azure CLI
az webapp show \
  --name bsg-demo-platform-app \
  --resource-group bsg-demo-platform \
  --query "{state: state, defaultHostName: defaultHostName, httpsOnly: httpsOnly}"
```

Or check in Azure Portal:
- Go to Azure Portal → App Services → `bsg-demo-platform-app`
- Check the **Overview** tab for status
- Status should be **Running**

### 2. Check Backend URL is Correct

The frontend should point to:
- **Production**: `https://bsg-demo-platform-app.azurewebsites.net/api/v1`
- **Local**: `http://localhost:8000/api/v1`

Verify in:
- GitHub Actions workflow: `.github/workflows/deploy-static-webapp.yml` (line 40)
- Frontend code: `frontend/src/services/api.ts` (runtime detection)

### 3. Check GitHub Secrets

Ensure these secrets are set in GitHub:
- `AZURE_CREDENTIALS` - For Azure deployment
- `AZURE_STATIC_WEB_APPS_API_TOKEN` - For frontend deployment
- `RAG_JWT_TOKEN` - For RAG API access
- `DATABASE_URL` - For database connection

**To check:**
1. Go to: https://github.com/georgasa/bsg-demo-platform/settings/secrets/actions
2. Verify all required secrets exist
3. If `RAG_JWT_TOKEN` was just added, trigger a new deployment

### 4. Trigger Backend Deployment

If you just added `RAG_JWT_TOKEN`:
1. Go to GitHub Actions: https://github.com/georgasa/bsg-demo-platform/actions
2. Find "Deploy to Azure App Service" workflow
3. Click "Run workflow" → Select `develop` branch → Run
4. Wait for deployment to complete (usually 5-10 minutes)

### 5. Verify Environment Variables in Azure

Check if `RAG_JWT_TOKEN` is set in Azure App Service:

```bash
az webapp config appsettings list \
  --name bsg-demo-platform-app \
  --resource-group bsg-demo-platform \
  --query "[?name=='RAG_JWT_TOKEN']"
```

Or in Azure Portal:
- App Service → Configuration → Application settings
- Look for `RAG_JWT_TOKEN`

### 6. Check CORS Configuration

The backend CORS is configured to allow:
- `*.azurestaticapps.net` (all Azure Static Web Apps)
- `*.azurewebsites.net` (all Azure App Services)

If you're still getting CORS errors, check:
- `backend/app/core/config.py` - CORS origins
- `backend/app/main.py` - CORS middleware configuration

### 7. Test Backend Directly

Test if the backend is accessible:

```bash
# Health check
curl https://bsg-demo-platform-app.azurewebsites.net/api/v1/health

# JWT info endpoint (if token is set)
curl https://bsg-demo-platform-app.azurewebsites.net/api/v1/deployment/temenos/jwt-info
```

### 8. Check Backend Logs

View backend logs to see what's happening:

```bash
# Using Azure CLI
az webapp log tail \
  --name bsg-demo-platform-app \
  --resource-group bsg-demo-platform
```

Or in Azure Portal:
- App Service → Log stream
- Look for errors or connection issues

### 9. Restart Backend Service

If backend is running but not responding:

```bash
az webapp restart \
  --name bsg-demo-platform-app \
  --resource-group bsg-demo-platform
```

### 10. Verify Deployment Workflow

Check the latest GitHub Actions run:
1. Go to: https://github.com/georgasa/bsg-demo-platform/actions
2. Click on the latest "Deploy to Azure App Service" run
3. Check for any errors in the workflow steps
4. Verify all steps completed successfully

## AKS Namespace Discovery Issues

### Issue: "No namespaces found" in Azure App Service

**Problem**: AKS namespace discovery shows "No namespaces found" when deployed to Azure App Service.

**How It Works**:
The code tries multiple methods in order:
1. **Kubernetes Python Client** (Preferred) - Gets kubeconfig via Azure credentials, lists namespaces via Kubernetes API
2. **kubectl Fallback** - Uses `kubectl get namespaces` command (now auto-installed via `startup.sh`)

**Current Status**:
- ✅ **Local Development**: Works because `kubectl` and Azure CLI are installed
- ✅ **Azure App Service**: kubectl is now installed automatically by `startup.sh`
- ⚠️ **May still fail** if Managed Identity lacks permissions

**Immediate Diagnostic Steps**:

1. **Check Backend Logs**:
   ```bash
   az webapp log tail --name bsg-demo-platform-app --resource-group bsg-demo-platform
   ```
   Look for:
   - `"=== FUNCTION ENTRY: list_cluster_namespaces ==="`
   - `"Kubernetes Python client available: True/False"`
   - `"kubectl not found"` errors
   - `"Failed to get kubeconfig"` messages
   - `"startup.sh"` execution logs

2. **Verify kubectl Installation**:
   ```bash
   az webapp ssh --name bsg-demo-platform-app --resource-group bsg-demo-platform
   which kubectl
   kubectl version --client
   ```

3. **Check Managed Identity Permissions**:
   ```bash
   # Get principal ID
   PRINCIPAL_ID=$(az webapp identity show --name bsg-demo-platform-app --resource-group bsg-demo-platform --query principalId -o tsv)
   
   # Grant "Azure Kubernetes Service Cluster User Role" if missing
   az role assignment create \
     --assignee $PRINCIPAL_ID \
     --role "Azure Kubernetes Service Cluster User Role" \
     --scope /subscriptions/58a91cf0-0f39-45fd-a63e-5a9a28c7072b/resourceGroups/modulartest3/providers/Microsoft.ContainerService/managedClusters/transact
   ```

**Common Issues**:
- **kubectl not found**: Check if `startup.sh` ran successfully (should install kubectl automatically)
- **Kubernetes Python client fails**: Managed Identity likely lacks "Azure Kubernetes Service Cluster User Role"
- **No kubeconfig**: Azure credentials don't have permission to get cluster credentials

**Expected Success Output**:
If working, you should see namespaces like: adapterservice, deposits202507, eventstore, genericconfig, holdings, modular-banking, partyv2, transact, webingress

## Deployment Issues

### Issue: Frontend Not Loading (Blank Page)

**Problem**: Accessing `https://bsg-demo-platform-app.azurewebsites.net` shows a blank page.

**Solution**:
1. Verify static files are copied during deployment (check workflow step "Copy frontend build to backend static")
2. Check backend logs for "Static files mounted at /static" or "index.html not found" warnings
3. Verify `backend/app/static/index.html` exists after deployment

### Issue: Deployment Timeout

**Problem**: GitHub Actions deployment times out after 30+ minutes.

**Solution**:
- ✅ **FIXED**: Timeout increased to 45 minutes
- Package cleanup optimized to reduce deployment size
- Check workflow logs for specific step causing delay

## Common Issues

### Issue: "Backend API Not Reachable"

**Possible Causes:**
- Backend not deployed yet
- Backend deployment failed
- Backend service is stopped
- Network/firewall blocking access
- Incorrect backend URL in frontend

**Solutions:**
1. Verify backend is deployed and running
2. Check GitHub Actions workflow status
3. Verify backend URL in frontend code
4. Check Azure App Service logs
5. Restart backend service

### Issue: "RAG_JWT_TOKEN not configured"

**Possible Causes:**
- Secret not set in GitHub Secrets
- Secret not set in Azure App Service
- Backend not restarted after setting secret

**Solutions:**
1. Set `RAG_JWT_TOKEN` in GitHub Secrets
2. Trigger new deployment OR manually set in Azure App Service
3. Restart backend service

**Check Token Setup**:
```bash
# Check if token is configured in Azure
az webapp config appsettings list \
  --name bsg-demo-platform-app \
  --resource-group bsg-demo-platform \
  --query "[?name=='RAG_JWT_TOKEN']"

# Check token status via API
curl https://bsg-demo-platform-app.azurewebsites.net/api/v1/deployment/temenos/jwt-info
```

### Issue: CORS Errors

**Possible Causes:**
- Frontend domain not in CORS origins
- CORS middleware not configured correctly

**Solutions:**
1. Verify frontend domain is in CORS origins
2. Check CORS configuration in backend
3. Verify CORS middleware is enabled

## Quick Diagnostic Script

Run this PowerShell script to check everything:

```powershell
# Check backend accessibility
try {
    $health = Invoke-RestMethod -Uri "https://bsg-demo-platform-app.azurewebsites.net/api/v1/health" -TimeoutSec 10
    Write-Host "✓ Backend is accessible" -ForegroundColor Green
} catch {
    Write-Host "✗ Backend is NOT accessible: $($_.Exception.Message)" -ForegroundColor Red
}

# Check JWT token status (if backend is accessible)
try {
    $jwtInfo = Invoke-RestMethod -Uri "https://bsg-demo-platform-app.azurewebsites.net/api/v1/deployment/temenos/jwt-info" -TimeoutSec 10
    if ($jwtInfo.data.configured) {
        Write-Host "✓ RAG_JWT_TOKEN is configured" -ForegroundColor Green
        if ($jwtInfo.data.has_expiration -and $jwtInfo.data.is_expired) {
            Write-Host "⚠ JWT token is EXPIRED" -ForegroundColor Yellow
        }
    } else {
        Write-Host "✗ RAG_JWT_TOKEN is NOT configured" -ForegroundColor Red
    }
} catch {
    Write-Host "⚠ Could not check JWT status: $($_.Exception.Message)" -ForegroundColor Yellow
}
```

---

**Last Updated**: November 2025  
**Maintained By**: BSG Team

