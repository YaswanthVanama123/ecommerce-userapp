# API Optimization Guide

## Overview

The optimized API layer includes comprehensive features for performance optimization, reliability, and efficient data fetching.

## Features Implemented

### 1. Request Caching with TTL
- **Automatic caching** for GET requests
- **LRU eviction** when cache size limit is reached
- **TTL-based expiration** with multiple strategies
- **Cache invalidation** on mutations

### 2. Request Deduplication
- **Prevents duplicate in-flight requests**
- Automatically shares responses between duplicate requests
- Only applies to GET requests by default

### 3. Request Cancellation
- **Automatic cancellation** of previous requests with same endpoint
- Uses AbortController for native cancellation
- Cleanup on request completion

### 4. Retry Logic with Exponential Backoff
- **Automatic retry** for failed requests
- Exponential backoff with jitter
- Configurable retry attempts and delays
- Smart retry only on appropriate methods and status codes

### 5. Request Batching
- **Groups multiple requests** within a time window
- Reduces server load and network overhead
- Processes related requests together

### 6. Optimized Timeouts
- **Different timeouts** for different request types
- 30s for normal requests
- 2 minutes for uploads/downloads
- 5 minutes for long polling

### 7. Performance Monitoring
- **Tracks request metrics**
- Cache hit rates
- Deduplication rates
- Average response times
- Error rates

## Cache Strategies

```javascript
// Available cache strategies
axiosInstance.CACHE_STRATEGIES = {
  SHORT: 60000,        // 1 minute - frequently changing data
  MEDIUM: 300000,      // 5 minutes - moderately static data
  LONG: 900000,        // 15 minutes - rarely changing data
  VERY_LONG: 3600000   // 1 hour - very static data
}
```

### Cache Strategy Usage by Endpoint

| Endpoint Type | Strategy | TTL | Reason |
|--------------|----------|-----|---------|
| User Profile | SHORT | 1 min | May change frequently |
| Products List | MEDIUM | 5 min | Moderate update frequency |
| Featured Products | LONG | 15 min | Changes infrequently |
| Categories | VERY_LONG | 1 hour | Rarely changes |
| Cart | SHORT | 1 min | Changes frequently |
| Orders | SHORT | 1 min | Status updates |

## Usage Examples

### Basic API Calls

```javascript
import { authApi, productApi, cartApi, orderApi } from '@/api';

// Get current user (cached for 1 minute)
const user = await authApi.getMe();

// Get products (cached for 5 minutes)
const products = await productApi.getProducts({ page: 1, limit: 20 });

// Get cart (cached for 1 minute)
const cart = await cartApi.getCart();
```

### Bypassing Cache

```javascript
// Force fresh data by skipping cache
const freshUser = await authApi.getMe({ skipCache: true });

// Skip cache for specific product request
const product = await productApi.getProductById(123, { skipCache: true });
```

### Custom Timeout

```javascript
import { axiosInstance } from '@/api/axiosConfig';

// Custom request with longer timeout
const response = await axiosInstance.get('/api/large-report', {
  timeout: 60000, // 60 seconds
  cacheTTL: 300000 // Cache for 5 minutes
});
```

### File Upload with Progress

```javascript
// Upload file with special timeout
const formData = new FormData();
formData.append('file', file);

const response = await axiosInstance.post('/upload', formData, {
  uploadFile: true, // Uses 2-minute timeout
  headers: {
    'Content-Type': 'multipart/form-data'
  },
  onUploadProgress: (progressEvent) => {
    const percentCompleted = Math.round(
      (progressEvent.loaded * 100) / progressEvent.total
    );
    console.log(`Upload progress: ${percentCompleted}%`);
  }
});
```

### Batch Fetching

```javascript
import { batchFetch, authApi, cartApi, orderApi } from '@/api';

// Fetch multiple resources in parallel
const results = await batchFetch([
  () => authApi.getMe(),
  () => cartApi.getCart(),
  () => orderApi.getMyOrders({ page: 1, limit: 5 })
]);

// Results include success/failure status
results.forEach((result, index) => {
  if (result.success) {
    console.log(`Request ${index} succeeded:`, result.data);
  } else {
    console.error(`Request ${index} failed:`, result.error);
  }
});
```

### Prefetching

