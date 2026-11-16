@echo off
title Tejapriyan Live World Model Node
color 0b

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0share-live-model.ps1"
if errorlevel 1 (
    echo.
    echo Tunnel launcher exited with an error.
)
pause
