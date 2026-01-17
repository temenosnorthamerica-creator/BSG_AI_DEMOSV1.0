#!/bin/bash
# Install kubectl in Azure App Service
# This script can be run as a startup command or via SSH

set -e

echo "Installing kubectl in Azure App Service..."

# Check if kubectl is already installed
if command -v kubectl &> /dev/null; then
    echo "kubectl is already installed"
    kubectl version --client
    exit 0
fi

# Create bin directory if it doesn't exist
mkdir -p /home/site/wwwroot/bin

# Download kubectl
KUBECTL_VERSION=$(curl -L -s https://dl.k8s.io/release/stable.txt)
KUBECTL_URL="https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl"

echo "Downloading kubectl ${KUBECTL_VERSION}..."
curl -LO "${KUBECTL_URL}"

# Make executable and move to bin directory
chmod +x kubectl
mv kubectl /home/site/wwwroot/bin/kubectl

# Add to PATH (for current session)
export PATH="/home/site/wwwroot/bin:${PATH}"

# Verify installation
if [ -f /home/site/wwwroot/bin/kubectl ]; then
    echo "kubectl installed successfully"
    /home/site/wwwroot/bin/kubectl version --client
else
    echo "ERROR: kubectl installation failed"
    exit 1
fi

echo ""
echo "To make kubectl available permanently, add this to your startup command:"
echo "export PATH=\"/home/site/wwwroot/bin:\${PATH}\" && <your-startup-command>"

