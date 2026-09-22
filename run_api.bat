@echo off
title Uveisense AI — Express API (Port 3001)
cd /d "%~dp0"
echo ===================================================================
echo   Uveisense AI — Express REST API + SQLite (Port 3001)
echo   Clinical Database & Decision Support Platform
echo ===================================================================
echo.
set "PORT=3001"
set "NODE_ENV=development"
set "PYTHON_BACKEND_URL=http://127.0.0.1:8000/predict"
set "PYTHON_IMAGE_URL=http://127.0.0.1:8000/predict-image"

echo Starting Express API server...
echo.
node server\index.js
if errorlevel 1 (
    echo.
    echo [ERROR] Express API server stopped with an error.
)
echo.
pause
