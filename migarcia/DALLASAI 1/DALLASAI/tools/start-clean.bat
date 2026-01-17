@echo off
REM ##############################################################################
REM BSG Demo Platform - Clean Startup Script
REM Starts backend and frontend with clean environment (no CORS conflicts)
REM ##############################################################################

setlocal enabledelayedexpansion

echo ========================================
echo   BSG Demo Platform - Clean Start
echo ========================================
echo.

REM ##############################################################################
REM Kill existing processes
REM ##############################################################################

echo [INFO] Cleaning up existing processes...

REM Kill processes on port 8000 (backend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    echo [INFO] Killing backend process on port 8000 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)

REM Kill processes on port 3000 (frontend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo [INFO] Killing frontend process on port 3000 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)

timeout /t 2 /nobreak >nul
echo [OK] Cleanup complete
echo.

REM ##############################################################################
REM Start Backend with clean environment
REM ##############################################################################

echo [INFO] Starting backend server...

cd backend

REM Clear potentially problematic environment variables
set "CORS_ORIGINS="
set "CORS_METHODS="
set "CORS_HEADERS="

REM Start backend in new window with clean environment
start "BSG Backend" cmd /c "py -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

cd ..

echo [OK] Backend starting in separate window
echo [INFO] Backend URL: http://localhost:8000
echo [INFO] API Docs: http://localhost:8000/docs
echo.

REM Wait for backend to start
echo [INFO] Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

REM ##############################################################################
REM Start Frontend
REM ##############################################################################

echo [INFO] Starting frontend server...

cd frontend

REM Start frontend in new window
start "BSG Frontend" cmd /c "npm run dev"

cd ..

echo [OK] Frontend starting in separate window
echo [INFO] Frontend URL: http://localhost:3000
echo.

REM ##############################################################################
REM Summary
REM ##############################################################################

echo ========================================
echo   Services Started
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo.
echo [INFO] Services are running in separate windows
echo [INFO] Close those windows to stop the services
echo.
echo Press any key to open the frontend in your browser...
pause >nul

start http://localhost:3000
