@echo off
echo KARAM@2026@mira | ssh -i "%USERPROFILE%\.ssh\hetzner_deployer" -o StrictHostKeyChecking=no root@178.105.209.59 "sed -i 's/^#*PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config && sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config && systemctl restart sshd && echo PASSWORD_AUTH_DISABLED" 2>&1
