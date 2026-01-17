@echo off
REM Restart All Services - BSG Demo Platform
REM This script stops and restarts both backend and frontend servers

echo ========================================
echo   BSG Demo Platform - Restart All
echo ========================================
echo.

REM Change to script directory
cd /d "%~dp0"

echo [1/4] Stopping existing services...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq *uvicorn*" 2>nul
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *vite*" 2>nul
timeout /t 2 /nobreak >nul
echo   Done.
echo.

echo [2/4] Starting Backend Server...
start "BSG Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 3 /nobreak >nul
echo   Backend starting in new window...
echo.

echo [3/4] Starting Frontend Server...
start "BSG Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 3 /nobreak >nul
echo   Frontend starting in new window...
echo.

echo [4/4] Waiting for services to start...
timeout /t 10 /nobreak >nul
echo.

echo ========================================
echo   Services Started!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo.
echo Two command windows have opened:
echo   - BSG Backend  (backend server)
echo   - BSG Frontend (frontend server)
echo.
echo Wait a few seconds for services to fully start, then:
echo   1. Open http://localhost:3000 in your browser
echo   2. Go to Demo -^> Deployment Analyzer
echo   3. Connect to Azure and analyze deployments
echo.
echo Press any key to exit...
pause >nul

