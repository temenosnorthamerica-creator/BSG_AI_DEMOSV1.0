# Remove CORS environment variables
Write-Host "Removing CORS environment variables..." -ForegroundColor Yellow

# Remove from User level
[Environment]::SetEnvironmentVariable('CORS_ORIGINS', $null, 'User')
[Environment]::SetEnvironmentVariable('CORS_METHODS', $null, 'User')
[Environment]::SetEnvironmentVariable('CORS_HEADERS', $null, 'User')

# Remove from Machine level (requires admin)
try {
    [Environment]::SetEnvironmentVariable('CORS_ORIGINS', $null, 'Machine')
    [Environment]::SetEnvironmentVariable('CORS_METHODS', $null, 'Machine')
    [Environment]::SetEnvironmentVariable('CORS_HEADERS', $null, 'Machine')
    Write-Host "[OK] Removed from Machine level" -ForegroundColor Green
} catch {
    Write-Host "[SKIP] Could not remove from Machine level (requires admin)" -ForegroundColor Gray
}

# Remove from current Process
[Environment]::SetEnvironmentVariable('CORS_ORIGINS', $null, 'Process')
[Environment]::SetEnvironmentVariable('CORS_METHODS', $null, 'Process')
[Environment]::SetEnvironmentVariable('CORS_HEADERS', $null, 'Process')

Write-Host "[OK] CORS environment variables removed" -ForegroundColor Green
Write-Host ""
Write-Host "Please close this window and restart any PowerShell/CMD windows" -ForegroundColor Yellow
