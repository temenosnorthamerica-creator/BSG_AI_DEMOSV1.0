# BSG Demo Platform - Frontend Dev Server Restart Script
# This script kills any existing processes on port 3000 and starts the dev server

Write-Host "BSG Demo Platform - Frontend Dev Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Kill any existing processes on port 3000
Write-Host "`nChecking for existing processes on port 3000..." -ForegroundColor Yellow
$existingProcess = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($existingProcess) {
    Write-Host "Found existing process(es): $existingProcess" -ForegroundColor Yellow
    foreach ($pid in $existingProcess) {
        try {
            Stop-Process -Id $pid -Force -ErrorAction Stop
            Write-Host "Killed process $pid" -ForegroundColor Green
        } catch {
            Write-Host "Failed to kill process $pid: $_" -ForegroundColor Red
        }
    }
    Start-Sleep -Seconds 2
} else {
    Write-Host "No existing processes found on port 3000" -ForegroundColor Green
}

# Wait a moment for ports to be released
Start-Sleep -Seconds 1

# Start the dev server
Write-Host "`nStarting Vite dev server..." -ForegroundColor Yellow
Write-Host "Server will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server`n" -ForegroundColor Gray

try {
    npm run dev
} catch {
    Write-Host "`nError starting dev server: $_" -ForegroundColor Red
    exit 1
}

