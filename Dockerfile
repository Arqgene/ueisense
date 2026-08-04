# Dockerfile for Full-Stack Uveitis AI Diagnosis System
# Includes React Frontend static build + Node.js Express SQLite API + Python PyTorch FastAPI Backend

FROM python:3.10-slim

# Install Node.js 20 and system build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gnupg \
    build-essential \
    python3-dev \
    sqlite3 \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Install Lightweight CPU PyTorch & Python dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r backend/requirements.txt

# 2. Install Node dependencies & build React Frontend
COPY package.json package-lock.json ./
RUN npm ci --include=dev

COPY server/package.json ./server/package.json
RUN cd server && npm install

# 3. Copy application code
COPY . .

# 4. Build Vite production bundle into /app/dist
RUN npm run build

# Expose HTTP port 80 (standard web port) and 8000
EXPOSE 80 3001 8000

# Make start script executable
RUN chmod +x ./start.sh

# Default launch command
CMD ["./start.sh"]
