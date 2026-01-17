#!/bin/bash
# Azure VM Setup Script for BSG Demo Platform
# This script creates an Azure VM to host the application

set -e

RESOURCE_GROUP="bsg-demo-platform"
VM_NAME="bsg-demo-platform-vm"
LOCATION="eastus"
VM_SIZE="Standard_B2s"  # 2 vCPUs, 4GB RAM
VM_USERNAME="azureuser"
VM_IMAGE="Ubuntu2204"  # Ubuntu 22.04 LTS

echo "=========================================="
echo "  Azure VM Setup for BSG Demo Platform"
echo "=========================================="
echo ""

# Check if resource group exists
if ! az group show --name $RESOURCE_GROUP &>/dev/null; then
    echo "Creating resource group: $RESOURCE_GROUP"
    az group create --name $RESOURCE_GROUP --location $LOCATION
else
    echo "Resource group $RESOURCE_GROUP already exists"
fi

# Check if VM exists
if az vm show --resource-group $RESOURCE_GROUP --name $VM_NAME &>/dev/null; then
    echo "VM $VM_NAME already exists. Getting IP address..."
    VM_IP=$(az vm show -d -g $RESOURCE_GROUP -n $VM_NAME --query publicIps -o tsv)
    echo "VM IP: $VM_IP"
else
    echo "Creating VM: $VM_NAME"
    
    # Generate SSH key if it doesn't exist
    if [ ! -f ~/.ssh/id_rsa_bsg_demo ]; then
        echo "Generating SSH key..."
        ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa_bsg_demo -N "" -C "bsg-demo-platform"
    fi
    
    # Create VM
    az vm create \
        --resource-group $RESOURCE_GROUP \
        --name $VM_NAME \
        --image $VM_IMAGE \
        --size $VM_SIZE \
        --admin-username $VM_USERNAME \
        --ssh-key-values ~/.ssh/id_rsa_bsg_demo.pub \
        --public-ip-sku Standard \
        --location $LOCATION \
        --os-disk-size-gb 64
    
    # Open ports
    echo "Opening ports 80 (HTTP) and 8000 (Backend API)..."
    az vm open-port --port 80 --resource-group $RESOURCE_GROUP --name $VM_NAME --priority 1000
    az vm open-port --port 8000 --resource-group $RESOURCE_GROUP --name $VM_NAME --priority 1001
    
    # Get VM IP
    VM_IP=$(az vm show -d -g $RESOURCE_GROUP -n $VM_NAME --query publicIps -o tsv)
    echo "VM created successfully!"
    echo "VM IP: $VM_IP"
fi

echo ""
echo "=========================================="
echo "  VM Setup Complete"
echo "=========================================="
echo ""
echo "VM Details:"
echo "  Name: $VM_NAME"
echo "  IP: $VM_IP"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Size: $VM_SIZE"
echo ""
echo "Next steps:"
echo "  1. SSH to VM: ssh -i ~/.ssh/id_rsa_bsg_demo $VM_USERNAME@$VM_IP"
echo "  2. Install dependencies on VM (run infrastructure/vm-setup.sh on VM)"
echo "  3. Configure GitHub Secrets:"
echo "     - AZURE_CREDENTIALS (service principal)"
echo "     - VM_SSH_PRIVATE_KEY (contents of ~/.ssh/id_rsa_bsg_demo)"
echo "  4. Push to develop branch to trigger deployment"
echo ""
echo "Frontend will be available at: http://$VM_IP"
echo "Backend API will be available at: http://$VM_IP/api/v1"

