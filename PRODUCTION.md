# Production Deployment Guide

This guide covers production optimizations, build configuration, and deployment best practices for the ValidateSharing web application.

## Table of Contents

1. [Environment Configuration](#environment-configuration)
2. [Build Scripts](#build-scripts)
3. [Performance Optimizations](#performance-optimizations)
4. [Production Checklist](#production-checklist)
5. [Deployment Steps](#deployment-steps)
6. [Monitoring & Analytics](#monitoring--analytics)
7. [Troubleshooting](#troubleshooting)

---

## Environment Configuration

### Production Environment Variables

The application uses `.env.production` for production-specific configuration. Copy and customize this file:

```bash
cp .env.production.example .env.production
```

### Required Variables

```env
# API Configuration (REQUIRED)
VITE_API_URL=https://api.yourdomain.com/api

# Application Info
VITE_APP_NAME=ValidateSharing
VITE_APP_ENV=production
```

### Optional Variables

```env
# Performance Monitoring
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true

# Analytics Services
VITE_GA_TRACKING_ID=your-ga-id
VITE_SENTRY_DSN=your-sentry-dsn

# CDN Configuration
VITE_CDN_URL=https://cdn.yourdomain.com
VITE_STATIC_ASSETS_URL=https://static.yourdomain.com
```

---

## Build Scripts

### Available Scripts

```bash
# Development
npm run dev              # Start development server

# Production Build
npm run build:prod       # Build for production (uses .env.production)
npm run build:staging    # Build for staging environment
npm run build:analyze    # Build and analyze bundle size

# Preview & Testing
npm run preview:prod     # Preview production build locally
npm run test:build       # Build and preview together
npm run serve            # Serve built files on port 3000

# Maintenance
npm run clean            # Clean dist directory
npm run lint:fix         # Fix linting issues
```

### Building for Production

```bash
# Clean and build
npm run clean
npm run build:prod

# Verify build output
npm run verify:build
```

The build process will:
- Clean previous builds
- Bundle and minify all assets
- Split code into optimized chunks
- Generate source maps (hidden)
- Create compressed versions (gzip & brotli)
- Generate bundle analysis report

---

## Performance Optimizations

### 1. Code Splitting

The application automatically splits code into chunks:

- **Vendor chunks**: React, Router, Forms, HTTP clients
- **Page chunks**: Each route is a separate chunk
- **Component chunks**: Shared components

### 2. Lazy Loading

All route components are lazy-loaded using React.lazy():

```javascript
const Home = lazy(() => import('./pages/Home'));
```

### 3. Route Prefetching

Critical routes are prefetched automatically:
- High-priority routes (home, products, cart)
- Routes on hover
- Routes in viewport

Controlled by `VITE_ENABLE_LAZY_LOADING` flag.

### 4. Web Vitals Tracking

Performance monitoring tracks:
- **LCP** (Largest Contentful Paint)
- **FID** (First Input Delay)
- **CLS** (Cumulative Layout Shift)
- **FCP** (First Contentful Paint)
- **TTFB** (Time to First Byte)

### 5. Asset Optimization

- Images: Organized in `assets/images/`
- Fonts: Organized in `assets/fonts/`
- CSS: Code-split and minified
- JS: Terser minification with aggressive settings

### 6. Compression

Build output includes:
- **Gzip** compression (`.gz` files)
- **Brotli** compression (`.br` files)

Configure your server to serve pre-compressed files.

---

## Production Checklist

### Before Building

- [ ] Update `VITE_API_URL` in `.env.production`
- [ ] Configure analytics IDs (GA, Sentry)
- [ ] Set `VITE_APP_VERSION` to current version
- [ ] Review and update CDN URLs if applicable
- [ ] Test all environment flags
- [ ] Run `npm run lint:fix`

### Build Configuration

- [ ] Verify `vite.config.js` settings
- [ ] Check chunk size warnings
- [ ] Review manual chunk configuration
- [ ] Ensure source maps are set to `hidden`
- [ ] Verify terser options for console removal

### After Building

- [ ] Check bundle sizes in `dist/stats.html`
- [ ] Verify all routes load correctly
- [ ] Test lazy loading behavior
- [ ] Check network waterfall in DevTools
- [ ] Verify error boundary functionality
- [ ] Test on slow 3G network
- [ ] Validate PWA features (if enabled)

### Security

- [ ] Never commit `.env.production` to version control
- [ ] Ensure API keys are not in bundle
- [ ] Configure CORS on API server
- [ ] Set up CSP (Content Security Policy)
- [ ] Enable HTTPS only
- [ ] Configure secure headers

---

## Deployment Steps

### 1. Build the Application

```bash
npm run build:prod
```

### 2. Verify Build Output

```bash
# Check dist directory
ls -lh dist/

# Verify bundle sizes
npm run analyze
```

### 3. Deploy to Server

#### Option A: Static Hosting (Netlify, Vercel, etc.)

```bash
# Netlify
netlify deploy --prod --dir=dist

# Vercel
vercel --prod
```

#### Option B: Traditional Server (Nginx, Apache)

Upload `dist/` folder contents to your web server.

**Nginx Configuration:**

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/app/dist;
    index index.html;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Brotli (if supported)
    brotli on;
    brotli_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass https://api.yourdomain.com;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### Option C: Docker

```bash
docker build -t user-webapp .
docker run -p 3000:3000 user-webapp
```

### 4. Post-Deployment Verification

- [ ] Visit the production URL
- [ ] Test all critical user flows
- [ ] Check browser console for errors
- [ ] Verify API connectivity
- [ ] Test on multiple devices/browsers
- [ ] Run Lighthouse audit
- [ ] Check analytics tracking

---

## Monitoring & Analytics

### Performance Monitoring

The app automatically tracks Web Vitals when `VITE_ENABLE_PERFORMANCE_MONITORING=true`.

View metrics in:
- Browser DevTools Console
- Google Analytics (if configured)
- Custom analytics endpoint

### Error Reporting

Errors are automatically reported when `VITE_ENABLE_ERROR_REPORTING=true`.

Configure error reporting:
- **Sentry**: Set `VITE_SENTRY_DSN`
- **Custom**: Set `VITE_ERROR_REPORTING_ENDPOINT`

### Analytics Setup

**Google Analytics:**

```env
VITE_ENABLE_ANALYTICS=true
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
```

Add GA script to `index.html`:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

## Troubleshooting

### Build Issues

**Problem: Build fails with memory error**

Solution:
```bash
export NODE_OPTIONS=--max-old-space-size=4096
npm run build:prod
```

**Problem: Chunk size warnings**

Solution: Review `vite.config.js` chunk splitting configuration and increase `chunkSizeWarningLimit` if necessary.

### Runtime Issues

**Problem: Blank page after deployment**

- Check browser console for errors
- Verify base URL in router
- Check API URL configuration
- Ensure server is configured for SPA routing

**Problem: Routes return 404**

- Configure server for SPA routing (see Nginx config above)
- Ensure `index.html` is served for all routes

**Problem: API calls failing**

- Verify `VITE_API_URL` is correct
- Check CORS configuration on API server
- Inspect network requests in DevTools

### Performance Issues

**Problem: Slow initial load**

- Run bundle analyzer: `npm run build:analyze`
- Check network waterfall in DevTools
- Review lazy loading implementation
- Consider increasing prefetch priority

**Problem: High CLS (layout shift)**

- Ensure images have width/height attributes
- Use skeleton loaders
- Avoid inserting content above existing content

---

## Build Artifacts

After building, the `dist/` directory contains:

```
dist/
├── index.html              # Main HTML file
├── assets/
│   ├── js/
│   │   ├── vendor/         # Vendor chunks
│   │   ├── pages/          # Page chunks
│   │   └── components/     # Component chunks
│   ├── css/                # Stylesheets
│   ├── images/             # Optimized images
│   └── fonts/              # Web fonts
└── stats.html              # Bundle analysis report
```

### File Naming

All assets include content hash for cache busting:
- `[name]-[hash].js`
- `[name]-[hash].css`
- `[name]-[hash].[ext]`

---

## Performance Targets

### Web Vitals Goals

- **LCP**: < 2.5s (good)
- **FID**: < 100ms (good)
- **CLS**: < 0.1 (good)
- **FCP**: < 1.8s (good)
- **TTFB**: < 800ms (good)

### Bundle Size Goals

- Initial JS bundle: < 300KB (gzipped)
- Vendor chunks: < 200KB each (gzipped)
- Page chunks: < 50KB each (gzipped)
- CSS: < 50KB total (gzipped)

### Lighthouse Scores (Target: 90+)

- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

---

## Support & Resources

- **Vite Documentation**: https://vitejs.dev
- **React Performance**: https://react.dev/learn/performance
- **Web Vitals**: https://web.dev/vitals
- **Bundle Analysis**: Check `dist/stats.html` after build

---

## Version History

- **v1.0.0** - Initial production configuration
  - Code splitting and lazy loading
  - Performance monitoring
  - Error boundaries
  - Route prefetching
  - Compression (gzip/brotli)
