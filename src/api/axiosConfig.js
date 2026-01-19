import axios from 'axios';

/**
 * Optimized Axios Configuration
 * Features:
 * - Request/Response caching with TTL
 * - Request deduplication
 * - Request cancellation
 * - Retry logic with exponential backoff
 * - Request batching
 * - Optimized timeouts
 * - Performance monitoring
 */

// ============================================================================
// Configuration Constants
// ============================================================================

// Use relative path to leverage Vite proxy - avoids CORS issues in development
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const TIMEOUTS = {
  DEFAULT: 30000,      // 30 seconds for normal requests
  UPLOAD: 120000,      // 2 minutes for file uploads
  DOWNLOAD: 120000,    // 2 minutes for downloads
  LONG_POLL: 300000    // 5 minutes for long polling
};

const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY: 1000,
  MAX_DELAY: 10000,
  BACKOFF_FACTOR: 2,
  RETRYABLE_STATUS_CODES: [408, 429, 500, 502, 503, 504],
  RETRYABLE_METHODS: ['GET', 'PUT', 'HEAD', 'DELETE', 'OPTIONS']
};

const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000,      // 5 minutes
  MAX_CACHE_SIZE: 100,              // Maximum cache entries
  CACHEABLE_METHODS: ['GET', 'HEAD'],
  CACHE_STRATEGIES: {
    SHORT: 1 * 60 * 1000,           // 1 minute
    MEDIUM: 5 * 60 * 1000,          // 5 minutes
    LONG: 15 * 60 * 1000,           // 15 minutes
    VERY_LONG: 60 * 60 * 1000       // 1 hour
  }
};

// ============================================================================
// Cache Manager
// ============================================================================

class CacheManager {
  constructor() {
    this.cache = new Map();
    this.accessTimes = new Map();
  }

  /**
   * Generate cache key from request config
   */
  generateKey(config) {
    const { method, url, params, data } = config;
    const key = {
      method: method?.toUpperCase(),
      url,
      params: params || {},
      data: data || {}
    };
    return JSON.stringify(key);
  }

  /**
   * Get cached response if valid
   */
  get(config) {
    const key = this.generateKey(config);
    const cached = this.cache.get(key);

    if (!cached) return null;

    const now = Date.now();
    const isExpired = now - cached.timestamp > cached.ttl;

    if (isExpired) {
      this.cache.delete(key);
      this.accessTimes.delete(key);
      return null;
    }

    // Update access time for LRU
    this.accessTimes.set(key, now);

    return cached.data;
  }

  /**
   * Set cache with TTL
   */
  set(config, data, ttl = CACHE_CONFIG.DEFAULT_TTL) {
    const key = this.generateKey(config);

    // Enforce cache size limit using LRU
    if (this.cache.size >= CACHE_CONFIG.MAX_CACHE_SIZE) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    this.accessTimes.set(key, Date.now());
  }

  /**
   * Evict least recently used entry
   */
  evictLRU() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, time] of this.accessTimes.entries()) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.accessTimes.delete(oldestKey);
    }
  }

  /**
   * Invalidate cache by pattern
   */
  invalidate(pattern) {
    if (pattern instanceof RegExp) {
      for (const key of this.cache.keys()) {
        if (pattern.test(key)) {
          this.cache.delete(key);
          this.accessTimes.delete(key);
        }
      }
    } else if (typeof pattern === 'string') {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
          this.accessTimes.delete(key);
        }
      }
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    this.accessTimes.clear();
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: CACHE_CONFIG.MAX_CACHE_SIZE,
      entries: Array.from(this.cache.keys())
    };
  }
}

// ============================================================================
// Request Deduplication Manager
// ============================================================================

class DeduplicationManager {
  constructor() {
    this.pendingRequests = new Map();
  }

  /**
   * Generate request key
   */
  generateKey(config) {
    const { method, url, params, data } = config;
    return JSON.stringify({
      method: method?.toUpperCase(),
      url,
      params: params || {},
      data: data || {}
    });
  }

  /**
   * Check if request is in flight and return promise if exists
   */
  getPending(config) {
    const key = this.generateKey(config);
    return this.pendingRequests.get(key);
  }

