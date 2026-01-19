// PWA Utilities - Install Prompt, Update Notifications, Offline Detection
// Handles PWA installation, service worker updates, and connection status

class PWAUtils {
  constructor() {
    this.deferredPrompt = null;
    this.isOnline = navigator.onLine;
    this.isInstalled = false;
    this.listeners = new Map();
    this.serviceWorker = null;
    this.updateAvailable = false;

    this.init();
  }

  // ========================================
  // Initialization
  // ========================================

  init() {
    // Check if already installed
    this.checkInstallStatus();

    // Listen for install prompt
    this.setupInstallPrompt();

    // Listen for service worker updates
    this.setupServiceWorkerListeners();

    // Setup online/offline detection
    this.setupConnectionListeners();

    // Setup app visibility change listeners
    this.setupVisibilityListeners();

    // Check for updates periodically
    this.startUpdateCheck();
  }

  // ========================================
  // Installation Management
  // ========================================

  checkInstallStatus() {
    // Check if running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      this.emit('installed', { source: 'standalone' });
    }

    // Check if running as PWA on iOS
    if (window.navigator.standalone === true) {
      this.isInstalled = true;
      this.emit('installed', { source: 'ios' });
    }

    // Listen for display mode changes
    window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
      this.isInstalled = e.matches;
      if (e.matches) {
        this.emit('installed', { source: 'display-mode-change' });
      }
    });
  }

  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the default install prompt
      e.preventDefault();

      // Save the event for later use
      this.deferredPrompt = e;

      // Notify listeners that install is available
      this.emit('installAvailable', {
        platforms: e.platforms,
        userChoice: null
      });

      console.log('[PWA] Install prompt captured, ready to show custom install UI');
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', (e) => {
      console.log('[PWA] App installed successfully');
      this.isInstalled = true;
      this.deferredPrompt = null;
      this.emit('installed', { source: 'user-action' });

      // Track installation
      this.trackInstallation();
    });
  }

  async showInstallPrompt() {
    if (!this.deferredPrompt) {
      console.warn('[PWA] Install prompt not available');
      return {
        outcome: 'not-available',
        platform: null
      };
    }

    try {
      // Show the install prompt
      this.deferredPrompt.prompt();

      // Wait for user choice
      const choiceResult = await this.deferredPrompt.userChoice;

      console.log('[PWA] User choice:', choiceResult.outcome);

      // Clear the deferred prompt
      this.deferredPrompt = null;

      // Emit event
      this.emit('installPromptResult', choiceResult);

      return choiceResult;
    } catch (error) {
      console.error('[PWA] Error showing install prompt:', error);
      return {
        outcome: 'error',
        platform: null,
        error
      };
    }
  }

  canInstall() {
    return this.deferredPrompt !== null && !this.isInstalled;
  }

  getInstallStatus() {
    return {
      isInstalled: this.isInstalled,
      canInstall: this.canInstall(),
      isOnline: this.isOnline
    };
  }

  // ========================================
  // Service Worker Updates
  // ========================================

  setupServiceWorkerListeners() {
    if (!('serviceWorker' in navigator)) {
      console.warn('[PWA] Service Worker not supported');
      return;
    }

    // Listen for controller change (new SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[PWA] New service worker activated');
      this.emit('swActivated', { timestamp: Date.now() });

      // Optionally reload the page to use new SW
      if (this.shouldAutoReload()) {
        window.location.reload();
      }
    });

    // Check for waiting service worker
    this.checkForWaitingServiceWorker();

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      this.handleServiceWorkerMessage(event.data);
    });
  }

  async checkForWaitingServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();

      if (!registration) return;

      this.serviceWorker = registration;

      // Check if there's a waiting worker
      if (registration.waiting) {
        console.log('[PWA] Update available, waiting for activation');
        this.updateAvailable = true;
        this.emit('updateAvailable', {
          waiting: true,
          installing: false
        });
      }

      // Listen for new service worker installing
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        console.log('[PWA] New service worker installing');
        this.emit('updateInstalling', { timestamp: Date.now() });

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker installed and waiting
            console.log('[PWA] Update installed, ready to activate');
            this.updateAvailable = true;
            this.emit('updateAvailable', {
              waiting: true,
              installing: false
            });
          }
        });
      });
    } catch (error) {
      console.error('[PWA] Error checking for updates:', error);
    }
  }

  handleServiceWorkerMessage(data) {
    console.log('[PWA] Message from service worker:', data);

    switch (data.type) {
      case 'SYNC_SUCCESS':
        this.emit('syncSuccess', data);
        break;
      case 'CACHE_UPDATED':
        this.emit('cacheUpdated', data);
        break;
      case 'OFFLINE_FALLBACK':
        this.emit('offlineFallback', data);
        break;
      default:
        this.emit('swMessage', data);
    }
  }

  async skipWaiting() {
    if (!this.serviceWorker || !this.serviceWorker.waiting) {
      console.warn('[PWA] No waiting service worker to skip');
      return false;
    }

    try {
      // Tell the waiting SW to skip waiting
      this.serviceWorker.waiting.postMessage({ type: 'SKIP_WAITING' });
      return true;
    } catch (error) {
      console.error('[PWA] Error skipping waiting:', error);
      return false;
    }
  }

  async updateApp() {
    const skipped = await this.skipWaiting();
    if (skipped) {
      console.log('[PWA] App will reload with new version');
      this.emit('updating', { timestamp: Date.now() });
      // The page will reload automatically when the new SW activates
    }
  }

  async checkForUpdates() {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        console.log('[PWA] Checked for updates');
      }
    } catch (error) {
      console.error('[PWA] Error checking for updates:', error);
    }
  }

  startUpdateCheck(interval = 60000) { // Check every minute
    setInterval(() => {
      this.checkForUpdates();
    }, interval);
  }

  shouldAutoReload() {
    // Don't auto-reload if user is actively using the app
    return !document.hidden;
  }

  // ========================================
  // Connection Status
  // ========================================

  setupConnectionListeners() {
    window.addEventListener('online', () => {
      console.log('[PWA] Back online');
      this.isOnline = true;
      this.emit('online', { timestamp: Date.now() });
    });

    window.addEventListener('offline', () => {
      console.log('[PWA] Gone offline');
      this.isOnline = false;
      this.emit('offline', { timestamp: Date.now() });
    });

    // Monitor connection quality
    if ('connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

      if (connection) {
        connection.addEventListener('change', () => {
          this.emit('connectionChange', {
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt,
            saveData: connection.saveData
          });
        });
      }
    }
  }

  getConnectionInfo() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    if (!connection) {
      return {
        online: this.isOnline,
        type: 'unknown',
        effectiveType: 'unknown',
        downlink: null,
        rtt: null,
        saveData: false
      };
    }

    return {
      online: this.isOnline,
      type: connection.type || 'unknown',
      effectiveType: connection.effectiveType || 'unknown',
      downlink: connection.downlink || null,
      rtt: connection.rtt || null,
      saveData: connection.saveData || false
    };
  }

  isSlowConnection() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!connection) return false;

    return connection.effectiveType === 'slow-2g' ||
           connection.effectiveType === '2g' ||
           connection.saveData === true;
  }

  // ========================================
  // App Visibility
  // ========================================

  setupVisibilityListeners() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.emit('appHidden', { timestamp: Date.now() });
      } else {
        this.emit('appVisible', { timestamp: Date.now() });
        // Check for updates when app becomes visible
        this.checkForUpdates();
      }
    });
  }

  // ========================================
  // Cache Management
  // ========================================

  async clearCache() {
    if (!('caches' in window)) return;

    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('[PWA] All caches cleared');
      this.emit('cacheCleared', { count: cacheNames.length });
      return true;
    } catch (error) {
      console.error('[PWA] Error clearing cache:', error);
      return false;
    }
  }

  async getCacheStatus() {
    if (!('caches' in window)) return null;

    try {
      const cacheNames = await caches.keys();
      const status = {
        count: cacheNames.length,
        names: cacheNames,
        size: 0
      };

      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        status.size += keys.length;
      }

      return status;
    } catch (error) {
      console.error('[PWA] Error getting cache status:', error);
      return null;
    }
  }

  // ========================================
  // Event System
  // ========================================

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;

    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  emit(event, data) {
    if (!this.listeners.has(event)) return;

    this.listeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[PWA] Error in ${event} listener:`, error);
      }
    });
  }

  // ========================================
  // Analytics & Tracking
  // ========================================

  trackInstallation() {
    // Track installation event
    if (window.gtag) {
      window.gtag('event', 'pwa_installed', {
        event_category: 'PWA',
        event_label: 'App Installed',
        value: 1
      });
    }

    // Store installation date
    localStorage.setItem('pwa_installed_date', new Date().toISOString());
  }

  getInstallDate() {
    return localStorage.getItem('pwa_installed_date');
  }

  // ========================================
  // Utility Methods
  // ========================================

  async shareContent(data) {
    if (!navigator.share) {
      console.warn('[PWA] Web Share API not supported');
      return false;
    }

    try {
      await navigator.share(data);
      console.log('[PWA] Content shared successfully');
      return true;
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('[PWA] Error sharing content:', error);
      }
      return false;
    }
  }

  canShare() {
    return 'share' in navigator;
  }

  async requestPersistentStorage() {
    if (!navigator.storage || !navigator.storage.persist) {
      console.warn('[PWA] Persistent storage not supported');
      return false;
    }

    try {
      const isPersisted = await navigator.storage.persist();
      console.log('[PWA] Persistent storage:', isPersisted ? 'granted' : 'denied');
      return isPersisted;
    } catch (error) {
      console.error('[PWA] Error requesting persistent storage:', error);
      return false;
    }
  }

  async getStorageEstimate() {
    if (!navigator.storage || !navigator.storage.estimate) {
      return null;
    }

    try {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage,
        quota: estimate.quota,
        percentUsed: (estimate.usage / estimate.quota) * 100,
        available: estimate.quota - estimate.usage
      };
    } catch (error) {
      console.error('[PWA] Error getting storage estimate:', error);
      return null;
    }
  }
}

// Create singleton instance
const pwaUtils = new PWAUtils();

// Export both the instance and the class
export default pwaUtils;
export { PWAUtils };
