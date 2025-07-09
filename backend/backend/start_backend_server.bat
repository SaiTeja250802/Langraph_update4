@echo off
echo Starting Backend API Server...
echo.

set PYTHONPATH=%~dp0src
cd /d "%~dp0"

echo Setting Python path to: %PYTHONPATH%
echo Current directory: %CD%

python server.py
