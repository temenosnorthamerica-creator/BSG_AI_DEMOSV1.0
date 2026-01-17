# Restart All Services Script
# This script helps restart backend and frontend servers

Write-Host "`n=== BSG Demo Platform - Restart All Services ===" -ForegroundColor Cyan
Write-Host "`nThis will help you restart backend and frontend servers`n" -ForegroundColor Yellow

# Check if processes are running
Write-Host "Checking for running services..." -ForegroundColor Cyan
$backendRunning = $false
$frontendRunning = $false

# Check backend (Python/Uvicorn)
$pythonProcs = Get-Process | Where-Object {$_.ProcessName -eq "python" -or $_.ProcessName -eq "pythonw"} -ErrorAction SilentlyContinue
if ($pythonProcs) {
    Write-Host "  Backend (Python) is running - PID: $($pythonProcs[0].Id)" -ForegroundColor Yellow
    $backendRunning = $true
} else {
    Write-Host "  Backend is not running" -ForegroundColor Gray
}

# Check frontend (Node)
$nodeProcs = Get-Process | Where-Object {$_.ProcessName -eq "node"} -ErrorAction SilentlyContinue
if ($nodeProcs) {
    Write-Host "  Frontend (Node) is running - PID: $($nodeProcs[0].Id)" -ForegroundColor Yellow
    $frontendRunning = $true
} else {
    Write-Host "  Frontend is not running" -ForegroundColor Gray
}

Write-Host "`n=== Instructions ===" -ForegroundColor Green
Write-Host "`nTo restart services:" -ForegroundColor Cyan
Write-Host "`n1. STOP CURRENT SERVICES:" -ForegroundColor Yellow
Write-Host "   - Go to terminals where backend/frontend are running" -ForegroundColor White
Write-Host "   - Press Ctrl+C in each terminal to stop them" -ForegroundColor White

Write-Host "`n2. START BACKEND:" -ForegroundColor Yellow
Write-Host "   Open a NEW terminal and run:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Cyan
Write-Host "   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000" -ForegroundColor Cyan

Write-Host "`n3. START FRONTEND:" -ForegroundColor Yellow
Write-Host "   Open ANOTHER NEW terminal and run:" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Cyan

Write-Host "`n4. VERIFY:" -ForegroundColor Yellow
Write-Host "   - Backend: http://localhost:8000/api/v1/health" -ForegroundColor White
Write-Host "   - Frontend: http://localhost:5173" -ForegroundColor White

Write-Host "`n=== Quick Start Commands ===" -ForegroundColor Green
Write-Host "`nCopy and paste these commands in separate terminals:`n" -ForegroundColor Cyan

Write-Host "# Terminal 1 - Backend" -ForegroundColor Yellow
Write-Host "cd backend; python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000" -ForegroundColor White

Write-Host "`n# Terminal 2 - Frontend" -ForegroundColor Yellow
Write-Host "cd frontend; npm run dev" -ForegroundColor White

Write-Host "`n`nPress any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

