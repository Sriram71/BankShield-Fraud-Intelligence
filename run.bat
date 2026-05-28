@echo off
title GuardRail AI Startup Script
echo ====================================================================
echo             GUARDRAIL AI - AUTOMATED TRANSACTION AUDIT
echo ====================================================================
echo.

:: Check for Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python was not found in your system PATH.
    echo Please install Python 3.10+ and select "Add python.exe to PATH" during setup.
    pause
    exit /b 1
)

:: Virtual environment verification
if not exist .venv (
    echo [INFO] Virtual environment (.venv) not found. Creating...
    python -m venv .venv
    if %errorlevel% neq 0 (
        echo [ERROR] Failed creating virtual environment.
        pause
        exit /b 1
    )
)

:: Activate virtual environment and install packages
echo [INFO] Activating virtual environment...
call .venv\Scripts\activate.bat

echo [INFO] Verifying and installing dependencies from requirements.txt...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed installing python packages.
    pause
    exit /b 1
)

:: Launch the browser automatically
echo [INFO] Starting browser dashboard...
start http://127.0.0.1:8000

:: Run the FastAPI application
echo [INFO] Launching FastAPI Web Server...
echo.
python main.py

pause
