/**
 * Service Worker Registration Utility
 * Handles registration, updates, and lifecycle management of the service worker
 */

const SW_PATH = '/sw.js';
const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000; // Check for updates every hour

/**
 * Register the service worker
 */
export function registerServiceWorker() {
  // Check if service workers are supported
  if (!('serviceWorker' in navigator)) {
    console.log('[SW] Service Workers are not supported in this browser');
    return;
  }

  // Wait for the page to load before registering
  if (document.readyState === 'loading') {
    window.addEventListener('load', () => register());
  } else {
    register();
  }
}

/**
 * Internal registration function
 */
async function register() {
  try {
    console.log('[SW] Registering service worker...');

    const registration = await navigator.serviceWorker.register(SW_PATH, {
      scope: '/',
      updateViaCache: 'none', // Always fetch fresh service worker
    });

    console.log('[SW] Service Worker registered successfully:', registration.scope);

    // Set up update detection
    setupUpdateDetection(registration);

    // Check for updates periodically
    setInterval(() => {
      registration.update();
    }, UPDATE_CHECK_INTERVAL);

    // Handle controller change (new service worker activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW] New service worker activated');

      // Notify user about the update
      notifyUserOfUpdate();
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

    // If there's a waiting worker, prompt user to update
    if (registration.waiting) {
      promptUserToUpdate(registration.waiting);
    }

    // Set up background sync if supported
    if ('sync' in registration) {
      setupBackgroundSync(registration);
    }

    // Request notification permission (optional)
    if ('Notification' in window && Notification.permission === 'default') {
      // Don't request immediately - let the app decide when
      console.log('[SW] Notification permission not requested yet');
    }

  } catch (error) {
    console.error('[SW] Service Worker registration failed:', error);
  }
}

/**
 * Set up update detection
 */
function setupUpdateDetection(registration) {
  // Check for updates when page gains focus
  window.addEventListener('focus', () => {
    registration.update();
  });

  // Check for updates when coming back online
  window.addEventListener('online', () => {
    console.log('[SW] Back online, checking for updates...');
    registration.update();
  });

  // Listen for new service worker installing
  registration.addEventListener('updatefound', () => {
    const newWorker = registration.installing;
    console.log('[SW] New service worker found, installing...');

    newWorker.addEventListener('statechange', () => {
      console.log('[SW] Service worker state changed to:', newWorker.state);

      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // New service worker installed, but old one is still controlling
        console.log('[SW] New content is available, please refresh');
        promptUserToUpdate(newWorker);
      }

      if (newWorker.state === 'activated') {
        console.log('[SW] New service worker activated');
      }
    });
  });
}

/**
 * Prompt user to update to new service worker
 */
function promptUserToUpdate(worker) {
  // Create a custom event that the app can listen to
  const event = new CustomEvent('swUpdateAvailable', {
    detail: { worker }
  });
  window.dispatchEvent(event);

  // Also show a simple notification if the app doesn't handle it
  setTimeout(() => {
    if (confirm('A new version is available! Reload to update?')) {
      worker.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, 1000);
}

/**
 * Notify user that update has been applied
 */
function notifyUserOfUpdate() {
  // Create a custom event
  const event = new CustomEvent('swUpdated');
  window.dispatchEvent(event);

  console.log('[SW] Application has been updated');
}

/**
 * Handle messages from service worker
 */
function handleServiceWorkerMessage(event) {
  const { data } = event;

  console.log('[SW] Message from service worker:', data);

  switch (data.type) {
    case 'SYNC_SUCCESS':
      console.log('[SW] Background sync successful:', data.url);

      // Notify the app
      const syncEvent = new CustomEvent('swSyncSuccess', {
        detail: data
      });
      window.dispatchEvent(syncEvent);
      break;

    case 'CACHE_UPDATED':
      console.log('[SW] Cache updated:', data.cacheName);
      break;

    case 'ERROR':
      console.error('[SW] Service worker error:', data.error);
      break;

    default:
      console.log('[SW] Unknown message type:', data.type);
  }
}

/**
 * Set up background sync
 */
function setupBackgroundSync(registration) {
  console.log('[SW] Background sync is supported');

  // Listen for online event to trigger sync
  window.addEventListener('online', async () => {
    try {
      // Register sync for cart updates
      await registration.sync.register('cart-sync');
      console.log('[SW] Cart sync registered');

      // Register sync for orders
      await registration.sync.register('order-sync');
      console.log('[SW] Order sync registered');
    } catch (error) {
      console.error('[SW] Background sync registration failed:', error);
    }
  });
}

/**
 * Unregister service worker (for development/testing)
 */
export async function unregisterServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();

    if (registration) {
      const unregistered = await registration.unregister();
      console.log('[SW] Service worker unregistered:', unregistered);
      return unregistered;
    }

    return false;
  } catch (error) {
    console.error('[SW] Failed to unregister service worker:', error);
    return false;
  }
}

