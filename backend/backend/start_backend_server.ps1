Write-Host "Starting Backend API Server..." -ForegroundColor Green
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
$srcPath = Join-Path $scriptPath "src"

$env:PYTHONPATH = $srcPath
Set-Location $scriptPath

Write-Host "Setting Python path to: $env:PYTHONPATH" -ForegroundColor Yellow
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

python server.py
