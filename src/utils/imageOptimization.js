// Image Optimization Utilities
// Handles lazy loading, WebP support, responsive images, and compression

import { useState, useEffect, useRef, useCallback } from 'react';

// ========================================
// Configuration
// ========================================

const IMAGE_CONFIG = {
  // Lazy loading
  rootMargin: '50px', // Start loading 50px before image enters viewport
  threshold: 0.01,

  // WebP support
  supportsWebP: null, // Will be detected

  // Image sizes
  sizes: {
    thumbnail: 150,
    small: 300,
    medium: 600,
    large: 1200,
    xlarge: 1920
  },

  // Quality settings
  quality: {
    thumbnail: 60,
    small: 70,
    medium: 80,
    large: 85,
    xlarge: 90
  },

  // Placeholder
  placeholder: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="24" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ELoading...%3C/text%3E%3C/svg%3E',

  // Error placeholder
  errorPlaceholder: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23fee2e2" width="400" height="300"/%3E%3Ctext fill="%23dc2626" font-family="sans-serif" font-size="24" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EError%3C/text%3E%3C/svg%3E',

  // Cache
  cache: new Map(),
  maxCacheSize: 100
};

// ========================================
// WebP Support Detection
// ========================================

export function detectWebPSupport() {
  if (IMAGE_CONFIG.supportsWebP !== null) {
    return Promise.resolve(IMAGE_CONFIG.supportsWebP);
  }

  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      IMAGE_CONFIG.supportsWebP = webP.height === 2;
      resolve(IMAGE_CONFIG.supportsWebP);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

// ========================================
// Image URL Generation
// ========================================

/**
 * Generate optimized image URL with size and format
 */
export function getOptimizedImageUrl(src, options = {}) {
  if (!src) return IMAGE_CONFIG.placeholder;

  const {
    size = 'medium',
    quality = IMAGE_CONFIG.quality[size],
    format = 'auto',
    fit = 'cover'
  } = options;

  // If it's a full URL from external source, return as is
  if (src.startsWith('http://') || src.startsWith('https://')) {
    // For external images, we can add query parameters if the CDN supports it
    return src;
  }

  // For local images, construct optimized URL
  const width = IMAGE_CONFIG.sizes[size];
  const useWebP = format === 'webp' || (format === 'auto' && IMAGE_CONFIG.supportsWebP);
  const extension = useWebP ? 'webp' : 'jpg';

  // Remove existing extension
  const baseSrc = src.replace(/\.[^.]+$/, '');

  // Construct optimized URL
  return `${baseSrc}-${size}-q${quality}.${extension}`;
}

/**
 * Generate responsive image srcset
 */
export function generateSrcSet(src, sizes = ['small', 'medium', 'large']) {
  if (!src) return '';

  return sizes
    .map(size => {
      const width = IMAGE_CONFIG.sizes[size];
      const url = getOptimizedImageUrl(src, { size });
      return `${url} ${width}w`;
    })
    .join(', ');
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateSizes(breakpoints = {
  mobile: '100vw',
  tablet: '50vw',
  desktop: '33vw'
}) {
  return [
    `(max-width: 640px) ${breakpoints.mobile}`,
    `(max-width: 1024px) ${breakpoints.tablet}`,
    breakpoints.desktop
  ].join(', ');
}

// ========================================
// Lazy Loading Hook
// ========================================

/**
 * Hook for lazy loading images
 */
export function useLazyImage(src, options = {}) {
  const [imageSrc, setImageSrc] = useState(IMAGE_CONFIG.placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  const {
    size = 'medium',
    threshold = IMAGE_CONFIG.threshold,
    rootMargin = IMAGE_CONFIG.rootMargin,
    onLoad,
    onError
  } = options;

  useEffect(() => {
    if (!src) return;

    const imgElement = imgRef.current;
    if (!imgElement) return;

    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      // Fallback: load image immediately
      loadImage();
      return;
    }

    // Create observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage();
            if (observerRef.current) {
              observerRef.current.disconnect();
            }
          }
        });
      },
      {
        threshold,
        rootMargin
      }
    );

    // Start observing
    observerRef.current.observe(imgElement);

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [src, size, threshold, rootMargin]);

  const loadImage = useCallback(() => {
    // Check cache first
    const cacheKey = `${src}-${size}`;
    if (IMAGE_CONFIG.cache.has(cacheKey)) {
      const cachedUrl = IMAGE_CONFIG.cache.get(cacheKey);
      setImageSrc(cachedUrl);
      setIsLoaded(true);
      onLoad?.();
      return;
    }

    // Create new image to preload
    const img = new Image();
    const optimizedSrc = getOptimizedImageUrl(src, { size });

    img.onload = () => {
      setImageSrc(optimizedSrc);
      setIsLoaded(true);
      setIsError(false);

      // Cache the URL
      cacheImage(cacheKey, optimizedSrc);

      onLoad?.();
    };

    img.onerror = () => {
      setImageSrc(IMAGE_CONFIG.errorPlaceholder);
      setIsError(true);
      onError?.();
    };

    img.src = optimizedSrc;
  }, [src, size, onLoad, onError]);

  return {
    src: imageSrc,
    isLoaded,
    isError,
    ref: imgRef
  };
}