```javascript
import { prefetch } from '@/api';

// Prefetch product details before navigation
async function navigateToProduct(productId) {
  // Start prefetching in background
  prefetch.productDetails(productId);

  // Navigate to product page
  navigate(`/products/${productId}`);
  // Data will be available from cache when page loads
}

// Prefetch dashboard data
async function navigateToDashboard() {
  prefetch.userDashboard();
  navigate('/dashboard');
}

// Prefetch homepage data
async function navigateToHome() {
  prefetch.homepage();
  navigate('/');
}
```

### Manual Cache Invalidation

```javascript
import { invalidateCache, axiosInstance } from '@/api';

// Invalidate specific cache areas
invalidateCache.products(); // Clear product caches
invalidateCache.cart();      // Clear cart caches
invalidateCache.orders();    // Clear order caches
invalidateCache.auth();      // Clear auth caches
invalidateCache.all();       // Clear all caches

// Or use pattern matching
axiosInstance.clearCache('/products'); // Clear all product endpoints
axiosInstance.clearCache(/\/products\/\d+/); // Clear specific product pattern
```

### Disable Request Cancellation

```javascript
// By default, previous requests to same endpoint are cancelled
// To disable this behavior:
const response = await axiosInstance.get('/api/data', {
  cancellable: false
});
```

### Disable Retry Logic

```javascript
// For operations that shouldn't be retried
const response = await axiosInstance.post('/auth/login', credentials, {
  skipRetry: true
});
```

### Custom Request with All Options

```javascript
const response = await axiosInstance.get('/api/complex-operation', {
  // Request config
  params: { filter: 'active' },

  // Cache config
  skipCache: false,
  cacheTTL: axiosInstance.CACHE_STRATEGIES.MEDIUM,

  // Deduplication
  skipDeduplication: false,

  // Cancellation
  cancellable: true,

  // Retry
  skipRetry: false,

  // Timeout
  timeout: 20000,

  // Special timeouts
  uploadFile: false,
  downloadFile: false,
  longPoll: false
});
```

## Performance Monitoring

### Get Metrics

```javascript
import { axiosInstance } from '@/api/axiosConfig';

// Get current performance metrics
const metrics = axiosInstance.getMetrics();

console.log(metrics);
/* Output:
{
  totalRequests: 150,
  cachedResponses: 45,
  deduplicatedRequests: 12,
  failedRequests: 3,
  retriedRequests: 5,
  averageResponseTime: 234.5,
  responseTimes: [...],
  cache: {
    size: 67,
    maxSize: 100,
    entries: [...]
  },
  pendingRequests: 2,
  cacheHitRate: "30.00%",
  deduplicationRate: "8.00%",
  errorRate: "2.00%"
}
*/
```

### Reset Metrics

```javascript
// Reset all performance metrics
axiosInstance.resetMetrics();
```

### Cancel All Pending Requests

```javascript
// Useful when user navigates away or logs out
axiosInstance.cancelAll();
```

## React Integration Examples

### Using in Components

```javascript
import { useState, useEffect } from 'react';
import { productApi } from '@/api';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Automatically cached for 5 minutes
        const data = await productApi.getProducts();
        setProducts(data.data.products);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div>
      {loading ? 'Loading...' : products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### Custom Hook with Caching

```javascript
import { useState, useEffect } from 'react';
import { axiosInstance } from '@/api/axiosConfig';

function useApi(apiCall, deps = [], options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiCall();

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
      // Cancel request on unmount if needed
      if (options.cancelOnUnmount) {
        axiosInstance.cancelAll();
      }
    };
  }, deps);

  return { data, loading, error };
}

