# HiIntelligence Local Runner Script
# This script launches the HiIntelligence backend and frontend projects locally.
# It automatically sets up the backend to fall back to SQLite if PostgreSQL is not available,
# and starts both development servers concurrently.

$ErrorActionPreference = "Stop"

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "         HiIntelligence Local Runner Script             " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

# Check for .NET SDK
try {
    $dotnetVer = & "dotnet" --version
    Write-Host "[OK] .NET SDK is installed: $dotnetVer" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] .NET SDK is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install the .NET 9.0 SDK: https://dotnet.microsoft.com/download" -ForegroundColor Yellow
    exit 1
}

# Check for Node.js
try {
    $nodeVer = & "node" -v
    Write-Host "[OK] Node.js is installed: $nodeVer" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install Node.js (v18+): https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check backend directory
$BackendDir = Join-Path $PSScriptRoot "backend\HiIntelligence.Api"
if (-not (Test-Path $BackendDir)) {
    Write-Host "[ERROR] Backend directory not found at $BackendDir" -ForegroundColor Red
    exit 1
}

# Check frontend directory
$FrontendDir = Join-Path $PSScriptRoot "frontend"
if (-not (Test-Path $FrontendDir)) {
    Write-Host "[ERROR] Frontend directory not found at $FrontendDir" -ForegroundColor Red
    exit 1
}

# Install Frontend dependencies
Write-Host "`n[1/3] Installing frontend dependencies..." -ForegroundColor Yellow
Push-Location $FrontendDir
try {
    & npm install
    Write-Host "[OK] Frontend dependencies installed successfully." -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to install frontend dependencies." -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location

# Build Backend
Write-Host "`n[2/3] Building backend project..." -ForegroundColor Yellow
Push-Location $BackendDir
try {
    & dotnet build
    Write-Host "[OK] Backend build completed successfully." -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Backend build failed." -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location

# Run services
Write-Host "`n[3/3] Launching servers..." -ForegroundColor Yellow
Write-Host "Starting API on http://localhost:5000" -ForegroundColor Cyan
Write-Host "Starting Frontend on http://localhost:3000 (or first available port)" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to terminate both servers." -ForegroundColor Yellow

$apiJob = Start-Process dotnet -ArgumentList "run --project `"$BackendDir`"" -NoNewWindow -PassThru
$uiJob = Start-Process npm -ArgumentList "run dev" -WorkingDirectory $FrontendDir -NoNewWindow -PassThru

# Monitor jobs
try {
    while ($true) {
        if ($apiJob.HasExited) {
            Write-Host "[WARNING] API process terminated unexpectedly." -ForegroundColor Red
            break
        }
        if ($uiJob.HasExited) {
            Write-Host "[WARNING] Frontend process terminated unexpectedly." -ForegroundColor Red
            break
        }
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host "`nStopping servers..." -ForegroundColor Yellow
    if (-not $apiJob.HasExited) {
        $apiJob | Stop-Process -Force
    }
    if (-not $uiJob.HasExited) {
        $uiJob | Stop-Process -Force
    }
    Write-Host "Done." -ForegroundColor Green
}
