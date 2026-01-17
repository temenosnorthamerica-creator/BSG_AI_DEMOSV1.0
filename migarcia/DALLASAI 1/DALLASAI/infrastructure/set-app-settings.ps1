# PowerShell script to set Azure App Service environment variables
# This handles the connection string with special characters properly

$appName = "bsg-demo-platform-app"
$resourceGroup = "bsg-demo-platform"

# MongoDB connection string - set this before running the script
# Example: $databaseUrl = "mongodb://your-connection-string"
$databaseUrl = $env:DATABASE_URL
if (-not $databaseUrl) {
    Write-Host "[ERROR] DATABASE_URL environment variable is not set" -ForegroundColor Red
    exit 1
}

# Set all app settings using a JSON approach to avoid shell escaping issues
$settingsJson = @{
    DATABASE_URL = $databaseUrl
    DATABASE_NAME = "bsg_demo"
    ENVIRONMENT = "production"
    DEBUG = "False"
    SCM_DO_BUILD_DURING_DEPLOYMENT = "false"
    ENABLE_ORYX_BUILD = "false"
} | ConvertTo-Json -Compress

# Convert to az cli format
$settingsArray = @()
foreach ($key in $settingsJson.PSObject.Properties.Name) {
    $value = $settingsJson.$key
    $settingsArray += "$key=$value"
}

# Set all app settings
az webapp config appsettings set `
    --name $appName `
    --resource-group $resourceGroup `
    --settings $settingsArray `
    --output none

Write-Host "App settings configured successfully"

