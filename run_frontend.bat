@echo off
title Uveisense AI — Vite Frontend (Port 5173)
cd /d "%~dp0"
echo ===================================================================
echo   Uveisense AI — Vite React Frontend (Port 5173)
echo   Arqgene x Dr. Agarwal's Eye Hospital Network
echo ===================================================================
echo.
echo Starting Vite Dev Server...
echo.
call npm.cmd run dev
if errorlevel 1 (
    echo.
    echo [ERROR] Vite frontend failed to start.
)
echo.
pause
