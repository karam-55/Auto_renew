#!/bin/bash
set -e

# ============================================
# AUTO_Renew - Production Deployment Script
# For Ubuntu 22.04 on Hetzner
# ============================================

PROJECT_DIR="/opt/auto-renew"
REPO_URL=""
SERVER_IP=$(curl -s ifconfig.me)

echo "========================================"
echo "  AUTO_Renew - Production Deployment"
echo "  Server IP: $SERVER_IP"
echo "========================================"

# ============================================
# Step 1: System Update & Dependencies
# ============================================
echo "[1/9] Updating system and installing dependencies..."
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    nginx \
    certbot \
    python3-certbot-nginx \
    git \
    htop \
    ufw \
    fail2ban

# ============================================
# Step 2: Install Docker
# ============================================
echo "[2/9] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo usermod -aG docker $USER
    echo "Docker installed. You may need to logout and login again."
else
    echo "Docker already installed."
fi

# ============================================
# Step 3: Create Project Directory
# ============================================
echo "[3/9] Setting up project directory..."
sudo mkdir -p $PROJECT_DIR
sudo chown $USER:$USER $PROJECT_DIR

# ============================================
# Step 4: Setup Firewall
# ============================================
echo "[4/9] Configuring firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# ============================================
# Step 5: Configure Fail2Ban
# ============================================
echo "[5/9] Configuring Fail2Ban..."
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# ============================================
# Step 6: Clone / Copy Project
# ============================================
echo "[6/9] Setting up project files..."
# Note: If using git, uncomment below:
# git clone $REPO_URL $PROJECT_DIR
# Or manually copy files via SCP/rsync

# Create required directories
mkdir -p $PROJECT_DIR/deploy
mkdir -p $PROJECT_DIR/backend
mkdir -p $PROJECT_DIR/customer_frontend
mkdir -p $PROJECT_DIR/evolution-api-main/evolution-api-main

# ============================================
# Step 7: Generate Secrets
# ============================================
echo "[7/9] Generating secrets..."
if [ ! -f $PROJECT_DIR/deploy/.env ]; then
    echo "Creating .env file from template..."
    # Generate random passwords
    POSTGRES_PASS=$(openssl rand -base64 32)
    EVO_POSTGRES_PASS=$(openssl rand -base64 32)
    REDIS_PASS=$(openssl rand -base64 32)
    MINIO_PASS=$(openssl rand -base64 32)
    JWT_SECRET=$(openssl rand -base64 48)
    JWT_REFRESH=$(openssl rand -base64 48)
    EVO_API_KEY=$(openssl rand -hex 32 | tr '[:lower:]' '[:upper:]')

    cat > $PROJECT_DIR/deploy/.env <<EOF
POSTGRES_USER=garage_admin
POSTGRES_PASSWORD=$POSTGRES_PASS
POSTGRES_DB=garage_master
EVO_POSTGRES_DB=evolution_db
EVO_POSTGRES_USER=postgres
EVO_POSTGRES_PASSWORD=$EVO_POSTGRES_PASS
REDIS_PASSWORD=$REDIS_PASS
MINIO_ROOT_USER=garage_minio
MINIO_ROOT_PASSWORD=$MINIO_PASS
MINIO_BUCKET=garage-files
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH
CORS_ORIGIN=*
CUSTOMER_CORS_ORIGIN=*
MECHANIC_CORS_ORIGIN=*
EVO_API_KEY=$EVO_API_KEY
EVO_INSTANCE_NAME=garage
DEFAULT_TENANT_ID=default
SERVER_IP=$SERVER_IP
EOF
    echo "Generated .env with random secrets."
    echo "⚠️  IMPORTANT: Save these credentials securely!"
    echo ""
    echo "Evolution API Key: $EVO_API_KEY"
    echo ""
else
    echo ".env already exists. Skipping generation."
fi

# ============================================
# Step 8: Build & Deploy
# ============================================
echo "[8/9] Building and deploying..."
cd $PROJECT_DIR/deploy

# Build backend image
docker compose -f docker-compose.prod.yml build backend

# Start all services
docker compose -f docker-compose.prod.yml up -d

# Wait for database to be ready
echo "Waiting for database..."
sleep 10

# Run Prisma migrations
# Uncomment after first deploy when you have schema:
# docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
# docker compose -f docker-compose.prod.yml exec backend npx prisma db seed

# ============================================
# Step 9: Verify Deployment
# ============================================
echo "[9/9] Verifying deployment..."
sleep 5

echo ""
echo "========================================"
echo "  Deployment Complete!"
echo "========================================"
echo ""
echo "Services Status:"
docker compose -f docker-compose.prod.yml ps

echo ""
echo "Access Points:"
echo "  - Customer Portal: http://$SERVER_IP/customer"
echo "  - API:             http://$SERVER_IP/api"
echo "  - Evolution API:   http://$SERVER_IP:8081"
echo "  - MinIO Console:   http://$SERVER_IP:9001"
echo ""
echo "Desktop App:"
echo "  - Admin Panel (Tauri Desktop) connects to: http://$SERVER_IP/api"
echo ""
echo "Next Steps:"
echo "  1. Configure WhatsApp: http://$SERVER_IP:8081"
echo "  2. Create Evolution API instance"
echo "  3. Link WhatsApp number"
echo "  4. When ready, add domain and run: certbot --nginx"
echo ""
echo "To view logs: docker compose -f docker-compose.prod.yml logs -f"
echo "To stop:      docker compose -f docker-compose.prod.yml down"
echo ""
