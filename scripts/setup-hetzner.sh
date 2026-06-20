#!/bin/bash
# ============================================
# Garage Go 2.0 - Hetzner Server Setup Script
# Ubuntu 22.04
# ============================================

set -e

echo "🚗 Garage Go 2.0 - Hetzner Server Setup"
echo "========================================"
echo ""

# Update & Clean
echo "📦 Step 1: Update & Clean System..."
sudo apt update && sudo apt upgrade -y
sudo apt autoremove -y
sudo apt autoclean -y
echo "✅ System updated"
echo ""

# Remove old projects
echo "🗑️  Step 2: Remove Old Projects..."
sudo rm -rf /var/www/garage-go-old
sudo rm -rf /home/garage-old
echo "✅ Old projects removed"
echo ""

# Install Docker
echo "🐳 Step 3: Install Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo "✅ Docker installed"
else
    echo "✅ Docker already installed"
fi
echo ""

# Install Docker Compose
echo "🐳 Step 4: Install Docker Compose..."
if ! command -v docker &> /dev/null; then
    sudo apt install docker-compose-plugin -y
    echo "✅ Docker Compose installed"
else
    echo "✅ Docker Compose already installed"
fi
echo ""

# Install Node.js 20
echo "📦 Step 5: Install Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    echo "✅ Node.js 20 installed"
else
    echo "✅ Node.js already installed"
fi
echo ""

# Install PostgreSQL 16
echo "🐘 Step 6: Install PostgreSQL 16..."
if ! command -v psql &> /dev/null; then
    sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
    sudo apt update
    sudo apt install postgresql-16 -y
    echo "✅ PostgreSQL 16 installed"
else
    echo "✅ PostgreSQL already installed"
fi
echo ""

# Install Nginx
echo "🌐 Step 7: Install Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt install nginx -y
    echo "✅ Nginx installed"
else
    echo "✅ Nginx already installed"
fi
echo ""

# Install Redis
echo "🔴 Step 8: Install Redis..."
if ! command -v redis-server &> /dev/null; then
    sudo apt install redis-server -y
    sudo systemctl enable redis-server
    sudo systemctl start redis-server
    echo "✅ Redis installed"
else
    echo "✅ Redis already installed"
fi
echo ""

# Install Git
echo "📦 Step 9: Install Git..."
if ! command -v git &> /dev/null; then
    sudo apt install git -y
    echo "✅ Git installed"
else
    echo "✅ Git already installed"
fi
echo ""

# Install Certbot (for SSL)
echo "🔒 Step 10: Install Certbot..."
if ! command -v certbot &> /dev/null; then
    sudo apt install certbot python3-certbot-nginx -y
    echo "✅ Certbot installed"
else
    echo "✅ Certbot already installed"
fi
echo ""

# Create project directory
echo "📁 Step 11: Create Project Directory..."
sudo mkdir -p /var/www/garage-go
sudo chown -R $USER:$USER /var/www/garage-go
echo "✅ Project directory created: /var/www/garage-go"
echo ""

# Create logs directory
echo "📝 Step 12: Create Logs Directory..."
sudo mkdir -p /var/log/garage-go
sudo chown -R $USER:$USER /var/log/garage-go
echo "✅ Logs directory created"
echo ""

# Setup firewall (UFW)
echo "🔥 Step 13: Setup Firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
echo "✅ Firewall configured"
echo ""

# Install PM2 (for Node.js process management)
echo "⚡ Step 14: Install PM2..."
sudo npm install -g pm2
echo "✅ PM2 installed"
echo ""

echo "========================================"
echo "✅ Hetzner Server Setup Complete!"
echo "========================================"
echo ""
echo "Next Steps:"
echo "1. Clone the repository to /var/www/garage-go"
echo "2. Configure environment variables"
echo "3. Run docker-compose up -d"
echo "4. Configure SSL with certbot"
echo ""
