/**
 * Performance Monitoring Utility
 * Tracks Web Vitals and custom performance metrics
 */

// Core Web Vitals thresholds (in milliseconds)
const THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint
  FID: { good: 100, needsImprovement: 300 },   // First Input Delay
  CLS: { good: 0.1, needsImprovement: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, needsImprovement: 3000 }, // First Contentful Paint
  TTFB: { good: 800, needsImprovement: 1800 }, // Time to First Byte
  INP: { good: 200, needsImprovement: 500 },   // Interaction to Next Paint
};

// Performance metrics store
const performanceMetrics = {
  pageLoadTime: 0,
  timeToInteractive: 0,
  resourceLoadTime: 0,
  apiCalls: [],
  customMarks: {},
  webVitals: {},
};

/**
 * Initialize performance monitoring
 */
export const initPerformanceMonitoring = () => {
  if (!isPerformanceMonitoringEnabled()) {
    console.log('Performance monitoring is disabled');
    return;
  }

  console.log('Initializing performance monitoring...');

  // Track page load performance
  trackPageLoad();

  // Track Web Vitals
  trackWebVitals();

  // Track resource loading
  trackResourceLoading();

  // Setup performance observer for long tasks
  observeLongTasks();

  // Track memory usage (if available)
  trackMemoryUsage();

  // Log performance metrics on page unload
  setupPerformanceReporting();
};

/**
 * Check if performance monitoring is enabled
 */
const isPerformanceMonitoringEnabled = () => {
  return import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true';
};

/**
 * Track page load performance
 */
const trackPageLoad = () => {
  if (!window.performance || !window.performance.timing) {
    return;
  }

  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      const domReadyTime = perfData.domContentLoadedEventEnd - perfData.navigationStart;
      const renderTime = perfData.domComplete - perfData.domLoading;

      performanceMetrics.pageLoadTime = pageLoadTime;

      logMetric('Page Load', {
        pageLoadTime: `${pageLoadTime}ms`,
        domReadyTime: `${domReadyTime}ms`,
        renderTime: `${renderTime}ms`,
        rating: getRating(pageLoadTime, 'LCP'),
      });

      // Send to analytics
      sendToAnalytics('page_load', {
        page_load_time: pageLoadTime,
        dom_ready_time: domReadyTime,
        render_time: renderTime,
      });
    }, 0);
  });
};

/**
 * Track Core Web Vitals
 */
const trackWebVitals = () => {
  // Largest Contentful Paint (LCP)
  observeWebVital('largest-contentful-paint', (entry) => {
    const value = entry.renderTime || entry.loadTime;
    performanceMetrics.webVitals.LCP = value;

    logMetric('LCP', {
      value: `${Math.round(value)}ms`,
      rating: getRating(value, 'LCP'),
      element: entry.element?.tagName,
    });

    sendToAnalytics('web_vital_lcp', { value: Math.round(value) });
  });

  // First Input Delay (FID)
  observeWebVital('first-input', (entry) => {
    const value = entry.processingStart - entry.startTime;
    performanceMetrics.webVitals.FID = value;

    logMetric('FID', {
      value: `${Math.round(value)}ms`,
      rating: getRating(value, 'FID'),
      eventType: entry.name,
    });

    sendToAnalytics('web_vital_fid', { value: Math.round(value) });
  });

  // Cumulative Layout Shift (CLS)
  let clsValue = 0;
  observeWebVital('layout-shift', (entry) => {
    if (!entry.hadRecentInput) {
      clsValue += entry.value;
      performanceMetrics.webVitals.CLS = clsValue;

      logMetric('CLS', {
        value: clsValue.toFixed(3),
        rating: getRating(clsValue, 'CLS'),
      });

      sendToAnalytics('web_vital_cls', { value: parseFloat(clsValue.toFixed(3)) });
    }
  });

  // First Contentful Paint (FCP)
  observeWebVital('paint', (entry) => {
    if (entry.name === 'first-contentful-paint') {
      const value = entry.startTime;
      performanceMetrics.webVitals.FCP = value;

      logMetric('FCP', {
        value: `${Math.round(value)}ms`,
        rating: getRating(value, 'FCP'),
      });

      sendToAnalytics('web_vital_fcp', { value: Math.round(value) });
    }
  });

  // Time to First Byte (TTFB)
  if (window.performance && window.performance.timing) {
    const ttfb = window.performance.timing.responseStart - window.performance.timing.requestStart;
    performanceMetrics.webVitals.TTFB = ttfb;

    logMetric('TTFB', {
      value: `${ttfb}ms`,
      rating: getRating(ttfb, 'TTFB'),
    });

    sendToAnalytics('web_vital_ttfb', { value: ttfb });
  }
};

