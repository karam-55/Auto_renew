#!/bin/bash
# Docker cleanup script - runs weekly
set -e

LOG_FILE=/var/log/auto-renew-cleanup.log
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$TIMESTAMP] Starting Docker cleanup..." >> "$LOG_FILE"

# Remove stopped containers, unused networks, dangling images, build cache
docker container prune -f >> "$LOG_FILE" 2>&1
docker network prune -f >> "$LOG_FILE" 2>&1
docker image prune -f >> "$LOG_FILE" 2>&1
docker buildx prune -f >> "$LOG_FILE" 2>&1

# Remove unused volumes (only dangling, not mounted)
docker volume prune -f >> "$LOG_FILE" 2>&1

# Clean old Docker logs from /var/lib/docker/containers
find /var/lib/docker/containers -type f -name '*.log' -size +100M -exec sh -c 'cat /dev/null > "$1"' _ {} \; 2>/dev/null || true

# Report disk usage after cleanup
DF_PCT=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')
echo "[$TIMESTAMP] Cleanup done. Root disk usage: ${DF_PCT}%" >> "$LOG_FILE"
