// Service Worker for PWA - E-commerce User WebApp
// Version: 1.0.0

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `ecommerce-user-${CACHE_VERSION}`;
const PRECACHE_NAME = `ecommerce-precache-${CACHE_VERSION}`;
const API_CACHE_NAME = `ecommerce-api-${CACHE_VERSION}`;
const IMAGE_CACHE_NAME = `ecommerce-images-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `ecommerce-dynamic-${CACHE_VERSION}`;

// Cache expiration times (in milliseconds)
const CACHE_EXPIRATION = {
  API: 5 * 60 * 1000, // 5 minutes
  IMAGES: 7 * 24 * 60 * 60 * 1000, // 7 days
  STATIC: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// Critical assets to precache
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/index.css',
  '/offline.html', // Fallback page
];

// API endpoints that should use network-first strategy
const NETWORK_FIRST_APIS = [
  '/api/auth/me',
  '/api/cart',
  '/api/orders',
  '/api/products/featured',
];

// API endpoints that can use cache-first strategy
const CACHE_FIRST_APIS = [
  '/api/products',
];

// Background sync tags
const SYNC_TAGS = {
  CART_SYNC: 'cart-sync',
  ORDER_SYNC: 'order-sync',
  CART_UPDATE: 'cart-update',
};

// IndexedDB for storing pending requests
const DB_NAME = 'ecommerce-sync-db';
const DB_VERSION = 1;
const STORE_NAME = 'pending-requests';

// ========================================
// Installation Event
// ========================================
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...', CACHE_VERSION);

  event.waitUntil(
    (async () => {
      try {
        // Open precache and cache critical assets
        const precache = await caches.open(PRECACHE_NAME);
        await precache.addAll(PRECACHE_URLS.filter(url => url !== '/offline.html'));

        // Create offline fallback page
        const offlineResponse = new Response(
          `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline - E-commerce Store</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
    }
    .container {
      text-align: center;
      max-width: 500px;
    }
    .icon {
      font-size: 80px;
      margin-bottom: 20px;
    }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }
    p {
      font-size: 1.2rem;
      margin-bottom: 2rem;
      opacity: 0.9;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: white;
      color: #667eea;
      text-decoration: none;
      border-radius: 25px;
      font-weight: 600;
      transition: transform 0.2s;
    }
    .button:hover {
      transform: scale(1.05);
    }
    .features {
      margin-top: 3rem;
      text-align: left;
    }
    .feature {
      display: flex;
      align-items: center;
      margin-bottom: 1rem;
      padding: 10px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
    }
    .feature-icon {
      margin-right: 15px;
      font-size: 24px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📡</div>
    <h1>You're Offline</h1>
    <p>It looks like you've lost your internet connection. Don't worry, we've saved some content for you!</p>
    <a href="/" class="button" onclick="window.location.reload()">Try Again</a>

    <div class="features">
      <div class="feature">
        <span class="feature-icon">✓</span>
        <span>Your cart is saved locally</span>
      </div>
      <div class="feature">
        <span class="feature-icon">✓</span>
        <span>Previously viewed products are cached</span>
      </div>
      <div class="feature">
        <span class="feature-icon">✓</span>
        <span>Changes will sync when you're back online</span>
      </div>
    </div>
  </div>
</body>
</html>`,
          {
            headers: { 'Content-Type': 'text/html' }
          }
        );
        await precache.put('/offline.html', offlineResponse);

        console.log('[Service Worker] Precaching completed');

        // Skip waiting to activate immediately
        self.skipWaiting();
      } catch (error) {
        console.error('[Service Worker] Precaching failed:', error);
      }
    })()
  );
});

// ========================================
// Activation Event
// ========================================
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...', CACHE_VERSION);

  event.waitUntil(
    (async () => {
      try {
        // Clean up old caches
        const cacheNames = await caches.keys();
        const validCacheNames = [
          CACHE_NAME,
          PRECACHE_NAME,
          API_CACHE_NAME,
          IMAGE_CACHE_NAME,
          DYNAMIC_CACHE_NAME,
        ];

        await Promise.all(
          cacheNames.map(cacheName => {
            if (!validCacheNames.includes(cacheName)) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );

        // Take control of all clients
        await self.clients.claim();
        console.log('[Service Worker] Activated successfully');
      } catch (error) {
        console.error('[Service Worker] Activation failed:', error);
      }
    })()
  );
});

// ========================================
// Fetch Event - Main Request Handler
// ========================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for caching (except for background sync)
  if (request.method !== 'GET') {
    event.respondWith(handleNonGetRequest(request));
    return;
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests
    event.respondWith(handleApiRequest(request, url));
  } else if (isImageRequest(request)) {
    // Image requests
    event.respondWith(handleImageRequest(request));
  } else if (isStaticAsset(request)) {
    // Static assets (CSS, JS, fonts)
    event.respondWith(handleStaticAsset(request));
  } else {
    // HTML/navigation requests
    event.respondWith(handleNavigationRequest(request));
  }
});

// ========================================
// Request Handlers
// ========================================

// Handle API requests with network-first or cache-first strategy
async function handleApiRequest(request, url) {
  const pathname = url.pathname;

  // Determine strategy based on endpoint
  const isNetworkFirst = NETWORK_FIRST_APIS.some(api => pathname.includes(api));

  if (isNetworkFirst) {
    return networkFirstStrategy(request, API_CACHE_NAME);
  } else {
    return cacheFirstStrategy(request, API_CACHE_NAME, CACHE_EXPIRATION.API);
  }
}

// Handle image requests with cache-first strategy
async function handleImageRequest(request) {
  return cacheFirstStrategy(request, IMAGE_CACHE_NAME, CACHE_EXPIRATION.IMAGES);
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  return cacheFirstStrategy(request, CACHE_NAME, CACHE_EXPIRATION.STATIC);
}

// Handle navigation requests
async function handleNavigationRequest(request) {
  try {
    // Try network first for HTML
    const response = await fetch(request);

    if (response && response.status === 200) {
      // Cache successful response
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // If network fails, try cache
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // If not in cache, return offline page
    const offlineResponse = await caches.match('/offline.html');
    return offlineResponse || new Response('Offline', { status: 503 });
  }
}

// Handle non-GET requests (POST, PUT, DELETE)
async function handleNonGetRequest(request) {
  try {
    // Clone the request to read the body
    const clonedRequest = request.clone();

    // Try to send the request
    const response = await fetch(request);

    return response;
  } catch (error) {
    console.log('[Service Worker] Network request failed, queuing for background sync');

    // Store request for background sync
    await queueRequestForSync(request);

    // Return a custom response indicating the request is queued
    return new Response(
      JSON.stringify({
        success: false,
        queued: true,
        message: 'Request queued for background sync',
      }),
      {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// ========================================
// Caching Strategies
// ========================================

// Network-first strategy: Try network, fallback to cache
async function networkFirstStrategy(request, cacheName) {
  try {
    const response = await fetch(request);

    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      // Check if cache is expired
      const cacheTime = await getCacheTime(request.url);
      if (cacheTime && Date.now() - cacheTime < CACHE_EXPIRATION.API) {
        return cachedResponse;
      }
    }

    return cachedResponse || new Response('Network error', { status: 503 });
  }
}

// Cache-first strategy: Try cache, fallback to network
async function cacheFirstStrategy(request, cacheName, maxAge) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Check if cache is still valid
    const cacheTime = await getCacheTime(request.url);
    if (!cacheTime || Date.now() - cacheTime < maxAge) {
      // Update cache in background
      updateCacheInBackground(request, cacheName);
      return cachedResponse;
    }
  }

  // If no cache or expired, fetch from network
  try {
    const response = await fetch(request);

    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
      await setCacheTime(request.url);
    }

    return response;
  } catch (error) {
    // If network fails and we have cache, return it even if expired
    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
}

// Update cache in background without blocking response
async function updateCacheInBackground(request, cacheName) {
  try {
    const response = await fetch(request);

    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      await cache.put(request, response.clone());
      await setCacheTime(request.url);
    }
  } catch (error) {
    // Silently fail - we already have cached version
    console.log('[Service Worker] Background cache update failed:', error);
  }
}

// ========================================
// Cache Time Management
// ========================================

async function getCacheTime(url) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['cache-times'], 'readonly');
    const store = transaction.objectStore('cache-times');
    const request = store.get(url);

    request.onsuccess = () => resolve(request.result?.time);
    request.onerror = () => resolve(null);
  });
}

async function setCacheTime(url) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['cache-times'], 'readwrite');
    const store = transaction.objectStore('cache-times');
    const request = store.put({ url, time: Date.now() });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ========================================
// Background Sync
// ========================================

// Queue request for background sync
async function queueRequestForSync(request) {
  try {
    const clonedRequest = request.clone();
    const body = await clonedRequest.text();

    const requestData = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: body,
      timestamp: Date.now(),
    };

    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(requestData);

      request.onsuccess = () => {
        console.log('[Service Worker] Request queued for sync:', requestData.url);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[Service Worker] Failed to queue request:', error);
  }
}

// Handle background sync event
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync event:', event.tag);

  if (event.tag === SYNC_TAGS.CART_SYNC ||
      event.tag === SYNC_TAGS.ORDER_SYNC ||
      event.tag === SYNC_TAGS.CART_UPDATE) {
    event.waitUntil(syncPendingRequests());
  }
});

// Sync all pending requests
async function syncPendingRequests() {
  try {
    const db = await openDB();
    const requests = await getAllPendingRequests(db);

    console.log(`[Service Worker] Syncing ${requests.length} pending requests`);

    for (const requestData of requests) {
      try {
        // Recreate the request
        const request = new Request(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body,
        });

        // Try to send the request
        const response = await fetch(request);

        if (response.ok) {
          // Remove from pending queue
          await removePendingRequest(db, requestData.id);
          console.log('[Service Worker] Synced request:', requestData.url);

          // Notify clients of successful sync
          notifyClients({
            type: 'SYNC_SUCCESS',
            url: requestData.url,
            method: requestData.method,
          });
        }
      } catch (error) {
        console.error('[Service Worker] Failed to sync request:', error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Background sync failed:', error);
  }
}

// ========================================
// IndexedDB Helpers
// ========================================

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true
        });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('url', 'url', { unique: false });
      }

      if (!db.objectStoreNames.contains('cache-times')) {
        db.createObjectStore('cache-times', { keyPath: 'url' });
      }
    };
  });
}

function getAllPendingRequests(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function removePendingRequest(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ========================================
// Client Communication
// ========================================

function notifyClients(message) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage(message);
    });
  });
}

// Handle messages from clients
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      })
    );
  }

  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    getCacheStatus().then(status => {
      event.ports[0].postMessage(status);
    });
  }
});

// Get cache status
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {
    version: CACHE_VERSION,
    caches: [],
    totalSize: 0,
  };

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    status.caches.push({
      name: cacheName,
      items: keys.length,
    });
  }

  return status;
}

// ========================================
// Utility Functions
// ========================================

function isImageRequest(request) {
  return /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(new URL(request.url).pathname);
}

function isStaticAsset(request) {
  return /\.(js|css|woff|woff2|ttf|eot)$/i.test(new URL(request.url).pathname);
}

// ========================================
// Push Notifications (Future Enhancement)
// ========================================

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');

  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'ecommerce-notification',
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification('E-commerce Store', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});

console.log('[Service Worker] Loaded successfully', CACHE_VERSION);
