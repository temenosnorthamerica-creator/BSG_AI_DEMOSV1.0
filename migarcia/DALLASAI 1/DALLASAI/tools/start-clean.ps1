# BSG Demo Platform - Clean Startup Script (PowerShell)
# Starts backend and frontend with clean environment

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BSG Demo Platform - Clean Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kill existing processes
Write-Host "[INFO] Cleaning up existing processes..." -ForegroundColor Yellow

# Kill backend (port 8000)
$backendProcesses = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($pid in $backendProcesses) {
    Write-Host "[INFO] Killing backend process (PID: $pid)" -ForegroundColor Gray
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
}

# Kill frontend (port 3000)
$frontendProcesses = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($pid in $frontendProcesses) {
    Write-Host "[INFO] Killing frontend process (PID: $pid)" -ForegroundColor Gray
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
}

Start-Sleep -Seconds 2
Write-Host "[OK] Cleanup complete" -ForegroundColor Green
Write-Host ""

# Start Backend in new window with completely clean environment
Write-Host "[INFO] Starting backend server..." -ForegroundColor Yellow

$backendScript = @"
`$Host.UI.RawUI.WindowTitle = 'BSG Backend'
Write-Host '========================================' -ForegroundColor Cyan
Write-Host '  BSG Backend Server' -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan
Write-Host ''

# Completely clear problematic environment variables
Remove-Item Env:\CORS_ORIGINS -ErrorAction SilentlyContinue
Remove-Item Env:\CORS_METHODS -ErrorAction SilentlyContinue
Remove-Item Env:\CORS_HEADERS -ErrorAction SilentlyContinue
Remove-Item Env:\API_V1_PREFIX -ErrorAction SilentlyContinue

cd '$PWD\backend'

Write-Host '[INFO] Starting uvicorn...' -ForegroundColor Yellow
Write-Host '[INFO] Backend URL: http://localhost:8000' -ForegroundColor Gray
Write-Host '[INFO] API Docs: http://localhost:8000/docs' -ForegroundColor Gray
Write-Host ''

py -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
"@

$backendScriptPath = "$env:TEMP\start-backend-clean.ps1"
$backendScript | Out-File -FilePath $backendScriptPath -Encoding UTF8

Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", $backendScriptPath

Write-Host "[OK] Backend starting in separate window" -ForegroundColor Green
Write-Host "[INFO] Backend URL: http://localhost:8000" -ForegroundColor Gray
Write-Host ""

# Wait for backend to start
Write-Host "[INFO] Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start Frontend in new window
Write-Host "[INFO] Starting frontend server..." -ForegroundColor Yellow

$frontendScript = @"
`$Host.UI.RawUI.WindowTitle = 'BSG Frontend'
Write-Host '========================================' -ForegroundColor Cyan
Write-Host '  BSG Frontend Server' -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan
Write-Host ''

cd '$PWD\frontend'

Write-Host '[INFO] Starting Vite dev server...' -ForegroundColor Yellow
Write-Host '[INFO] Frontend URL: http://localhost:3000' -ForegroundColor Gray
Write-Host ''

npm run dev
"@

$frontendScriptPath = "$env:TEMP\start-frontend-clean.ps1"
$frontendScript | Out-File -FilePath $frontendScriptPath -Encoding UTF8

Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", $frontendScriptPath

Write-Host "[OK] Frontend starting in separate window" -ForegroundColor Green
Write-Host "[INFO] Frontend URL: http://localhost:3000" -ForegroundColor Gray
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Services Started" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "[INFO] Services are running in separate windows" -ForegroundColor Gray
Write-Host "[INFO] Close those windows to stop the services" -ForegroundColor Gray
Write-Host ""

# Open browser
Start-Sleep -Seconds 3
Write-Host "Opening browser..." -ForegroundColor Yellow
Start-Process "http://localhost:3000"
