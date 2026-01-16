# PWA Command Reference

Quick reference for all PWA-related commands and utilities.

## NPM Scripts

```bash
# Generate icons from source image (requires: npm install sharp --save-dev)
npm run pwa:icons source.png

# Generate placeholder icons (no dependencies)
npm run pwa:placeholders

# Build and test PWA
npm run pwa:test

# Regular development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Icon Generation

### Using Sharp (Production)
```bash
# Install sharp
npm install sharp --save-dev

# Generate all icons
npm run pwa:icons source.png
```

### Using Online Tool
1. Visit https://www.pwabuilder.com/imageGenerator
2. Upload 512x512 source image
3. Download all icons
4. Place in `/public` directory

### Required Icon Sizes
- 72x72, 96x96, 128x128, 144x144
- 152x152, 192x192, 384x384, 512x512

## Testing Commands

### Quick Test
```bash
# Build and serve
npm run pwa:test
# Visit http://localhost:3000
```

### Manual Testing
```bash
# Build
npm run build

# Serve with any static server
npx serve dist -l 3000
# or
python -m http.server 3000 -d dist
```

### Lighthouse Audit
```bash
# Install globally
npm install -g lighthouse

# Run audit
lighthouse http://localhost:3000 --view

# Or use Chrome DevTools:
# DevTools → Lighthouse → Run Audit
```

## Service Worker Management

### Check SW Status
```javascript
// In browser console
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('Registration:', reg);
  console.log('Active:', reg.active);
  console.log('Waiting:', reg.waiting);
  console.log('Installing:', reg.installing);
});
```

### Unregister SW
```javascript
// In browser console
navigator.serviceWorker.getRegistration().then(reg => {
  if (reg) {
    reg.unregister().then(() => {
      console.log('SW unregistered');
      window.location.reload();
    });
  }
});
```

### Force Update
```javascript
// In browser console
navigator.serviceWorker.getRegistration().then(reg => {
  if (reg) {
    reg.update().then(() => {
      console.log('Update check complete');
    });
  }
});
```

### Skip Waiting
```javascript
// In browser console
navigator.serviceWorker.controller.postMessage({
  type: 'SKIP_WAITING'
});
```

## Cache Management

### View Caches
```javascript
// In browser console
caches.keys().then(names => {
  console.log('Cache names:', names);
});
```

### View Cache Contents
```javascript
// In browser console
caches.open('ecommerce-api-v1.0.0').then(cache => {
  cache.keys().then(keys => {
    console.log('Cached URLs:', keys.map(k => k.url));
  });
});
```

### Clear All Caches
```javascript
// In browser console
caches.keys().then(names => {
  Promise.all(names.map(name => caches.delete(name)))
    .then(() => {
      console.log('All caches cleared');
      window.location.reload();
    });
});
```

### Clear Specific Cache
```javascript
// In browser console
caches.delete('ecommerce-api-v1.0.0').then(deleted => {
  console.log('Cache deleted:', deleted);
});
```

### Get Cache Status (Using Utility)
```javascript
import { getCacheStatus } from './utils/serviceWorkerRegistration';

const status = await getCacheStatus();
console.log('Cache status:', status);
```

## React Hooks Usage

### useServiceWorker
```javascript
import { useServiceWorker } from './utils/useServiceWorker';

const {
  swStatus,          // Service worker status
  cacheStatus,       // Cache information
  updateAvailable,   // Boolean: update available
  isOnline,          // Boolean: online status
  isPWA,             // Boolean: running as PWA
  canInstall,        // Boolean: can install
  updateStatus,      // Function: refresh status
  applyUpdate,       // Function: apply update
  installApp,        // Function: install app
  syncCart,          // Function: sync cart
  syncOrders,        // Function: sync orders
} = useServiceWorker();
```

### useOnlineStatus
```javascript
import { useOnlineStatus } from './utils/useServiceWorker';

const isOnline = useOnlineStatus();

if (!isOnline) {
  console.log('Offline mode');
}
```

### useInstallPrompt
```javascript
import { useInstallPrompt } from './utils/useServiceWorker';

const {
  prompt,           // Install prompt object
  isInstalled,      // Boolean: app installed
  canInstall,       // Boolean: can show prompt
  install,          // Function: show install prompt
} = useInstallPrompt();

if (canInstall) {
  await install();
}
```

### useBackgroundSync
```javascript
import { useBackgroundSync } from './utils/useServiceWorker';

const {
  syncing,          // Boolean: currently syncing
  lastSync,         // Timestamp of last sync
  sync,             // Function: trigger sync
} = useBackgroundSync();

// Trigger sync
await sync('cart-sync');
```

## Direct Utility Functions

### Registration
```javascript
import {
  registerServiceWorker,
  unregisterServiceWorker,
  getServiceWorkerStatus,
} from './utils/serviceWorkerRegistration';

// Register
registerServiceWorker();

// Unregister
await unregisterServiceWorker();

// Get status
const status = await getServiceWorkerStatus();
```

### Cache Management
```javascript
import {
  clearAllCaches,
  getCacheStatus,
} from './utils/serviceWorkerRegistration';

// Clear all
await clearAllCaches();

