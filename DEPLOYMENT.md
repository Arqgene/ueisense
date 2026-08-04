# 🚀 Deployment & Cloud Hosting Guide

This guide provides step-by-step instructions to push and host the full-stack **Uveitis AI Screening & Diagnosis System** on cloud platforms (Render, Railway, DigitalOcean, AWS, or any VPS).

---

## 📦 Project Architecture Overview

The system consists of 3 integrated services:
1. **React 19 + Vite Frontend** (`dist/` static bundle)
2. **Node.js + Express + SQLite Database API** (`server/index.js` on port `3001`)
3. **Python 3 + PyTorch FastAPI Neuro-Fuzzy Backend** (`backend/server.py` on port `8000`)

---

## 🐙 Step 1: Push Code to GitHub

If you haven't initialized Git or created a repository yet:

```bash
# 1. Initialize git repository (if not already done)
git init

# 2. Add files and commit
git add .
git commit -m "Initial commit: Full-stack Uveitis AI Diagnosis System"

# 3. Rename branch to main
git branch -M main

# 4. Link to your GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git

# 5. Push to GitHub
git push -u origin main
```

---

## 🐳 Option A: 1-Click Docker Deployment (Recommended for Any VPS / Cloud Server)

The repository includes a production-ready `Dockerfile` and `docker-compose.yml`.

### On any Linux VPS (DigitalOcean Droplet, AWS EC2, Hetzner, Linode):

1. **SSH into your server:**
   ```bash
   ssh user@your-server-ip
   ```

2. **Clone your repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
   cd YOUR_REPOSITORY_NAME
   ```

3. **Run Docker Compose:**
   ```bash
   docker compose up -d --build
   ```

4. **Access your application:**
   - App & Database API: `http://your-server-ip:3001`
   - PyTorch FastAPI ML API: `http://your-server-ip:8000/docs`

---

## ☁️ Option B: Hosting on Render.com

[Render](https://render.com) supports multi-service and Docker web apps with persistent storage.

### Deploying via Docker Service on Render:
1. Log in to **Render Dashboard** → Click **New +** → Select **Web Service**.
2. Connect your GitHub repository.
3. Choose **Docker** as the Runtime environment.
4. Set Environment Variables:
   - `PORT`: `3001`
   - `PYTHON_BACKEND_URL`: `http://127.0.0.1:8000/predict`
5. Click **Create Web Service**. Render will automatically build the container and deploy your live URL (`https://your-app-name.onrender.com`).

---

## ⚡ Option C: Hosting on Railway.app

1. Log in to **Railway.app** → Click **New Project** → Select **Deploy from GitHub repo**.
2. Select your repository.
3. Railway detects the `Dockerfile` automatically.
4. Add Persistent Volume mapped to `/app/server/db` for database persistence.
5. Click **Deploy**. Your app will be live on your `.up.railway.app` domain.

---

## 🔧 Environment Variables Reference

| Variable Name | Default Value | Description |
|---|---|---|
| `PORT` | `3001` | Express API server port |
| `PYTHON_BACKEND_URL` | `http://127.0.0.1:8000/predict` | PyTorch FastAPI prediction URL |
| `VITE_API_URL` | *(Auto-detected)* | Custom API URL if hosting frontend separately |

---

## 📊 Post-Deployment Health Check

Once deployed, verify all endpoints are responsive:
- Health check: `https://your-domain.com/api/health`
- Patient queue API: `https://your-domain.com/api/patients`
- Stats API: `https://your-domain.com/api/stats`
