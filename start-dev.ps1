# ============================================================
#  Suraksha Web App Dev Startup Script
#  Usage: .\start-dev.ps1
# ============================================================

$ErrorActionPreference = 'SilentlyContinue'

$BACKEND  = "D:\Suraksha - Web App\backend"
$FRONTEND = "D:\Suraksha - Web App\frontend"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Suraksha Web Dev Launcher" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. Start PostgreSQL ──────────────────────────────────────
Write-Host "[1/3] Starting PostgreSQL..." -ForegroundColor Yellow
$pgBin  = "D:\PostgreSQL\pgsql\bin\pg_ctl.exe"
$pgData = "D:\OdooData\pgdata"
$pgLog  = "$env:TEMP\postgres.log"
if (Test-Path $pgBin) {
    & $pgBin start -D $pgData -l $pgLog 2>$null | Out-Null
    Start-Sleep -Seconds 2
    Write-Host "   PostgreSQL started." -ForegroundColor Green
} else {
    Write-Host "   pg_ctl not found — skipping" -ForegroundColor DarkGray
}

# ── 2. Start Backend ─────────────────────────────────────────
Write-Host "[2/3] Starting Backend on port 3001..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$BACKEND'; npm run dev" -WindowStyle Minimized
Start-Sleep -Seconds 3
Write-Host "   Backend started." -ForegroundColor Green

# ── 3. Start Frontend with --host ───────────────────────────
Write-Host "[3/3] Starting Frontend (accessible on network)..." -ForegroundColor Yellow
Write-Host ""

# Get local IP
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -ne '127.0.0.1' -and $_.PrefixOrigin -eq 'Dhcp' } | Select-Object -First 1).IPAddress

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Local   : http://localhost:5173" -ForegroundColor White
if ($localIP) {
    Write-Host "  Network : http://${localIP}:5173" -ForegroundColor White
    Write-Host "  (open this URL on mobile browser on same WiFi)" -ForegroundColor DarkGray
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $FRONTEND
npx vite --host