// ========================================
// Lazy Image Component
// ========================================

/**
 * Lazy loading image component
 */
export function LazyImage({
  src,
  alt = '',
  className = '',
  size = 'medium',
  width,
  height,
  onLoad,
  onError,
  style = {},
  ...props
}) {
  const { src: imageSrc, isLoaded, isError, ref } = useLazyImage(src, {
    size,
    onLoad,
    onError
  });

  return (
    <img
      ref={ref}
      src={imageSrc}
      alt={alt}
      className={`${className} ${isLoaded ? 'loaded' : 'loading'} ${isError ? 'error' : ''}`}
      width={width}
      height={height}
      style={{
        ...style,
        transition: 'opacity 0.3s ease-in-out',
        opacity: isLoaded ? 1 : 0.5
      }}
      loading="lazy"
      {...props}
    />
  );
}

// ========================================
// Responsive Image Component
// ========================================

/**
 * Responsive image with srcset and sizes
 */
export function ResponsiveImage({
  src,
  alt = '',
  className = '',
  sizes = ['small', 'medium', 'large'],
  breakpoints,
  width,
  height,
  onLoad,
  onError,
  style = {},
  ...props
}) {
  const { src: imageSrc, isLoaded, isError, ref } = useLazyImage(src, {
    size: sizes[sizes.length - 1],
    onLoad,
    onError
  });

  const srcSet = generateSrcSet(src, sizes);
  const sizesAttr = breakpoints ? generateSizes(breakpoints) : undefined;

  return (
    <img
      ref={ref}
      src={imageSrc}
      srcSet={srcSet}
      sizes={sizesAttr}
      alt={alt}
      className={`${className} ${isLoaded ? 'loaded' : 'loading'} ${isError ? 'error' : ''}`}
      width={width}
      height={height}
      style={{
        ...style,
        transition: 'opacity 0.3s ease-in-out',
        opacity: isLoaded ? 1 : 0.5
      }}
      loading="lazy"
      {...props}
    />
  );
}

// ========================================
// Progressive Image Component
// ========================================

/**
 * Progressive loading with blur-up effect
 */
export function ProgressiveImage({
  src,
  alt = '',
  className = '',
  size = 'medium',
  width,
  height,
  onLoad,
  onError,
  style = {},
  ...props
}) {
  const [lowResSrc, setLowResSrc] = useState(IMAGE_CONFIG.placeholder);
  const [highResSrc, setHighResSrc] = useState(null);
  const [isHighResLoaded, setIsHighResLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!src) return;

    // Load low-res version first (thumbnail)
    const lowResImg = new Image();
    const lowResUrl = getOptimizedImageUrl(src, { size: 'thumbnail' });

    lowResImg.onload = () => {
      setLowResSrc(lowResUrl);
    };

    lowResImg.src = lowResUrl;

    // Then load high-res version
    const highResImg = new Image();
    const highResUrl = getOptimizedImageUrl(src, { size });

    highResImg.onload = () => {
      setHighResSrc(highResUrl);
      setIsHighResLoaded(true);
      onLoad?.();
    };

    highResImg.onerror = () => {
      onError?.();
    };

    highResImg.src = highResUrl;
  }, [src, size, onLoad, onError]);

  return (
    <div
      ref={imgRef}
      className={`progressive-image-container ${className}`}
      style={{ position: 'relative', overflow: 'hidden', ...style }}
    >
      {/* Low-res blurred background */}
      <img
        src={lowResSrc}
        alt=""
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          filter: 'blur(10px)',
          transform: 'scale(1.1)',
          transition: 'opacity 0.3s ease-in-out',
          opacity: isHighResLoaded ? 0 : 1
        }}
        aria-hidden="true"
      />

      {/* High-res image */}
      {highResSrc && (
        <img
          src={highResSrc}
          alt={alt}
          width={width}
          height={height}
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            transition: 'opacity 0.3s ease-in-out',
            opacity: isHighResLoaded ? 1 : 0
          }}
          {...props}
        />
      )}
    </div>
  );
}