  /**
   * Add pending request
   */
  addPending(config, promise) {
    const key = this.generateKey(config);
    this.pendingRequests.set(key, promise);

    // Clean up when request completes
    promise.finally(() => {
      this.pendingRequests.delete(key);
    });

    return promise;
  }

  /**
   * Cancel all pending requests
   */
  cancelAll() {
    this.pendingRequests.clear();
  }

  /**
   * Get pending request count
   */
  getPendingCount() {
    return this.pendingRequests.size;
  }
}

// ============================================================================
// Request Cancellation Manager
// ============================================================================

class CancellationManager {
  constructor() {
    this.controllers = new Map();
  }

  /**
   * Create cancel token for request
   */
  createToken(config) {
    const controller = new AbortController();
    const key = this.generateKey(config);

    // Cancel previous request with same key if exists
    this.cancel(key);

    this.controllers.set(key, controller);
    return controller.signal;
  }

  /**
   * Generate key for request
   */
  generateKey(config) {
    return `${config.method}:${config.url}`;
  }

  /**
   * Cancel specific request
   */
  cancel(key) {
    const controller = this.controllers.get(key);
    if (controller) {
      controller.abort();
      this.controllers.delete(key);
    }
  }

  /**
   * Cancel all requests
   */
  cancelAll() {
    for (const controller of this.controllers.values()) {
      controller.abort();
    }
    this.controllers.clear();
  }

  /**
   * Clean up completed request
   */
  cleanup(config) {
    const key = this.generateKey(config);
    this.controllers.delete(key);
  }
}

// ============================================================================
// Request Batching Manager
// ============================================================================

class BatchManager {
  constructor() {
    this.queue = [];
    this.timer = null;
    this.batchDelay = 50; // 50ms batching window
    this.maxBatchSize = 10;
  }

  /**
   * Add request to batch queue
   */
  addToBatch(config, resolve, reject) {
    this.queue.push({ config, resolve, reject });

    // Process batch if max size reached
    if (this.queue.length >= this.maxBatchSize) {
      this.processBatch();
    } else {
      // Schedule batch processing
      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(() => this.processBatch(), this.batchDelay);
    }
  }

  /**
   * Process batched requests
   */
  async processBatch() {
    if (this.queue.length === 0) return;

    const batch = [...this.queue];
    this.queue = [];

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    // Group by endpoint
    const grouped = batch.reduce((acc, item) => {
      const endpoint = item.config.url.split('/')[1] || 'default';
      if (!acc[endpoint]) acc[endpoint] = [];
      acc[endpoint].push(item);
      return acc;
    }, {});

    // Process each group
    for (const [endpoint, requests] of Object.entries(grouped)) {
      if (requests.length === 1) {
        // Single request, execute normally
        const { config, resolve, reject } = requests[0];
        try {
          const response = await axios(config);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      } else {
        // Multiple requests, could implement batch endpoint here
        // For now, execute in parallel
        await Promise.allSettled(
          requests.map(async ({ config, resolve, reject }) => {
            try {
              const response = await axios(config);
              resolve(response);
            } catch (error) {
              reject(error);
            }
          })
        );
      }
    }
  }
}

// ============================================================================
// Retry Logic with Exponential Backoff
// ============================================================================

const shouldRetry = (error, retryCount) => {
  if (retryCount >= RETRY_CONFIG.MAX_RETRIES) return false;

  const method = error.config?.method?.toUpperCase();
  if (!RETRY_CONFIG.RETRYABLE_METHODS.includes(method)) return false;

  // Don't retry if backend is completely down (connection refused)
  if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
    console.warn('[Axios] Backend unavailable, skipping retry');
    return false;
  }

  // Retry on network errors (timeout, etc.)
  if (!error.response) return true;

  // Retry on specific status codes
  return RETRY_CONFIG.RETRYABLE_STATUS_CODES.includes(error.response.status);
};

const getRetryDelay = (retryCount) => {
  const delay = Math.min(
    RETRY_CONFIG.INITIAL_DELAY * Math.pow(RETRY_CONFIG.BACKOFF_FACTOR, retryCount),
    RETRY_CONFIG.MAX_DELAY
  );
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================================================
// Axios Instance Creation
// ============================================================================

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUTS.DEFAULT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  // Enable credentials to send cookies
  withCredentials: true,
  // Validate status
  validateStatus: (status) => status >= 200 && status < 300,
  // Maximum content length
  maxContentLength: 50 * 1024 * 1024, // 50MB
  maxBodyLength: 50 * 1024 * 1024,    // 50MB
});

