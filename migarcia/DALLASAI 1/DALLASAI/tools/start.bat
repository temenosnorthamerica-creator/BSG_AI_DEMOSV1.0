@echo off
REM ##############################################################################
REM BSG Demo Platform - Windows Startup Script
REM This script starts all components of the BSG Demo Platform on Windows
REM ##############################################################################

setlocal enabledelayedexpansion

set BACKEND_DIR=backend
set FRONTEND_DIR=frontend
set BACKEND_PORT=8000
set FRONTEND_PORT=3000
set LOG_DIR=logs

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

echo ========================================
echo   BSG Demo Platform - Startup
echo ========================================
echo.

REM ##############################################################################
REM Check Dependencies
REM ##############################################################################

echo [INFO] Checking dependencies...

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Please install from https://nodejs.org/
    pause
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm not found. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

where py >nul 2>&1
if errorlevel 1 (
    where python >nul 2>&1
    if errorlevel 1 (
        where python3 >nul 2>&1
        if errorlevel 1 (
            echo [ERROR] Python not found. Please install from https://www.python.org/
            pause
            exit /b 1
        )
        set PYTHON_CMD=python3
    ) else (
        set PYTHON_CMD=python
    )
) else (
    set PYTHON_CMD=py
)

echo [OK] All required dependencies are installed
echo.

REM ##############################################################################
REM Start Docker Services (if present)
REM ##############################################################################

if exist "docker-compose.yml" (
    echo [INFO] Starting Docker services...
    where docker >nul 2>&1
    if not errorlevel 1 (
        docker compose up -d 2>nul
        if not errorlevel 1 (
            echo [OK] Docker services started
        ) else (
            docker-compose up -d 2>nul
            if not errorlevel 1 (
                echo [OK] Docker services started
            ) else (
                echo [WARN] Could not start Docker services
            )
        )
    ) else (
        echo [WARN] Docker not found, skipping Docker services
    )
    echo.
)

REM ##############################################################################
REM Start Backend
REM ##############################################################################

set BACKEND_STARTED=0

if exist "%BACKEND_DIR%" (
    echo [INFO] Starting backend...

    REM Check for Python files
    dir /s /b "%BACKEND_DIR%\*.py" 2>nul | findstr /v /c:"\." >nul
    if errorlevel 1 (
        echo [WARN] No Python files found in backend directory, skipping backend
    ) else (
        REM Kill existing processes on backend port
        echo [INFO] Checking for processes on port %BACKEND_PORT%...
        for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%BACKEND_PORT% ^| findstr LISTENING') do (
            echo [INFO] Killing process on port %BACKEND_PORT% (PID: %%a)
            taskkill /F /PID %%a >nul 2>&1
        )
        timeout /t 2 /nobreak >nul

        REM Check for virtual environment
        if exist "%BACKEND_DIR%\venv\Scripts\activate.bat" (
            echo [INFO] Using virtual environment
            call "%BACKEND_DIR%\venv\Scripts\activate.bat"
        ) else if exist "%BACKEND_DIR%\.venv\Scripts\activate.bat" (
            echo [INFO] Using virtual environment
            call "%BACKEND_DIR%\.venv\Scripts\activate.bat"
        )

        REM Install dependencies if requirements.txt exists
        if exist "%BACKEND_DIR%\requirements.txt" (
            echo [INFO] Checking and installing backend dependencies...
            
            REM Install/upgrade packages from requirements.txt using pip
            echo [INFO] Installing/updating Python packages from requirements.txt...
            %PYTHON_CMD% -m pip install --upgrade -r "%BACKEND_DIR%\requirements.txt" >nul 2>&1
            if errorlevel 1 (
                echo [WARN] Some packages may have failed to install. Trying without --upgrade...
                %PYTHON_CMD% -m pip install -r "%BACKEND_DIR%\requirements.txt" >nul 2>&1
                if errorlevel 1 (
                    echo [WARN] Package installation had errors. Check manually with: %PYTHON_CMD% -m pip install -r "%BACKEND_DIR%\requirements.txt"
                ) else (
                    echo [OK] Backend dependencies installed
                )
            ) else (
                echo [OK] All backend dependencies are installed/up-to-date
            )
        )

        REM Start the backend server
        cd "%BACKEND_DIR%"

        if exist "main.py" (
            echo [INFO] Starting backend with main.py...
            start /b cmd /c "%PYTHON_CMD% main.py > ..\%LOG_DIR%\backend.log 2>&1"
            set BACKEND_STARTED=1
        ) else if exist "app.py" (
            echo [INFO] Starting backend with app.py...
            start /b cmd /c "%PYTHON_CMD% app.py > ..\%LOG_DIR%\backend.log 2>&1"
            set BACKEND_STARTED=1
        ) else (
            where uvicorn >nul 2>&1
            if not errorlevel 1 (
                echo [INFO] Starting backend with uvicorn...
                start /b cmd /c "%PYTHON_CMD% -m uvicorn app.main:app --host 0.0.0.0 --port %BACKEND_PORT% --reload > ..\%LOG_DIR%\backend.log 2>&1"
                set BACKEND_STARTED=1
            ) else (
                echo [WARN] No known backend entry point found
            )
        )

        cd ..

        if !BACKEND_STARTED! equ 1 (
            timeout /t 2 /nobreak >nul
            echo [OK] Backend started
            echo [INFO] Backend URL: http://localhost:%BACKEND_PORT%
            echo [INFO] Backend logs: %LOG_DIR%\backend.log
        )
    )
) else (
    echo [WARN] Backend directory not found, skipping backend
)