// Usage
function ProductDetails({ productId }) {
  const { data, loading, error } = useApi(
    () => productApi.getProductById(productId),
    [productId],
    { cancelOnUnmount: true }
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{data?.name}</div>;
}
```

### Mutation with Cache Invalidation

```javascript
import { useState } from 'react';
import { cartApi } from '@/api';

function AddToCartButton({ productId, quantity }) {
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async () => {
    try {
      setLoading(true);
      // Automatically invalidates cart cache
      await cartApi.addToCart({ productId, quantity });

      // Show success message
      toast.success('Added to cart!');
    } catch (error) {
      toast.error('Failed to add to cart');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleAddToCart} disabled={loading}>
      {loading ? 'Adding...' : 'Add to Cart'}
    </button>
  );
}
```

## Best Practices

### 1. Cache Strategy Selection

- Use **SHORT** (1 min) for frequently changing data (cart, notifications)
- Use **MEDIUM** (5 min) for moderately static data (products, user profile)
- Use **LONG** (15 min) for rarely changing data (featured products)
- Use **VERY_LONG** (1 hour) for very static data (categories, settings)

### 2. Cache Invalidation

- Always invalidate related caches after mutations
- Use pattern matching for bulk invalidation
- Clear all caches on login/logout

### 3. Error Handling

- Retry logic is automatic for safe methods (GET, PUT, HEAD, DELETE, OPTIONS)
- Disable retry for sensitive operations (login, payment, order creation)
- Always handle errors in your components

### 4. Performance Optimization

- Use prefetching for predictable navigation patterns
- Batch multiple independent requests
- Monitor metrics in development to tune cache strategies

### 5. Request Cancellation

- Requests are automatically cancelled when new request to same endpoint is made
- Cancel all requests on logout or major navigation
- Disable cancellation for long-running operations

### 6. Deduplication

- Automatic for GET requests
- Prevents multiple identical requests in flight
- Can be disabled with `skipDeduplication: true`

## Configuration

### Adjusting Cache Size

```javascript
// In axiosConfig.js, modify:
const CACHE_CONFIG = {
  MAX_CACHE_SIZE: 200, // Increase from 100 to 200
  // ...
};
```

### Adjusting Retry Configuration

```javascript
// In axiosConfig.js, modify:
const RETRY_CONFIG = {
  MAX_RETRIES: 5,        // Increase from 3 to 5
  INITIAL_DELAY: 500,    // Start with 500ms
  MAX_DELAY: 15000,      // Max 15 seconds
  // ...
};
```

### Custom Timeout Values

```javascript
// In axiosConfig.js, modify:
const TIMEOUTS = {
  DEFAULT: 45000,     // 45 seconds
  UPLOAD: 180000,     // 3 minutes
  DOWNLOAD: 180000,   // 3 minutes
  LONG_POLL: 600000   // 10 minutes
};
```

## Troubleshooting

### Cache Not Working

```javascript
// Check if cache is enabled
console.log(axiosInstance.getMetrics());

// Verify request is cacheable (GET/HEAD)
// Verify not using skipCache: true
```

### Requests Being Cancelled

```javascript
// If you don't want cancellation
const response = await axiosInstance.get('/api/data', {
  cancellable: false
});
```

### Too Many Retries

```javascript
// Disable retry for specific request
const response = await axiosInstance.post('/api/data', data, {
  skipRetry: true
});
```

### Performance Monitoring in Development

```javascript
// Add to your app initialization
if (import.meta.env.DEV) {
  setInterval(() => {
    console.table(axiosInstance.getMetrics());
  }, 10000); // Log metrics every 10 seconds
}
```

## API Reference

### axiosInstance Methods

- `axiosInstance.clearCache(pattern?)` - Clear cache
- `axiosInstance.cancelAll()` - Cancel all pending requests
- `axiosInstance.getMetrics()` - Get performance metrics
- `axiosInstance.resetMetrics()` - Reset metrics
- `axiosInstance.CACHE_STRATEGIES` - Cache TTL constants

### Cache Manager Methods

```javascript
import { cacheManager } from '@/api/axiosConfig';

cacheManager.get(config)           // Get cached response
cacheManager.set(config, data, ttl) // Set cache
cacheManager.invalidate(pattern)   // Invalidate by pattern
cacheManager.clear()               // Clear all
cacheManager.getStats()            // Get cache statistics
```

### invalidateCache Methods

```javascript
import { invalidateCache } from '@/api';

invalidateCache.auth()     // Clear auth caches
invalidateCache.products() // Clear product caches
invalidateCache.cart()     // Clear cart caches
invalidateCache.orders()   // Clear order caches
invalidateCache.all()      // Clear all caches
```

## Migration from Old API

### Before

```javascript
import axiosInstance from './axiosConfig';

const response = await axiosInstance.get('/products');
const data = response.data;
```

### After

```javascript
import { productApi } from '@/api';

// Automatically optimized with caching, deduplication, retry, etc.
const data = await productApi.getProducts();
```

## Performance Gains

Expected improvements with all optimizations:

- **30-50% reduction** in API calls through caching and deduplication
- **Faster page loads** through prefetching
- **Better reliability** through automatic retries
- **Reduced server load** through request batching
- **Better UX** through request cancellation and proper timeouts

## Support

For issues or questions:
1. Check the metrics with `axiosInstance.getMetrics()`
2. Review console for error messages
3. Verify configuration in axiosConfig.js
4. Check network tab for actual request behavior
