# Infrastructure Setup

This directory contains scripts and configurations for deploying the BSG Demo Platform to Azure.

## Current Deployment: Azure Static Web Apps

**Frontend URL**: https://kind-beach-01c0a990f.3.azurestaticapps.net

**App Details:**
- **Name**: `bsg-demo-platform-4077`
- **Type**: Azure Static Web Apps (Free tier)
- **Location**: `eastus2`
- **Resource Group**: `bsg-demo-platform`

**Why Static Web Apps:**
- ✅ Free tier available (no quota restrictions)
- ✅ Automatic HTTPS and unique URL
- ✅ No SSH/policy restrictions
- ✅ Perfect for React frontend
- ✅ Auto-deployment from GitHub

## Azure VM Deployment (Alternative - Currently Blocked)

### Prerequisites

1. Azure CLI installed and logged in
2. SSH key pair generated (`~/.ssh/id_rsa_bsg_demo`)
3. GitHub repository with Actions enabled

### Step 1: Create Azure VM

```bash
cd infrastructure
chmod +x azure-vm-setup.sh
./azure-vm-setup.sh
```

This will:
- Create resource group `bsg-demo-platform` (if it doesn't exist)
- Create Ubuntu 22.04 VM `bsg-demo-platform-vm`
- Open ports 80 (HTTP) and 8000 (Backend API)
- Display VM IP address

### Step 2: Setup VM

SSH to the VM and run the setup script:

```bash
ssh -i ~/.ssh/id_rsa_bsg_demo azureuser@<VM_IP>
```

On the VM:

```bash
curl -fsSL https://raw.githubusercontent.com/georgasa/bsg-demo-platform/develop/infrastructure/vm-setup.sh | bash
```

Or manually:

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python 3.11
sudo apt-get install -y python3.11 python3.11-venv python3-pip

# Install nginx
sudo apt-get install -y nginx

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Create directories
mkdir -p ~/bsg-demo-platform/{frontend/dist,backend,logs}

# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 8000/tcp
sudo ufw --force enable
```

### Step 3: Configure GitHub Secrets

Go to GitHub repository → Settings → Secrets and variables → Actions

Add the following secrets:

1. **AZURE_CREDENTIALS** (Service Principal JSON):
   ```bash
   az ad sp create-for-rbac --name "bsg-demo-platform-github" --role contributor --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/bsg-demo-platform --sdk-auth
   ```

2. **VM_SSH_PRIVATE_KEY** (SSH private key):
   ```bash
   cat ~/.ssh/id_rsa_bsg_demo
   ```
   Copy the entire output including `-----BEGIN` and `-----END` lines

3. **AZURE_SUBSCRIPTION_ID**:
   ```bash
   az account show --query id -o tsv
   ```

### Step 4: Deploy

Push to `develop` branch or manually trigger the workflow:

```bash
git checkout develop
git push origin develop
```

The GitHub Actions workflow will:
1. Build frontend
2. Install backend dependencies
3. Deploy to VM via SSH
4. Configure nginx
5. Start backend service
6. Run health checks

## Access URLs

After deployment:

- **Frontend**: http://<VM_IP>
- **Backend API**: http://<VM_IP>/api/v1
- **API Docs**: http://<VM_IP>/docs
- **Health Check**: http://<VM_IP>/api/v1/health

## VM Management

### SSH to VM
```bash
ssh -i ~/.ssh/id_rsa_bsg_demo azureuser@<VM_IP>
```

### Check Backend Service
```bash
sudo systemctl status bsg-backend
sudo systemctl logs bsg-backend -f
```

### Check Nginx
```bash
sudo systemctl status nginx
sudo nginx -t
```

### Restart Services
```bash
sudo systemctl restart bsg-backend
sudo systemctl restart nginx
```

## Troubleshooting

### VM IP Address
```bash
az vm show -d -g bsg-demo-platform -n bsg-demo-platform-vm --query publicIps -o tsv
```

### View VM Logs
```bash
az vm get-instance-view -g bsg-demo-platform -n bsg-demo-platform-vm --query instanceView.statuses
```

### Delete VM (if needed)
```bash
az vm delete --resource-group bsg-demo-platform --name bsg-demo-platform-vm --yes
```

