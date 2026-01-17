#!/bin/bash
# Setup GitHub Secrets for Azure App Service Deployment
# This script creates an Azure Service Principal and outputs the credentials
# that need to be added to GitHub Secrets

set -e

RESOURCE_GROUP="bsg-demo-platform"
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
SP_NAME="bsg-demo-platform-github-actions"

echo "=========================================="
echo "Azure GitHub Actions Setup"
echo "=========================================="
echo ""
echo "Subscription ID: $SUBSCRIPTION_ID"
echo "Resource Group: $RESOURCE_GROUP"
echo "Service Principal Name: $SP_NAME"
echo ""

# Check if service principal already exists
EXISTING_SP=$(az ad sp list --display-name "$SP_NAME" --query "[0].appId" -o tsv 2>/dev/null || echo "")

if [ -n "$EXISTING_SP" ]; then
    echo "⚠️  Service Principal '$SP_NAME' already exists."
    read -p "Do you want to delete and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Deleting existing service principal..."
        az ad sp delete --id "$EXISTING_SP" || true
    else
        echo "Using existing service principal..."
        az ad sp credential reset --id "$EXISTING_SP" --append
        CREDS=$(az ad sp create-for-rbac --name "$SP_NAME" --role contributor \
            --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP" \
            --sdk-auth 2>/dev/null || echo "")
    fi
fi

if [ -z "$EXISTING_SP" ] || [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Creating new Service Principal..."
    CREDS=$(az ad sp create-for-rbac --name "$SP_NAME" \
        --role contributor \
        --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP" \
        --sdk-auth)
fi

echo ""
echo "=========================================="
echo "✅ Service Principal Created Successfully"
echo "=========================================="
echo ""
echo "Copy the JSON below and add it to GitHub Secrets:"
echo ""
echo "1. Go to: https://github.com/georgasa/bsg-demo-platform/settings/secrets/actions"
echo "2. Click 'New repository secret'"
echo "3. Name: AZURE_CREDENTIALS"
echo "4. Value: (paste the JSON below)"
echo ""
echo "--- START COPY ---"
echo "$CREDS"
echo "--- END COPY ---"
echo ""
echo "=========================================="
echo "Additional Secrets (if needed):"
echo "=========================================="
echo ""
echo "AZURE_SUBSCRIPTION_ID: $SUBSCRIPTION_ID"
echo "AZURE_RESOURCE_GROUP: $RESOURCE_GROUP"
echo ""

