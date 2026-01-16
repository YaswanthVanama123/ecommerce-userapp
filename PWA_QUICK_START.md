# PWA Quick Start Guide

## Files Created

### Core PWA Files
1. **`/public/sw.js`** - Service Worker (850+ lines)
   - Cache management with versioning
   - Network-first and cache-first strategies
   - Background sync for cart/orders
   - Offline support with custom fallback page
   - IndexedDB for pending requests

2. **`/public/manifest.json`** - Web App Manifest
   - App metadata and icons
   - Shortcuts to key pages
   - Display modes and theme colors

3. **`/public/browserconfig.xml`** - Microsoft tiles config

### Utilities
4. **`/src/utils/serviceWorkerRegistration.js`** - SW Registration
   - Service worker lifecycle management
   - Update detection and handling
   - Background sync triggers
   - Install prompt handling
   - Cache management utilities

5. **`/src/utils/useServiceWorker.js`** - React Hooks
   - `useServiceWorker()` - Main hook
   - `useOnlineStatus()` - Online/offline detection
   - `useInstallPrompt()` - App installation
   - `useBackgroundSync()` - Background sync

### Components
6. **`/src/components/common/PWAFeatures.jsx`** - UI Components
   - `PWAUpdateBanner` - Show update notifications
   - `PWAInstallPrompt` - Install app button
   - `OnlineStatusIndicator` - Connection status
   - `ServiceWorkerStatus` - Debug component

### Scripts
7. **`/scripts/generate-icons.js`** - Icon generator (requires sharp)
8. **`/scripts/generate-placeholder-icons.js`** - Placeholder generator

### Documentation
9. **`PWA_IMPLEMENTATION_GUIDE.md`** - Complete guide
10. **`PWA_QUICK_START.md`** - This file

### Updated Files
- **`index.html`** - Added PWA meta tags and manifest link
- **`main.jsx`** - Added service worker registration
- **`vite.config.js`** - Configured to copy public files
- **`package.json`** - Added PWA scripts

## Installation & Setup

### 1. Install Dependencies (Optional)

For icon generation with sharp:
```bash
npm install sharp --save-dev
```

### 2. Generate Icons

**Option A: Use placeholder icons (quick start)**
```bash
npm run pwa:placeholders
```

**Option B: Generate from source image (production)**
```bash
# Place your 512x512 source image in the root
npm run pwa:icons source.png
```

**Option C: Use online tool**
- Visit https://www.pwabuilder.com/imageGenerator
- Upload a 512x512 image
- Download and place icons in `/public`

### 3. Add PWA Components to App

Update `src/App.jsx`:
```jsx
import { PWAFeatures } from './components/common/PWAFeatures';

function App() {
  return (
    <>
      {/* Your app code */}

      {/* Add PWA features */}
      <PWAFeatures />
    </>
  );
}
```

### 4. Test Locally

```bash
# Development mode
npm run dev

# Production build and test
npm run pwa:test
```

### 5. Verify PWA

1. Open Chrome DevTools
2. Go to Application tab
3. Check:
   - Service Workers (should be active)
   - Manifest (should be valid)
   - Cache Storage (should have caches)

4. Run Lighthouse audit:
   - DevTools → Lighthouse → Progressive Web App
   - Target: 100 score

## Features Overview

### Caching Strategies

**Network-First** (Fresh data priority)
- User data: `/api/auth/me`
- Cart: `/api/cart`
- Orders: `/api/orders`
- Featured products: `/api/products/featured`

**Cache-First** (Speed priority)
- Product listings: `/api/products`
- Images (7 days)
- Static assets (30 days)

**Stale-While-Revalidate**
- HTML pages
- Navigation requests

### Background Sync

Automatically sync when back online:
- Cart operations (`cart-sync`)
- Order submissions (`order-sync`)
- Cart updates (`cart-update`)

### Offline Support

- Custom offline page with saved features list
- Cached pages accessible offline
- Pending requests queued and synced

## Usage Examples

### Check Online Status

```jsx
import { useOnlineStatus } from './utils/useServiceWorker';

function MyComponent() {
  const isOnline = useOnlineStatus();

  return (
    <div>
      {!isOnline && (
        <div className="offline-banner">
          You are offline. Changes will sync when you reconnect.
        </div>
      )}
    </div>
  );
}
```

### Install App Prompt

