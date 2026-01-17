# Verify JWT Token Setup for Azure Deployment
# This script helps verify if the RAG JWT token is properly configured

Write-Host "=== BSG Demo Platform - JWT Token Verification ===" -ForegroundColor Cyan
Write-Host ""

# Check local .env file
Write-Host "[1/3] Checking local .env file..." -ForegroundColor Yellow
if (Test-Path "backend\.env") {
    $envContent = Get-Content "backend\.env" | Select-String "RAG_JWT_TOKEN"
    if ($envContent) {
        Write-Host "  ✓ Local .env has RAG_JWT_TOKEN" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Local .env missing RAG_JWT_TOKEN" -ForegroundColor Red
    }
} else {
    Write-Host "  ✗ backend\.env file not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "[2/3] Checking Azure App Service configuration..." -ForegroundColor Yellow
Write-Host "  Run this command to check Azure:" -ForegroundColor White
Write-Host "  az webapp config appsettings list \" -ForegroundColor Gray
Write-Host "    --name bsg-demo-platform-app \" -ForegroundColor Gray
Write-Host "    --resource-group bsg-demo-platform \" -ForegroundColor Gray
Write-Host "    --query \"[?name=='RAG_JWT_TOKEN']\"" -ForegroundColor Gray

Write-Host ""
Write-Host "[3/3] Testing Azure API endpoint..." -ForegroundColor Yellow
Write-Host "  Checking JWT token status on Azure App Service..." -ForegroundColor White
try {
    $response = Invoke-RestMethod -Uri "https://bsg-demo-platform-app.azurewebsites.net/api/v1/deployment/temenos/jwt-info" -Method Get -TimeoutSec 10
    Write-Host "  API Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5 | Write-Host
    
    if ($response.data.configured) {
        Write-Host "  ✓ RAG_JWT_TOKEN is configured in Azure" -ForegroundColor Green
        if ($response.data.has_expiration) {
            if ($response.data.is_expired) {
                Write-Host "  ⚠ WARNING: JWT token is EXPIRED!" -ForegroundColor Red
            } else {
                Write-Host "  ✓ JWT token is valid (expires in $($response.data.days_remaining) days)" -ForegroundColor Green
            }
        }
    } else {
        Write-Host "  ✗ RAG_JWT_TOKEN is NOT configured in Azure" -ForegroundColor Red
        Write-Host "  Action: Set it in GitHub Secrets or Azure App Service" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠ Could not reach Azure App Service" -ForegroundColor Yellow
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "  This might mean:" -ForegroundColor White
    Write-Host "  - Backend is not deployed yet" -ForegroundColor Gray
    Write-Host "  - Backend is not accessible" -ForegroundColor Gray
    Write-Host "  - CORS or network issue" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Check GitHub Secrets: Repository -> Settings -> Secrets and variables -> Actions" -ForegroundColor White
Write-Host "2. If missing, add RAG_JWT_TOKEN secret with the token value" -ForegroundColor White
Write-Host "3. Redeploy or manually set in Azure App Service" -ForegroundColor White
Write-Host ""
Write-Host "See docs/CHECK_TOKEN_SETUP.md for detailed instructions" -ForegroundColor Gray

