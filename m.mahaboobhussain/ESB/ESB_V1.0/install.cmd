@echo off
title ESB Application Installer
echo ========================================
echo    ESB Application - Installing...
echo ========================================
echo.

:: Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

echo Installing Backend dependencies...
cd /d %~dp0backend
call npm install
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)

echo.
echo Installing Frontend dependencies...
cd /d %~dp0frontend
call npm install
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)

cd /d %~dp0

echo.
echo ========================================
echo    Installation Complete!
echo ========================================
echo.
echo    Run start.cmd to launch the application
echo.
pause
