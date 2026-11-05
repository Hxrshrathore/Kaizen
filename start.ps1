# ==============================================================================
# KAIZEN / NEXUS - Quick Launcher Script
# ==============================================================================
# Usage:
#   .\start.ps1                   (Starts production server: npm run start)
#   .\start.ps1 -Dev              (Starts development server: npm run dev)
#   .\start.ps1 -RegenPipeline    (Runs full high-precision raw PDF ingestion pipeline)
#   .\start.ps1 -CleanOcr         (Wipes old OCR data, local crops, and Redis staging)
# ==============================================================================

param (
    [switch]$Dev,
    [switch]$RegenPipeline,
    [switch]$CleanOcr
)

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "               KAIZEN - ACADEMIC AI SUITE LAUNCHER                " -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

if (Test-Path "C:\nvm4w\nodejs") {
    $env:Path = "C:\nvm4w\nodejs;" + $env:Path
}

if (-not (Test-Path ".env")) {
    Write-Warning "No .env found! Running setup.ps1 first..."
    & .\setup.ps1
}

if ($CleanOcr) {
    Write-Host "Wiping old OCR database records and local crops..." -ForegroundColor Yellow
    npx tsx scripts/delete_old_ocr_data.ts
    exit 0
}

if ($RegenPipeline) {
    Write-Host "Launching Kaizen High-Precision OCR & R2 Pipeline on Raw Examination Papers..." -ForegroundColor Green
    .\llm_backend\venv\Scripts\python.exe scripts\regenerate_from_raw_pyqs.py
    exit 0
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

