@echo off
title TouchPass Desktop Helper & Launcher

cd /d "%~dp0"

echo [TouchPass] Checking Python installation...

set "PYTHON_CMD="
python --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set "PYTHON_CMD=python"
) else (
    py -3 --version >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        set "PYTHON_CMD=py -3"
    ) else (
        python3 --version >nul 2>&1
        if %ERRORLEVEL% EQU 0 (
            set "PYTHON_CMD=python3"
        )
    )
)

if "%PYTHON_CMD%"=="" (
    echo.
    echo ========================================================
    echo  ERROR: Python is not installed or not found in PATH!
    echo ========================================================
    echo  Please download and install Python 3.8 or higher from:
    echo  https://www.python.org/downloads/
    echo.
    echo  IMPORTANT: Make sure to check "Add Python to PATH"
    echo  during installation.
    echo ========================================================
    echo.
    pause
    exit /b 1
)

set "VENV_DIR=software\.venv"
set "VENV_PY=%VENV_DIR%\Scripts\python.exe"
set "REQ_FILE=software\requirements.txt"

if not exist "%VENV_DIR%" (
    echo [TouchPass] Creating virtual environment in %VENV_DIR%...
    %PYTHON_CMD% -m venv "%VENV_DIR%"
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment!
        pause
        exit /b 1
    )
    if exist "%REQ_FILE%" (
        echo [TouchPass] Installing dependencies from %REQ_FILE%...
        "%VENV_PY%" -m pip install -r "%REQ_FILE%"
        if errorlevel 1 (
            echo [WARNING] Failed to install dependencies.
        )
    )
)

if exist "%VENV_PY%" (
    set "RUN_PY=%VENV_PY%"
) else (
    set "RUN_PY=%PYTHON_CMD%"
)

echo [TouchPass] Starting Web Portal...
"%RUN_PY%" run_portal_win.py %*

if errorlevel 1 (
    echo.
    echo [ERROR] TouchPass Portal exited with error code %ERRORLEVEL%.
    pause
)


