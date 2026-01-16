/**
 * Environment Configuration Utility
 * Centralizes access to environment variables with defaults and validation
 */

const ENV = {
  // Application
  APP_NAME: import.meta.env.VITE_APP_NAME || 'ValidateSharing',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  APP_ENV: import.meta.env.VITE_APP_ENV || import.meta.env.MODE || 'development',

  // API Configuration
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  API_TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,
  API_RATE_LIMIT: parseInt(import.meta.env.VITE_API_RATE_LIMIT) || 100,
  API_RATE_WINDOW: parseInt(import.meta.env.VITE_API_RATE_WINDOW) || 60000,

  // Feature Flags
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  ENABLE_ERROR_REPORTING: import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true',
  ENABLE_PERFORMANCE_MONITORING: import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true',
  ENABLE_DEBUG_MODE: import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true',
  ENABLE_SERVICE_WORKER: import.meta.env.VITE_ENABLE_SERVICE_WORKER === 'true',
  ENABLE_CODE_SPLITTING: import.meta.env.VITE_ENABLE_CODE_SPLITTING === 'true',
  ENABLE_LAZY_LOADING: import.meta.env.VITE_ENABLE_LAZY_LOADING === 'true',

  // Performance
  PREFETCH_TIMEOUT: parseInt(import.meta.env.VITE_PREFETCH_TIMEOUT) || 2000,

  // CDN & Assets
  CDN_URL: import.meta.env.VITE_CDN_URL || '',
  STATIC_ASSETS_URL: import.meta.env.VITE_STATIC_ASSETS_URL || '',

  // Analytics
  GA_TRACKING_ID: import.meta.env.VITE_GA_TRACKING_ID || '',
  SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN || '',
  ANALYTICS_ENDPOINT: import.meta.env.VITE_ANALYTICS_ENDPOINT || '',
  ERROR_REPORTING_ENDPOINT: import.meta.env.VITE_ERROR_REPORTING_ENDPOINT || '',

  // Security
  ENABLE_HTTPS: import.meta.env.VITE_ENABLE_HTTPS === 'true',
  ALLOWED_ORIGINS: import.meta.env.VITE_ALLOWED_ORIGINS?.split(',') || [],

  // Cache
  CACHE_VERSION: import.meta.env.VITE_CACHE_VERSION || '1.0.0',
  ENABLE_HTTP_CACHE: import.meta.env.VITE_ENABLE_HTTP_CACHE === 'true',

  // Image Optimization
  IMAGE_QUALITY: parseInt(import.meta.env.VITE_IMAGE_QUALITY) || 80,
  ENABLE_WEBP: import.meta.env.VITE_ENABLE_WEBP === 'true',
  ENABLE_LAZY_IMAGES: import.meta.env.VITE_ENABLE_LAZY_IMAGES === 'true',

  // Session
  SESSION_TIMEOUT: parseInt(import.meta.env.VITE_SESSION_TIMEOUT) || 1800000, // 30 minutes
  REMEMBER_ME_DURATION: parseInt(import.meta.env.VITE_REMEMBER_ME_DURATION) || 2592000000, // 30 days
};

/**
 * Check if running in production
 */
export const isProduction = () => {
  return ENV.APP_ENV === 'production';
};

/**
 * Check if running in development
 */
export const isDevelopment = () => {
  return ENV.APP_ENV === 'development';
};

/**
 * Check if running in test environment
 */
export const isTest = () => {
  return ENV.APP_ENV === 'test';
};

/**
 * Get API URL with optional path
 */