/**
 * Get service worker status
 */
export async function getServiceWorkerStatus() {
  if (!('serviceWorker' in navigator)) {
    return { supported: false };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();

    if (!registration) {
      return { supported: true, registered: false };
    }

    return {
      supported: true,
      registered: true,
      scope: registration.scope,
      updateViaCache: registration.updateViaCache,
      installing: !!registration.installing,
      waiting: !!registration.waiting,
      active: !!registration.active,
    };
  } catch (error) {
    console.error('[SW] Failed to get service worker status:', error);
    return { supported: true, error: error.message };
  }
}

/**
 * Clear all caches (for development/testing)
 */
export async function clearAllCaches() {
  if (!('caches' in window)) {
    return false;
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('[SW] All caches cleared');
    return true;
  } catch (error) {
    console.error('[SW] Failed to clear caches:', error);
    return false;
  }
}

/**
 * Get cache status
 */
export async function getCacheStatus() {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
    return null;
  }

  return new Promise((resolve) => {
    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = (event) => {
      resolve(event.data);
    };

    navigator.serviceWorker.controller.postMessage(
      { type: 'GET_CACHE_STATUS' },
      [messageChannel.port2]
    );

    // Timeout after 5 seconds
    setTimeout(() => resolve(null), 5000);
  });
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('[SW] Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * Check if app is running as PWA
 */
export function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true ||
         document.referrer.includes('android-app://');
}

/**
 * Check if app is installable
 */
export function checkInstallability() {
  let deferredPrompt;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();

    // Stash the event so it can be triggered later
    deferredPrompt = e;

    // Dispatch custom event so the app can show install UI
    const event = new CustomEvent('appInstallable', {
      detail: { prompt: deferredPrompt }
    });
    window.dispatchEvent(event);
  });

  window.addEventListener('appinstalled', () => {
    console.log('[SW] PWA was installed');
    deferredPrompt = null;

    // Dispatch custom event
    const event = new CustomEvent('appInstalled');
    window.dispatchEvent(event);
  });
}

/**
 * Show install prompt
 */
export async function showInstallPrompt(deferredPrompt) {
  if (!deferredPrompt) {
    console.log('[SW] Install prompt not available');
    return false;
  }

  // Show the install prompt
  deferredPrompt.prompt();

  // Wait for the user to respond to the prompt
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`[SW] User response to install prompt: ${outcome}`);

  return outcome === 'accepted';
}

/**
 * Trigger background sync manually
 */
export async function triggerBackgroundSync(tag) {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    if ('sync' in registration) {
      await registration.sync.register(tag);
      console.log(`[SW] Background sync triggered: ${tag}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
    return false;
  }
}

/**
 * Check online status
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Listen for online/offline events
 */
export function setupOnlineOfflineListeners(onOnline, onOffline) {
  window.addEventListener('online', () => {
    console.log('[SW] Connection restored');
    if (onOnline) onOnline();
  });

  window.addEventListener('offline', () => {
    console.log('[SW] Connection lost');
    if (onOffline) onOffline();
  });
}

// Initialize installability check
if (typeof window !== 'undefined') {
  checkInstallability();
}

export default {
  registerServiceWorker,
  unregisterServiceWorker,
  getServiceWorkerStatus,
  clearAllCaches,
  getCacheStatus,
  requestNotificationPermission,
  isPWA,
  checkInstallability,
  showInstallPrompt,
  triggerBackgroundSync,
  isOnline,
  setupOnlineOfflineListeners,
};