// Get status
const status = await getCacheStatus();
```

### Background Sync
```javascript
import { triggerBackgroundSync }
  from './utils/serviceWorkerRegistration';

// Trigger sync
await triggerBackgroundSync('cart-sync');
await triggerBackgroundSync('order-sync');
await triggerBackgroundSync('cart-update');
```

### Network Detection
```javascript
import {
  isOnline,
  setupOnlineOfflineListeners,
} from './utils/serviceWorkerRegistration';

// Check status
if (isOnline()) {
  console.log('Online');
}

// Listen for changes
setupOnlineOfflineListeners(
  () => console.log('Online'),
  () => console.log('Offline')
);
```

### Installation
```javascript
import {
  isPWA,
  showInstallPrompt,
} from './utils/serviceWorkerRegistration';

// Check if PWA
if (isPWA()) {
  console.log('Running as PWA');
}

// Show install prompt (need prompt object from event)
const accepted = await showInstallPrompt(deferredPrompt);
```

### Notifications
```javascript
import { requestNotificationPermission }
  from './utils/serviceWorkerRegistration';

// Request permission
const granted = await requestNotificationPermission();
```

## Browser DevTools

### Service Worker Panel
```
Chrome DevTools → Application → Service Workers
- View registration status
- Update on reload
- Bypass for network
- Unregister
- Inspect (open SW console)
```

### Cache Storage Panel
```
Chrome DevTools → Application → Cache Storage
- View all caches
- Inspect cache contents
- Delete caches
- View request/response
```

### Manifest Panel
```
Chrome DevTools → Application → Manifest
- View manifest data
- Check icons
- Test install
- View shortcuts
```

### Lighthouse Panel
```
Chrome DevTools → Lighthouse
- Select "Progressive Web App"
- Select "Performance"
- Generate report
- View score and recommendations
```

### Network Panel
```
Chrome DevTools → Network
- Filter by service worker
- View cached responses (from ServiceWorker)
- Set throttling to test offline
- Disable cache for testing
```

## Quick Troubleshooting

### Clear Everything
```javascript
// In browser console - nuclear option
(async () => {
  // Unregister SW
  const reg = await navigator.serviceWorker.getRegistration();
  if (reg) await reg.unregister();

  // Clear caches
  const names = await caches.keys();
  await Promise.all(names.map(n => caches.delete(n)));

  // Clear localStorage
  localStorage.clear();

  // Reload
  window.location.reload();
})();
```

### Force Fresh Install
```bash
1. Open DevTools → Application
2. Click "Clear storage"
3. Check all boxes
4. Click "Clear site data"
5. Hard refresh: Ctrl+Shift+R
```

### Test in Incognito
```bash
1. Open incognito/private window
2. Visit your app
3. Test PWA features
4. No cached data interfering
```

## Version Management

### Update Cache Version
```javascript
// In sw.js
const CACHE_VERSION = 'v1.0.1'; // Update this
const CACHE_NAME = `ecommerce-user-${CACHE_VERSION}`;
```

### Check Current Version
```javascript
// In browser console
navigator.serviceWorker.controller.postMessage({
  type: 'GET_CACHE_STATUS'
});

// Listen for response
navigator.serviceWorker.addEventListener('message', (event) => {
  console.log('Version:', event.data.version);
});
```

## Deployment

### Build
```bash
npm run build
```

### Deploy to Vercel
```bash
vercel --prod
```

### Deploy to Netlify
```bash
netlify deploy --prod
```

### Deploy to Static Server
```bash
# Upload dist/ folder to server
# Ensure HTTPS is enabled
# Configure headers (see PWA_IMPLEMENTATION_GUIDE.md)
```

## Monitoring

### Custom Events
```javascript
// Listen for SW events
window.addEventListener('swUpdateAvailable', (e) => {
  console.log('Update available', e.detail);
});

window.addEventListener('appInstallable', (e) => {
  console.log('App can be installed', e.detail);
});

window.addEventListener('appInstalled', () => {
  console.log('App installed');
});

window.addEventListener('swSyncSuccess', (e) => {
  console.log('Sync success', e.detail);
});
```

### Analytics Integration
```javascript
// Track PWA installs
window.addEventListener('appinstalled', () => {
  gtag('event', 'pwa_install');
});

// Track offline usage
if (!navigator.onLine) {
  gtag('event', 'offline_usage');
}

// Track SW updates
window.addEventListener('swUpdated', () => {
  gtag('event', 'sw_update');
});
```

## File Locations

```
Key files:
- /public/sw.js                              (Service Worker)
- /public/manifest.json                      (PWA Manifest)
- /src/utils/serviceWorkerRegistration.js    (SW Utils)
- /src/utils/useServiceWorker.js             (React Hooks)
- /src/components/common/PWAFeatures.jsx     (UI Components)
- /scripts/generate-icons.js                 (Icon Generator)
```

## Quick Links

- **Full Guide**: PWA_IMPLEMENTATION_GUIDE.md
- **Quick Start**: PWA_QUICK_START.md
- **Summary**: PWA_IMPLEMENTATION_SUMMARY.md
- **Checklist**: PWA_CHECKLIST.md
- **Example**: EXAMPLE_PWA_CART_INTEGRATION.jsx

---

**Print this page for quick reference during development!**
