# Azure Configuration Guide

This document provides detailed instructions for configuring Azure resources and permissions for the BSG Demo Platform.

## Table of Contents

1. [Managed Identity Setup](#managed-identity-setup)
2. [Role Assignments](#role-assignments)
3. [AKS Access Configuration](#aks-access-configuration)
4. [Environment Variables](#environment-variables)
5. [Verification Steps](#verification-steps)

## Managed Identity Setup

### Enable System-Assigned Managed Identity

The backend App Service uses a System-Assigned Managed Identity to authenticate to Azure services without managing credentials.

**Steps:**

1. **Navigate to App Service in Azure Portal:**
   - Go to: https://portal.azure.com
   - Navigate to: **App Services** → `bsg-demo-platform-app`

2. **Enable Managed Identity:**
   - Click on **Identity** in the left sidebar
   - Go to **System assigned** tab
   - Toggle **Status** to **On**
   - Click **Save**
   - Wait for the identity to be created (usually 10-30 seconds)

3. **Copy the Principal ID:**
   - After saving, the **Object (principal) ID** will be displayed
   - Copy this ID (e.g., `12e9c273-f0f7-4e0b-bdf8-bf950544d4db`)
   - You'll need this for role assignments

## Role Assignments

### Subscription-Level Reader Role (Required)

The Managed Identity needs the **Reader** role at the **subscription level** to query Azure resources.

**Why Subscription Level?**
- The application needs to list resource groups across the subscription
- Resource-level or resource-group-level permissions are too restrictive
- Subscription-level Reader role is read-only and safe

**Steps:**

1. **Using Azure CLI:**
   ```bash
   az role assignment create \
     --assignee <principal-id> \
     --role "Reader" \
     --scope /subscriptions/<subscription-id>
   ```

2. **Example:**
   ```bash
   az role assignment create \
     --assignee 12e9c273-f0f7-4e0b-bdf8-bf950544d4db \
     --role "Reader" \
     --scope /subscriptions/58a91cf0-0f39-45fd-a63e-5a9a28c7072b
   ```

3. **Using Azure Portal:**
   - Go to: **Subscriptions** → Select your subscription → **Access control (IAM)**
   - Click **Add** → **Add role assignment**
   - **Role**: Select **Reader**
   - **Assign access to**: Select **Managed identity**
   - **Members**: Click **Select members** → Find your App Service → Select it
   - **Scope**: Ensure it's set to **Subscription** level
   - Click **Review + assign**

**Verify the Assignment:**
```bash
az role assignment list \
  --assignee <principal-id> \
  --scope /subscriptions/<subscription-id> \
  --query "[].{Role:roleDefinitionName, Scope:scope, Principal:principalName}"
```

**Expected Output:**
```json
[
  {
    "Role": "Reader",
    "Scope": "/subscriptions/58a91cf0-0f39-45fd-a63e-5a9a28c7072b",
    "Principal": "bsg-demo-platform-app"
  }
]
```

## AKS Access Configuration

### Azure Kubernetes Service Cluster Admin Role (Required for Namespace Discovery)

If you need to discover AKS namespaces and pods, the Managed Identity needs the **Azure Kubernetes Service Cluster Admin Role** on each AKS cluster to get cluster admin credentials.

**Note**: The application now uses the Kubernetes Python client library (no kubectl required), but it still needs permissions to retrieve cluster credentials from Azure.

**Steps:**

1. **Grant Cluster Admin Role (Required for getting cluster credentials):**
   ```bash
   az role assignment create \
     --assignee <principal-id> \
     --role "Azure Kubernetes Service Cluster Admin Role" \
     --scope /subscriptions/<subscription-id>/resourceGroups/<aks-resource-group>/providers/Microsoft.ContainerService/managedClusters/<cluster-name>
   ```

2. **Example:**
   ```bash
   az role assignment create \
     --assignee 12e9c273-f0f7-4e0b-bdf8-bf950544d4db \
     --role "Azure Kubernetes Service Cluster Admin Role" \
     --scope /subscriptions/58a91cf0-0f39-45fd-a63e-5a9a28c7072b/resourceGroups/modulartest3/providers/Microsoft.ContainerService/managedClusters/transact
   ```

**Why Cluster Admin Role?**
- The application needs to call `list_cluster_admin_credentials()` to get the kubeconfig
- This requires the "Azure Kubernetes Service Cluster Admin Role" permission
- The kubeconfig is used to authenticate with the Kubernetes API (not for actual cluster admin operations)

## Environment Variables

### Required Environment Variables

These should be set in Azure App Service **Configuration** → **Application settings**:

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URL` | MongoDB connection string | Yes | `mongodb://...` |
| `DATABASE_NAME` | Database name | No | `bsg_demo` |
| `RAG_JWT_TOKEN` | JWT token for Temenos RAG API | No | `eyJhbGc...` |
| `RAG_API_URL` | Temenos RAG API base URL | No | `https://tbsg.temenos.com` |
| `ENVIRONMENT` | Environment name | No | `production` |
| `DEBUG` | Debug mode | No | `False` |

### Setting Environment Variables

**Using Azure Portal:**
1. Go to: **App Services** → `bsg-demo-platform-app` → **Configuration**
2. Click **Application settings** tab
3. Click **+ New application setting**
4. Add each variable with its value
5. Click **Save**
6. **Restart the App Service** for changes to take effect

**Using Azure CLI:**
```bash
az webapp config appsettings set \
  --name bsg-demo-platform-app \
  --resource-group <resource-group-name> \
  --settings \
    DATABASE_URL="mongodb://..." \
    DATABASE_NAME="bsg_demo" \
    RAG_JWT_TOKEN="eyJhbGc..." \
    ENVIRONMENT="production"
```

**Using GitHub Secrets (for automated deployment):**
- Set secrets in: GitHub → Settings → Secrets and variables → Actions
- Secrets are automatically deployed via GitHub Actions workflow
- See `.github/workflows/deploy-app-service.yml` for details

## Verification Steps

### 1. Verify Managed Identity is Enabled

**Using Azure Portal:**
- App Service → Identity → System assigned
- Status should be **On**
- Object (principal) ID should be displayed

**Using Azure CLI:**
```bash
az webapp identity show \
  --name bsg-demo-platform-app \
  --resource-group <resource-group-name> \
  --query "principalId"
```

### 2. Verify Role Assignments

**List all role assignments for the Managed Identity:**
```bash
az role assignment list \
  --assignee <principal-id> \
  --all \
  --query "[].{Role:roleDefinitionName, Scope:scope, Resource:resourceGroup}"
```

**Expected:**
- At least one **Reader** role at subscription level

### 3. Test Backend Connection

**Health Check:**
```bash
curl https://bsg-demo-platform-app.azurewebsites.net/api/v1/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-21T10:00:00Z"
}
```

### 4. Test Azure Resource Access

**Connect to Azure from the Web App:**
1. Open the deployed web app
2. Navigate to **Deployment** component → **Demo** tab
3. Click **Connect to Azure**
4. Enter your subscription ID
5. Click **Connect**

**Expected:**
- Should successfully connect
- Should list resource groups
- Should be able to analyze resources

**If it fails:**
- Check App Service logs for authentication errors
- Verify Managed Identity is enabled
- Verify Reader role is assigned at subscription level
- Restart the App Service

### 5. Check Backend Logs

**View logs in Azure Portal:**
- App Service → **Log stream** (real-time logs)
- App Service → **Logs** → **Application Logging** (historical logs)

**Using Azure CLI:**
```bash
az webapp log tail \
  --name bsg-demo-platform-app \
  --resource-group <resource-group-name>
```

**Look for:**
- `Using DefaultAzureCredential (Azure App Service - Managed Identity)` - ✅ Good
- `Using Azure CLI credential` - ❌ Should not appear in Azure App Service
- Authentication errors - Check role assignments

## Troubleshooting

### Issue: "Unable to connect to Azure"

**Possible Causes:**
1. Managed Identity not enabled
2. Reader role not assigned
3. Role assigned at wrong scope (resource group instead of subscription)
4. App Service not restarted after configuration

**Solutions:**
1. Verify Managed Identity is enabled (see [Verification Steps](#verification-steps))
2. Verify Reader role is assigned at subscription level
3. Restart the App Service
4. Check backend logs for specific error messages

### Issue: "No namespaces found" for AKS clusters

**Root Cause:**
- AKS namespace discovery requires `kubectl` which is not available in Azure App Service
- This is a known limitation

**Current Status:**
- ✅ Works in local development (kubectl installed)
- ❌ Does not work in Azure App Service (kubectl not installed)

**Workaround:**
- The application will still analyze other Azure resources (App Services, Storage Accounts, etc.)
- AKS pods will not be discovered automatically
- See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for details

**Future Fix:**
- Update code to use Kubernetes Python client library instead of kubectl
- This will eliminate the need for kubectl in Azure App Service

## Summary

### Minimum Required Configuration

1. ✅ Enable System-Assigned Managed Identity on App Service
2. ✅ Grant **Reader** role at **subscription level** to Managed Identity
3. ✅ Set required environment variables (DATABASE_URL, etc.)
4. ✅ Restart App Service after configuration

### Optional Configuration

- AKS Cluster User Role (for future AKS namespace discovery support)

---

**Last Updated**: November 2025  
**Maintained By**: BSG Team

