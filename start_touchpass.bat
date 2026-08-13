@echo off
title TouchPass Local Helper Launcher
echo Starting TouchPass Web Portal...
start http://127.0.0.1:8787/
"C:\Users\block\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe" run_portal_win.py
pause
