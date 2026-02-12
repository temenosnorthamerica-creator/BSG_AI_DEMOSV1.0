@echo off
title ESB Application Starter
echo ========================================
echo    ESB Application - Starting...
echo ========================================
echo.

:: Check if node_modules exist, if not install
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

echo.
echo Starting Backend Server (Port 8006)...
start cmd /k "title ESB Backend && cd /d %~dp0backend && npm run dev"

:: Wait for backend to start
timeout /t 3 /nobreak >nul

echo Starting Frontend Server (Port 3016)...
start cmd /k "title ESB Frontend && cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo    ESB Application Started!
echo ========================================
echo.
echo    Frontend: http://localhost:3016
echo    Backend:  http://localhost:8006
echo.
echo    To stop, run: stop.cmd
echo    Or close the terminal windows
echo ========================================
echo.
pause
