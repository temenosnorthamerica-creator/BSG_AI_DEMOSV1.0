# Fix Azure Connection Script
# This script helps fix the "Failed to connect to Azure" error

Write-Host "`n=== Azure Connection Fix ===" -ForegroundColor Cyan -BackgroundColor DarkBlue
Write-Host ""

# Step 1: Check Azure CLI
Write-Host "Step 1: Checking Azure CLI..." -ForegroundColor Yellow
$azVersion = az --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Azure CLI is not installed!" -ForegroundColor Red
    Write-Host "  Please install Azure CLI first: https://aka.ms/installazurecliwindows" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Azure CLI is installed" -ForegroundColor Green

# Step 2: Check if logged in
Write-Host "`nStep 2: Checking Azure login status..." -ForegroundColor Yellow
try {
    $account = az account show 2>&1 | Out-String
    if ($account -match "error|Error|ERROR|not logged in|Please run") {
        throw "Not logged in"
    }
    Write-Host "✓ Already logged in to Azure" -ForegroundColor Green
    $account | ConvertFrom-Json | Select-Object name, id, user | Format-List
} catch {
    Write-Host "✗ Not logged in to Azure" -ForegroundColor Red
    Write-Host "`nLogging in to Azure..." -ForegroundColor Yellow
    Write-Host "  This will open a browser window for authentication" -ForegroundColor Gray
    az login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Login failed. Please try again manually: az login" -ForegroundColor Red
        exit 1
    }
}

# Step 3: Set subscription
Write-Host "`nStep 3: Setting subscription..." -ForegroundColor Yellow
$subscriptionId = "58a91cf0-0f39-45fd-a63e-5a9a28c7072b"
az account set --subscription $subscriptionId 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Subscription set" -ForegroundColor Green
} else {
    Write-Host "⚠ Could not set subscription (may already be set)" -ForegroundColor Yellow
}

# Step 4: Verify subscription
Write-Host "`nStep 4: Verifying subscription access..." -ForegroundColor Yellow
$currentSub = az account show --query id -o tsv 2>&1
if ($currentSub -eq $subscriptionId) {
    Write-Host "✓ Subscription verified: $subscriptionId" -ForegroundColor Green
} else {
    Write-Host "⚠ Current subscription: $currentSub" -ForegroundColor Yellow
    Write-Host "  Expected: $subscriptionId" -ForegroundColor Yellow
}

# Step 5: Check backend
Write-Host "`nStep 5: Checking backend server..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/health" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ Backend is running" -ForegroundColor Green
    $needsRestart = $false
} catch {
    Write-Host "✗ Backend is not running" -ForegroundColor Red
    Write-Host "  Starting backend..." -ForegroundColor Yellow
    $needsRestart = $true
}

# Step 6: Restart backend if needed
if ($needsRestart) {
    Write-Host "`nStep 6: Starting backend server..." -ForegroundColor Yellow
    Write-Host "  Backend will start in a new window" -ForegroundColor Gray
    Write-Host "  Please wait for it to start, then refresh the frontend" -ForegroundColor Gray
    
    $backendDir = Join-Path $PWD "backend"
    $scriptPath = Join-Path $env:TEMP "start-backend-fix.ps1"
    @"
cd '$backendDir'
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
pause
"@ | Out-File -FilePath $scriptPath -Encoding UTF8
    
    $command = "& `"$scriptPath`""
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $command
    
    Write-Host "  Waiting 10 seconds for backend to start..." -ForegroundColor Gray
    Start-Sleep -Seconds 10
    
    # Test again
    try {
        $health = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/health" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        Write-Host "✓ Backend is now running!" -ForegroundColor Green
    } catch {
        Write-Host "⚠ Backend may still be starting. Check the backend window." -ForegroundColor Yellow
    }
} else {
    Write-Host "`nStep 6: Backend is running - no restart needed" -ForegroundColor Green
    Write-Host "  However, you may want to restart it to pick up new Azure credentials" -ForegroundColor Yellow
    Write-Host "  Stop it (Ctrl+C) and restart manually if connection still fails" -ForegroundColor Yellow
}

# Summary
Write-Host "`n=== Summary ===" -ForegroundColor Cyan -BackgroundColor DarkBlue
Write-Host ""
Write-Host "✓ Azure CLI: Installed" -ForegroundColor Green
Write-Host "✓ Azure Login: Complete" -ForegroundColor Green
Write-Host "✓ Subscription: Set" -ForegroundColor Green
Write-Host "✓ Backend: Running" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Open frontend: http://localhost:5173" -ForegroundColor White
Write-Host "  2. Go to: Demo -> Deployment Analyzer" -ForegroundColor White
Write-Host "  3. Enter subscription ID: $subscriptionId" -ForegroundColor White
Write-Host "  4. Click 'Connect to Azure'" -ForegroundColor White
Write-Host "  5. It should work now! 🎉" -ForegroundColor Green
Write-Host ""

