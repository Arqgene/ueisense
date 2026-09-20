@echo off
setlocal enabledelayedexpansion
title Uveitis AI System - Master Launcher
cd /d "%~dp0"
set "ROOT_DIR=%CD%"
set "SERVER_DIR=%ROOT_DIR%\server"

echo ===================================================================
echo           Uveitis AI Screening ^& Diagnosis System
echo ===================================================================
echo.

:: 1. Detect Python Interpreter
set "PY_CMD="
if exist "%ROOT_DIR%\.venv\Scripts\python.exe" (
    set "PY_CMD=%ROOT_DIR%\.venv\Scripts\python.exe"
    echo [OK] Using virtual environment Python: .venv\Scripts\python.exe
) else (
    py -3.12 --version >nul 2>&1
    if !errorlevel! equ 0 (
        set "PY_CMD=py -3.12"
        echo [OK] Using Python Launcher: py -3.12
    ) else (
        py --version >nul 2>&1
        if !errorlevel! equ 0 (
            set "PY_CMD=py"
            echo [OK] Using Python Launcher: py
        ) else (
            python --version >nul 2>&1
            if !errorlevel! equ 0 (
                set "PY_CMD=python"
                echo [OK] Using system Python: python
            ) else (
                echo [ERROR] Python 3.10+ was not found on your system.
                echo Please install Python from https://www.python.org/
                pause
                exit /b 1
            )
        )
    )
)

:: 2. Check Node.js and NPM
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js was not found in your PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: 3. Check Server Dependencies
if not exist "%SERVER_DIR%\node_modules" (
    echo [*] Installing Node server dependencies - one-time setup...
    cd /d "%SERVER_DIR%"
    call npm.cmd install
    cd /d "%ROOT_DIR%"
)

:: 4. Check Frontend Dependencies
if not exist "%ROOT_DIR%\node_modules" (
    echo [*] Installing frontend web dependencies - one-time setup...
    cd /d "%ROOT_DIR%"
    call npm.cmd install
)

:: 5. Clean up any previous instances on ports 8000, 3001, 5173
echo [*] Checking and cleaning up previous server instances...
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT_DIR%\stop_servers.ps1" >nul 2>&1

:: 6. Configure Environment Variables
set "PORT=3001"
set "PYTHON_BACKEND_URL=http://127.0.0.1:8000/predict"
set "EYE_MODEL_PATH=%ROOT_DIR%\backend\models\best_model.pth"

echo.
echo [*] Starting [1/3] Python PyTorch FastAPI Backend on Port 8000...
start "Uveitis AI - Python ML Backend (Port 8000)" /D "%ROOT_DIR%" cmd /k ""%PY_CMD%" "%ROOT_DIR%\backend\server.py""
ping 127.0.0.1 -n 4 >nul

echo [*] Starting [2/3] Node Express Database Server on Port 3001...
start "Uveitis AI - Node Express API (Port 3001)" /D "%SERVER_DIR%" cmd /k "node "%SERVER_DIR%\index.js""
ping 127.0.0.1 -n 3 >nul

echo [*] Starting [3/3] Vite React Frontend on Port 5173...
start "Uveitis AI - Vite Web Frontend (Port 5173)" /D "%ROOT_DIR%" cmd /k "npm.cmd run dev"
ping 127.0.0.1 -n 4 >nul

:: 7. Open Browser
echo [*] Opening application in default web browser...
start http://localhost:5173

echo.
echo ===================================================================
echo   All services have started successfully!
echo.
echo   - Web Application:       http://localhost:5173
echo   - Node Database API:     http://localhost:3001/api/health
echo   - Python ML Backend:     http://127.0.0.1:8000/docs
echo.
echo   Keep this window open. Run 'stop_all.bat' to stop all services.
echo ===================================================================
echo.
pause
