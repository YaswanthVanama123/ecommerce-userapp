import { useState, useEffect, useCallback } from 'react';
import {
  getServiceWorkerStatus,
  getCacheStatus,
  requestNotificationPermission,
  isPWA,
  showInstallPrompt,
  triggerBackgroundSync,
  isOnline,
  setupOnlineOfflineListeners,
} from './serviceWorkerRegistration';

/**
 * Custom hook for service worker functionality
 */
export function useServiceWorker() {
  const [swStatus, setSwStatus] = useState(null);
  const [cacheStatus, setCacheStatus] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isAppOnline, setIsAppOnline] = useState(isOnline());
  const [isPWAMode, setIsPWAMode] = useState(false);

  // Initialize
  useEffect(() => {
    // Check if running as PWA
    setIsPWAMode(isPWA());

    // Get initial status
    updateStatus();

    // Listen for SW update events
    const handleUpdateAvailable = (event) => {
      setUpdateAvailable(true);
    };

    const handleAppInstallable = (event) => {
      setInstallPrompt(event.detail.prompt);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsPWAMode(true);
    };

    const handleSyncSuccess = (event) => {
      console.log('Background sync completed:', event.detail);
    };

    window.addEventListener('swUpdateAvailable', handleUpdateAvailable);
    window.addEventListener('appInstallable', handleAppInstallable);
    window.addEventListener('appInstalled', handleAppInstalled);
    window.addEventListener('swSyncSuccess', handleSyncSuccess);

    // Set up online/offline listeners
    setupOnlineOfflineListeners(
      () => setIsAppOnline(true),
      () => setIsAppOnline(false)
    );

    return () => {
      window.removeEventListener('swUpdateAvailable', handleUpdateAvailable);
      window.removeEventListener('appInstallable', handleAppInstallable);
      window.removeEventListener('appInstalled', handleAppInstalled);
      window.removeEventListener('swSyncSuccess', handleSyncSuccess);
    };
  }, []);

  // Update status
  const updateStatus = useCallback(async () => {
    const status = await getServiceWorkerStatus();
    setSwStatus(status);

    const cache = await getCacheStatus();
    setCacheStatus(cache);
  }, []);

  // Apply update
  const applyUpdate = useCallback(() => {
    if (updateAvailable) {
      window.location.reload();
    }
  }, [updateAvailable]);

  // Install app
  const installApp = useCallback(async () => {
    if (installPrompt) {
      const accepted = await showInstallPrompt(installPrompt);
      if (accepted) {
        setInstallPrompt(null);
      }
      return accepted;
    }
    return false;
  }, [installPrompt]);

  // Request notifications
  const enableNotifications = useCallback(async () => {
    return await requestNotificationPermission();
  }, []);

  // Trigger sync
  const syncData = useCallback(async (tag) => {
    return await triggerBackgroundSync(tag);
  }, []);

  // Sync cart
  const syncCart = useCallback(async () => {
    return await syncData('cart-sync');
  }, [syncData]);

  // Sync orders
  const syncOrders = useCallback(async () => {
    return await syncData('order-sync');
  }, [syncData]);

  return {
    // Status
    swStatus,
    cacheStatus,
    updateAvailable,
    isOnline: isAppOnline,
    isPWA: isPWAMode,
    canInstall: !!installPrompt,

    // Actions
    updateStatus,
    applyUpdate,
    installApp,
    enableNotifications,
    syncCart,
    syncOrders,
    syncData,
  };
}

/**
 * Custom hook for online/offline status
 */
export function useOnlineStatus() {
  const [online, setOnline] = useState(isOnline());

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return online;
}

/**
 * Custom hook for PWA install prompt
 */
export function useInstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(isPWA());

  useEffect(() => {
    const handleInstallable = (event) => {
      setPrompt(event.detail.prompt);
    };

    const handleInstalled = () => {
      setPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener('appInstallable', handleInstallable);
    window.addEventListener('appInstalled', handleInstalled);

    return () => {
      window.removeEventListener('appInstallable', handleInstallable);
      window.removeEventListener('appInstalled', handleInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (prompt) {
      const accepted = await showInstallPrompt(prompt);
      if (accepted) {
        setPrompt(null);
      }
      return accepted;
    }
    return false;
  }, [prompt]);

  return {
    prompt,
    isInstalled,
    canInstall: !!prompt,
    install,
  };
}

/**
 * Custom hook for background sync
 */
export function useBackgroundSync() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    const handleSyncSuccess = (event) => {
      setSyncing(false);
      setLastSync(Date.now());
    };

    window.addEventListener('swSyncSuccess', handleSyncSuccess);

    return () => {
      window.removeEventListener('swSyncSuccess', handleSyncSuccess);
    };
  }, []);

  const sync = useCallback(async (tag) => {
    setSyncing(true);
    const success = await triggerBackgroundSync(tag);
    if (!success) {
      setSyncing(false);
    }
    return success;
  }, []);

  return {
    syncing,
    lastSync,
    sync,
  };
}

export default {
  useServiceWorker,
  useOnlineStatus,
  useInstallPrompt,
  useBackgroundSync,
};
