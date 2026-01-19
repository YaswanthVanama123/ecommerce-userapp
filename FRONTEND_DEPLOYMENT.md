# StyleHub Frontend Deployment Guide (User WebApp)

## Production Build and Deployment

### Prerequisites
- Node.js 18+
- Built backend API running
- Domain configured

### Build Process

```bash
# 1. Navigate to user-webapp
cd user-webapp

# 2. Install dependencies
npm install

# 3. Create production environment file
cat > .env.production << EOF
VITE_API_URL=https://api.yourdomain.com/api
VITE_APP_NAME=StyleHub
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
EOF

# 4. Build for production
npm run build
# Output will be in dist/ directory
```

### Deployment to Server

```bash
# 1. Copy dist folder to server
scp -r dist/* user@server:/var/www/stylehub/user-webapp/

# Or via Git
ssh user@server
cd /var/www/stylehub/user-webapp
git pull
npm install
npm run build
```

### NGINX Configuration

```bash
sudo nano /etc/nginx/sites-available/stylehub-user
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/stylehub/user-webapp/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json image/svg+xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # API proxy (optional, if not using separate API domain)
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/stylehub-user /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL Setup

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### CDN Setup (Cloudflare)

1. Point DNS to Cloudflare
2. Enable:
   - Auto Minify (JS, CSS, HTML)
   - Brotli compression
   - Always Use HTTPS
   - HTTP/2
3. Page Rules:
   - Cache Level: Standard
   - Browser Cache TTL: 4 hours

### Performance Optimization

**Lazy Loading:** Already implemented via React.lazy()

**Code Splitting:** Vite handles automatically

**Image Optimization:** Use Cloudinary transformations

### Updates

```bash
cd /var/www/stylehub/user-webapp
git pull
npm install
npm run build
# NGINX automatically serves new files
```

### Rollback

```bash
cd /var/www/stylehub/user-webapp
git checkout <previous-commit>
npm run build
```
