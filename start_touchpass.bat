@echo off
title TouchPass Local Helper Launcher
echo Starting TouchPass Web Portal...
start http://127.0.0.1:8787/
where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    python run_portal_win.py
) else (
    echo Python environment not found in PATH!
    echo Please install Python 3 or add Python to system PATH.
    pause
)

