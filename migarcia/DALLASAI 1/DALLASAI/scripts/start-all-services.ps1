# Start All Services Script
# This script starts both backend and frontend servers

Write-Host "`n=== Starting BSG Demo Platform Services ===" -ForegroundColor Cyan
Write-Host ""

# Check if ports are in use
Write-Host "Checking ports..." -ForegroundColor Yellow
$port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
$port5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue

if ($port8000) {
    Write-Host "  Port 8000 (backend) is IN USE!" -ForegroundColor Red
    Write-Host "  Please stop the backend first (Ctrl+C in its terminal)" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "  Port 8000 (backend) is available" -ForegroundColor Green
}

if ($port5173) {
    Write-Host "  Port 5173 (frontend) is IN USE!" -ForegroundColor Red
    Write-Host "  Please stop the frontend first (Ctrl+C in its terminal)" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "  Port 5173 (frontend) is available" -ForegroundColor Green
}

Write-Host "`n=== Starting Backend ===" -ForegroundColor Green
Write-Host "Starting backend server on port 8000..." -ForegroundColor Cyan

# Start backend in a new window
$backendScript = @"
cd '$PWD\backend'
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
pause
"@

$backendScriptPath = Join-Path $env:TEMP "start-backend.ps1"
$backendScript | Out-File -FilePath $backendScriptPath -Encoding UTF8

Start-Process powershell -ArgumentList "-NoExit", "-Command", "& '$backendScriptPath'" -WindowStyle Normal

Write-Host "  Backend starting in new window..." -ForegroundColor Green
Start-Sleep -Seconds 2

Write-Host "`n=== Starting Frontend ===" -ForegroundColor Green
Write-Host "Starting frontend server on port 5173..." -ForegroundColor Cyan

# Start frontend in a new window
$frontendScript = @"
cd '$PWD\frontend'
npm run dev
pause
"@

$frontendScriptPath = Join-Path $env:TEMP "start-frontend.ps1"
$frontendScript | Out-File -FilePath $frontendScriptPath -Encoding UTF8

Start-Process powershell -ArgumentList "-NoExit", "-Command", "& '$frontendScriptPath'" -WindowStyle Normal

Write-Host "  Frontend starting in new window..." -ForegroundColor Green
Start-Sleep -Seconds 2

Write-Host "`n=== Services Started ===" -ForegroundColor Green
Write-Host ""
Write-Host "Backend: http://localhost:8000/api/v1/health" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Wait a few seconds for services to start, then:" -ForegroundColor Yellow
Write-Host "  1. Open http://localhost:5173 in your browser" -ForegroundColor White
Write-Host "  2. Go to Demo -> Deployment Analyzer" -ForegroundColor White
Write-Host "  3. Select subscription -> Resource groups" -ForegroundColor White
Write-Host "  4. Namespaces should now appear!" -ForegroundColor Green
Write-Host ""

