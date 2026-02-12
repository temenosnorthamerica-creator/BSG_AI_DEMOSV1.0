@echo off
title ESB Application Restart
echo ========================================
echo    ESB Application - Restarting...
echo ========================================
echo.

:: Stop the application
call "%~dp0stop.cmd"

:: Wait a moment
timeout /t 2 /nobreak >nul

:: Start the application
call "%~dp0start.cmd"
