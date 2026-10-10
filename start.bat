@echo off
title 3D Diwali Greeting Web App
echo Starting 3D Diwali Greeting Server on http://localhost:8080 ...
powershell -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
pause
