# ─── Dockerfile.ml — Python FastAPI + PyTorch Inference Backend ───────────────
FROM python:3.10-slim

LABEL maintainer="Arqgene x Dr. Agarwal's Eye Hospital"
LABEL description="UEISense ML Backend — Neuro-Fuzzy + CNN Uveitis Prediction"

# System dependencies for OpenCV / PyTorch / Pillow
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libgomp1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies (CPU-only PyTorch + torchvision — lightweight)
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir \
    torch torchvision --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r backend/requirements.txt

COPY backend ./backend

ENV HOST=0.0.0.0
ENV PORT=8000
ENV MODEL_PATH=/app/backend/models/best_model.pth

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["python3", "backend/server.py"]
