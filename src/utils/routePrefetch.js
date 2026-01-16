/**
 * Route Prefetching Utility
 * Implements intelligent prefetching for critical routes to improve navigation performance
 */

import { matchPath } from 'react-router-dom';

// Route configuration with priority and prefetch settings
const ROUTE_CONFIG = {
  '/': { priority: 'high', prefetch: true },
  '/products': { priority: 'high', prefetch: true },
  '/products/:id': { priority: 'medium', prefetch: true },
  '/cart': { priority: 'high', prefetch: true },
  '/checkout': { priority: 'high', prefetch: true },
  '/login': { priority: 'medium', prefetch: true },
  '/register': { priority: 'low', prefetch: true },
  '/orders': { priority: 'low', prefetch: false },
  '/profile': { priority: 'low', prefetch: false },
};

// Prefetch cache to avoid duplicate requests
const prefetchCache = new Map();

// Network status tracking
let isSlowConnection = false;
let isPrefetchingEnabled = true;

/**
 * Initialize route prefetching
 */
export const initRoutePrefetching = () => {
  if (!import.meta.env.VITE_ENABLE_LAZY_LOADING === 'true') {
    console.log('Route prefetching is disabled');
    return;
  }

  // Check network conditions
  checkNetworkConditions();

  // Setup intersection observer for link prefetching
  setupLinkPrefetching();

  // Prefetch critical routes on idle
  prefetchCriticalRoutes();

  console.log('Route prefetching initialized');
};

/**
 * Check network conditions and adjust prefetching behavior
 */
const checkNetworkConditions = () => {
  if (!navigator.connection) {
    return;
  }

  const connection = navigator.connection;

  // Detect slow connections
  isSlowConnection =
    connection.effectiveType === 'slow-2g' ||
    connection.effectiveType === '2g' ||
    connection.saveData;

  // Disable prefetching on slow connections or save-data mode
  if (isSlowConnection) {
    isPrefetchingEnabled = false;
    console.log('Prefetching disabled due to slow connection or data saver mode');
  }

  // Listen for connection changes
  connection.addEventListener('change', () => {
    isSlowConnection =
      connection.effectiveType === 'slow-2g' ||
      connection.effectiveType === '2g' ||
      connection.saveData;

    isPrefetchingEnabled = !isSlowConnection;
  });
};

/**
 * Setup intersection observer for automatic link prefetching
 */
const setupLinkPrefetching = () => {
  if (!('IntersectionObserver' in window)) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const link = entry.target;
          const href = link.getAttribute('href');

          if (href && shouldPrefetch(href)) {
            prefetchRoute(href);
          }
        }
      });
    },
    {
      rootMargin: '50px', // Start prefetching when link is 50px from viewport
      threshold: 0.1,
    }
  );

  // Observe all internal links
  const observeLinks = () => {
    const links = document.querySelectorAll('a[href^="/"]');
    links.forEach((link) => {
      if (!link.hasAttribute('data-no-prefetch')) {
        observer.observe(link);
      }
    });
  };

  // Initial observation
  observeLinks();

  // Re-observe on route changes (using MutationObserver)
  const mutationObserver = new MutationObserver(() => {
    observeLinks();
  });

  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
};

/**
 * Check if route should be prefetched
 */
const shouldPrefetch = (path) => {
  if (!isPrefetchingEnabled) {
    return false;
  }

  // Check if already prefetched
  if (prefetchCache.has(path)) {
    return false;
  }

  // Check if current path
  if (window.location.pathname === path) {
    return false;
  }

  // Check route config
  const config = getRouteConfig(path);
  return config?.prefetch !== false;
};

/**
 * Get route configuration for a path
 */
const getRouteConfig = (path) => {
  // Try exact match first
  if (ROUTE_CONFIG[path]) {
    return ROUTE_CONFIG[path];
  }

  // Try pattern matching
  for (const [pattern, config] of Object.entries(ROUTE_CONFIG)) {
    if (matchPath(pattern, path)) {
      return config;
    }
  }

  return null;
};

/**
 * Prefetch a specific route
 */
export const prefetchRoute = async (path) => {
  if (!shouldPrefetch(path)) {
    return;
  }

  // Mark as prefetched to avoid duplicates
  prefetchCache.set(path, 'pending');

  try {
    // Use link prefetch for the route
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = path;
    link.as = 'document';
    document.head.appendChild(link);

    // Optionally prefetch route chunk
    // This requires dynamic import mapping for lazy-loaded routes
    await prefetchRouteChunk(path);

    prefetchCache.set(path, 'complete');
    console.log(`Prefetched route: ${path}`);
  } catch (error) {
    console.warn(`Failed to prefetch route: ${path}`, error);
    prefetchCache.set(path, 'error');
  }
};

