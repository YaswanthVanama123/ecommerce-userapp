/**
 * Centralized Error Logging Utility
 * Provides error logging functionality for both development and production environments
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Error severity levels
 */
export const ErrorLevel = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
};

/**
 * Format error object for logging
 */
const formatError = (error, context = {}) => {
  const errorData = {
    message: error.message || 'Unknown error',
    stack: error.stack || null,
    name: error.name || 'Error',
    code: error.code || null,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenSize: `${window.screen.width}x${window.screen.height}`,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    context: {
      ...context,
      // Add any additional context
      localStorage: getLocalStorageInfo(),
      sessionStorage: getSessionStorageInfo(),
    },
  };

  return errorData;
};

/**
 * Get sanitized localStorage info (without sensitive data)
 */
const getLocalStorageInfo = () => {
  try {
    const keys = Object.keys(localStorage);
    const info = {};
    keys.forEach(key => {
      // Don't log sensitive data like tokens
      if (!key.toLowerCase().includes('token') &&
          !key.toLowerCase().includes('password') &&
          !key.toLowerCase().includes('secret')) {
        info[key] = localStorage.getItem(key)?.substring(0, 100); // Limit length
      }
    });
    return info;
  } catch (error) {
    return { error: 'Failed to read localStorage' };
  }
};

/**
 * Get sanitized sessionStorage info (without sensitive data)
 */
const getSessionStorageInfo = () => {
  try {
    const keys = Object.keys(sessionStorage);
    const info = {};
    keys.forEach(key => {
      // Don't log sensitive data
      if (!key.toLowerCase().includes('token') &&
          !key.toLowerCase().includes('password') &&
          !key.toLowerCase().includes('secret')) {
        info[key] = sessionStorage.getItem(key)?.substring(0, 100); // Limit length
      }
    });
    return info;
  } catch (error) {
    return { error: 'Failed to read sessionStorage' };
  }
};

/**
 * Send error to backend logging endpoint
 */
const sendToBackend = async (errorData, level = ErrorLevel.ERROR) => {
  try {
    const response = await fetch(`${API_BASE_URL}/logs/error`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...errorData,
        level,
        source: 'user-webapp',
      }),
    });

    if (!response.ok) {
      console.warn('Failed to send error log to backend:', response.statusText);
    }
  } catch (error) {
    // Silently fail - don't create infinite loop
    console.warn('Error logging failed:', error.message);
  }
};

/**
 * Log to console in development mode
 */
const logToConsole = (errorData, level = ErrorLevel.ERROR) => {
  const isDev = import.meta.env.DEV;

  if (isDev) {
    const styles = {
      [ErrorLevel.INFO]: 'color: #3b82f6; font-weight: bold;',
      [ErrorLevel.WARNING]: 'color: #f59e0b; font-weight: bold;',
      [ErrorLevel.ERROR]: 'color: #ef4444; font-weight: bold;',
      [ErrorLevel.CRITICAL]: 'color: #dc2626; font-weight: bold; font-size: 14px;',
    };

    console.group(`%c${level.toUpperCase()}: ${errorData.message}`, styles[level]);
    console.error('Error Object:', errorData);
    if (errorData.stack) {
      console.error('Stack Trace:', errorData.stack);
    }
    if (Object.keys(errorData.context).length > 0) {
      console.info('Context:', errorData.context);
    }
    console.groupEnd();
  }
};

/**
 * Send error to third-party service (e.g., Sentry)
 */
const sendToThirdParty = (errorData, level = ErrorLevel.ERROR) => {
  // Sentry integration
  if (window.Sentry && import.meta.env.VITE_ENABLE_SENTRY === 'true') {
    window.Sentry.captureException(new Error(errorData.message), {
      level: level,
      tags: {
        source: 'user-webapp',
      },
      contexts: {
        error: errorData,
      },
    });
  }

  // Google Analytics integration
  if (window.gtag && import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
    window.gtag('event', 'exception', {
      description: errorData.message,
      fatal: level === ErrorLevel.CRITICAL,
    });
  }

  // Custom analytics integration
  if (window.analytics && typeof window.analytics.track === 'function') {
    window.analytics.track('Error Occurred', {
      ...errorData,
      level,
    });
  }
};