// ============================================================================
// Initialize Managers
// ============================================================================

const cacheManager = new CacheManager();
const deduplicationManager = new DeduplicationManager();
const cancellationManager = new CancellationManager();
const batchManager = new BatchManager();

// Performance metrics
const metrics = {
  totalRequests: 0,
  cachedResponses: 0,
  deduplicatedRequests: 0,
  failedRequests: 0,
  retriedRequests: 0,
  averageResponseTime: 0,
  responseTimes: []
};

// ============================================================================
// Request Interceptor
// ============================================================================

// CSRF Token management
let csrfToken = null;
let isRefreshingToken = false; // Prevent multiple simultaneous refresh attempts

// Function to fetch CSRF token
const fetchCsrfToken = async () => {
  try {
    const response = await axios.get('/api/csrf-token', {
      withCredentials: true
    });
    csrfToken = response.data?.data?.csrfToken;
    return csrfToken;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    return null;
  }
};

// Fetch CSRF token on initialization (with delay to ensure proper setup)
// Disabled auto-fetch - will fetch lazily when needed to avoid issues if backend is down
// setTimeout(() => {
//   fetchCsrfToken();
// }, 100);

axiosInstance.interceptors.request.use(
  async (config) => {
    const startTime = Date.now();
    config.metadata = { startTime };

    // Add CSRF token for state-changing methods
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method?.toUpperCase())) {
      // If no CSRF token, fetch it
      if (!csrfToken) {
        await fetchCsrfToken();
      }

      // Add CSRF token to headers
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }

    // Handle timeout override
    if (config.uploadFile) {
      config.timeout = TIMEOUTS.UPLOAD;
    } else if (config.downloadFile) {
      config.timeout = TIMEOUTS.DOWNLOAD;
    } else if (config.longPoll) {
      config.timeout = TIMEOUTS.LONG_POLL;
    }

    // Check cache for GET requests
    if (CACHE_CONFIG.CACHEABLE_METHODS.includes(config.method?.toUpperCase()) && !config.skipCache) {
      const cached = cacheManager.get(config);
      if (cached) {
        metrics.cachedResponses++;
        // Return cached response in axios format
        return Promise.reject({
          config,
          cached: true,
          data: cached.data,
          status: cached.status,
          statusText: cached.statusText,
          headers: cached.headers
        });
      }
    }

    // Check for duplicate in-flight requests
    if (config.method?.toUpperCase() === 'GET' && !config.skipDeduplication) {
      const pending = deduplicationManager.getPending(config);
      if (pending) {
        metrics.deduplicatedRequests++;
        return Promise.reject({
          config,
          deduplicated: true,
          promise: pending
        });
      }
    }

    // Add cancellation token
    if (!config.signal && config.cancellable !== false) {
      config.signal = cancellationManager.createToken(config);
    }

    // Initialize retry count
    config.retryCount = config.retryCount || 0;

    // Track metrics
    metrics.totalRequests++;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================================================
// Response Interceptor
// ============================================================================

