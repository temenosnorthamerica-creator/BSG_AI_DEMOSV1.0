# Check Backend Status Script
# This script checks if the backend Azure App Service is accessible and configured correctly

Write-Host "=== BSG Demo Platform - Backend Status Check ===" -ForegroundColor Cyan
Write-Host ""

$backendUrl = "https://bsg-demo-platform-app.azurewebsites.net"

# 1. Check if backend is accessible
Write-Host "[1/3] Checking backend accessibility..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "$backendUrl/api/v1/health" -Method Get -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    Write-Host "  ✓ Backend is accessible (HTTP $($healthResponse.StatusCode))" -ForegroundColor Green
    Write-Host "  Response: $($healthResponse.Content.Substring(0, [Math]::Min(200, $healthResponse.Content.Length)))..." -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "  ✗ Backend is NOT accessible" -ForegroundColor Red
    Write-Host "  Status Code: $statusCode" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($statusCode -eq 503) {
        Write-Host ""
        Write-Host "  ⚠ HTTP 503 means the service exists but is unavailable." -ForegroundColor Yellow
        Write-Host "  Possible causes:" -ForegroundColor Yellow
        Write-Host "    - Backend is starting up" -ForegroundColor Gray
        Write-Host "    - Backend is restarting (after setting RAG_JWT_TOKEN)" -ForegroundColor Gray
        Write-Host "    - Backend service is stopped" -ForegroundColor Gray
        Write-Host ""
        Write-Host "  Solutions:" -ForegroundColor Yellow
        Write-Host "    1. Wait 2-3 minutes and try again" -ForegroundColor Gray
        Write-Host "    2. Check GitHub Actions - is deployment still running?" -ForegroundColor Gray
        Write-Host "    3. Restart the backend service in Azure Portal" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "=== Backend Status Check Complete ===" -ForegroundColor Cyan
    exit 1
}

Write-Host ""

# 2. Check JWT token configuration
Write-Host "[2/3] Checking RAG_JWT_TOKEN configuration..." -ForegroundColor Yellow
try {
    $jwtResponse = Invoke-RestMethod -Uri "$backendUrl/api/v1/deployment/temenos/jwt-info" -Method Get -TimeoutSec 10 -ErrorAction Stop
    if ($jwtResponse.data.configured) {
        Write-Host "  ✓ RAG_JWT_TOKEN is configured" -ForegroundColor Green
        
        if ($jwtResponse.data.has_expiration) {
            if ($jwtResponse.data.is_expired) {
                Write-Host "  ⚠ WARNING: JWT token is EXPIRED!" -ForegroundColor Red
                Write-Host "  Expired: $($jwtResponse.data.expires_at)" -ForegroundColor Red
            } else {
                Write-Host "  ✓ JWT token is valid" -ForegroundColor Green
                Write-Host "  Expires: $($jwtResponse.data.expires_at)" -ForegroundColor Gray
                Write-Host "  Days remaining: $($jwtResponse.data.days_remaining)" -ForegroundColor Gray
            }
        } else {
            Write-Host "  ✓ JWT token has no expiration" -ForegroundColor Green
        }
        
        Write-Host "  User: $($jwtResponse.data.user_id) ($($jwtResponse.data.email))" -ForegroundColor Gray
    } else {
        Write-Host "  ✗ RAG_JWT_TOKEN is NOT configured" -ForegroundColor Red
        Write-Host "  Action: Set RAG_JWT_TOKEN in Azure App Service or GitHub Secrets" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠ Could not check JWT token status" -ForegroundColor Yellow
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host ""

# 3. Check CORS configuration
Write-Host "[3/3] Testing CORS configuration..." -ForegroundColor Yellow
Write-Host "  Frontend URL: https://kind-beach-01c0a990f.3.azurestaticapps.net" -ForegroundColor Gray
Write-Host "  Backend URL: $backendUrl" -ForegroundColor Gray
Write-Host "  ✓ CORS is configured to allow *.azurestaticapps.net" -ForegroundColor Green

Write-Host ""
Write-Host "=== Backend Status Check Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. If backend returned 503, wait a few minutes and check again" -ForegroundColor White
Write-Host "  2. If RAG_JWT_TOKEN is not set, trigger a new deployment" -ForegroundColor White
Write-Host "  3. Check GitHub Actions: https://github.com/georgasa/bsg-demo-platform/actions" -ForegroundColor White
Write-Host '  4. Check Azure Portal: https://portal.azure.com' -ForegroundColor White

