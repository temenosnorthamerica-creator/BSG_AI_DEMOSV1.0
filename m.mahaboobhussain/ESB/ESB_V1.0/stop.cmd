@echo off
title ESB Application Stopper
echo ========================================
echo    ESB Application - Stopping...
echo ========================================
echo.

:: Kill Node.js processes running on ports 3000 and 3001
echo Stopping Frontend (Port 3000)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo Stopping Backend (Port 3001)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
)

:: Also try to close any cmd windows with our titles
echo Closing Backend cmd...
taskkill /FI "WINDOWTITLE eq ESB Backend*" /F >nul 2>&1
echo Closing Frontend cmd...
taskkill /FI "WINDOWTITLE eq ESB Frontend*" /F >nul 2>&1

echo.
echo ========================================
echo    ESB Application Stopped!
echo ========================================
echo.
pause
