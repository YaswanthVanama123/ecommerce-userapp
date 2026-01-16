import React from 'react';
import { useServiceWorker, useOnlineStatus, useInstallPrompt } from '../utils/useServiceWorker';

/**
 * PWA Update Banner Component
 * Shows when a new version is available
 */
export function PWAUpdateBanner() {
  const { updateAvailable, applyUpdate } = useServiceWorker();

  if (!updateAvailable) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#667eea',
        color: 'white',
        padding: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 9999,
        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
      }}
    >
      <div>
        <strong>New version available!</strong>
        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
          Click "Update" to get the latest features and improvements.
        </p>
      </div>
      <button
        onClick={applyUpdate}
        style={{
          backgroundColor: 'white',
          color: '#667eea',
          border: 'none',
          padding: '0.75rem 1.5rem',
          borderRadius: '0.5rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          fontSize: '1rem',
        }}
      >
        Update
      </button>
    </div>
  );
}

/**
 * PWA Install Prompt Component
 * Shows install button when app is installable
 */
export function PWAInstallPrompt() {
  const { canInstall, install, isInstalled } = useInstallPrompt();

  if (isInstalled || !canInstall) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        backgroundColor: 'white',
        borderRadius: '1rem',
        padding: '1rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        maxWidth: '320px',
        zIndex: 9998,
      }}
    >
      <div style={{ marginBottom: '0.75rem' }}>
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>
          Install App
        </h3>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
          Install our app for a better experience and offline access!
        </p>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={install}
          style={{
            flex: 1,
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          Install
        </button>
        <button
          onClick={() => {}}
          style={{
            backgroundColor: '#f3f4f6',
            color: '#666',
            border: 'none',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            cursor: 'pointer',
          }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}

/**
 * Online/Offline Status Indicator
 */
export function OnlineStatusIndicator() {
  const isOnline = useOnlineStatus();
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    if (!isOnline) {
      setShow(true);
    } else {
      // Show "back online" message briefly
      setShow(true);
      const timer = setTimeout(() => setShow(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!show) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: isOnline ? '#10b981' : '#ef4444',
        color: 'white',
        padding: '0.75rem 1.5rem',
        borderRadius: '2rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.9rem',
        fontWeight: '600',
      }}
    >
      <span>{isOnline ? '✓' : '⚠'}</span>
      <span>{isOnline ? 'Back Online' : 'No Internet Connection'}</span>
    </div>
  );
}

/**
 * PWA Features Container
 * Combines all PWA UI components
 */
export function PWAFeatures() {
  return (
    <>
      <PWAUpdateBanner />
      <PWAInstallPrompt />
      <OnlineStatusIndicator />
    </>
  );
}

/**
 * Service Worker Status Component (for debugging)
 */
export function ServiceWorkerStatus() {
  const { swStatus, cacheStatus, isOnline, isPWA } = useServiceWorker();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1rem',
        left: '1rem',
        backgroundColor: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '1rem',
        borderRadius: '0.5rem',
        fontSize: '0.75rem',
        maxWidth: '300px',
        zIndex: 9999,
      }}
    >
      <h4 style={{ margin: '0 0 0.5rem 0' }}>Service Worker Status</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div>Online: {isOnline ? 'Yes' : 'No'}</div>
        <div>PWA Mode: {isPWA ? 'Yes' : 'No'}</div>
        {swStatus && (
          <>
            <div>Registered: {swStatus.registered ? 'Yes' : 'No'}</div>
            <div>Active: {swStatus.active ? 'Yes' : 'No'}</div>
          </>
        )}
        {cacheStatus && (
          <>
            <div>Cache Version: {cacheStatus.version}</div>
            <div>Caches: {cacheStatus.caches?.length || 0}</div>
          </>
        )}
      </div>
    </div>
  );
}

export default PWAFeatures;
