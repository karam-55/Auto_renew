#!/usr/bin/env bash
set -euo pipefail

# ============================================
# SAFE SERVER CLEANUP SCRIPT
# Auto Renew Production Server
# ============================================
# This script cleans temporary files WITHOUT deleting:
#   - Docker volumes (database data)
#   - .env files
#   - Running containers
#   - Important backups
# ============================================

LOG_FILE="/var/log/auto-renew-cleanup.log"
exec >> "$LOG_FILE" 2>&1

echo "=========================================="
echo "Cleanup started at $(date)"
echo "=========================================="

# Show disk usage before
echo "Disk usage BEFORE cleanup:"
df -h /

# 1. Clean package manager caches (safe)
echo "Cleaning apt cache..."
apt-get clean || true
apt-get autoremove -y || true

# 2. Clean npm cache (safe - downloads are re-fetchable)
echo "Cleaning npm cache..."
npm cache clean --force || true

# 3. Remove old log files (keep last 7 days)
echo "Rotating and cleaning logs older than 7 days..."
find /var/log -type f -name "*.log" -mtime +7 -delete || true
find /var/log -type f -name "*.log.*" -mtime +7 -delete || true

# 4. Clean Docker build cache (safe - rebuildable)
echo "Cleaning Docker build cache..."
docker builder prune -f || true

# 5. Remove dangling Docker images (not used by any container)
echo "Removing dangling Docker images..."
docker image prune -f || true

# 6. Remove stopped containers only (NOT running ones)
echo "Removing stopped containers..."
docker container prune -f || true

# 7. Remove unused Docker networks
echo "Removing unused Docker networks..."
docker network prune -f || true

# 8. Clean temporary files (safe)
echo "Cleaning temporary files..."
find /tmp -type f -atime +3 -delete || true
find /var/tmp -type f -atime +3 -delete || true

# 9. Clean old Docker logs inside containers (via journald if available)
echo "Cleaning journal logs older than 7 days..."
journalctl --vacuum-time=7d || true

# Show disk usage after
echo "Disk usage AFTER cleanup:"
df -h /

echo "Cleanup finished at $(date)"
echo "=========================================="
