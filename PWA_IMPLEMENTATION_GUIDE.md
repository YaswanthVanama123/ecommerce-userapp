# PWA Implementation Guide

## Overview

This implementation provides comprehensive Progressive Web App (PWA) features including:

- **Service Worker**: Advanced caching strategies and offline support
- **Background Sync**: Queue failed requests and sync when online
- **Install Prompt**: Install app on device
- **Push Notifications**: Ready for push notification support
- **Cache Management**: Intelligent caching with expiration
- **Offline Fallback**: Custom offline page

## Files Created

### 1. Service Worker (`/public/sw.js`)
The main service worker file with:
- **Cache versioning** (v1.0.0)
- **Multiple cache strategies**:
  - Network-first for critical API calls (cart, orders, user data)
  - Cache-first for products and static assets
  - Stale-while-revalidate for images
- **Background sync** for cart and order operations
- **Offline page** with custom HTML
- **IndexedDB** for storing pending requests

### 2. Manifest (`/public/manifest.json`)
PWA manifest with:
- App metadata (name, description, icons)
- Display mode (standalone)
- Theme colors
- Shortcuts to key pages (Products, Cart, Orders, Profile)
- Share target configuration

### 3. Service Worker Registration (`/src/utils/serviceWorkerRegistration.js`)
Utility functions for:
- Registering service worker
- Detecting updates
- Managing cache
- Handling background sync
- Install prompts
- Online/offline detection

### 4. React Hooks (`/src/utils/useServiceWorker.js`)
Custom React hooks:
- `useServiceWorker()` - Main hook for SW features
- `useOnlineStatus()` - Track online/offline state
- `useInstallPrompt()` - Handle app installation
- `useBackgroundSync()` - Manage background sync

### 5. PWA Components (`/src/components/common/PWAFeatures.jsx`)
Ready-to-use React components:
- `PWAUpdateBanner` - Show update notifications
- `PWAInstallPrompt` - Install app prompt
- `OnlineStatusIndicator` - Connection status
- `PWAFeatures` - Combined component

### 6. Browser Config (`/public/browserconfig.xml`)
Microsoft Edge/IE tile configuration

### 7. Updated Files
- `index.html` - PWA meta tags and manifest link
- `main.jsx` - Service worker registration

## Setup Instructions

### 1. Generate Icons

You need to create app icons in these sizes:
- 72x72 (`icon-72x72.png`)
- 96x96 (`icon-96x96.png`)
- 128x128 (`icon-128x128.png`)
- 144x144 (`icon-144x144.png`)
- 152x152 (`icon-152x152.png`)
- 192x192 (`icon-192x192.png`)
- 384x384 (`icon-384x384.png`)
- 512x512 (`icon-512x512.png`)

**Option 1: Using online tools**
- Use [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)
- Upload a 512x512 PNG source image
- Download all generated icons

**Option 2: Using ImageMagick**
```bash
# Install ImageMagick (if not installed)
# macOS: brew install imagemagick
# Ubuntu: sudo apt-get install imagemagick

# Generate icons from source image (replace source.png with your image)
convert source.png -resize 72x72 public/icon-72x72.png
convert source.png -resize 96x96 public/icon-96x96.png
convert source.png -resize 128x128 public/icon-128x128.png
convert source.png -resize 144x144 public/icon-144x144.png
convert source.png -resize 152x152 public/icon-152x152.png
convert source.png -resize 192x192 public/icon-192x192.png
convert source.png -resize 384x384 public/icon-384x384.png
convert source.png -resize 512x512 public/icon-512x512.png
```

**Option 3: Using Node.js script**
```bash
npm install sharp --save-dev
```

Create `scripts/generate-icons.js`:
```javascript
const sharp = require('sharp');
const fs = require('fs');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const sourceImage = 'source.png'; // Your source image

sizes.forEach(size => {
  sharp(sourceImage)
    .resize(size, size)
    .toFile(`public/icon-${size}x${size}.png`)
    .then(() => console.log(`Generated ${size}x${size}`))
    .catch(err => console.error(err));
});
```

Run: `node scripts/generate-icons.js`

### 2. Add PWA Components to Your App

Update `src/App.jsx` to include PWA features:

```jsx
import { PWAFeatures } from './components/common/PWAFeatures';

function App() {
  return (
    <>
      {/* Your existing app code */}

      {/* Add PWA features */}
      <PWAFeatures />
    </>
  );
}
```

### 3. Use Service Worker Features

#### Check online status:
```jsx
import { useOnlineStatus } from './utils/useServiceWorker';

function MyComponent() {
  const isOnline = useOnlineStatus();

  return (
    <div>
      {!isOnline && <div>You are offline</div>}
    </div>
  );
}
```

#### Handle app installation:
```jsx
import { useInstallPrompt } from './utils/useServiceWorker';

function InstallButton() {
  const { canInstall, install } = useInstallPrompt();

  if (!canInstall) return null;

  return (
    <button onClick={install}>
      Install App
    </button>
  );
}
```

#### Trigger background sync:
```jsx
import { useBackgroundSync } from './utils/useServiceWorker';

function CartComponent() {
  const { sync } = useBackgroundSync();

  const handleAddToCart = async (item) => {
    try {
      await addToCart(item);
    } catch (error) {
      // If offline, queue for sync
      await sync('cart-sync');
    }
  };
}
```

## Cache Strategies

### Network-First (Fresh Data Priority)
Used for:
- User authentication (`/api/auth/me`)
- Shopping cart (`/api/cart`)
- Orders (`/api/orders`)
- Featured products (`/api/products/featured`)