/**
 * Main error logging function
 * @param {Error|string} error - Error object or error message
 * @param {object} context - Additional context information
 * @param {string} level - Error severity level
 */
export const logError = (error, context = {}, level = ErrorLevel.ERROR) => {
  try {
    // Convert string to Error object if needed
    const errorObj = typeof error === 'string' ? new Error(error) : error;

    // Format error data
    const errorData = formatError(errorObj, context);

    // Log to console in development
    logToConsole(errorData, level);

    // Send to backend in production
    if (import.meta.env.PROD || import.meta.env.VITE_ENABLE_ERROR_LOGGING === 'true') {
      sendToBackend(errorData, level);
    }

    // Send to third-party services
    if (import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true') {
      sendToThirdParty(errorData, level);
    }
  } catch (loggingError) {
    // Fallback logging if error logger itself fails
    console.error('Error logging failed:', loggingError);
    console.error('Original error:', error);
  }
};

/**
 * Log API errors with additional request/response context
 */
export const logApiError = (error, request = {}, response = {}) => {
  const context = {
    type: 'api_error',
    request: {
      method: request.method || 'UNKNOWN',
      url: request.url || 'UNKNOWN',
      headers: request.headers || {},
      body: request.body || null,
    },
    response: {
      status: response.status || null,
      statusText: response.statusText || null,
      data: response.data || null,
    },
  };

  logError(error, context, ErrorLevel.ERROR);
};

/**
 * Log network errors
 */
export const logNetworkError = (error, url = '') => {
  const context = {
    type: 'network_error',
    url,
    online: navigator.onLine,
    connectionType: navigator.connection?.effectiveType || 'unknown',
  };

  logError(error, context, ErrorLevel.WARNING);
};

/**
 * Log validation errors
 */
export const logValidationError = (error, formData = {}) => {
  const context = {
    type: 'validation_error',
    formData: sanitizeFormData(formData),
  };

  logError(error, context, ErrorLevel.INFO);
};

/**
 * Log authentication errors
 */
export const logAuthError = (error, attemptedAction = '') => {
  const context = {
    type: 'auth_error',
    attemptedAction,
    authenticated: !!localStorage.getItem('token'),
  };

  logError(error, context, ErrorLevel.WARNING);
};

/**
 * Sanitize form data to remove sensitive information
 */
const sanitizeFormData = (formData) => {
  const sanitized = { ...formData };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard', 'cvv', 'ssn'];

  Object.keys(sanitized).forEach(key => {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    }
  });

  return sanitized;
};

/**
 * Log performance issues
 */
export const logPerformanceIssue = (metric, value, threshold) => {
  const context = {
    type: 'performance_issue',
    metric,
    value,
    threshold,
    exceeded: value > threshold,
  };

  logError(
    new Error(`Performance threshold exceeded: ${metric} = ${value} (threshold: ${threshold})`),
    context,
    ErrorLevel.WARNING
  );
};

/**
 * Initialize global error handlers
 */
export const initErrorLogging = () => {
  // Global error handler
  window.addEventListener('error', (event) => {
    logError(event.error || new Error(event.message), {
      type: 'global_error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    }, ErrorLevel.ERROR);
  });

  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    logError(event.reason || new Error('Unhandled Promise Rejection'), {
      type: 'unhandled_rejection',
      promise: event.promise,
    }, ErrorLevel.ERROR);
  });

  // Log when user goes offline
  window.addEventListener('offline', () => {
    logError(new Error('User went offline'), {
      type: 'network_status',
    }, ErrorLevel.WARNING);
  });

  // Console.error override (optional - for catching console.error calls)
  if (import.meta.env.VITE_OVERRIDE_CONSOLE_ERROR === 'true') {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      logError(new Error(args.join(' ')), {
        type: 'console_error',
      }, ErrorLevel.ERROR);
    };
  }

  console.log('Error logging initialized');
};

export default {
  logError,
  logApiError,
  logNetworkError,
  logValidationError,
  logAuthError,
  logPerformanceIssue,
  initErrorLogging,
  ErrorLevel,
};
