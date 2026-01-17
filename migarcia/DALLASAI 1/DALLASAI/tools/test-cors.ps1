# Test CORS Configuration
# This script tests if the backend is returning proper CORS headers

$backendUrl = "https://bsg-demo-platform-app.azurewebsites.net"
$frontendOrigin = "https://kind-beach-01c0a990f.3.azurestaticapps.net"

Write-Host "=== Testing CORS Configuration ===" -ForegroundColor Cyan
Write-Host ""

# Test OPTIONS preflight request
Write-Host "[1/3] Testing OPTIONS preflight request..." -ForegroundColor Yellow
try {
    $optionsResponse = Invoke-WebRequest -Uri "$backendUrl/api/v1/deployment/azure/connect" `
        -Method OPTIONS `
        -Headers @{
            "Origin" = $frontendOrigin
            "Access-Control-Request-Method" = "POST"
            "Access-Control-Request-Headers" = "content-type"
        } `
        -UseBasicParsing `
        -ErrorAction Stop
    
    Write-Host "  Status Code: $($optionsResponse.StatusCode)" -ForegroundColor Green
    Write-Host "  CORS Headers:" -ForegroundColor Green
    if ($optionsResponse.Headers['Access-Control-Allow-Origin']) {
        Write-Host "    ✓ Access-Control-Allow-Origin: $($optionsResponse.Headers['Access-Control-Allow-Origin'])" -ForegroundColor Green
    } else {
        Write-Host "    ✗ Access-Control-Allow-Origin: MISSING" -ForegroundColor Red
    }
    if ($optionsResponse.Headers['Access-Control-Allow-Methods']) {
        Write-Host "    ✓ Access-Control-Allow-Methods: $($optionsResponse.Headers['Access-Control-Allow-Methods'])" -ForegroundColor Green
    } else {
        Write-Host "    ✗ Access-Control-Allow-Methods: MISSING" -ForegroundColor Red
    }
    if ($optionsResponse.Headers['Access-Control-Allow-Headers']) {
        Write-Host "    ✓ Access-Control-Allow-Headers: $($optionsResponse.Headers['Access-Control-Allow-Headers'])" -ForegroundColor Green
    } else {
        Write-Host "    ✗ Access-Control-Allow-Headers: MISSING" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ OPTIONS request failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "  Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

Write-Host ""

# Test actual GET request
Write-Host "[2/3] Testing GET request with Origin header..." -ForegroundColor Yellow
try {
    $getResponse = Invoke-WebRequest -Uri "$backendUrl/api/v1/health" `
        -Method GET `
        -Headers @{
            "Origin" = $frontendOrigin
        } `
        -UseBasicParsing `
        -ErrorAction Stop
    
    Write-Host "  Status Code: $($getResponse.StatusCode)" -ForegroundColor Green
    if ($getResponse.Headers['Access-Control-Allow-Origin']) {
        Write-Host "  ✓ CORS headers present" -ForegroundColor Green
        Write-Host "    Access-Control-Allow-Origin: $($getResponse.Headers['Access-Control-Allow-Origin'])" -ForegroundColor Gray
    } else {
        Write-Host "  ✗ CORS headers missing" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ GET request failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test backend accessibility
Write-Host "[3/3] Testing backend accessibility..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$backendUrl/api/v1/health" -Method Get -TimeoutSec 10 -ErrorAction Stop
    Write-Host "  ✓ Backend is accessible and responding" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "  ✗ Backend returned HTTP $statusCode" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($statusCode -eq 503) {
        Write-Host ""
        Write-Host "  ⚠ Backend is unavailable (503). Need to:" -ForegroundColor Yellow
        Write-Host "    1. Wait for deployment to complete" -ForegroundColor White
        Write-Host "    2. Restart the backend service" -ForegroundColor White
        Write-Host "    3. Check backend logs for errors" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "=== CORS Test Complete ===" -ForegroundColor Cyan

