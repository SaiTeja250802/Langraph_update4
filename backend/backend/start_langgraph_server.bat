@echo off
echo Starting LangGraph Development Server...
echo.

set PYTHONPATH=%~dp0src
cd /d "%~dp0"

echo Setting Python path to: %PYTHONPATH%
echo Current directory: %CD%

langgraph dev --port 8001
