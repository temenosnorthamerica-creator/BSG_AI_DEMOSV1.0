# AmrBSGBankEcoIntDemo - Unified Shutdown Script
# This script stops all demo projects and provides a status report

param(
    [switch]$Force,       # Force kill without confirmation
    [string]$Project      # Stop a specific project only
)

$ErrorActionPreference = "Continue"
$BaseDir = $PSScriptRoot
$LogsDir = Join-Path $BaseDir "logs"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " AmrBSGBankEcoIntDemo - Shutdown Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Project Definitions (same as startup-all.ps1)
$Projects = @{
    "landing" = @{
        Name = "Landing Page (BG_DallasAiProjects)"
        Port = 3000
        Type = "frontend"
    }
    "config-api" = @{
        Name = "Config API Server"
        Port = 3010
        Type = "backend-node"
    }
    "crm" = @{
        Name = "CRM Banking Simulator"
        Port = 3001
        Type = "frontend"
    }
    "bsg-frontend" = @{
        Name = "BSG Demo Platform - Frontend"
        Port = 3002
        Type = "frontend"
    }
    "bsg-backend" = @{
        Name = "BSG Demo Platform - Backend"
        Port = 8002
        Type = "backend-python"
    }
    "debitcards-frontend" = @{
        Name = "Debit Cards - Frontend"
        Port = 3003
        Type = "frontend"
    }
    "debitcards-backend" = @{
        Name = "Debit Cards - Backend"
        Port = 8003
        Type = "backend-python"
    }
    "lms" = @{
        Name = "LMS Applicant Portal"
        Port = 3004
        Type = "frontend"
    }
    "esb-frontend" = @{
        Name = "ESB - Frontend"
        Port = 3016
        Type = "frontend"
    }
    "esb-backend" = @{
        Name = "ESB - Backend"
        Port = 8006
        Type = "backend-node"
    }
}

# Function to check if a port is in use and get the PID
function Get-PortProcess {
    param([int]$Port)

    $result = netstat -ano | Select-String ":$Port\s" | Select-String "LISTENING"
    if ($result) {
        $line = $result.Line.Trim()
        $parts = $line -split '\s+'
        $processId = $parts[-1]
        return [int]$processId
    }
    return $null
}

# Function to check service status via HTTP
function Test-ServiceHttp {
    param([int]$Port)

    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
        return $true
    }
    catch {
        return $false
    }
}

# Function to stop a service by port
function Stop-ServiceByPort {
    param(
        [string]$ProjectKey,
        [hashtable]$ProjectInfo
    )

    $port = $ProjectInfo.Port
    $name = $ProjectInfo.Name

    $processId = Get-PortProcess -Port $port

    if ($processId) {
        try {
            # Get process info before killing
            $proc = Get-Process -Id $processId -ErrorAction SilentlyContinue
            $procName = if ($proc) { $proc.ProcessName } else { "Unknown" }

            # Kill the process tree
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue

            # Also try to kill any child processes
            Get-CimInstance Win32_Process | Where-Object { $_.ParentProcessId -eq $processId } | ForEach-Object {
                Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
            }

            Write-Host "  [STOPPED] $name (Port $port, PID $processId, $procName)" -ForegroundColor Green
            return @{ Status = "Stopped"; PID = $processId; Process = $procName }
        }
        catch {
            Write-Host "  [ERROR] Failed to stop $name (Port $port): $_" -ForegroundColor Red
            return @{ Status = "Error"; PID = $processId; Error = $_.Exception.Message }
        }
    }
    else {
        Write-Host "  [SKIP] $name (Port $port) - Not running" -ForegroundColor DarkGray
        return @{ Status = "NotRunning"; PID = $null }
    }
}

# Collect initial status
Write-Host "[Checking Current Status...]" -ForegroundColor Magenta
Write-Host ""

$InitialStatus = @{}
foreach ($key in $Projects.Keys) {
    $proj = $Projects[$key]
    $processId = Get-PortProcess -Port $proj.Port
    $httpOk = Test-ServiceHttp -Port $proj.Port
    $InitialStatus[$key] = @{
        Running = ($null -ne $processId)
        PID = $processId
        HttpOk = $httpOk
    }
}

# Display initial status
Write-Host "Current Service Status:" -ForegroundColor Yellow
Write-Host ("-" * 60) -ForegroundColor DarkGray

