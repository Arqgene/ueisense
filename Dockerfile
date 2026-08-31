# Stage 1: Build React static bundle
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build production assets
COPY . .
RUN npm run build

# Stage 2: Serve static files with lightweight Nginx web server
FROM nginx:alpine

# Copy built assets to Nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx configuration for React Router SPA history fallback
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
