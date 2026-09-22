@echo off
setlocal enabledelayedexpansion
title Uveisense AI — Master Launcher
cd /d "%~dp0"
set "ROOT_DIR=%CD%"
set "SERVER_DIR=%ROOT_DIR%\server"
set "BACKEND_DIR=%ROOT_DIR%\backend"

echo.
echo ===================================================================
echo     Uveisense AI - Clinical Ophthalmology Diagnosis System
echo     Arqgene x Dr. Agarwal's Eye Hospital Network
echo     Clinical Workflow: Patient - Doctor - Senior Ratification
echo ===================================================================
echo.

:: ── Step 1: Detect Python ────────────────────────────────────────────────────
echo [1/4] Detecting Python interpreter...
set "PY_CMD="

if exist "%ROOT_DIR%\.venv\Scripts\python.exe" (
    set "PY_CMD=%ROOT_DIR%\.venv\Scripts\python.exe"
    echo       OK  Virtual environment found: .venv
    goto :python_done
)

py -3.12 -c "import sys; sys.exit(0)" >nul 2>&1
if not errorlevel 1 (
    set "PY_CMD=py -3.12"
    echo       OK  Python 3.12 launcher found: py -3.12
    goto :python_done
)

if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
    set "PY_CMD=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
    echo       OK  Python 3.12 path found
    goto :python_done
)

py -3.11 -c "import sys; sys.exit(0)" >nul 2>&1
if not errorlevel 1 (
    set "PY_CMD=py -3.11"
    echo       OK  Python 3.11 launcher found: py -3.11
    goto :python_done
)

py -c "import sys; sys.exit(0)" >nul 2>&1
if not errorlevel 1 (
    set "PY_CMD=py"
    echo       OK  Python launcher found: py
    goto :python_done
)

python -c "import sys; sys.exit(0)" >nul 2>&1
if not errorlevel 1 (
    set "PY_CMD=python"
    echo       OK  System Python found
    goto :python_done
)

echo       ERROR  Python 3.10+ not found.
echo              Install from https://www.python.org/
pause
exit /b 1

:python_done

:: ── Step 2: Check Node.js ───────────────────────────────────────────────────
echo.
echo [2/4] Checking Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo       ERROR  Node.js not found in PATH.
    echo              Install from https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do echo       OK  Node.js %%v

:: ── Step 3: Check Dependencies ──────────────────────────────────────────────
echo.
echo [3/4] Checking Node.js dependencies...

if exist "%SERVER_DIR%\node_modules" goto :server_deps_ok
echo       Installing server dependencies [one-time setup]...
cd /d "%SERVER_DIR%"
call npm.cmd install --production
if errorlevel 1 (
    echo       ERROR  Server npm install failed.
    pause
    exit /b 1
)
cd /d "%ROOT_DIR%"
echo       OK  Server dependencies installed.
:server_deps_ok
echo       OK  Server node_modules found.

if exist "%ROOT_DIR%\node_modules" goto :frontend_deps_ok
echo       Installing frontend dependencies [one-time setup]...
cd /d "%ROOT_DIR%"
call npm.cmd install
if errorlevel 1 (
    echo       ERROR  Frontend npm install failed.
    pause
    exit /b 1
)
echo       OK  Frontend dependencies installed.
:frontend_deps_ok
echo       OK  Frontend node_modules found.

:: ── Step 4: Clear Ports ─────────────────────────────────────────────────────
echo.
echo [4/4] Clearing ports 5173, 3001, 8000...
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT_DIR%\stop_servers.ps1" >nul 2>&1
ping 127.0.0.1 -n 3 >nul
echo       OK  Ports cleared.

:: ── Launching Services ───────────────────────────────────────────────────────
echo.
echo ===================================================================
echo   Launching 3 System Services in Separate Windows...
echo ===================================================================
echo.

echo [1/3] Starting Python ML Backend (Port 8000)...
start "UEISense - ML Backend" "%ROOT_DIR%\run_ml.bat"
ping 127.0.0.1 -n 4 >nul

echo [2/3] Starting Express REST API (Port 3001)...
start "UEISense - Express API" "%ROOT_DIR%\run_api.bat"
ping 127.0.0.1 -n 3 >nul

echo [3/3] Starting Vite Frontend (Port 5173)...
start "UEISense - Vite Frontend" "%ROOT_DIR%\run_frontend.bat"
ping 127.0.0.1 -n 4 >nul

:: ── Open Browser ─────────────────────────────────────────────────────────────
echo.
echo Opening application in default browser...
start http://localhost:5173

echo.
echo ===================================================================
echo   All 3 Services Launched Successfully!
echo.
echo   Service         URL                                  Status
echo   --------------- ------------------------------------ -------
echo   Frontend SPA    http://localhost:5173                Running
echo   Express API     http://localhost:3001/api/health     Running
echo   ML Backend      http://127.0.0.1:8000/docs           Running
echo.
echo   Clinical Endpoints:
echo     Patient Intake:    http://localhost:5173/patient-portal
echo     Doctor Login:      http://localhost:5173/doctor-login
echo     Doctor Queue:      http://localhost:5173/doctor/queue
echo.
echo   Doctor Roster (Dr. Agarwal's Eye Hospital Network):
echo     DR-AG-01  Dr. Soundari S.           Senior Consultant
echo     DR-AG-02  Dr. Ramamurthy Sundar     Senior Consultant
echo     DR-AG-03  Dr. V. Rajeshwari         Senior Consultant
echo     DR-AG-04  Dr. Anand Parthasarathy   Junior Specialist
echo     DR-AG-05  Dr. Preethi Govindarajan  Junior Specialist
echo.
echo   To stop all running services, run: stop_all.bat
echo ===================================================================
echo.
pause
