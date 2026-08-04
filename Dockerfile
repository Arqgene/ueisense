# Single-Stage Ultra-Lightweight Production Runtime
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
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r backend/requirements.txt

# Install Node server production dependencies
COPY server/package.json ./server/package.json
RUN cd server && npm install --omit=dev && npm cache clean --force

# Copy pre-built dist static assets and application code
COPY dist ./dist
COPY backend ./backend
COPY server ./server
COPY start.sh ./start.sh

# Environment & Execution setup
ENV PORT=80
ENV PYTHON_BACKEND_URL=http://127.0.0.1:8000/predict

EXPOSE 80 3001 8000
RUN chmod +x ./start.sh

CMD ["./start.sh"]