/**
 * Prefetch route chunk (lazy-loaded component)
 */
const prefetchRouteChunk = async (path) => {
  // Map routes to their dynamic imports
  const routeChunkMap = {
    '/': () => import('../pages/Home.jsx'),
    '/products': () => import('../pages/ProductListing.jsx'),
    '/products/:id': () => import('../pages/ProductDetail.jsx'),
    '/cart': () => import('../pages/Cart.jsx'),
    '/checkout': () => import('../pages/Checkout.jsx'),
    '/login': () => import('../pages/Login.jsx'),
    '/register': () => import('../pages/Register.jsx'),
    '/orders': () => import('../pages/OrderHistory.jsx'),
    '/profile': () => import('../pages/Profile.jsx'),
  };

  // Find matching route
  for (const [pattern, loader] of Object.entries(routeChunkMap)) {
    if (path === pattern || matchPath(pattern, path)) {
      try {
        await loader();
        return;
      } catch (error) {
        console.warn(`Failed to prefetch chunk for: ${path}`, error);
      }
    }
  }
};

/**
 * Prefetch critical routes on idle
 */
const prefetchCriticalRoutes = () => {
  if (!isPrefetchingEnabled) {
    return;
  }

  // Use requestIdleCallback if available, otherwise setTimeout
  const scheduleCallback =
    window.requestIdleCallback ||
    ((cb) => setTimeout(cb, parseInt(import.meta.env.VITE_PREFETCH_TIMEOUT) || 2000));

  scheduleCallback(() => {
    const criticalRoutes = Object.entries(ROUTE_CONFIG)
      .filter(([_, config]) => config.priority === 'high' && config.prefetch)
      .map(([path]) => path);

    criticalRoutes.forEach((route) => {
      prefetchRoute(route);
    });
  });
};

/**
 * Prefetch on hover (for specific links)
 */
export const prefetchOnHover = (path) => {
  if (!isPrefetchingEnabled) {
    return () => {};
  }

  return () => {
    prefetchRoute(path);
  };
};

/**
 * Prefetch multiple routes
 */
export const prefetchRoutes = (routes) => {
  if (!isPrefetchingEnabled) {
    return;
  }

  routes.forEach((route) => {
    prefetchRoute(route);
  });
};

/**
 * Clear prefetch cache
 */
export const clearPrefetchCache = () => {
  prefetchCache.clear();
};

/**
 * Get prefetch status for a route
 */
export const getPrefetchStatus = (path) => {
  return prefetchCache.get(path) || 'not-started';
};

/**
 * Enable/disable prefetching
 */
export const setPrefetchingEnabled = (enabled) => {
  isPrefetchingEnabled = enabled;
};

/**
 * Preload critical resources (CSS, fonts, etc.)
 */
export const preloadCriticalResources = () => {
  const criticalResources = [
    // Add your critical resources here
    // { href: '/fonts/main.woff2', as: 'font', type: 'font/woff2' },
    // { href: '/css/critical.css', as: 'style' },
  ];

  criticalResources.forEach((resource) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.href;
    link.as = resource.as;
    if (resource.type) {
      link.type = resource.type;
    }
    if (resource.as === 'font') {
      link.crossOrigin = 'anonymous';
    }
    document.head.appendChild(link);
  });
};

/**
 * Setup DNS prefetch for external domains
 */
export const setupDnsPrefetch = () => {
  const externalDomains = [
    // Add external domains that your app connects to
    import.meta.env.VITE_API_URL?.replace(/^https?:\/\//, '').split('/')[0],
    import.meta.env.VITE_CDN_URL?.replace(/^https?:\/\//, '').split('/')[0],
  ].filter(Boolean);

  externalDomains.forEach((domain) => {
    // DNS Prefetch
    const dnsPrefetch = document.createElement('link');
    dnsPrefetch.rel = 'dns-prefetch';
    dnsPrefetch.href = `//${domain}`;
    document.head.appendChild(dnsPrefetch);

    // Preconnect for critical domains
    const preconnect = document.createElement('link');
    preconnect.rel = 'preconnect';
    preconnect.href = `//${domain}`;
    preconnect.crossOrigin = 'anonymous';
    document.head.appendChild(preconnect);
  });
};

/**
 * Setup resource hints
 */
export const setupResourceHints = () => {
  preloadCriticalResources();
  setupDnsPrefetch();
};

export default {
  initRoutePrefetching,
  prefetchRoute,
  prefetchRoutes,
  prefetchOnHover,
  clearPrefetchCache,
  getPrefetchStatus,
  setPrefetchingEnabled,
  preloadCriticalResources,
  setupDnsPrefetch,
  setupResourceHints,
};
