@echo off
REM Stop All Services - BSG Demo Platform
REM This script stops both backend and frontend servers

echo ========================================
echo   BSG Demo Platform - Stop All
echo ========================================
echo.

echo Stopping services...
echo.

REM Stop Python processes (backend)
echo [1/2] Stopping Backend (Python)...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq *uvicorn*" 2>nul
if %errorlevel% == 0 (
    echo   Backend stopped.
) else (
    echo   No backend process found.
)
echo.

REM Stop Node processes (frontend)
echo [2/2] Stopping Frontend (Node)...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *vite*" 2>nul
if %errorlevel% == 0 (
    echo   Frontend stopped.
) else (
    echo   No frontend process found.
)
echo.

echo ========================================
echo   All services stopped.
echo ========================================
echo.
echo Press any key to exit...
pause >nul