echo.

REM ##############################################################################
REM Start Frontend
REM ##############################################################################

set FRONTEND_STARTED=0

if exist "%FRONTEND_DIR%" (
    echo [INFO] Starting frontend...

    if not exist "%FRONTEND_DIR%\package.json" (
        echo [WARN] No package.json found in frontend directory, skipping frontend
    ) else (
        REM Kill existing processes on frontend port
        echo [INFO] Checking for processes on port %FRONTEND_PORT%...
        for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%FRONTEND_PORT% ^| findstr LISTENING') do (
            echo [INFO] Killing process on port %FRONTEND_PORT% (PID: %%a)
            taskkill /F /PID %%a >nul 2>&1
        )
        timeout /t 2 /nobreak >nul

        cd "%FRONTEND_DIR%"

        REM Install dependencies if node_modules doesn't exist
        if not exist "node_modules" (
            echo [INFO] Installing frontend dependencies...
            call npm install
        )

        REM Start the frontend server
        echo [INFO] Starting frontend dev server...
        start /b cmd /c "npm run dev > ..\%LOG_DIR%\frontend.log 2>&1"
        set FRONTEND_STARTED=1

        cd ..

        if !FRONTEND_STARTED! equ 1 (
            timeout /t 2 /nobreak >nul
            echo [OK] Frontend started
            echo [INFO] Frontend URL: http://localhost:%FRONTEND_PORT%
            echo [INFO] Frontend logs: %LOG_DIR%\frontend.log
        )
    )
) else (
    echo [WARN] Frontend directory not found, skipping frontend
)

echo.

REM ##############################################################################
REM Summary
REM ##############################################################################

echo ========================================
echo   Services Status
echo ========================================

if !BACKEND_STARTED! equ 1 (
    echo [OK] Backend:  http://localhost:%BACKEND_PORT%
) else (
    echo [WARN] Backend:  Not running
)

if !FRONTEND_STARTED! equ 1 (
    echo [OK] Frontend: http://localhost:%FRONTEND_PORT%
) else (
    echo [WARN] Frontend: Not running
)

echo.

if !FRONTEND_STARTED! equ 0 (
    if !BACKEND_STARTED! equ 0 (
        echo [ERROR] No services started. Please check the errors above.
        pause
        exit /b 1
    )
)

echo [INFO] Services are running in the background
echo [INFO] Check log files in the "%LOG_DIR%" directory for output
echo [INFO] Use stop.bat to stop all services
echo.
echo Press any key to open the frontend in your browser...
pause >nul

if !FRONTEND_STARTED! equ 1 (
    start http://localhost:%FRONTEND_PORT%
) else if !BACKEND_STARTED! equ 1 (
    start http://localhost:%BACKEND_PORT%
)
