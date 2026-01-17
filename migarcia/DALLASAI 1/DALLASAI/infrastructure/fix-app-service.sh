#!/bin/bash
# Fix Azure App Service deployment issues

APP_NAME="bsg-demo-platform-app"
RESOURCE_GROUP="bsg-demo-platform"

echo "=== Fixing Azure App Service ==="

# 1. Ensure Always On is enabled
echo "1. Enabling Always On..."
az webapp config set \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --always-on true \
    --output none

# 2. Set correct startup command
echo "2. Setting startup command..."
az webapp config set \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --startup-file "gunicorn app.main:app --bind 0.0.0.0:8000 --workers 2 --worker-class uvicorn.workers.UvicornWorker --timeout 120 --access-logfile - --error-logfile -" \
    --output none

# 3. Set Python version
echo "3. Setting Python version..."
az webapp config set \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --linux-fx-version "PYTHON|3.11" \
    --output none

# 4. Restart the app
echo "4. Restarting app..."
az webapp restart \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --output none

echo "=== Fix complete ==="
echo "Waiting 30 seconds for app to start..."
sleep 30

# Test health endpoint
echo "Testing health endpoint..."
curl -f https://$APP_NAME.azurewebsites.net/api/v1/health || echo "Health check failed - check logs"

