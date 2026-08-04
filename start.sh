#!/bin/bash
set -e

echo "🚀 Starting Python PyTorch FastAPI Backend..."
python3 backend/server.py &

# Wait for Python backend to initialize
sleep 3

echo "🚀 Starting Node Express Database API & Web Host..."
exec node server/index.js
