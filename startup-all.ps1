# AmrBSGBankEcoIntDemo - Unified Startup Script
# This script starts all demo projects in separate PowerShell windows

param(
    [switch]$LandingOnly,
    [switch]$InstallDeps,
    [string]$Project
)

$ErrorActionPreference = "Continue"
$BaseDir = $PSScriptRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " AmrBSGBankEcoIntDemo - Startup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Project Definitions
$Projects = @{
    "landing" = @{
        Name = "Landing Page (BG_DallasAiProjects)"
        Owner = "brian.grundleger@temenos.com"
        Path = "brian.grundleger\BG_DallasAiProjects\DallasAiProjects"
        Port = 3000
        Type = "frontend"
        StartCmd = "npm run dev"
    }
    "crm" = @{
        Name = "CRM Banking Simulator"
        Owner = "alwin@temenos.com"
        Path = "alwin\crm-banking-simulator_v2\crm-banking-simulator_v2"
        Port = 3001
        Type = "frontend"
        StartCmd = "npm run dev"
    }
    "bsg-frontend" = @{
        Name = "BSG Demo Platform - Frontend"
        Owner = "migarcia@temenos.com"
        Path = "migarcia\DALLASAI 1\DALLASAI\frontend"
        Port = 3002
        Type = "frontend"
        StartCmd = "npm run dev"
    }
    "bsg-backend" = @{
        Name = "BSG Demo Platform - Backend"
        Owner = "migarcia@temenos.com"
        Path = "migarcia\DALLASAI 1\DALLASAI\backend"
        Port = 8002
        Type = "backend-python"
        StartCmd = "python -m uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload"
    }
    "debitcards-frontend" = @{
        Name = "Debit Cards - Frontend"
        Owner = "sweekruth.somaraju@temenos.com"
        Path = "sweekruth.somaraju\debitcards\debitcards\frontend"
        Port = 3003
        Type = "frontend"
        StartCmd = "npm run dev"
    }
    "debitcards-backend" = @{
        Name = "Debit Cards - Backend"
        Owner = "sweekruth.somaraju@temenos.com"
        Path = "sweekruth.somaraju\debitcards\debitcards\backend"
        Port = 8003
        Type = "backend-python"
        StartCmd = "python -m uvicorn app.main:app --host 0.0.0.0 --port 8003 --reload"
    }
    "lms" = @{
        Name = "LMS Applicant Portal"
        Owner = "mmoore@temenos.com"
        Path = "mmoore\lms-applicant-portal\lms-applicant-portal"
        Port = 3004
        Type = "frontend"
        StartCmd = "npm run dev"
    }
    "middleware" = @{
        Name = "Middleware Integration"
        Owner = "m.mahaboobhussain@temenos.com"
        Path = "m.mahaboobhussain\MIDDLEWARE\TEST_NEW_APP"
        Port = "3005 (frontend), 8005 (backend)"
        Type = "fullstack"
        StartCmd = "npm run start"
    }
}

function Install-Dependencies {
    param($ProjectPath, $ProjectName, $Type)

    $FullPath = Join-Path $BaseDir $ProjectPath

    if (-not (Test-Path $FullPath)) {
        Write-Host "  [SKIP] Path not found: $FullPath" -ForegroundColor Yellow
        return
    }

    Write-Host "  Installing dependencies for $ProjectName..." -ForegroundColor Yellow

    Push-Location $FullPath
    try {
        if ($Type -eq "backend-python") {
            if (Test-Path "requirements.txt") {
                Write-Host "    Running: pip install -r requirements.txt" -ForegroundColor Gray
                pip install -r requirements.txt
            }
        } else {
            if (Test-Path "package.json") {
                Write-Host "    Running: npm install" -ForegroundColor Gray
                npm install
            }
        }
        Write-Host "  [OK] $ProjectName dependencies installed" -ForegroundColor Green
    }
    catch {
        Write-Host "  [ERROR] Failed to install dependencies for $ProjectName" -ForegroundColor Red
    }
    finally {
        Pop-Location
    }
}

