# 🚀 Simple Virtual Machine (VM) Deployment Guide

This guide provides 1-step deployment instructions for hosting the **Uveitis AI Screening & Diagnosis System** on any Virtual Machine (AWS EC2, DigitalOcean Droplet, Hetzner, Linode, Azure VM, GCP Compute Instance, or any Linux VPS).

---

## ⚡ Option 1: Docker Deployment (Recommended — 1 Command)

The app comes with an optimized Nginx multi-stage Docker setup.

### Step 1: SSH into your VM and clone the repository
```bash
ssh user@your-vm-ip
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
cd YOUR_REPOSITORY_NAME
```

### Step 2: Run Docker Compose
```bash
docker compose up -d --build
```

**That's it!** Your app is live at `http://your-vm-ip`.

---

## 📦 Option 2: Direct Node.js / Nginx Deployment (No Docker)

If you prefer deploying without Docker directly on the host VM:

### Step 1: Install Node.js & build static assets
```bash
# Install dependencies & build static bundle
npm install
npm run build
```

### Step 2: Serve using `serve` or Nginx
```bash
# Quick serve on port 80 (requires root or sudo)
sudo npx serve -s dist -l 80
```

*Or set up Nginx / PM2:*
```nginx
server {
    listen 80;
    server_name your-vm-ip;

    location / {
        root /path/to/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

---

## ⚡ Option 3: Deploying on Static Host (Vercel / Netlify / Render Static)

Since the application is 100% self-contained with client-side `localStorage` state management, you can also deploy it to free static host services:
- **Vercel**: Connect Git repo -> Framework: Vite -> Build command: `npm run build` -> Output: `dist`
- **Netlify**: Publish directory `dist`
- **Render**: Create Static Site -> Publish directory `dist`

---

## ✅ System Features Available Standalone:
- **Layer 1**: Patient Intake Questionnaire & Demographics
- **Layer 2**: Adaptive Neuro-Fuzzy Risk & Severity Calculation Engine
- **Layer 3**: Automated Specialist Referral Recommendation
- **Layer 4**: Doctor Preliminary Assessment & Concordance Tracker
- **Layer 5**: Slitlamp Image Preprocessing & Box Localization
- **Layer 6**: Sealed CNN Findings Unlocking & Physician Disclosure
- **Layer 7**: Multi-Layer Consensus Score & Custom Treatment Plan Generation
