# Deploy SSH key to remote server
$Server = "178.105.209.59"
$User = "root"
$Password = "KARAM@2026@mira"
$KeyPath = "$env:USERPROFILE\.ssh\hetzner_deployer.pub"

Write-Host "Reading public key from: $KeyPath"
$PublicKey = Get-Content $KeyPath -Raw

Write-Host "Connecting to $Server..."

# Method: Create a temporary script with the public key content
$TempScript = @"
#!/bin/bash
mkdir -p /root/.ssh
chmod 700 /root/.ssh

# Add the key if not already present
if ! grep -q "$($PublicKey.Trim())" /root/.ssh/authorized_keys 2>/dev/null; then
    echo "$($PublicKey.Trim())" >> /root/.ssh/authorized_keys
    chmod 600 /root/.ssh/authorized_keys
    echo "SSH_KEY_ADDED"
else
    echo "SSH_KEY_ALREADY_EXISTS"
fi

# Verify
ls -la /root/.ssh/
wc -l /root/.ssh/authorized_keys
"@

$TempLocalFile = "$env:TEMP\add_key_script.sh"
$TempScript | Out-File -FilePath $TempLocalFile -Encoding ASCII

# Now we need to copy and execute this on the remote server
# Use a different approach - echo the key directly via ssh
Write-Host "Adding SSH key to authorized_keys..."

# Create the command to add key
$RemoteCommand = @"
mkdir -p /root/.ssh && chmod 700 /root/.ssh && echo '$($PublicKey.Trim())' >> /root/.ssh/authorized_keys && chmod 600 /root/.ssh/authorized_keys && echo 'SUCCESS'
"@

Write-Host "Command prepared. Executing..."