$runningCount = 0
$stoppedCount = 0

foreach ($key in $Projects.Keys | Sort-Object { $Projects[$_].Port }) {
    $proj = $Projects[$key]
    $status = $InitialStatus[$key]

    if ($status.Running) {
        $runningCount++
        $httpStatus = if ($status.HttpOk) { "OK" } else { "No Response" }
        Write-Host "  [RUNNING] $($proj.Name) (Port $($proj.Port), PID $($status.PID), HTTP: $httpStatus)" -ForegroundColor Green
    }
    else {
        $stoppedCount++
        Write-Host "  [STOPPED] $($proj.Name) (Port $($proj.Port))" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "Summary: $runningCount running, $stoppedCount stopped" -ForegroundColor Cyan
Write-Host ""

# If nothing is running, exit
if ($runningCount -eq 0) {
    Write-Host "No services are currently running." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press any key to exit..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 0
}

# Confirmation (unless -Force)
if (-not $Force) {
    Write-Host "This will stop $runningCount service(s)." -ForegroundColor Yellow
    $confirm = Read-Host "Continue? (Y/N)"
    if ($confirm -notmatch '^[Yy]') {
        Write-Host "Shutdown cancelled." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Press any key to exit..." -ForegroundColor Gray
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 0
    }
}

Write-Host ""

# Stop specific project or all
if ($Project) {
    if ($Projects.ContainsKey($Project)) {
        Write-Host "[Stopping Single Project: $Project]" -ForegroundColor Magenta
        Stop-ServiceByPort -ProjectKey $Project -ProjectInfo $Projects[$Project] | Out-Null
    }
    else {
        Write-Host "Unknown project: $Project" -ForegroundColor Red
        Write-Host "Available projects: $($Projects.Keys -join ', ')" -ForegroundColor Yellow
    }
}
else {
    # Stop all services - frontends first, then backends
    Write-Host "[Stopping Frontends...]" -ForegroundColor Magenta
    $frontendKeys = $Projects.Keys | Where-Object { $Projects[$_].Type -eq "frontend" }
    foreach ($key in $frontendKeys) {
        Stop-ServiceByPort -ProjectKey $key -ProjectInfo $Projects[$key] | Out-Null
    }

    Write-Host ""
    Write-Host "[Stopping Backends...]" -ForegroundColor Magenta
    $backendKeys = $Projects.Keys | Where-Object { $Projects[$_].Type -ne "frontend" }
    foreach ($key in $backendKeys) {
        Stop-ServiceByPort -ProjectKey $key -ProjectInfo $Projects[$key] | Out-Null
    }
}

# Wait a moment for processes to fully terminate
Start-Sleep -Seconds 2

# Final status check
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Final Status Report" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$FinalStatus = @{}
$finalRunning = 0
$finalStopped = 0

foreach ($key in $Projects.Keys | Sort-Object { $Projects[$_].Port }) {
    $proj = $Projects[$key]
    $processId = Get-PortProcess -Port $proj.Port

    $FinalStatus[$key] = @{ Running = ($null -ne $processId); PID = $processId }

    if ($null -ne $processId) {
        $finalRunning++
        Write-Host "  [STILL RUNNING] $($proj.Name) (Port $($proj.Port), PID $processId)" -ForegroundColor Red
    }
    else {
        $finalStopped++
        Write-Host "  [STOPPED] $($proj.Name) (Port $($proj.Port))" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host ("-" * 60) -ForegroundColor DarkGray

if ($finalRunning -eq 0) {
    Write-Host ""
    Write-Host "All services have been stopped successfully!" -ForegroundColor Green
}
else {
    Write-Host ""
    Write-Host "Warning: $finalRunning service(s) may still be running." -ForegroundColor Yellow
    Write-Host "You may need to manually terminate them or run with -Force." -ForegroundColor Yellow
}

# Log the shutdown
$ShutdownLog = Join-Path $LogsDir "shutdown.log"
$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$LogEntry = @"

============================================================
[$Timestamp] Shutdown executed
============================================================
Services stopped: $finalStopped
Services still running: $finalRunning
"@

try {
    Add-Content -Path $ShutdownLog -Value $LogEntry -ErrorAction SilentlyContinue
}
catch {
    # Ignore log write errors
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Shutdown Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To restart all services:" -ForegroundColor White
Write-Host "  .\startup-all.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
