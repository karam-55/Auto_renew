@echo off
echo KARAM@2026@mira | ssh -o StrictHostKeyChecking=no root@178.105.209.59 "mkdir -p /root/.ssh && chmod 700 /root/.ssh && cat /tmp/new_key.pub >> /root/.ssh/authorized_keys && chmod 600 /root/.ssh/authorized_keys && echo KEY_ENABLED && cat /root/.ssh/authorized_keys | wc -l" 2>&1
