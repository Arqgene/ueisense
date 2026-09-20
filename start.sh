#!/bin/bash
set -e

echo "🚀 Starting Python PyTorch FastAPI Backend on 127.0.0.1:8000..."
python3 backend/server.py &
FASTAPI_PID=$!

echo "⏳ Waiting for Python FastAPI ML backend to be responsive..."
for i in $(seq 1 30); do
  if curl -s http://127.0.0.1:8000/docs > /dev/null 2>&1; then
    echo "✅ Python FastAPI ML Backend is up and ready! (attempt $i)"
    break
  fi
  sleep 1
done

echo "🚀 Starting Node Express Database API & Web Host on Port 80..."
exec node server/index.js
