#!/usr/bin/env bash
set -euo pipefail

# ============================================
# Setup script for safe cleanup automation
# Run once on the server as root
# ============================================

echo "Setting up safe cleanup automation..."

# 1. Make cleanup script executable and install it
chmod +x /opt/auto-renew/deploy/cleanup.sh
ln -sf /opt/auto-renew/deploy/cleanup.sh /usr/local/bin/auto-renew-cleanup

# 2. Install logrotate config
ln -sf /opt/auto-renew/deploy/logrotate-auto-renew.conf /etc/logrotate.d/auto-renew

# 3. Install disk monitor
chmod +x /opt/auto-renew/deploy/disk-monitor.sh
ln -sf /opt/auto-renew/deploy/disk-monitor.sh /usr/local/bin/auto-renew-disk-monitor

# 4. Add cron jobs
# Cleanup: every Sunday at 3 AM
# Disk monitor: every hour
CLEANUP_CRON="0 3 * * 0 /usr/local/bin/auto-renew-cleanup"
MONITOR_CRON="0 * * * * /usr/local/bin/auto-renew-disk-monitor"

(crontab -l 2>/dev/null || true) | grep -v "auto-renew-" | (cat - && echo "$CLEANUP_CRON" && echo "$MONITOR_CRON") | crontab -

echo "Cleanup automation installed successfully."
echo "Cleanup schedule: Every Sunday at 3:00 AM"
echo "Disk monitor schedule: Every hour"
echo "Logs: /var/log/auto-renew-cleanup.log"
