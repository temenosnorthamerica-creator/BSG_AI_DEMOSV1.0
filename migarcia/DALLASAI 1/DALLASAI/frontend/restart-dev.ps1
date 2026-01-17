# BSG Demo Platform - Quick Restart Script
# Kills and restarts the dev server

Write-Host "Restarting dev server..." -ForegroundColor Yellow

# Kill processes on port 3000
$processes = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($processes) {
    foreach ($pid in $processes) {
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
}

Start-Sleep -Seconds 2

# Start the server
& "$PSScriptRoot\start-dev.ps1"

