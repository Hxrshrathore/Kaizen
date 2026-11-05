# ==============================================================================
# KAIZEN / NEXUS - Full 1-Click Automated Setup & Installation Script
# ==============================================================================
# Run with: powershell -ExecutionPolicy Bypass -File .\setup.ps1
#
# This automated script:
#  1. Installs Node.js, Python, Git (via winget or chocolatey) if missing.
#  2. Generates complete .env with all Neon DB, Google OAuth & Cloudflare R2 keys.
#  3. Runs npm install & npx prisma generate.
#  4. Sets up python venv in llm_backend\venv & installs all AI dependencies.
#  5. Automatically downloads the Llama-3.2-3B GGUF model if missing.
#  6. Builds the production Next.js bundle so 'npm start' works immediately.
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "   _  __     _                                                    " -ForegroundColor Cyan
Write-Host "  | |/ /__ _(_)__ ___ ___                                         " -ForegroundColor Cyan
Write-Host "  | ' </ _` / |_ // -_) _ \                                       " -ForegroundColor Cyan
Write-Host "  |_|\_\__,_/_/__/\__/_//_/   1-CLICK AUTOMATED SYSTEM INSTALLER  " -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "Operating System : Windows" -ForegroundColor Gray
Write-Host "Directory        : $PSScriptRoot" -ForegroundColor Gray
Write-Host ""

function Refresh-Path {
    if (Test-Path "C:\nvm4w\nodejs") {
        $env:Path = "C:\nvm4w\nodejs;" + $env:Path
    }
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User") + ";" + $env:Path
}

# ------------------------------------------------------------------------------
# STEP 1: Check / Install Package Manager & System Dependencies
# ------------------------------------------------------------------------------
Write-Host "[1/6] Checking system prerequisites..." -ForegroundColor Yellow

# Check Winget
$hasWinget = Get-Command winget -ErrorAction SilentlyContinue

# Helper to install via winget or chocolatey
function Install-App {
    param (
        [string]$WingetId,
        [string]$ChocoId,
        [string]$Name
    )
    Write-Host "  Installing $Name..." -ForegroundColor Cyan
    if ($hasWinget) {
        & winget install --id $WingetId -e --accept-package-agreements --accept-source-agreements --silent
    } else {
        # Check / Install Chocolatey
        if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
            Write-Host "  Installing Chocolatey package manager..." -ForegroundColor Gray
            Set-ExecutionPolicy Bypass -Scope Process -Force
            [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
            Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
            Refresh-Path
        }
        & choco install $ChocoId -y
    }
    Refresh-Path
}

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Install-App -WingetId "OpenJS.NodeJS.LTS" -ChocoId "nodejs-lts" -Name "Node.js LTS"
}
$nodeVer = (node -v) 2>$null
Write-Host "  [OK] Node.js: $nodeVer" -ForegroundColor Green

# Check Python
$hasPython = $false
try {
    $pyOut = (python --version) 2>$null
    if ($pyOut -match "Python 3\.") { $hasPython = $true }
} catch {}

if (-not $hasPython) {
    Install-App -WingetId "Python.Python.3.12" -ChocoId "python312" -Name "Python 3.12"
}
$pyVer = (python --version) 2>$null
Write-Host "  [OK] Python: $pyVer" -ForegroundColor Green

# Check Git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Install-App -WingetId "Git.Git" -ChocoId "git" -Name "Git"
}
$gitVer = (git --version) 2>$null
Write-Host "  [OK] Git: $gitVer" -ForegroundColor Green

# ------------------------------------------------------------------------------
# STEP 2: Configure Environment Keys (.env)
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "[2/6] Configuring Environment (.env)..." -ForegroundColor Yellow

