# ==============================================================================
# KAIZEN / NEXUS - Quick Launcher Script
# ==============================================================================
# Usage:
#   .\start.ps1         (Starts production server: npm run start)
#   .\start.ps1 -Dev    (Starts development server: npm run dev)
# ==============================================================================

param (
    [switch]$Dev
)

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "               KAIZEN - ACADEMIC AI SUITE LAUNCHER                " -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

if (-not (Test-Path ".env")) {
    Write-Warning "No .env found! Running setup.ps1 first..."
    & .\setup.ps1
}

if ($Dev) {
    Write-Host "Starting Development Server on http://localhost:3000..." -ForegroundColor Green
    Write-Host "Python backend will auto-wake on demand and sleep when idle." -ForegroundColor Gray
    npm run dev
} else {
    Write-Host "Starting Production Server on http://localhost:3000..." -ForegroundColor Green
    Write-Host "Python backend will auto-wake on demand and sleep when idle." -ForegroundColor Gray
    npm start
}

