@echo off
echo KARAM@2026@mira | scp -o StrictHostKeyChecking=no "%TEMP%\key_to_deploy.pub" root@178.105.209.59:/tmp/new_key.pub