/**
 * Observe specific Web Vital using PerformanceObserver
 */
const observeWebVital = (entryType, callback) => {
  try {
    if (!window.PerformanceObserver) {
      return;
    }

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        callback(entry);
      }
    });

    observer.observe({ type: entryType, buffered: true });
  } catch (error) {
    console.warn(`Failed to observe ${entryType}:`, error);
  }
};

/**
 * Track resource loading performance
 */
const trackResourceLoading = () => {
  if (!window.performance || !window.performance.getEntriesByType) {
    return;
  }

  window.addEventListener('load', () => {
    const resources = window.performance.getEntriesByType('resource');
    const totalSize = resources.reduce((sum, resource) => sum + (resource.transferSize || 0), 0);
    const totalDuration = resources.reduce((sum, resource) => sum + resource.duration, 0);

    performanceMetrics.resourceLoadTime = totalDuration;

    const resourcesByType = resources.reduce((acc, resource) => {
      const type = resource.initiatorType;
      if (!acc[type]) {
        acc[type] = { count: 0, size: 0, duration: 0 };
      }
      acc[type].count++;
      acc[type].size += resource.transferSize || 0;
      acc[type].duration += resource.duration;
      return acc;
    }, {});

    logMetric('Resource Loading', {
      totalResources: resources.length,
      totalSize: `${(totalSize / 1024).toFixed(2)} KB`,
      totalDuration: `${totalDuration.toFixed(2)}ms`,
      byType: resourcesByType,
    });

    sendToAnalytics('resource_loading', {
      total_resources: resources.length,
      total_size: totalSize,
      total_duration: totalDuration,
    });
  });
};

/**
 * Observe long tasks (tasks taking more than 50ms)
 */
const observeLongTasks = () => {
  try {
    if (!window.PerformanceObserver) {
      return;
    }

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        logMetric('Long Task Detected', {
          duration: `${Math.round(entry.duration)}ms`,
          startTime: `${Math.round(entry.startTime)}ms`,
          warning: 'Task blocked main thread',
        });

        sendToAnalytics('long_task', {
          duration: Math.round(entry.duration),
          start_time: Math.round(entry.startTime),
        });
      }
    });

    observer.observe({ type: 'longtask', buffered: true });
  } catch (error) {
    console.warn('Long task observer not supported:', error);
  }
};

/**
 * Track memory usage
 */
const trackMemoryUsage = () => {
  if (!window.performance || !window.performance.memory) {
    return;
  }

  setInterval(() => {
    const memory = window.performance.memory;
    const usedMemory = memory.usedJSHeapSize / (1024 * 1024);
    const totalMemory = memory.totalJSHeapSize / (1024 * 1024);
    const limit = memory.jsHeapSizeLimit / (1024 * 1024);

    if (usedMemory / limit > 0.9) {
      logMetric('Memory Warning', {
        used: `${usedMemory.toFixed(2)} MB`,
        total: `${totalMemory.toFixed(2)} MB`,
        limit: `${limit.toFixed(2)} MB`,
        usage: `${((usedMemory / limit) * 100).toFixed(1)}%`,
      });
    }
  }, 30000); // Check every 30 seconds
};

/**
 * Track API call performance
 */
export const trackAPICall = (url, duration, status, method = 'GET') => {
  const apiCall = {
    url,
    duration,
    status,
    method,
    timestamp: Date.now(),
  };

  performanceMetrics.apiCalls.push(apiCall);

  if (duration > 1000) {
    logMetric('Slow API Call', {
      url,
      duration: `${duration}ms`,
      status,
      method,
      warning: 'API call took more than 1 second',
    });
  }

  sendToAnalytics('api_call', {
    duration,
    status,
    method,
    slow: duration > 1000,
  });
};

/**
 * Create custom performance marks
 */
