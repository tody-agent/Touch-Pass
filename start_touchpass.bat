@echo off
title TouchPass Desktop App

cd /d "%~dp0"

set "TAURI_EXE="
if exist "software\desktop-app\src-tauri\target\release\touchpass-desktop.exe" (
    set "TAURI_EXE=software\desktop-app\src-tauri\target\release\touchpass-desktop.exe"
) else if exist "software\desktop-app\src-tauri\target\debug\touchpass-desktop.exe" (
    set "TAURI_EXE=software\desktop-app\src-tauri\target\debug\touchpass-desktop.exe"
)

if not "%TAURI_EXE%"=="" (
    echo [TouchPass] Starting native Tauri desktop app...
    echo [TouchPass] Binary: %TAURI_EXE%
    start "TouchPass" "%TAURI_EXE%" %*
    exit /b 0
)

echo.
echo ========================================================
echo  ERROR: Native TouchPass desktop app is not built.
echo ========================================================
echo  Build it from the repository root with:
echo.
echo    cd software\desktop-app
echo    npm install
echo    npm run tauri:build
echo.
echo  The legacy web portal was not started automatically.
echo ========================================================
echo.
pause
exit /b 1
