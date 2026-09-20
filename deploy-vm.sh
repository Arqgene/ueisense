#!/bin/bash
# ==============================================================================
#  UveiSense - GCP Compute Engine 1-Click Bootstrap & Deploy Script
#  Target OS: Ubuntu 22.04 / 24.04 LTS
# ==============================================================================
set -e

echo "=================================================================="
echo "   🚀 UveiSense AI Clinical System - Production VM Setup"
echo "=================================================================="

# 1. Update system & install prerequisites (including Git LFS)
echo "[1/6] Installing Docker, Git, and Git LFS..."
sudo apt-get update -y
sudo apt-get install -y curl git git-lfs ca-certificates

# Install Git LFS hooks
git lfs install

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "[*] Installing Docker Engine..."
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker "$USER"
fi

# 2. Configure 2 GB Swap file to ensure PyTorch has sufficient memory headroom
if [ ! -f /swapfile ]; then
    echo "[2/6] Configuring 2 GB swap space for memory protection..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✅ Swap configured."
else
    echo "[2/6] Swap space already present."
fi

# 3. Verify Git LFS downloaded large model weights
echo "[3/6] Pulling Git LFS binary models..."
git lfs pull

MODEL_FILE="backend/models/best_model.pth"
if [ -f "$MODEL_FILE" ]; then
    FILE_SIZE=$(stat -c%s "$MODEL_FILE" 2>/dev/null || stat -f%z "$MODEL_FILE")
    echo "   Model found: $MODEL_FILE ($(( FILE_SIZE / 1024 / 1024 )) MB)"
    if [ "$FILE_SIZE" -lt 1000000 ]; then
        echo "⚠️ WARNING: $MODEL_FILE appears to be an LFS pointer rather than full weights."
        echo "   Running 'git lfs pull'..."
        git lfs pull
    fi
else
    echo "⚠️ Warning: $MODEL_FILE not found. If transferred via scp, place it in backend/models/."
fi

# 4. Build and start containers
echo "[4/6] Building and launching multi-service Docker container..."
sudo docker compose down 2>/dev/null || true
sudo docker compose up -d --build

# 5. Wait for application health check
echo "[5/6] Verifying deployment health..."
EXTERNAL_IP=$(curl -s -4 ifconfig.me || echo "your-server-ip")

echo "⏳ Waiting for API to respond on port 80..."
for i in $(seq 1 45); do
    if curl -s http://127.0.0.1/api/health | grep -q "uveitis-api-server"; then
        echo "✅ API is healthy and responding!"
        break
    fi
    sleep 2
done

# 6. Summary
echo ""
echo "=================================================================="
echo "🎉 DEPLOYMENT COMPLETE & ONLINE!"
echo "=================================================================="
echo "   🌐 Web Application UI:     http://${EXTERNAL_IP}"
echo "   🏥 Health Check:           http://${EXTERNAL_IP}/api/health"
echo "   📊 Patient Queue API:      http://${EXTERNAL_IP}/api/patients"
echo "   🧠 ML Predict Endpoint:    http://${EXTERNAL_IP}/api/predict"
echo ""
echo "   Useful Commands:"
echo "     - View logs:             sudo docker logs -f uveitis_system"
echo "     - Restart app:           sudo docker compose restart"
echo "     - Stop app:              sudo docker compose down"
echo "=================================================================="