**Flow**: Try network → fallback to cache → return offline response

### Cache-First (Speed Priority)
Used for:
- Product listings (`/api/products`)
- Static assets (JS, CSS, fonts)
- Images (cached for 7 days)

**Flow**: Check cache → return cached → update cache in background

### Stale-While-Revalidate
Used for:
- Navigation (HTML pages)

**Flow**: Return cached → fetch fresh → update cache

## Cache Expiration

- **API calls**: 5 minutes
- **Images**: 7 days
- **Static assets**: 30 days

## Background Sync

### Available Sync Tags:
- `cart-sync` - Sync cart changes
- `order-sync` - Sync order submissions
- `cart-update` - Sync cart item updates

### How it works:
1. When offline, failed requests are stored in IndexedDB
2. When connection is restored, sync event is triggered
3. All pending requests are retried
4. Successfully synced requests are removed from queue
5. App is notified via `swSyncSuccess` event

### Manually trigger sync:
```javascript
import { triggerBackgroundSync } from './utils/serviceWorkerRegistration';

await triggerBackgroundSync('cart-sync');
```

## Testing PWA Features

### 1. Test Offline Mode
```javascript
// In browser DevTools:
// 1. Open Network tab
// 2. Set throttling to "Offline"
// 3. Reload page - should show offline page
// 4. Navigate to previously visited pages - should load from cache
```

### 2. Test Service Worker
```javascript
// In browser DevTools:
// 1. Open Application tab
// 2. Click "Service Workers"
// 3. See registered service worker
// 4. Click "Update" to force update
// 5. Click "Unregister" to test registration
```

### 3. Test Cache
```javascript
// In browser DevTools:
// 1. Open Application tab
// 2. Click "Cache Storage"
// 3. See all caches (precache, api, images, dynamic)
// 4. Inspect cached resources
```

### 4. Test Install
```javascript
// Desktop Chrome:
// 1. Open app in Chrome
// 2. Click install icon in address bar
// 3. Or use PWAInstallPrompt component

// Mobile:
// 1. Open app in Chrome/Safari
// 2. Click "Add to Home Screen" in menu
```

### 5. Test Background Sync
```javascript
// 1. Set network to offline
// 2. Try to add item to cart
// 3. Request should be queued
// 4. Set network to online
// 5. Request should automatically sync
```

## Lighthouse PWA Audit

Run Lighthouse to check PWA score:

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run audit
lighthouse http://localhost:3000 --view
```

**Target Scores:**
- Progressive Web App: 100
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

## Deployment Considerations

### 1. HTTPS Required
PWA features require HTTPS (except localhost for development)

### 2. Service Worker Scope
Service worker must be at root (`/sw.js`) to control entire app

### 3. Cache Busting
Update `CACHE_VERSION` in `sw.js` when deploying new version

### 4. Headers
Set proper cache headers in server config:

```nginx
# Service worker - no cache
location /sw.js {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}

# Manifest - short cache
location /manifest.json {
    add_header Cache-Control "public, max-age=3600";
}

# Static assets - long cache
location /static/ {
    add_header Cache-Control "public, max-age=31536000";
}
```

### 5. Update Strategy
```javascript
// When deploying new version:
// 1. Update CACHE_VERSION in sw.js
// 2. Deploy new files
// 3. Service worker will auto-update on next visit
// 4. Users will see update banner
// 5. Click "Update" to reload with new version
```

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Service Worker | ✓ | ✓ | ✓ | ✓ |
| Cache API | ✓ | ✓ | ✓ | ✓ |
| Background Sync | ✓ | ✗ | ✗ | ✓ |
| Push Notifications | ✓ | ✓ | ✗ | ✓ |
| Install Prompt | ✓ | ✗ | ✓* | ✓ |

*Safari uses "Add to Home Screen" menu option

## Debugging

### Enable Service Worker Logs
```javascript
// In sw.js, console.log statements will appear in:
// DevTools → Application → Service Workers → inspect

// Or in console:
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('SW Registration:', reg);
});
```

### Clear Everything
```javascript
// Clear all caches and unregister SW
import { clearAllCaches, unregisterServiceWorker } from './utils/serviceWorkerRegistration';

await clearAllCaches();
await unregisterServiceWorker();
window.location.reload();
```

### Check Cache Status
```javascript
import { getCacheStatus } from './utils/serviceWorkerRegistration';

const status = await getCacheStatus();
console.log('Cache Status:', status);
```

## Common Issues

### Issue: Service Worker not updating
**Solution**: Update `CACHE_VERSION` in sw.js and hard refresh (Ctrl+Shift+R)

### Issue: Install prompt not showing
**Solution**:
- Ensure HTTPS
- Check manifest.json is valid
- Verify all required icons exist
- Check Lighthouse PWA audit

### Issue: Caches growing too large
**Solution**: Implement cache cleanup in sw.js:
```javascript
// Add to activation event
const maxCacheSize = 50;
// ... cleanup logic
```

### Issue: Background sync not working
**Solution**:
- Only supported in Chrome/Edge
- Requires HTTPS
- Check sync registration in DevTools

## Next Steps

1. **Generate app icons** (see instructions above)
2. **Add PWA components** to your app
3. **Test offline functionality**
4. **Run Lighthouse audit**
5. **Deploy with HTTPS**
6. **Monitor cache performance**

## Additional Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Background Sync API](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [PWA Builder](https://www.pwabuilder.com/)

## Support

For issues or questions, check:
- Browser DevTools → Application tab
- Console for error messages
- Network tab for failed requests
- Service Worker lifecycle events