axiosInstance.interceptors.response.use(
  (response) => {
    const config = response.config;
    const endTime = Date.now();
    const duration = endTime - (config.metadata?.startTime || endTime);

    // Update metrics
    metrics.responseTimes.push(duration);
    if (metrics.responseTimes.length > 100) {
      metrics.responseTimes.shift();
    }
    metrics.averageResponseTime =
      metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length;

    // Cache successful GET requests
    if (
      CACHE_CONFIG.CACHEABLE_METHODS.includes(config.method?.toUpperCase()) &&
      !config.skipCache &&
      response.status >= 200 &&
      response.status < 300
    ) {
      const ttl = config.cacheTTL || CACHE_CONFIG.DEFAULT_TTL;
      cacheManager.set(config, {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      }, ttl);
    }

    // Cleanup cancellation token
    cancellationManager.cleanup(config);

    // Add performance info to response
    response.performance = {
      duration,
      cached: false
    };

    return response;
  },
  async (error) => {
    // Handle cached responses
    if (error.cached) {
      return Promise.resolve({
        data: error.data,
        status: error.status,
        statusText: error.statusText,
        headers: error.headers,
        config: error.config,
        performance: {
          duration: 0,
          cached: true
        }
      });
    }

    // Handle deduplicated requests
    if (error.deduplicated) {
      return error.promise;
    }

    const config = error.config;

    // Handle token refresh for 401 errors
    // Skip token refresh for auth endpoints themselves to prevent infinite loops
    const isAuthEndpoint = config.url?.includes('/auth/me') ||
                          config.url?.includes('/auth/refresh') ||
                          config.url?.includes('/auth/login') ||
                          config.url?.includes('/auth/register');

    if (error.response?.status === 401 && !config._retry && !isRefreshingToken && !isAuthEndpoint) {
      config._retry = true;
      isRefreshingToken = true;

      try {
        // Try to refresh token using cookie-based refresh endpoint
        const response = await axios.post(
          '/api/auth/refresh',
          {}, // No body needed as refresh token is in cookie
          { withCredentials: true }
        );

        // Token refreshed successfully, retry the original request
        if (response.data?.success) {
          isRefreshingToken = false;
          return axiosInstance(config);
        }
      } catch (refreshError) {
        isRefreshingToken = false;
        // Refresh failed - don't redirect, just reject
        // Let the calling code handle it (e.g., AuthContext will handle gracefully)
        console.log('[Axios] Token refresh failed, clearing auth state');
        return Promise.reject(error);
      }
    }

    // Retry logic
    if (shouldRetry(error, config.retryCount) && !config.skipRetry) {
      config.retryCount++;
      metrics.retriedRequests++;

      const delay = getRetryDelay(config.retryCount);
      await sleep(delay);

      // Recreate cancel token for retry
      if (config.cancellable !== false) {
        config.signal = cancellationManager.createToken(config);
      }

      return axiosInstance(config);
    }

    // Cleanup cancellation token
    cancellationManager.cleanup(config);

    // Track failed requests
    metrics.failedRequests++;

    return Promise.reject(error);
  }
);

// ============================================================================
// Helper Methods
// ============================================================================

/**
 * Create a request with custom options
 */
axiosInstance.createRequest = (config) => {
  return axiosInstance(config);
};

/**
 * Clear cache
 */
axiosInstance.clearCache = (pattern) => {
  if (pattern) {
    cacheManager.invalidate(pattern);
  } else {
    cacheManager.clear();
  }
};

/**
 * Cancel all pending requests
 */
axiosInstance.cancelAll = () => {
  cancellationManager.cancelAll();
  deduplicationManager.cancelAll();
};

/**
 * Get performance metrics
 */
axiosInstance.getMetrics = () => {
  return {
    ...metrics,
    cache: cacheManager.getStats(),
    pendingRequests: deduplicationManager.getPendingCount(),
    cacheHitRate: metrics.totalRequests > 0
      ? ((metrics.cachedResponses / metrics.totalRequests) * 100).toFixed(2) + '%'
      : '0%',
    deduplicationRate: metrics.totalRequests > 0
      ? ((metrics.deduplicatedRequests / metrics.totalRequests) * 100).toFixed(2) + '%'
      : '0%',
    errorRate: metrics.totalRequests > 0
      ? ((metrics.failedRequests / metrics.totalRequests) * 100).toFixed(2) + '%'
      : '0%'
  };
};

/**
 * Reset metrics
 */
axiosInstance.resetMetrics = () => {
  metrics.totalRequests = 0;
  metrics.cachedResponses = 0;
  metrics.deduplicatedRequests = 0;
  metrics.failedRequests = 0;
  metrics.retriedRequests = 0;
  metrics.averageResponseTime = 0;
  metrics.responseTimes = [];
};

/**
 * Configure cache TTL strategies
 */
axiosInstance.CACHE_STRATEGIES = CACHE_CONFIG.CACHE_STRATEGIES;

// Export managers for external use
export {
  cacheManager,
  deduplicationManager,
  cancellationManager,
  batchManager,
  metrics
};

export default axiosInstance;
