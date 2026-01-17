# PowerShell script to verify Azure App Service deployment

$appName = "bsg-demo-platform-app"
$resourceGroup = "bsg-demo-platform"
$baseUrl = "https://$appName.azurewebsites.net"

Write-Host "=== Azure App Service Deployment Verification ===" -ForegroundColor Cyan
Write-Host ""

# Check App Service status
Write-Host "1. Checking App Service status..." -ForegroundColor Yellow
$appStatus = az webapp show --name $appName --resource-group $resourceGroup --query "{state: state, defaultHostName: defaultHostName, httpsOnly: httpsOnly}" --output json | ConvertFrom-Json
Write-Host "   Status: $($appStatus.state)" -ForegroundColor $(if ($appStatus.state -eq "Running") { "Green" } else { "Red" })
Write-Host "   URL: $($appStatus.defaultHostName)" -ForegroundColor Green
Write-Host "   HTTPS Only: $($appStatus.httpsOnly)" -ForegroundColor Green
Write-Host ""

# Check environment variables
Write-Host "2. Checking environment variables..." -ForegroundColor Yellow
$envVars = az webapp config appsettings list --name $appName --resource-group $resourceGroup --query "[?name=='DATABASE_URL' || name=='DATABASE_NAME' || name=='ENVIRONMENT' || name=='DEBUG'].{name:name, value:value}" --output json | ConvertFrom-Json
foreach ($var in $envVars) {
    $displayValue = if ($var.name -eq "DATABASE_URL") { $var.value.Substring(0, [Math]::Min(50, $var.value.Length)) + "..." } else { $var.value }
    Write-Host "   $($var.name): $displayValue" -ForegroundColor Green
}
Write-Host ""

# Test health endpoint
Write-Host "3. Testing health endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/health" -Method Get -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    Write-Host "   Status: $($response.StatusCode) OK" -ForegroundColor Green
    Write-Host "   Response: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   HTTP Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}
Write-Host ""

# Check application logs (last 10 lines)
Write-Host "4. Checking recent application logs..." -ForegroundColor Yellow
$logs = az webapp log tail --name $appName --resource-group $resourceGroup --output json 2>&1 | Select-Object -First 10
if ($logs) {
    Write-Host "   Recent log entries:" -ForegroundColor Green
    $logs | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
} else {
    Write-Host "   No recent logs available" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "=== Verification Summary ===" -ForegroundColor Cyan
Write-Host "App Service URL: $baseUrl" -ForegroundColor Green
Write-Host "API Health: $baseUrl/api/v1/health" -ForegroundColor Green
Write-Host "API Docs: $baseUrl/docs" -ForegroundColor Green
Write-Host ""

