@echo off
echo Starting BSG Demo Platform Frontend...
echo.
echo Killing existing processes on port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
timeout /t 2 /nobreak >nul

echo Starting Vite dev server...
echo Server will be available at: http://localhost:3000
echo Press Ctrl+C to stop
echo.

npm run dev

