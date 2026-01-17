# BSG Demo Platform - Backend Startup Script
# Starts the FastAPI backend with Azure Cosmos DB MongoDB connection

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BSG Demo Platform - Backend Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set Azure Cosmos DB MongoDB connection string
# DATABASE_URL must be set before running this script
# Example: $env:DATABASE_URL = "mongodb://your-connection-string"
if (-not $env:DATABASE_URL) {
    Write-Host "[ERROR] DATABASE_URL environment variable is not set" -ForegroundColor Red
    exit 1
}
$env:DATABASE_NAME = "bsg_demo"
$env:ENVIRONMENT = "development"
$env:DEBUG = "True"
$env:LOG_LEVEL = "INFO"

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Database: Azure Cosmos DB MongoDB" -ForegroundColor Gray
Write-Host "  Host: bsg-demo-platform-mongodb.mongo.cosmos.azure.com:10255" -ForegroundColor Gray
Write-Host "  Database Name: $env:DATABASE_NAME" -ForegroundColor Gray
Write-Host "  Environment: $env:ENVIRONMENT" -ForegroundColor Gray
Write-Host ""

# Check if port 8000 is already in use
$portInUse = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "Warning: Port 8000 is already in use!" -ForegroundColor Yellow
    Write-Host "Stopping existing processes on port 8000..." -ForegroundColor Yellow
    $processes = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($pid in $processes) {
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
}

Write-Host "Starting FastAPI backend server..." -ForegroundColor Green
Write-Host "  Host: 0.0.0.0" -ForegroundColor Gray
Write-Host "  Port: 8000" -ForegroundColor Gray
Write-Host "  API Docs: http://localhost:8000/docs" -ForegroundColor Gray
Write-Host "  Health: http://localhost:8000/api/v1/health" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Change to backend directory (script location)
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath
Write-Host "Working directory: $(Get-Location)" -ForegroundColor Gray
Write-Host ""

# Start the backend
py -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

