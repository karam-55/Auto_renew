# Docker Desktop Check and Setup Script for Garage Go 2.0
# This script checks if Docker Desktop is running and starts required services

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Garage Go 2.0 - Docker Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if Docker is running
function Test-DockerRunning {
    try {
        $dockerInfo = docker info 2>&1
        if ($LASTEXITCODE -eq 0) {
            return $true
        }
        return $false
    }
    catch {
        return $false
    }
}

# Check if Docker Desktop is running
Write-Host "Checking if Docker Desktop is running..." -ForegroundColor Yellow
if (Test-DockerRunning) {
    Write-Host "✓ Docker Desktop is running" -ForegroundColor Green
}
else {
    Write-Host "✗ Docker Desktop is NOT running" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please follow these steps to start Docker Desktop:" -ForegroundColor Yellow
    Write-Host "1. Open Docker Desktop from your Start menu or desktop shortcut" -ForegroundColor White
    Write-Host "2. Wait for Docker to fully start (you'll see the whale icon in your system tray)" -ForegroundColor White
    Write-Host "3. Once Docker is running, run this script again" -ForegroundColor White
    Write-Host ""
    Write-Host "Press any key to exit..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host ""

# Navigate to project root
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $projectRoot

Write-Host "Project directory: $projectRoot" -ForegroundColor Cyan
Write-Host ""

# Start required Docker services
Write-Host "Starting required Docker services..." -ForegroundColor Yellow
Write-Host "Services: PostgreSQL, Redis, MinIO" -ForegroundColor White
Write-Host ""

try {
    docker-compose up -d postgres redis minio
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Docker services started successfully" -ForegroundColor Green
    }
    else {
        Write-Host "✗ Failed to start Docker services" -ForegroundColor Red
        Write-Host "Check docker-compose.yml for configuration errors" -ForegroundColor Yellow
        exit 1
    }
}
catch {
    Write-Host "✗ Error starting Docker services: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Wait for services to be ready
Write-Host "Waiting for services to be ready (15 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Run Prisma migrations
Write-Host "Running Prisma migrations..." -ForegroundColor Yellow
Set-Location backend
try {
    # Use migrate deploy instead of migrate dev for non-interactive mode
    npx prisma migrate deploy
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Database migrations completed successfully" -ForegroundColor Green
    }
    else {
        Write-Host "⚠ Migration had some issues, trying reset..." -ForegroundColor Yellow
        # Try reset if deploy fails
        npx prisma migrate reset --force --skip-generate
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Database reset and migrations completed successfully" -ForegroundColor Green
        }
        else {
            Write-Host "⚠ Migration reset had issues" -ForegroundColor Yellow
        }
    }
}
catch {
    Write-Host "⚠ Migration error: $_" -ForegroundColor Yellow
    Write-Host "Continuing anyway..." -ForegroundColor Yellow
}

Write-Host ""

# Run database seed if available
Write-Host "Checking for database seed file..." -ForegroundColor Yellow
$seedFile = "prisma/seed.ts"
if (Test-Path $seedFile) {
    Write-Host "Running database seed..." -ForegroundColor Yellow
    try {
        npx prisma db seed
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Database seeded successfully" -ForegroundColor Green
        }
        else {
            Write-Host "⚠ Seed had some issues" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "⚠ Seed error: $_" -ForegroundColor Yellow
    }
}
else {
    Write-Host "No seed file found, skipping seed" -ForegroundColor Cyan
}

Write-Host ""

# Return to project root
Set-Location $projectRoot

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services status:" -ForegroundColor Yellow
docker-compose ps postgres redis minio
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start the backend: cd backend && npm start" -ForegroundColor White
Write-Host "2. Start the admin frontend: cd admin_frontend && flutter run -d chrome" -ForegroundColor White
Write-Host "3. Start the mechanic app: cd mechanic_app && flutter run" -ForegroundColor White
Write-Host ""
Write-Host "For communication, use WhatsApp or phone - NO EMAILS" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
