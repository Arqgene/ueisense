#!/bin/bash
# ─── start.sh — Docker single-container entrypoint (legacy Dockerfile) ─────────
# Used when running the original monolithic Dockerfile (not docker-compose).
# For production, prefer: docker compose up

set -e

echo ""
echo "═══════════════════════════════════════════════════════"
echo "   UEISense — Uveitis AI Diagnosis System"
echo "   Arqgene × Dr. Agarwal's Eye Hospital"
echo "═══════════════════════════════════════════════════════"
echo ""

# ── 1. Start Python ML Backend ──────────────────────────────────────────────
echo "🧠 [1/2] Starting Python ML Backend (Neuro-Fuzzy + CNN) on port 8000..."
python3 backend/server.py &
ML_PID=$!

# Wait for ML backend to initialize
echo "    Waiting for ML backend to become ready..."
for i in $(seq 1 12); do
    if curl -sf http://127.0.0.1:8000/health >/dev/null 2>&1; then
        echo "    ✅ ML Backend ready at http://127.0.0.1:8000"
        break
    fi
    sleep 2
done

# ── 2. Start Node Express API + Serve dist/ ────────────────────────────────
echo ""
echo "🗄️  [2/2] Starting Node Express API + Static Host on port ${PORT:-80}..."
exec node server/index.js