export const markPerformance = (name) => {
  if (!window.performance || !window.performance.mark) {
    return;
  }

  window.performance.mark(name);
  performanceMetrics.customMarks[name] = Date.now();

  logMetric('Performance Mark', { name, timestamp: Date.now() });
};

/**
 * Measure performance between two marks
 */
export const measurePerformance = (name, startMark, endMark) => {
  if (!window.performance || !window.performance.measure) {
    return null;
  }

  try {
    window.performance.measure(name, startMark, endMark);
    const measure = window.performance.getEntriesByName(name)[0];

    logMetric('Performance Measure', {
      name,
      duration: `${Math.round(measure.duration)}ms`,
      start: startMark,
      end: endMark,
    });

    sendToAnalytics('performance_measure', {
      name,
      duration: Math.round(measure.duration),
    });

    return measure.duration;
  } catch (error) {
    console.warn('Failed to measure performance:', error);
    return null;
  }
};

/**
 * Get rating based on threshold
 */
const getRating = (value, metric) => {
  const threshold = THRESHOLDS[metric];
  if (!threshold) return 'unknown';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
};

/**
 * Log metric to console
 */
const logMetric = (name, data) => {
  if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true') {
    console.log(`[Performance] ${name}:`, data);
  }
};

/**
 * Send metrics to analytics service
 */
const sendToAnalytics = (eventName, data) => {
  if (!import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
    return;
  }

  // Google Analytics (if configured)
  if (window.gtag && import.meta.env.VITE_GA_TRACKING_ID) {
    window.gtag('event', eventName, data);
  }

  // Custom analytics endpoint (if configured)
  if (import.meta.env.VITE_ANALYTICS_ENDPOINT) {
    fetch(import.meta.env.VITE_ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: eventName, data, timestamp: Date.now() }),
    }).catch(() => {}); // Silently fail
  }
};

/**
 * Setup performance reporting on page unload
 */
const setupPerformanceReporting = () => {
  window.addEventListener('beforeunload', () => {
    // Send final performance report
    const report = {
      metrics: performanceMetrics,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: Date.now(),
    };

    // Use sendBeacon for reliable delivery
    if (navigator.sendBeacon && import.meta.env.VITE_ANALYTICS_ENDPOINT) {
      navigator.sendBeacon(
        import.meta.env.VITE_ANALYTICS_ENDPOINT,
        JSON.stringify(report)
      );
    }
  });
};

/**
 * Get all performance metrics
 */
export const getPerformanceMetrics = () => {
  return { ...performanceMetrics };
};

/**
 * Clear performance metrics
 */
export const clearPerformanceMetrics = () => {
  performanceMetrics.pageLoadTime = 0;
  performanceMetrics.timeToInteractive = 0;
  performanceMetrics.resourceLoadTime = 0;
  performanceMetrics.apiCalls = [];
  performanceMetrics.customMarks = {};
  performanceMetrics.webVitals = {};
};

/**
 * Track component render time
 */
export const trackComponentRender = (componentName) => {
  const startMark = `${componentName}-start`;
  const endMark = `${componentName}-end`;

  return {
    start: () => markPerformance(startMark),
    end: () => {
      markPerformance(endMark);
      return measurePerformance(`${componentName}-render`, startMark, endMark);
    },
  };
};

/**
 * Report vitals summary
 */
export const reportVitalsSummary = () => {
  const vitals = performanceMetrics.webVitals;

  console.group('Web Vitals Summary');
  console.log('LCP (Largest Contentful Paint):', vitals.LCP ? `${Math.round(vitals.LCP)}ms` : 'N/A');
  console.log('FID (First Input Delay):', vitals.FID ? `${Math.round(vitals.FID)}ms` : 'N/A');
  console.log('CLS (Cumulative Layout Shift):', vitals.CLS ? vitals.CLS.toFixed(3) : 'N/A');
  console.log('FCP (First Contentful Paint):', vitals.FCP ? `${Math.round(vitals.FCP)}ms` : 'N/A');
  console.log('TTFB (Time to First Byte):', vitals.TTFB ? `${vitals.TTFB}ms` : 'N/A');
  console.groupEnd();
};

export default {
  initPerformanceMonitoring,
  trackAPICall,
  markPerformance,
  measurePerformance,
  getPerformanceMetrics,
  clearPerformanceMetrics,
  trackComponentRender,
  reportVitalsSummary,
};
