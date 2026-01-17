#!/bin/bash
# Azure App Service Startup Script
# This script ensures proper initialization before starting the application

echo "=== BSG Demo Platform Startup ==="
echo "Timestamp: $(date)"
echo "Python version: $(python --version)"
echo "Working directory: $(pwd)"
echo ""

# Check if we're in the right directory
if [ ! -f "app/main.py" ]; then
    echo "ERROR: app/main.py not found!"
    echo "Current directory contents:"
    ls -la
    exit 1
fi

# Check if requirements are installed
echo "Checking Python packages..."
python -c "import fastapi, gunicorn, uvicorn" 2>&1
if [ $? -ne 0 ]; then
    echo "WARNING: Some required packages may be missing"
    echo "Installing requirements..."
    pip install -r requirements.txt --quiet
fi

# Verify gunicorn is available
if ! command -v gunicorn &> /dev/null; then
    echo "ERROR: gunicorn not found!"
    pip install gunicorn
fi

# Install kubectl if not available (needed for AKS namespace discovery)
if ! command -v kubectl &> /dev/null; then
    echo "Installing kubectl for AKS namespace discovery..."
    KUBECTL_VERSION=$(curl -L -s https://dl.k8s.io/release/stable.txt)
    curl -LO "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl"
    chmod +x kubectl
    mv kubectl /usr/local/bin/
    echo "✓ kubectl installed: $(kubectl version --client --short 2>/dev/null || echo 'installed')"
else
    echo "✓ kubectl already available: $(kubectl version --client --short 2>/dev/null || echo 'found')"
fi

echo ""
echo "Starting application with gunicorn..."
echo ""

# Azure App Service provides PORT environment variable
# Use it if available, otherwise default to 8000
PORT=${PORT:-8000}
echo "Using port: $PORT"
echo ""

# Start gunicorn with uvicorn workers
# Note: Azure App Service automatically sets PORT, but we bind to 0.0.0.0:PORT
exec gunicorn app.main:app \
    --bind 0.0.0.0:${PORT} \
    --workers 2 \
    --worker-class uvicorn.workers.UvicornWorker \
    --timeout 120 \
    --access-logfile - \
    --error-logfile - \
    --log-level info \
    --preload