export const getApiUrl = (path = '') => {
  const baseUrl = ENV.API_URL.endsWith('/') ? ENV.API_URL.slice(0, -1) : ENV.API_URL;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

/**
 * Get CDN URL for assets
 */
export const getCdnUrl = (assetPath) => {
  if (!ENV.CDN_URL) return assetPath;
  const baseUrl = ENV.CDN_URL.endsWith('/') ? ENV.CDN_URL.slice(0, -1) : ENV.CDN_URL;
  const cleanPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  return `${baseUrl}${cleanPath}`;
};

/**
 * Get static asset URL
 */
export const getStaticUrl = (assetPath) => {
  if (!ENV.STATIC_ASSETS_URL) return assetPath;
  const baseUrl = ENV.STATIC_ASSETS_URL.endsWith('/')
    ? ENV.STATIC_ASSETS_URL.slice(0, -1)
    : ENV.STATIC_ASSETS_URL;
  const cleanPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  return `${baseUrl}${cleanPath}`;
};

/**
 * Check if feature flag is enabled
 */
export const isFeatureEnabled = (feature) => {
  const featureKey = `ENABLE_${feature.toUpperCase()}`;
  return ENV[featureKey] === true;
};

/**
 * Get environment variable with fallback
 */
export const getEnv = (key, defaultValue = null) => {
  return ENV[key] !== undefined ? ENV[key] : defaultValue;
};

/**
 * Validate required environment variables
 */
export const validateEnv = () => {
  const required = ['API_URL'];
  const missing = required.filter(key => !ENV[key]);

  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    if (isProduction()) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  return missing.length === 0;
};

/**
 * Log environment info (development only)
 */
export const logEnvInfo = () => {
  if (isDevelopment() || ENV.ENABLE_DEBUG_MODE) {
    console.group('Environment Configuration');
    console.log('App Name:', ENV.APP_NAME);
    console.log('App Version:', ENV.APP_VERSION);
    console.log('Environment:', ENV.APP_ENV);
    console.log('API URL:', ENV.API_URL);
    console.log('Analytics Enabled:', ENV.ENABLE_ANALYTICS);
    console.log('Performance Monitoring:', ENV.ENABLE_PERFORMANCE_MONITORING);
    console.log('Error Reporting:', ENV.ENABLE_ERROR_REPORTING);
    console.groupEnd();
  }
};

/**
 * Get build info
 */
export const getBuildInfo = () => {
  return {
    name: ENV.APP_NAME,
    version: ENV.APP_VERSION,
    environment: ENV.APP_ENV,
    buildDate: new Date().toISOString(),
  };
};

/**
 * Check if analytics is enabled
 */
export const isAnalyticsEnabled = () => {
  return ENV.ENABLE_ANALYTICS && (ENV.GA_TRACKING_ID || ENV.ANALYTICS_ENDPOINT);
};

/**
 * Check if error reporting is enabled
 */
export const isErrorReportingEnabled = () => {
  return ENV.ENABLE_ERROR_REPORTING && (ENV.SENTRY_DSN || ENV.ERROR_REPORTING_ENDPOINT);
};

/**
 * Get timeout for requests
 */
export const getTimeout = (customTimeout = null) => {
  return customTimeout || ENV.API_TIMEOUT;
};

/**
 * Check if HTTPS should be enforced
 */
export const shouldUseHttps = () => {
  return ENV.ENABLE_HTTPS && isProduction();
};

/**
 * Check if origin is allowed
 */
export const isOriginAllowed = (origin) => {
  if (ENV.ALLOWED_ORIGINS.length === 0) return true;
  return ENV.ALLOWED_ORIGINS.includes(origin);
};

/**
 * Get cache key with version
 */
export const getCacheKey = (key) => {
  return `${ENV.APP_NAME}_${ENV.CACHE_VERSION}_${key}`;
};

/**
 * Check if service worker should be enabled
 */
export const shouldEnableServiceWorker = () => {
  return ENV.ENABLE_SERVICE_WORKER && isProduction() && 'serviceWorker' in navigator;
};

/**
 * Export all environment variables
 */
export default ENV;

// Validate environment on module load
validateEnv();

// Log environment info in development
if (isDevelopment()) {
  logEnvInfo();
}
