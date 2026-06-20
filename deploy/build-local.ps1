# ============================================
# AUTO_Renew - Local Build Script (Windows)
# Run this BEFORE deploying to server
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Building AUTO_Renew for Production" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Build Backend
Write-Host "`n[1/3] Building Backend..." -ForegroundColor Yellow
cd ..\backend
npm install
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Backend build OK" -ForegroundColor Green

# 2. Verify Customer Frontend
Write-Host "`n[2/3] Verifying Customer Frontend..." -ForegroundColor Yellow
if (Test-Path "..\customer_frontend\index.html") {
    Write-Host "Customer Frontend OK" -ForegroundColor Green
} else {
    Write-Host "Customer frontend not found!" -ForegroundColor Red
    exit 1
}

# 3. Verify all required files exist
Write-Host "`n[3/3] Verifying deployment files..." -ForegroundColor Yellow

$required = @(
    "..\backend\Dockerfile",
    "..\backend\package.json",
    "..\customer_frontend\index.html",
    ".\docker-compose.prod.yml",
    ".\nginx.conf",
    ".\.env.production",
    ".\deploy.sh"
)

$allOk = $true
foreach ($file in $required) {
    if (Test-Path $file) {
        Write-Host "  OK: $file" -ForegroundColor Green
    } else {
        Write-Host "  MISSING: $file" -ForegroundColor Red
        $allOk = $false
    }
}

if ($allOk) {
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "  All builds successful!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "`nNext step: Copy files to server:" -ForegroundColor Cyan
    Write-Host "  scp -r deploy/ backend/ customer_frontend/ evolution-api-main/ root@YOUR_SERVER_IP:/opt/auto-renew/" -ForegroundColor White
    Write-Host "`nNote: Admin Frontend (Tauri Desktop) is NOT deployed to server." -ForegroundColor Yellow
    Write-Host "      It runs locally and connects to the server API." -ForegroundColor Yellow
} else {
    Write-Host "`nSome files are missing. Please fix before deploying." -ForegroundColor Red
}

Write-Host "`n"
