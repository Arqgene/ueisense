@echo off
title Uveisense AI — ML Backend (Port 8000)
cd /d "%~dp0"
echo ===================================================================
echo   Uveisense AI — Python ML Backend (Port 8000)
echo   Neuro-Fuzzy + CNN / Grad-CAM Service
echo ===================================================================
echo.

set "PYTHON_CMD="
if exist ".venv\Scripts\python.exe" (
    set "PYTHON_CMD=.venv\Scripts\python.exe"
    goto :run
)

py -3.12 -c "import sys; sys.exit(0)" >nul 2>&1
if not errorlevel 1 (
    set "PYTHON_CMD=py -3.12"
    goto :run
)

if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
    set "PYTHON_CMD=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
    goto :run
)

py -c "import sys; sys.exit(0)" >nul 2>&1
if not errorlevel 1 (
    set "PYTHON_CMD=py"
    goto :run
)

set "PYTHON_CMD=python"

:run
echo Starting Python ML Backend using: %PYTHON_CMD%
echo.
%PYTHON_CMD% backend\server.py
if errorlevel 1 (
    echo.
    echo [ERROR] ML Backend failed to start or exited with an error.
)
echo.
pause
