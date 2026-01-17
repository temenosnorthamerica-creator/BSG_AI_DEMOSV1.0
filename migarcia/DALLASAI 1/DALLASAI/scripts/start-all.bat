@echo off
REM Start All Services - BSG Demo Platform
REM This script starts both backend and frontend servers

echo ========================================
echo   BSG Demo Platform - Start All
echo ========================================
echo.

REM Change to script directory
cd /d "%~dp0"

REM Check if services are already running
netstat -ano | findstr ":8000" >nul
if %errorlevel% == 0 (
    echo [WARNING] Port 8000 is already in use!
    echo   Backend may already be running.
    echo   Press Ctrl+C to cancel, or any key to continue...
    pause >nul
)

netstat -ano | findstr ":5173" >nul
if %errorlevel% == 0 (
    echo [WARNING] Port 5173 is already in use!
    echo   Frontend may already be running.
    echo   Press Ctrl+C to cancel, or any key to continue...
    pause >nul
)

echo [1/3] Starting Backend Server...
start "BSG Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 3 /nobreak >nul
echo   Backend starting in new window...
echo.

echo [2/3] Starting Frontend Server...
start "BSG Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 3 /nobreak >nul
echo   Frontend starting in new window...
echo.

echo [3/3] Waiting for services to start...
timeout /t 10 /nobreak >nul
echo.

echo ========================================
echo   Services Started!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:8000/docs
echo.
echo Two command windows have opened:
echo   - BSG Backend  (backend server)
echo   - BSG Frontend (frontend server)
echo.
echo Wait a few seconds for services to fully start, then:
echo   1. Open http://localhost:5173 in your browser
echo   2. Go to Demo -^> Deployment Analyzer
echo   3. Connect to Azure and analyze deployments
echo.
echo Press any key to exit...
pause >nul

