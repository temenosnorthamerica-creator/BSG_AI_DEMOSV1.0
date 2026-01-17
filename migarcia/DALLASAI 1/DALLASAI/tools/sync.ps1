# BSG Demo Platform - Sync Script
# Commits all changes and pushes to GitHub

param(
    [Parameter(Mandatory=$true)]
    [string]$Message
)

Write-Host "BSG Demo Platform - Sync to GitHub" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Get current branch
$branch = git symbolic-ref --short HEAD
Write-Host "Current branch: $branch" -ForegroundColor Yellow

# Check if there are changes
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "No changes to commit." -ForegroundColor Yellow
    exit 0
}

# Show what will be committed
Write-Host "`nChanges to commit:" -ForegroundColor Yellow
git status --short

# Add all changes
Write-Host "`nStaging all changes..." -ForegroundColor Yellow
git add .

# Commit
Write-Host "Committing with message: $Message" -ForegroundColor Yellow
git commit -m $Message

if ($LASTEXITCODE -ne 0) {
    Write-Host "Commit failed!" -ForegroundColor Red
    exit 1
}

# Push to GitHub
Write-Host "`nPushing to origin/$branch..." -ForegroundColor Yellow
git push origin $branch

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSuccessfully synced to GitHub!" -ForegroundColor Green
} else {
    Write-Host "`nPush failed. Please check your connection and try again." -ForegroundColor Red
    exit 1
}


