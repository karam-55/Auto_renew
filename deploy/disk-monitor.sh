#!/usr/bin/env bash
set -euo pipefail

# ============================================
# Disk space monitoring script
# Alerts when disk usage exceeds threshold
# ============================================

THRESHOLD=75
LOG_FILE="/var/log/auto-renew-cleanup.log"

# Get disk usage percentage (root partition)
USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

if [ "$USAGE" -ge "$THRESHOLD" ]; then
    echo "WARNING: Disk usage is ${USAGE}% (threshold: ${THRESHOLD}%) at $(date)" | tee -a "$LOG_FILE"
    # Here you could add notification (email, webhook, etc.)
    # Example: curl -X POST -d "Disk usage ${USAGE}%" YOUR_WEBHOOK_URL
fi
