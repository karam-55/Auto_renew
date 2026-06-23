#!/bin/bash
# Setup cron job for Evolution API auto-reconnect
CRON_LINE='*/5 * * * * cd /opt/auto-renew && EVO_API_KEY=269Q0BWR4LN7FJCD1VKUY53MSGP8EOZX EVO_INSTANCE_NAME=garage_new node /opt/auto-renew/evolution-reconnect.js >> /var/log/evolution-reconnect-cron.log 2>&1'

# Remove old entries and add new one
(crontab -l 2>/dev/null | grep -v 'evolution-reconnect'; echo "$CRON_LINE") | crontab -

echo "Cron job installed:"
crontab -l | grep evolution-reconnect
