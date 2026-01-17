# Remove incorrect path environment variables
Write-Host "Removing incorrect path environment variables..." -ForegroundColor Yellow

# Remove API_V1_PREFIX from all levels
[Environment]::SetEnvironmentVariable('API_V1_PREFIX', $null, 'User')
[Environment]::SetEnvironmentVariable('API_V1_PREFIX', $null, 'Process')

try {
    [Environment]::SetEnvironmentVariable('API_V1_PREFIX', $null, 'Machine')
    Write-Host "[OK] Removed from Machine level" -ForegroundColor Green
} catch {
    Write-Host "[SKIP] Could not remove from Machine level (requires admin)" -ForegroundColor Gray
}

Write-Host "[OK] Environment variables cleared" -ForegroundColor Green
