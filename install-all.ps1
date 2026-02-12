# AmrBSGBankEcoIntDemo - Install All Dependencies
# This script installs npm and pip dependencies for all projects

$ErrorActionPreference = "Continue"
$BaseDir = $PSScriptRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " AmrBSGBankEcoIntDemo - Install Dependencies" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Project paths for npm install
$NpmProjects = @(
    @{ Name = "Landing Page"; Path = "brian.grundleger\BG_DallasAiProjects\DallasAiProjects" },
    @{ Name = "CRM Banking Simulator"; Path = "alwin\crm-banking-simulator_v2\crm-banking-simulator_v2" },
    @{ Name = "BSG Demo Platform - Frontend"; Path = "migarcia\DALLASAI 1\DALLASAI\frontend" },
    @{ Name = "Debit Cards - Frontend"; Path = "sweekruth.somaraju\debitcards\debitcards\frontend" },
    @{ Name = "LMS Applicant Portal"; Path = "mmoore\lms-applicant-portal\lms-applicant-portal" }
)

# Project paths for pip install
$PipProjects = @(
    @{ Name = "BSG Demo Platform - Backend"; Path = "migarcia\DALLASAI 1\DALLASAI\backend" },
    @{ Name = "Debit Cards - Backend"; Path = "sweekruth.somaraju\debitcards\debitcards\backend" }
)

Write-Host "Installing NPM dependencies..." -ForegroundColor Yellow
Write-Host ""

foreach ($proj in $NpmProjects) {
    $FullPath = Join-Path $BaseDir $proj.Path

    if (-not (Test-Path $FullPath)) {
        Write-Host "  [SKIP] $($proj.Name) - Path not found" -ForegroundColor Yellow
        continue
    }

    $PackageJson = Join-Path $FullPath "package.json"
    if (-not (Test-Path $PackageJson)) {
        Write-Host "  [SKIP] $($proj.Name) - No package.json" -ForegroundColor Yellow
        continue
    }

    Write-Host "  Installing: $($proj.Name)..." -ForegroundColor Cyan
    Push-Location $FullPath
    try {
        npm install 2>&1 | Out-Null
        Write-Host "  [OK] $($proj.Name)" -ForegroundColor Green
    }
    catch {
        Write-Host "  [ERROR] $($proj.Name) - $($_.Exception.Message)" -ForegroundColor Red
    }
    finally {
        Pop-Location
    }
}

Write-Host ""
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
Write-Host ""

foreach ($proj in $PipProjects) {
    $FullPath = Join-Path $BaseDir $proj.Path

    if (-not (Test-Path $FullPath)) {
        Write-Host "  [SKIP] $($proj.Name) - Path not found" -ForegroundColor Yellow
        continue
    }

    $RequirementsTxt = Join-Path $FullPath "requirements.txt"
    if (-not (Test-Path $RequirementsTxt)) {
        Write-Host "  [SKIP] $($proj.Name) - No requirements.txt" -ForegroundColor Yellow
        continue
    }

    Write-Host "  Installing: $($proj.Name)..." -ForegroundColor Cyan
    Push-Location $FullPath
    try {
        pip install -r requirements.txt 2>&1 | Out-Null
        Write-Host "  [OK] $($proj.Name)" -ForegroundColor Green
    }
    catch {
        Write-Host "  [ERROR] $($proj.Name) - $($_.Exception.Message)" -ForegroundColor Red
    }
    finally {
        Pop-Location
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now run: .\startup-all.ps1" -ForegroundColor Yellow
Write-Host ""
