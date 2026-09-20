@echo off
title Stop Uveitis AI Services
echo ========================================================
echo       Stopping Uveitis AI System Services
echo ========================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop_servers.ps1"
echo.
pause