```jsx
import { useInstallPrompt } from './utils/useServiceWorker';

function Header() {
  const { canInstall, install } = useInstallPrompt();

  if (!canInstall) return null;

  return (
    <button onClick={install}>
      Install App
    </button>
  );
}
```

### Background Sync

```jsx
import { useBackgroundSync } from './utils/useServiceWorker';

function Cart() {
  const { sync, syncing } = useBackgroundSync();

  const handleAddToCart = async (item) => {
    try {
      await api.addToCart(item);
    } catch (error) {
      // Queue for background sync
      await sync('cart-sync');
      toast.info('Added to cart. Will sync when online.');
    }
  };
}
```

### Handle Updates

```jsx
import { useServiceWorker } from './utils/useServiceWorker';

function App() {
  const { updateAvailable, applyUpdate } = useServiceWorker();

  return (
    <>
      {updateAvailable && (
        <div className="update-banner">
          New version available!
          <button onClick={applyUpdate}>Update Now</button>
        </div>
      )}
    </>
  );
}
```

## Testing Checklist

### Development
- [ ] Service worker registers successfully
- [ ] Manifest loads without errors
- [ ] Icons are available
- [ ] Console shows no PWA errors

### Offline Mode
- [ ] App loads offline
- [ ] Cached pages work
- [ ] Offline page shows when needed
- [ ] Pending requests queue

### Updates
- [ ] New version detected
- [ ] Update banner shows
- [ ] Update applies correctly
- [ ] Old caches cleaned up

### Installation
- [ ] Install prompt appears
- [ ] App installs successfully
- [ ] App opens in standalone mode
- [ ] Icons display correctly

### Performance
- [ ] Lighthouse PWA score: 100
- [ ] Fast load times
- [ ] Cache not too large
- [ ] Background sync works

## Deployment

### Build for Production

```bash
npm run build
```

### Requirements

1. **HTTPS** - Required for PWA features
   - Use Let's Encrypt for free SSL
   - Or deploy to platforms with SSL (Vercel, Netlify)

2. **Service Worker at Root**
   - Service worker must be at `/sw.js`
   - Already configured in vite.config.js

3. **Cache Headers**
   - Service worker: no-cache
   - Manifest: 1 hour cache
   - Static assets: long cache

### Nginx Example

```nginx
# Service worker - always fetch fresh
location /sw.js {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Service-Worker-Allowed "/";
}

# Manifest
location /manifest.json {
    add_header Cache-Control "public, max-age=3600";
}

# Static assets
location /assets/ {
    add_header Cache-Control "public, max-age=31536000, immutable";
}
```

### Vercel/Netlify

Add to `public/_headers`:
```
/sw.js
  Cache-Control: no-cache, no-store, must-revalidate

/manifest.json
  Cache-Control: public, max-age=3600

/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

## Troubleshooting

### Service Worker Not Registering
```bash
# Check console for errors
# Verify sw.js is accessible at /sw.js
# Ensure HTTPS in production
# Hard refresh: Ctrl+Shift+R
```

### Install Prompt Not Showing
```bash
# Requirements:
# - HTTPS (or localhost)
# - Valid manifest.json
# - Valid icons (192px and 512px minimum)
# - Service worker registered
# - Site visited at least twice (with 5 min gap)
```

### Updates Not Applying
```bash
# Clear cache and hard refresh
# Update CACHE_VERSION in sw.js
# Check Application → Service Workers → Update on reload
```

### Cache Too Large
```bash
# Implement cache size limits in sw.js
# Clean old caches on activation
# Set shorter expiration times
```

## Next Steps

1. **Generate production icons** using source image
2. **Test all features** using checklist above
3. **Run Lighthouse audit** and fix issues
4. **Deploy with HTTPS**
5. **Monitor cache size** and performance
6. **Implement push notifications** (optional)

## Resources

- [PWA Guide](PWA_IMPLEMENTATION_GUIDE.md) - Full documentation
- [Web.dev PWA](https://web.dev/progressive-web-apps/)
- [MDN Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [PWA Builder](https://www.pwabuilder.com/)

## Support

For issues:
1. Check browser console for errors
2. Inspect Application tab in DevTools
3. Verify manifest.json is valid
4. Check service worker status
5. Review PWA_IMPLEMENTATION_GUIDE.md

## Version

Current PWA implementation version: **1.0.0**

Update `CACHE_VERSION` in `sw.js` when deploying new features.
