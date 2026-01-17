# Azure App Service Deployment Setup

This guide explains how to set up the Azure App Service deployment with GitHub Actions.

## Prerequisites

1. Azure CLI installed and logged in
2. GitHub repository access
3. Azure subscription with permissions to create Service Principals

## Step 1: Create Azure Service Principal

Run the following command to create a Service Principal for GitHub Actions:

```bash
# Set variables
RESOURCE_GROUP="bsg-demo-platform"
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
SP_NAME="bsg-demo-platform-github-actions"

# Create Service Principal
az ad sp create-for-rbac \
  --name "$SP_NAME" \
  --role contributor \
  --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP" \
  --sdk-auth
```

This will output a JSON object like:

```json
{
  "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "clientSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "subscriptionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```

## Step 2: Add GitHub Secret

1. Go to your GitHub repository: `https://github.com/georgasa/bsg-demo-platform`
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `AZURE_CREDENTIALS`
5. Value: Paste the **entire JSON output** from Step 1
6. Click **Add secret**

## Step 3: Verify App Service Configuration

The App Service should already be created. Verify it exists:

```bash
az webapp show \
  --name bsg-demo-platform-app \
  --resource-group bsg-demo-platform \
  --query "{state: state, defaultHostName: defaultHostName}" \
  --output json
```

## Step 4: Trigger Deployment

Once the secret is added, the GitHub Actions workflow will automatically deploy when you push to the `develop` branch:

```bash
git checkout develop
git push origin develop
```

Or manually trigger it:
1. Go to **Actions** tab in GitHub
2. Select **Deploy to Azure App Service** workflow
3. Click **Run workflow**
4. Select `develop` branch
5. Click **Run workflow**

## Step 5: Monitor Deployment

1. **GitHub Actions**: Check the workflow run at `https://github.com/georgasa/bsg-demo-platform/actions`
2. **Azure Portal**: Monitor at `https://portal.azure.com`
3. **Application Logs**: 
   ```bash
   az webapp log tail \
     --resource-group bsg-demo-platform \
     --name bsg-demo-platform-app
   ```

## Troubleshooting

### Azure Login Failed

If you see "Login failed with Error: Using auth-type: SERVICE_PRINCIPAL. Not all values are present":

1. Verify the `AZURE_CREDENTIALS` secret is set correctly
2. Ensure the JSON is valid (no extra characters, proper formatting)
3. Recreate the Service Principal if needed

### Application Error

If the app shows "Application Error":

1. Check application logs:
   ```bash
   az webapp log tail --resource-group bsg-demo-platform --name bsg-demo-platform-app
   ```

2. Verify startup command:
   ```bash
   az webapp config show \
     --name bsg-demo-platform-app \
     --resource-group bsg-demo-platform \
     --query "appCommandLine" \
     --output tsv
   ```

3. Check if dependencies are installed:
   ```bash
   az webapp ssh --resource-group bsg-demo-platform --name bsg-demo-platform-app
   # Then inside the container:
   pip list | grep gunicorn
   ```

### Deployment Failed

If deployment fails:

1. Check GitHub Actions logs for specific errors
2. Verify all required files are present in `backend/` directory
3. Ensure `.deploymentignore` excludes unnecessary files
4. Check that frontend build was successful

## Application URLs

After successful deployment:

- **Frontend**: https://bsg-demo-platform-app.azurewebsites.net
- **Backend API**: https://bsg-demo-platform-app.azurewebsites.net/api/v1
- **API Docs**: https://bsg-demo-platform-app.azurewebsites.net/docs
- **Health Check**: https://bsg-demo-platform-app.azurewebsites.net/api/v1/health

## Environment Variables

If you need to set environment variables for the App Service:

```bash
az webapp config appsettings set \
  --name bsg-demo-platform-app \
  --resource-group bsg-demo-platform \
  --settings \
    DATABASE_URL="your-database-url" \
    RAG_JWT_TOKEN="your-rag-token" \
    ENVIRONMENT="production"
```

