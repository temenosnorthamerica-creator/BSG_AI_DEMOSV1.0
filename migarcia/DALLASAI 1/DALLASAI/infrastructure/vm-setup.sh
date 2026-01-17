#!/bin/bash
# VM Initial Setup Script
# Run this script ON THE VM after it's created

set -e

echo "=========================================="
echo "  BSG Demo Platform - VM Setup"
echo "=========================================="
echo ""

# Update system
echo "Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 20
echo "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python 3.11
echo "Installing Python 3.11..."
sudo apt-get install -y python3.11 python3.11-venv python3-pip

# Install nginx
echo "Installing nginx..."
sudo apt-get install -y nginx

# Install Azure CLI (for future use)
echo "Installing Azure CLI..."
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Install kubectl (for AKS pod discovery)
echo "Installing kubectl..."
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
rm kubectl

# Create application directory
echo "Creating application directory..."
mkdir -p ~/bsg-demo-platform/{frontend/dist,backend,logs}

# Setup nginx
echo "Configuring nginx..."
sudo systemctl enable nginx
sudo systemctl start nginx

# Setup firewall
echo "Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 8000/tcp
sudo ufw --force enable

echo ""
echo "=========================================="
echo "  VM Setup Complete"
echo "=========================================="
echo ""
echo "Installed:"
echo "  - Node.js $(node --version)"
echo "  - Python $(python3 --version)"
echo "  - nginx $(nginx -v 2>&1)"
echo "  - kubectl $(kubectl version --client --short)"
echo ""
echo "VM is ready for deployment!"
echo "The GitHub Actions workflow will deploy the application automatically."

