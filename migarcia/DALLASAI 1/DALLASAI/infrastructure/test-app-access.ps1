# Test Azure App Service Access
$appUrl = "https://bsg-demo-platform-app.azurewebsites.net"

Write-Host "Testing Azure App Service Access..." -ForegroundColor Cyan
Write-Host "URL: $appUrl" -ForegroundColor Yellow
Write-Host ""

# Test root endpoint
Write-Host "1. Testing root endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $appUrl -Method Get -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
    Write-Host "   Status: $($response.StatusCode) OK" -ForegroundColor Green
    Write-Host "   Content Length: $($response.Content.Length) bytes" -ForegroundColor Green
} catch {
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test health endpoint
Write-Host "2. Testing health endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$appUrl/api/v1/health" -Method Get -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
    Write-Host "   Status: $($response.StatusCode) OK" -ForegroundColor Green
    Write-Host "   Response: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   HTTP Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

Write-Host ""

# Test API docs
Write-Host "3. Testing API docs endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$appUrl/docs" -Method Get -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
    Write-Host "   Status: $($response.StatusCode) OK" -ForegroundColor Green
} catch {
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan

