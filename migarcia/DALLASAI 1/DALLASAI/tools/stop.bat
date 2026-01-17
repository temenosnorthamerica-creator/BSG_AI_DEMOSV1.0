@echo off
REM ##############################################################################
REM BSG Demo Platform - Windows Stop Script
REM This script stops all running components of the BSG Demo Platform
REM ##############################################################################

setlocal enabledelayedexpansion

set BACKEND_PORT=8000
set FRONTEND_PORT=3000

echo ========================================
echo   BSG Demo Platform - Stop Services
echo ========================================
echo.

set STOPPED_ANY=0

REM Stop backend
echo [INFO] Stopping backend (port %BACKEND_PORT%)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%BACKEND_PORT% ^| findstr LISTENING') do (
    echo [INFO] Killing process on port %BACKEND_PORT% (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
    if not errorlevel 1 (
        echo [OK] Backend stopped
        set STOPPED_ANY=1
    )
)

REM Stop frontend
echo [INFO] Stopping frontend (port %FRONTEND_PORT%)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%FRONTEND_PORT% ^| findstr LISTENING') do (
    echo [INFO] Killing process on port %FRONTEND_PORT% (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
    if not errorlevel 1 (
        echo [OK] Frontend stopped
        set STOPPED_ANY=1
    )
)

REM Stop Docker services if present
if exist "docker-compose.yml" (
    where docker >nul 2>&1
    if not errorlevel 1 (
        echo [INFO] Stopping Docker services...
        docker compose down >nul 2>&1
        if not errorlevel 1 (
            echo [OK] Docker services stopped
            set STOPPED_ANY=1
        ) else (
            docker-compose down >nul 2>&1
            if not errorlevel 1 (
                echo [OK] Docker services stopped
                set STOPPED_ANY=1
            )
        )
    )
)

echo.
if !STOPPED_ANY! equ 1 (
    echo [OK] All services stopped successfully
) else (
    echo [WARN] No running services found
)

echo.
pause