function Start-Project {
    param($ProjectKey, $ProjectInfo)

    $FullPath = Join-Path $BaseDir $ProjectInfo.Path

    if (-not (Test-Path $FullPath)) {
        Write-Host "  [SKIP] Path not found: $ProjectInfo.Name" -ForegroundColor Yellow
        return
    }

    $Title = "$($ProjectInfo.Name) - Port: $($ProjectInfo.Port)"
    Write-Host "  Starting: $($ProjectInfo.Name) on port $($ProjectInfo.Port)..." -ForegroundColor Green

    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "Set-Location '$FullPath'; Write-Host 'Starting $($ProjectInfo.Name)...' -ForegroundColor Cyan; $($ProjectInfo.StartCmd)"
    ) -WindowStyle Normal

    Start-Sleep -Milliseconds 500
}

# Main Logic
if ($InstallDeps) {
    Write-Host "Installing dependencies for all projects..." -ForegroundColor Cyan
    Write-Host ""

    foreach ($key in $Projects.Keys) {
        $proj = $Projects[$key]
        Install-Dependencies -ProjectPath $proj.Path -ProjectName $proj.Name -Type $proj.Type
    }

    Write-Host ""
    Write-Host "Dependencies installation complete!" -ForegroundColor Green
    exit 0
}

if ($Project) {
    if ($Projects.ContainsKey($Project)) {
        Write-Host "Starting single project: $Project" -ForegroundColor Cyan
        Start-Project -ProjectKey $Project -ProjectInfo $Projects[$Project]
    } else {
        Write-Host "Unknown project: $Project" -ForegroundColor Red
        Write-Host "Available projects: $($Projects.Keys -join ', ')" -ForegroundColor Yellow
    }
    exit 0
}

if ($LandingOnly) {
    Write-Host "Starting Landing Page only..." -ForegroundColor Cyan
    Start-Project -ProjectKey "landing" -ProjectInfo $Projects["landing"]
    Write-Host ""
    Write-Host "Landing Page started at http://localhost:3000" -ForegroundColor Green
    exit 0
}

# Start all projects
Write-Host "Starting all projects..." -ForegroundColor Cyan
Write-Host ""

# Start backends first
Write-Host "[Backends]" -ForegroundColor Magenta
Start-Project -ProjectKey "bsg-backend" -ProjectInfo $Projects["bsg-backend"]
Start-Project -ProjectKey "debitcards-backend" -ProjectInfo $Projects["debitcards-backend"]

Write-Host ""
Write-Host "[Frontends]" -ForegroundColor Magenta

# Start landing page first
Start-Project -ProjectKey "landing" -ProjectInfo $Projects["landing"]

# Start other frontends
Start-Project -ProjectKey "crm" -ProjectInfo $Projects["crm"]
Start-Project -ProjectKey "bsg-frontend" -ProjectInfo $Projects["bsg-frontend"]
Start-Project -ProjectKey "debitcards-frontend" -ProjectInfo $Projects["debitcards-frontend"]
Start-Project -ProjectKey "lms" -ProjectInfo $Projects["lms"]
Start-Project -ProjectKey "middleware" -ProjectInfo $Projects["middleware"]

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " All Projects Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Project URLs:" -ForegroundColor Yellow
Write-Host "  Landing Page:      http://localhost:3000" -ForegroundColor White
Write-Host "  CRM Simulator:     http://localhost:3001" -ForegroundColor White
Write-Host "  BSG Demo:          http://localhost:3002 (API: :8002)" -ForegroundColor White
Write-Host "  Debit Cards:       http://localhost:3003 (API: :8003)" -ForegroundColor White
Write-Host "  LMS Portal:        http://localhost:3004" -ForegroundColor White
Write-Host "  Middleware:        http://localhost:3005 (API: :8005)" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