// ========================================
// Background Image Hook
// ========================================

/**
 * Hook for lazy loading background images
 */
export function useLazyBackgroundImage(src, options = {}) {
  const [backgroundImage, setBackgroundImage] = useState('none');
  const [isLoaded, setIsLoaded] = useState(false);
  const elementRef = useRef(null);

  const { size = 'large' } = options;

  useEffect(() => {
    if (!src) return;

    const element = elementRef.current;
    if (!element) return;

    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      loadBackgroundImage();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadBackgroundImage();
            observer.disconnect();
          }
        });
      },
      {
        threshold: 0.01,
        rootMargin: IMAGE_CONFIG.rootMargin
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [src, size]);

  const loadBackgroundImage = useCallback(() => {
    const img = new Image();
    const optimizedSrc = getOptimizedImageUrl(src, { size });

    img.onload = () => {
      setBackgroundImage(`url(${optimizedSrc})`);
      setIsLoaded(true);
    };

    img.onerror = () => {
      setBackgroundImage('none');
    };

    img.src = optimizedSrc;
  }, [src, size]);

  return {
    backgroundImage,
    isLoaded,
    ref: elementRef
  };
}

// ========================================
// Cache Management
// ========================================

function cacheImage(key, url) {
  // Limit cache size
  if (IMAGE_CONFIG.cache.size >= IMAGE_CONFIG.maxCacheSize) {
    const firstKey = IMAGE_CONFIG.cache.keys().next().value;
    IMAGE_CONFIG.cache.delete(firstKey);
  }

  IMAGE_CONFIG.cache.set(key, url);
}

export function clearImageCache() {
  IMAGE_CONFIG.cache.clear();
  console.log('[Image Optimization] Cache cleared');
}

export function getCacheSize() {
  return IMAGE_CONFIG.cache.size;
}

// ========================================
// Image Preloading
// ========================================

/**
 * Preload images for better performance
 */
export function preloadImages(urls, options = {}) {
  const { size = 'medium', priority = false } = options;

  return Promise.all(
    urls.map(url => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        const optimizedUrl = getOptimizedImageUrl(url, { size });

        // Set loading priority if supported
        if (priority && 'fetchPriority' in img) {
          img.fetchPriority = 'high';
        }

        img.onload = () => resolve(optimizedUrl);
        img.onerror = reject;
        img.src = optimizedUrl;
      });
    })
  );
}

/**
 * Preload image link (for better browser hints)
 */
export function createPreloadLink(url, options = {}) {
  const { size = 'medium', as = 'image', fetchPriority = 'auto' } = options;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = as;
  link.href = getOptimizedImageUrl(url, { size });
  link.fetchPriority = fetchPriority;

  document.head.appendChild(link);

  return link;
}

// ========================================
// Image Compression (Client-side)
// ========================================

/**
 * Compress image on client side before upload
 */
export function compressImage(file, options = {}) {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    mimeType = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        // Create canvas and compress
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            resolve(new File([blob], file.name, {
              type: mimeType,
              lastModified: Date.now()
            }));
          },
          mimeType,
          quality
        );
      };

      img.onerror = reject;
      img.src = e.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Initialize WebP detection
detectWebPSupport();

// Export default utilities
export default {
  LazyImage,
  ResponsiveImage,
  ProgressiveImage,
  useLazyImage,
  useLazyBackgroundImage,
  getOptimizedImageUrl,
  generateSrcSet,
  generateSizes,
  preloadImages,
  compressImage,
  detectWebPSupport,
  clearImageCache,
  getCacheSize
};
