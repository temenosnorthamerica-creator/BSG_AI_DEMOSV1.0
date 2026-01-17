# Count Lines of Code Script

Write-Host "=== BSG Demo Platform - Lines of Code ===" -ForegroundColor Cyan
Write-Host ""

$backendFiles = Get-ChildItem -Path "backend" -Include *.py -Recurse -File | 
    Where-Object { $_.FullName -notmatch 'node_modules|__pycache__|\.git|dist|\.env|venv|test|migrations' }

$frontendFiles = Get-ChildItem -Path "frontend/src" -Include *.ts,*.tsx,*.js,*.jsx -Recurse -File | 
    Where-Object { $_.FullName -notmatch 'node_modules|\.git|dist|\.env|test' }

$backendLines = 0
$frontendLines = 0

Write-Host "Counting Backend (Python) files..." -ForegroundColor Yellow
foreach ($file in $backendFiles) {
    $lines = (Get-Content $file.FullName -ErrorAction SilentlyContinue | Measure-Object -Line).Lines
    $backendLines += $lines
}
Write-Host "  Backend files: $($backendFiles.Count)" -ForegroundColor Gray
Write-Host "  Backend lines: $backendLines" -ForegroundColor Green

Write-Host ""
Write-Host "Counting Frontend (TypeScript/React) files..." -ForegroundColor Yellow
foreach ($file in $frontendFiles) {
    $lines = (Get-Content $file.FullName -ErrorAction SilentlyContinue | Measure-Object -Line).Lines
    $frontendLines += $lines
}
Write-Host "  Frontend files: $($frontendFiles.Count)" -ForegroundColor Gray
Write-Host "  Frontend lines: $frontendLines" -ForegroundColor Green

$total = $backendLines + $frontendLines

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "  Backend:  $backendLines lines ($($backendFiles.Count) files)" -ForegroundColor White
Write-Host "  Frontend: $frontendLines lines ($($frontendFiles.Count) files)" -ForegroundColor White
Write-Host "  Total:    $total lines ($($backendFiles.Count + $frontendFiles.Count) files)" -ForegroundColor Green
Write-Host ""