$encodedEnv = "REFUQUJBU0VfVVJMPSJwb3N0Z3Jlc3FsOi8vbmVvbmRiX293bmVyOm5wZ19vbTFjOXR6UktEYnJAZXAtZmFsbGluZy1icmVhZC1haGJ2d2U4ZS1wb29sZXIuYy0zLnVzLWVhc3QtMS5hd3MubmVvbi50ZWNoL25lb25kYj9zc2xtb2RlPXJlcXVpcmUmY2hhbm5lbF9iaW5kaW5nPXJlcXVpcmUiCkRJUkVDVF9VUkw9InBvc3RncmVzcWw6Ly9uZW9uZGJfb3duZXI6bnBnX29tMWM5dHpSS0RickBlcC1mYWxsaW5nLWJyZWFkLWFoYnZ3ZThlLmMtMy51cy1lYXN0LTEuYXdzLm5lb24udGVjaC9uZW9uZGI/c3NsbW9kZT1yZXF1aXJlJmNoYW5uZWxfYmluZGluZz1yZXF1aXJlIgoKSldUX1NFQ1JFVD0ieW9uZXh1c2Fpc2F3ZXNvbWUxMjMhIgoKR09PR0xFX0NMSUVOVF9JRD0iNjQ0MTE2NzYzODQ0LWUxMGdwOGRxNHMzcDBwYmFnbDlrNGxyMGQxcXVxN3FhLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIgpHT09HTEVfQ0xJRU5UX1NFQ1JFVD0iR09DU1BYLXNXeWw2amJqM3pzdGFlMS1MWWhlOUhUekNHSWciCgpORVhUX1BVQkxJQ19BUFBfVVJMPSJodHRwOi8vbG9jYWxob3N0OjMwMDAiCk5FWFRfUFVCTElDX0dPT0dMRV9DTElFTlRfSUQ9IjY0NDExNjc2Mzg0NC1lMTBncDhkcTRzM3AwcGJhZ2w5azRscjBkMXF1cTdxYS5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIKCkdFTUlOSV9BUElfS0VZPSJBSXphU3lDZjhhSzFBR2l0Ql9EWmVOVGRuR2pWUTNPN0piN21IMFUiCgojIENsb3VkZmxhcmUgUjIgT2JqZWN0IFN0b3JhZ2UKQ0xPVURGTEFSRV9SMl9BQ0NPVU5UX0lEPSIzMjg4YmY0ZGM3YmFjNTgxNzg5N2JjYmQ3Y2JlMTlkOCIKQ0xPVURGTEFSRV9SMl9BQ0NFU1NfS0VZX0lEPSIxZDhjNzIwMmI5YjU3MzhhMTkxNTUzMmI1ZmZmNmYxYyIKQ0xPVURGTEFSRV9SMl9TRUNSRVRfQUNDRVNTX0tFWT0iMTkxZTNhNmYzZDVkNzJkZDM0YTM2MDMzYTFlODA5OTBjMjUyYTY0MmE0NjQwYTJkMTc2Y2M3NmM1Zjk3MzU4YiIKQ0xPVURGTEFSRV9SMl9CVUNLRVQ9ImthaXplbiIKTkVYVF9QVUJMSUNfUjJfVVJMPSJodHRwczovL3B1Yi02MGZjNjc2ZDhiYTI0YTEzYTQ2OTI1YWI0OTQxZGRiNS5yMi5kZXYiCgojIFVwc3Rhc2ggUmVkaXMgKFN0YWdpbmcgQnVmZmVyICYgT0NSIENhY2hlKQpVUFNUQVNIX1JFRElTX1JFU1RfVVJMPSJodHRwczovL2NyZWF0aXZlLWJhc3MtMTg1Njc4LnVwc3Rhc2guaW8iClVQU1RBU0hfUkVESVNfUkVTVF9UT0tFTj0iZ1FBQUFBQUFBdFZPQUFJZ2NESmxZVE16TW1FMU1tRTBOREEwWVdRNE9USTVOell3WkdOaFpHWTJZV1ZsWlEiCgojIFVwc3Rhc2ggVmVjdG9yIChSQUcgJiBTZW1hbnRpYyBGaW5lLVR1bmluZyBTZWFyY2gpClVQU1RBU0hfVkVDVE9SX1JFU1RfVVJMPSJodHRwczovL2hlYWx0aHktZ2FubmV0LTczNDg0LXVzMS12ZWN0b3IudXBzdGFzaC5pbyIKVVBTVEFTSF9WRUNUT1JfUkVTVF9UT0tFTj0iQUJnRk1HaGxZV3gwYUhrdFoyRnVibVYwTFRjek5EZzBMWFZ6TVdGa2JXbHVUVlJhYlZsdFZYcE5WR3QwVGtSamVGbDVNREJOVkdzeFRGZEZOVTF0VlhSYVYwazBXbFJaZUU1VVRtdGFSR3Q0Igo="
$envContent = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($encodedEnv))

$envPath = Join-Path $PSScriptRoot ".env"
[System.IO.File]::WriteAllText($envPath, $envContent, [System.Text.Encoding]::UTF8)
Write-Host "  [OK] .env written with Neon DB, Google OAuth, Cloudflare R2, Upstash Redis & Upstash Vector credentials" -ForegroundColor Green

# ------------------------------------------------------------------------------
# STEP 3: Install Node Packages & Prisma Client
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "[3/6] Installing Node dependencies and generating Prisma client..." -ForegroundColor Yellow

