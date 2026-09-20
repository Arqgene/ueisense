# ── Stage 1: Build React Vite Frontend ──
FROM node:20-slim AS frontend-builder
WORKDIR /app

# Install frontend dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build production bundle
COPY index.html vite.config.js eslint.config.js ./
COPY public ./public
COPY src ./src
RUN npm run build

# ── Stage 2: Unified Production Runtime (Python 3.10 + Node.js 20) ──
FROM python:3.10-slim

# Install Node.js 20 & minimal system tools for C++ native sqlite build
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    sqlite3 \
    build-essential \
    python3-dev \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /var/cache/apt/*

WORKDIR /app

# Install Python requirements (CPU PyTorch)
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu --extra-index-url https://pypi.org/simple && \
    pip install --no-cache-dir -r backend/requirements.txt

# Install Node server production dependencies
COPY server/package.json ./server/package.json
RUN cd server && npm install --omit=dev && npm cache clean --force

# Copy pre-compiled frontend from builder stage
COPY --from=frontend-builder /app/dist ./dist

# Copy backend ML service, server code, and startup script
COPY backend ./backend
COPY server ./server
COPY start.sh ./start.sh

# Environment & Execution setup
ENV PORT=80
ENV PYTHON_BACKEND_URL=http://127.0.0.1:8000/predict
ENV EYE_MODEL_PATH=/app/backend/models/best_model.pth

EXPOSE 80 3001 8000
RUN sed -i 's/\r$//' ./start.sh && chmod +x ./start.sh

CMD ["./start.sh"]