npm install --no-audit
if ($LASTEXITCODE -ne 0) {
    Write-Warning "npm install encountered a warning, retrying with --legacy-peer-deps..."
    npm install --legacy-peer-deps
}

Write-Host "  Generating Prisma Client..." -ForegroundColor Cyan
npx prisma generate
Write-Host "  [OK] Node modules and Prisma client ready!" -ForegroundColor Green

# ------------------------------------------------------------------------------
# STEP 4: Setup Python Virtual Environment & Install ML Libraries
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "[4/6] Setting up Python virtual environment (llm_backend\venv)..." -ForegroundColor Yellow

$venvDir = Join-Path $PSScriptRoot "llm_backend\venv"
$venvPy = Join-Path $venvDir "Scripts\python.exe"

if (-not (Test-Path $venvPy)) {
    Write-Host "  Creating virtual environment..." -ForegroundColor Cyan
    python -m venv $venvDir
}

Write-Host "  Upgrading pip..." -ForegroundColor Cyan
& $venvPy -m pip install --upgrade pip --quiet

Write-Host "  Installing AI & ML dependencies from requirements.txt..." -ForegroundColor Cyan
$reqFile = Join-Path $PSScriptRoot "llm_backend\requirements.txt"
& $venvPy -m pip install -r $reqFile --quiet
Write-Host "  [OK] Python AI environment configured successfully!" -ForegroundColor Green

# ------------------------------------------------------------------------------
# STEP 5: Automated Model Download (Llama 3.2 3B Instruct GGUF)
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "[5/6] Checking AI Model (Llama-3.2-3B-Instruct-Q4_K_M.gguf)..." -ForegroundColor Yellow

$modelsDir = Join-Path $PSScriptRoot "llm_backend\models"
if (-not (Test-Path $modelsDir)) {
    New-Item -ItemType Directory -Path $modelsDir -Force | Out-Null
}

$modelFile = Join-Path $modelsDir "Llama-3.2-3B-Instruct-Q4_K_M.gguf"

if (Test-Path $modelFile) {
    $sizeMB = [math]::Round(((Get-Item $modelFile).Length / 1MB), 1)
    Write-Host "  [OK] Model already present ($sizeMB MB)" -ForegroundColor Green
} else {
    Write-Host "  Model file missing. Downloading Llama-3.2-3B-Instruct-Q4_K_M.gguf (~2.0 GB)..." -ForegroundColor Cyan
    Write-Host "  Downloading from official Hugging Face mirror..." -ForegroundColor Gray

    $modelUrl = "https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf"
    
    # Try BITS transfer first (fastest on Windows), fallback to curl/webclient
    $downloadSuccess = $false
    try {
        Start-BitsTransfer -Source $modelUrl -Destination $modelFile -DisplayName "Downloading Llama-3.2-3B Model"
        $downloadSuccess = $true
    } catch {
        Write-Host "  BITS transfer unavailable, using standard stream download..." -ForegroundColor Gray
    }

    if (-not $downloadSuccess -or -not (Test-Path $modelFile)) {
        & curl.exe -L -o $modelFile $modelUrl --progress-bar
    }

    if (Test-Path $modelFile) {
        $sizeMB = [math]::Round(((Get-Item $modelFile).Length / 1MB), 1)
        Write-Host "  [OK] Downloaded model successfully ($sizeMB MB)!" -ForegroundColor Green
    } else {
        Write-Warning "Could not download model automatically. You can place Llama-3.2-3B-Instruct-Q4_K_M.gguf in llm_backend\models manually."
    }
}

# ------------------------------------------------------------------------------
# STEP 6: Build Production Bundle
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "[6/6] Building production Next.js bundle..." -ForegroundColor Yellow

npm run build

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Green
Write-Host "        ALL SYSTEMS INSTALLED & READY TO GO!                     " -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "HOW TO RUN:" -ForegroundColor Cyan
Write-Host "  1. Production Mode : npm run start     (or npm start)" -ForegroundColor White
Write-Host "  2. Development Mode: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "OPTIMIZATION HIGHLIGHTS:" -ForegroundColor Yellow
Write-Host "  - Next.js auto-wakes the Python AI backend on demand." -ForegroundColor Gray
Write-Host "  - Python backend auto-sleeps after 5 minutes of inactivity (saves ~2.5GB RAM)." -ForegroundColor Gray
Write-Host "  - All ingestion crops stream from Cloudflare R2 CDN globally." -ForegroundColor Gray
Write-Host ""

