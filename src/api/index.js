import axiosInstance, { cacheManager } from './axiosConfig';

/**
 * Optimized API Layer
 * Features:
 * - Smart caching with TTL strategies
 * - Request deduplication
 * - Request cancellation support
 * - Automatic retry logic
 * - Performance tracking
 * - Cache invalidation helpers
 */

// ============================================================================
// Cache Invalidation Helpers
// ============================================================================

/**
 * Invalidate related caches after mutations
 */
const invalidateCache = {
  auth: () => {
    cacheManager.invalidate('/auth');
  },
  products: () => {
    cacheManager.invalidate('/products');
  },
  cart: () => {
    cacheManager.invalidate('/cart');
  },
  orders: () => {
    cacheManager.invalidate('/orders');
  },
  all: () => {
    cacheManager.clear();
  }
};

// ============================================================================
// Authentication API
// ============================================================================

export const authApi = {
  /**
   * Register a new user
   * No caching - mutation operation
   */
  register: async (userData) => {
    const response = await axiosInstance.post('/auth/register', userData, {
      skipCache: true,
      skipRetry: true, // Don't retry registration attempts
      timeout: 15000
    });
    return response.data;
  },

  /**
   * Login user
   * No caching - mutation operation
   */
  login: async (credentials) => {
    const response = await axiosInstance.post('/auth/login', credentials, {
      skipCache: true,
      skipRetry: true, // Don't retry login attempts
      timeout: 15000
    });

    // Invalidate all caches on login
    invalidateCache.all();

    return response.data;
  },

  /**
   * Logout user
   * No caching - mutation operation
   */
  logout: async () => {
    const response = await axiosInstance.post('/auth/logout', null, {
      skipCache: true,
      skipRetry: false,
      timeout: 10000
    });

    // Clear all caches on logout
    invalidateCache.all();

    return response.data;
  },

  /**
   * Get current user profile
   * Short-term caching (1 minute)
   */
  getMe: async (options = {}) => {
    const response = await axiosInstance.get('/auth/me', {
      cacheTTL: axiosInstance.CACHE_STRATEGIES.SHORT,
      skipCache: options.skipCache || false,
      timeout: 10000
    });
    return response.data;
  },

  /**
   * Refresh authentication token
   * No caching - mutation operation
   */
  refreshToken: async (refreshToken) => {
    const response = await axiosInstance.post('/auth/refresh',
      { refreshToken },
      {
        skipCache: true,
        skipRetry: true,
        timeout: 10000
      }
    );
    return response.data;
  },

  /**
   * Update user profile
   * No caching - mutation operation
   */
  updateProfile: async (userData) => {
    const response = await axiosInstance.put('/auth/profile', userData, {
      skipCache: true,
      timeout: 15000
    });

    // Invalidate auth cache
    invalidateCache.auth();

    return response.data;
  },

  /**
   * Change password
   * No caching - mutation operation
   */
  changePassword: async (passwordData) => {
    const response = await axiosInstance.put('/auth/change-password', passwordData, {
      skipCache: true,
      skipRetry: false,
      timeout: 15000
    });

    // Invalidate auth cache after password change
    invalidateCache.auth();

    return response.data;
  }
};

// ============================================================================
// Product API
// ============================================================================

export const productApi = {
  /**
   * Get products with filters and pagination
   * Medium-term caching (5 minutes)
   */
  getProducts: async (params = {}, options = {}) => {
    const response = await axiosInstance.get('/products', {
      params,
      cacheTTL: axiosInstance.CACHE_STRATEGIES.MEDIUM,
      skipCache: options.skipCache || false,
      timeout: 20000
    });
    return response.data;
  },

  /**
   * Get featured products
   * Long-term caching (15 minutes)
   */
  getFeaturedProducts: async (options = {}) => {
    const response = await axiosInstance.get('/products/featured', {
      cacheTTL: axiosInstance.CACHE_STRATEGIES.LONG,
      skipCache: options.skipCache || false,
      timeout: 20000
    });
    return response.data;
  },

  /**
   * Get trending products
   * Long-term caching (15 minutes)
   */
  getTrendingProducts: async (options = {}) => {
    const response = await axiosInstance.get('/products/trending', {
      cacheTTL: axiosInstance.CACHE_STRATEGIES.LONG,
      skipCache: options.skipCache || false,
      timeout: 20000
    });
    return response.data;
  },

  /**
   * Get product by ID
   * Medium-term caching (5 minutes)
   */
  getProductById: async (id, options = {}) => {
    if (!id) {
      throw new Error('Product ID is required');
    }

    const response = await axiosInstance.get(`/products/${id}`, {
      cacheTTL: axiosInstance.CACHE_STRATEGIES.MEDIUM,
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  },

  /**
   * Search products
   * Short-term caching (1 minute) - search results change frequently
   */
  searchProducts: async (query, params = {}, options = {}) => {
    const response = await axiosInstance.get('/products/search', {
      params: { q: query, ...params },
      cacheTTL: axiosInstance.CACHE_STRATEGIES.SHORT,
      skipCache: options.skipCache || false,
      timeout: 20000
    });
    return response.data;
  },

  /**
   * Get product categories
   * Very long-term caching (1 hour) - categories rarely change
   */
  getCategories: async (options = {}) => {
    const response = await axiosInstance.get('/products/categories', {
      cacheTTL: axiosInstance.CACHE_STRATEGIES.VERY_LONG,
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  },

  /**
   * Get products by category
   * Medium-term caching (5 minutes)
   */
  getProductsByCategory: async (categoryId, params = {}, options = {}) => {
    const response = await axiosInstance.get(`/products/category/${categoryId}`, {
      params,
      cacheTTL: axiosInstance.CACHE_STRATEGIES.MEDIUM,
      skipCache: options.skipCache || false,
      timeout: 20000
    });
    return response.data;
  },

  /**
   * Get related products
   * Long-term caching (15 minutes)
   */
  getRelatedProducts: async (productId, options = {}) => {
    const response = await axiosInstance.get(`/products/${productId}/related`, {
      cacheTTL: axiosInstance.CACHE_STRATEGIES.LONG,
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  },

  /**
   * Get product reviews
   * Short-term caching (1 minute) - reviews update frequently
   */
  getProductReviews: async (productId, params = {}, options = {}) => {
    const response = await axiosInstance.get(`/products/${productId}/reviews`, {
      params,
      cacheTTL: axiosInstance.CACHE_STRATEGIES.SHORT,
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  },

  /**
   * Get similar products
   * Long-term caching (15 minutes)
   */
  getSimilarProducts: async (productId, limit = 8, options = {}) => {
    const response = await axiosInstance.get(`/products/${productId}/recommendations`, {
      params: { limit },
      cacheTTL: axiosInstance.CACHE_STRATEGIES.LONG,
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  },

  /**
   * Get frequently bought together products
   * Long-term caching (15 minutes)
   */
  getFrequentlyBoughtTogether: async (productId, limit = 6, options = {}) => {
    const response = await axiosInstance.get(`/products/${productId}/frequently-bought`, {
      params: { limit },
      cacheTTL: axiosInstance.CACHE_STRATEGIES.LONG,
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  },

  /**
   * Get personalized product recommendations
   * Medium-term caching (5 minutes)
   */
  getRecommendations: async (limit = 10, options = {}) => {
    const response = await axiosInstance.get('/products/recommended', {
      params: { limit },
      cacheTTL: axiosInstance.CACHE_STRATEGIES.MEDIUM,
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  },

  /**
   * Get trending products now
   * Long-term caching (15 minutes)
   */
  getTrendingNow: async (limit = 10, options = {}) => {
    const response = await axiosInstance.get('/products/trending-now', {
      params: { limit },
      cacheTTL: axiosInstance.CACHE_STRATEGIES.LONG,
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  },

  /**
   * Get new arrivals
   * Long-term caching (15 minutes)
   */
  getNewArrivals: async (limit = 10, options = {}) => {
    const response = await axiosInstance.get('/products/new-arrivals', {
      params: { limit },
      cacheTTL: axiosInstance.CACHE_STRATEGIES.LONG,
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  },

  /**
   * Get best sellers
   * Long-term caching (15 minutes)
   */
  getBestSellers: async (limit = 10, options = {}) => {
    const response = await axiosInstance.get('/products/best-sellers', {
      params: { limit },
      cacheTTL: axiosInstance.CACHE_STRATEGIES.LONG,
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  }
};

// ============================================================================
// Review API
// ============================================================================

export const reviewApi = {
  /**
   * Get reviews for a product
   * Short-term caching (1 minute)
   */
  getReviews: async (productId, params = {}, options = {}) => {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    const response = await axiosInstance.get(`/products/${productId}/reviews`, {
      params,
      cacheTTL: axiosInstance.CACHE_STRATEGIES.SHORT,
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  },

  /**
   * Get review statistics for a product
   * Short-term caching (1 minute)
   */
  getReviewStats: async (productId, options = {}) => {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    const response = await axiosInstance.get(`/products/${productId}/reviews/stats`, {
      cacheTTL: axiosInstance.CACHE_STRATEGIES.SHORT,
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  },

  /**
   * Submit a review for a product
   * No caching - mutation operation
   */
  submitReview: async (productId, reviewData) => {
    if (!productId) {
      throw new Error('Product ID is required');
    }
    if (!reviewData || !reviewData.rating) {
      throw new Error('Rating is required');
    }

    const response = await axiosInstance.post(`/products/${productId}/reviews`, reviewData, {
      skipCache: true,
      timeout: 15000
    });

    // Invalidate product and review cache
    invalidateCache.products();

    return response.data;
  },

  /**
   * Update a review
   * No caching - mutation operation
   */
  updateReview: async (productId, reviewId, reviewData) => {
    if (!productId || !reviewId) {
      throw new Error('Product ID and Review ID are required');
    }

    const response = await axiosInstance.put(`/products/${productId}/reviews/${reviewId}`, reviewData, {
      skipCache: true,
      timeout: 15000
    });

    // Invalidate product and review cache
    invalidateCache.products();

    return response.data;
  },

  /**
   * Delete a review
   * No caching - mutation operation
   */
  deleteReview: async (productId, reviewId) => {
    if (!productId || !reviewId) {
      throw new Error('Product ID and Review ID are required');
    }

    const response = await axiosInstance.delete(`/products/${productId}/reviews/${reviewId}`, {
      skipCache: true,
      timeout: 10000
    });

    // Invalidate product and review cache
    invalidateCache.products();

    return response.data;
  },

  /**
   * Mark a review as helpful
   * No caching - mutation operation
   */
  markReviewHelpful: async (productId, reviewId) => {
    if (!productId || !reviewId) {
      throw new Error('Product ID and Review ID are required');
    }

    const response = await axiosInstance.post(`/products/${productId}/reviews/${reviewId}/helpful`, null, {
      skipCache: true,
      timeout: 10000
    });

    return response.data;
  },

  /**
   * Report a review
   * No caching - mutation operation
   */
  reportReview: async (productId, reviewId, reason) => {
    if (!productId || !reviewId) {
      throw new Error('Product ID and Review ID are required');
    }

    const response = await axiosInstance.post(`/products/${productId}/reviews/${reviewId}/report`,
      { reason },
      {
        skipCache: true,
        timeout: 10000
      }
    );

    return response.data;
  }
};

// ============================================================================
// Cart API
// ============================================================================

export const cartApi = {
  /**
   * Get user's cart
   * Short-term caching (1 minute) - cart changes frequently
   */
  getCart: async (options = {}) => {
    const response = await axiosInstance.get('/cart', {
      cacheTTL: axiosInstance.CACHE_STRATEGIES.SHORT,
      skipCache: options.skipCache || false,
      timeout: 10000
    });
    return response.data;
  },

  /**
   * Add item to cart
   * No caching - mutation operation
   */
  addToCart: async (item) => {
    if (!item || !item.productId) {
      throw new Error('Product ID is required');
    }

    const response = await axiosInstance.post('/cart', item, {
      skipCache: true,
      timeout: 15000
    });

    // Invalidate cart cache
    invalidateCache.cart();

    return response.data;
  },

  /**
   * Update cart item quantity
   * No caching - mutation operation
   */
  updateCartItem: async (itemId, quantity) => {
    if (!itemId) {
      throw new Error('Item ID is required');
    }
    if (quantity < 0) {
      throw new Error('Quantity must be positive');
    }

    const response = await axiosInstance.put(`/cart/${itemId}`,
      { quantity },
      {
        skipCache: true,
        timeout: 10000
      }
    );

    // Invalidate cart cache
    invalidateCache.cart();

    return response.data;
  },

  /**
   * Remove item from cart
   * No caching - mutation operation
   */
  removeFromCart: async (itemId) => {
    if (!itemId) {
      throw new Error('Item ID is required');
    }

    const response = await axiosInstance.delete(`/cart/${itemId}`, {
      skipCache: true,
      timeout: 10000
    });

    // Invalidate cart cache
    invalidateCache.cart();

    return response.data;
  },

  /**
   * Clear entire cart
   * No caching - mutation operation
   */
  clearCart: async () => {
    const response = await axiosInstance.delete('/cart', {
      skipCache: true,
      timeout: 10000
    });

    // Invalidate cart cache
    invalidateCache.cart();

    return response.data;
  },

  /**
   * Apply coupon code to cart
   * No caching - mutation operation
   */
  applyCoupon: async (couponCode) => {
    const response = await axiosInstance.post('/cart/coupon',
      { code: couponCode },
      {
        skipCache: true,
        timeout: 10000
      }
    );

    // Invalidate cart cache
    invalidateCache.cart();

    return response.data;
  },

  /**
   * Remove coupon from cart
   * No caching - mutation operation
   */
  removeCoupon: async () => {
    const response = await axiosInstance.delete('/cart/coupon', {
      skipCache: true,
      timeout: 10000
    });

    // Invalidate cart cache
    invalidateCache.cart();

    return response.data;
  }
};

// ============================================================================
// Order API
// ============================================================================

export const orderApi = {
  /**
   * Create new order
   * No caching - mutation operation
   */
  createOrder: async (orderData) => {
    if (!orderData) {
      throw new Error('Order data is required');
    }

    const response = await axiosInstance.post('/orders', orderData, {
      skipCache: true,
      skipRetry: true, // Don't retry order creation
      timeout: 30000
    });

    // Invalidate cart and order caches
    invalidateCache.cart();
    invalidateCache.orders();

    return response.data;
  },

  /**
   * Get user's orders with filters
   * Short-term caching (1 minute)
   */
  getMyOrders: async (params = {}, options = {}) => {
    const response = await axiosInstance.get('/orders', {
      params,
      cacheTTL: axiosInstance.CACHE_STRATEGIES.SHORT,
      skipCache: options.skipCache || false,
      timeout: 20000
    });
    return response.data;
  },

  /**
   * Advanced search orders with filters (User)
   * Short-term caching (30 seconds)
   */
  searchOrders: async (queryString = '', options = {}) => {
    const response = await axiosInstance.get(`/orders/search?${queryString}`, {
      cacheTTL: 30000, // 30 seconds cache
      skipCache: options.skipCache || false,
      timeout: 20000
    });
    return response.data;
  },

  /**
   * Get order by ID
   * Short-term caching (1 minute) - order status changes
   */
  getOrderById: async (id, options = {}) => {
    if (!id) {
      throw new Error('Order ID is required');
    }

    const response = await axiosInstance.get(`/orders/${id}`, {
      cacheTTL: axiosInstance.CACHE_STRATEGIES.SHORT,
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  },

  /**
   * Cancel order (legacy method - kept for backward compatibility)
   * No caching - mutation operation
   */
  cancelOrder: async (id, reason = '') => {
    if (!id) {
      throw new Error('Order ID is required');
    }

    const response = await axiosInstance.put(`/orders/${id}/cancel`,
      { reason },
      {
        skipCache: true,
        timeout: 15000
      }
    );

    // Invalidate order cache
    invalidateCache.orders();

    return response.data;
  },

  /**
   * Request order cancellation (comprehensive system)
   * No caching - mutation operation
   */
  requestCancellation: async (orderId, cancellationData) => {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    if (!cancellationData.reason) {
      throw new Error('Cancellation reason is required');
    }

    const response = await axiosInstance.post(`/orders/${orderId}/cancel`, cancellationData, {
      skipCache: true,
      timeout: 15000
    });

    invalidateCache.orders();
    return response.data;
  },

  /**
   * Request partial order cancellation
   * No caching - mutation operation
   */
  requestPartialCancellation: async (orderId, cancellationData) => {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    if (!cancellationData.items || !Array.isArray(cancellationData.items) || cancellationData.items.length === 0) {
      throw new Error('Items to cancel are required');
    }

    const response = await axiosInstance.post(`/orders/${orderId}/cancel-items`, cancellationData, {
      skipCache: true,
      timeout: 15000
    });

    invalidateCache.orders();
    return response.data;
  },

  /**
   * Check if order can be cancelled
   * Short-term caching
   */
  checkCancellationEligibility: async (orderId, options = {}) => {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const response = await axiosInstance.get(`/orders/${orderId}/can-cancel`, {
      cacheTTL: axiosInstance.CACHE_STRATEGIES.SHORT,
      skipCache: options.skipCache || false,
      timeout: 10000
    });

    return response.data;
  },

  /**
   * Modify order (items, address, quantities)
   * No caching - mutation operation
   */
  modifyOrder: async (id, modificationData) => {
    if (!id) {
      throw new Error('Order ID is required');
    }
    if (!modificationData || Object.keys(modificationData).length === 0) {
      throw new Error('Modification data is required');
    }

    const response = await axiosInstance.put(`/orders/${id}/modify`, modificationData, {
      skipCache: true,
      timeout: 30000 // Longer timeout for complex operations
    });

    // Invalidate order cache
    invalidateCache.orders();
    // May need to invalidate cart if items were added
    if (modificationData.itemsToAdd) {
      invalidateCache.cart();
    }

    return response.data;
  },

  /**
   * Get order tracking information
   * Short-term caching (1 minute)
   */
  trackOrder: async (id, options = {}) => {
    if (!id) {
      throw new Error('Order ID is required');
    }

    const response = await axiosInstance.get(`/orders/${id}/tracking`, {
      cacheTTL: axiosInstance.CACHE_STRATEGIES.SHORT,
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  },

  /**
   * Track order by tracking number (public endpoint)
   * Short-term caching (1 minute)
   */
  trackByTrackingNumber: async (trackingNumber, options = {}) => {
    if (!trackingNumber) {
      throw new Error('Tracking number is required');
    }

    const response = await axiosInstance.get(`/orders/track/${trackingNumber}`, {
      cacheTTL: axiosInstance.CACHE_STRATEGIES.SHORT,
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  },

  /**
   * Get shipment details with full tracking history
   * Short-term caching (1 minute)
   */
  getShipmentDetails: async (orderId, options = {}) => {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const response = await axiosInstance.get(`/orders/${orderId}/shipment`, {
      cacheTTL: axiosInstance.CACHE_STRATEGIES.SHORT,
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  },

  /**
   * Get all user shipments
   * Short-term caching (1 minute)
   */
  getMyShipments: async (params = {}, options = {}) => {
    const response = await axiosInstance.get('/orders/shipments', {
      params,
      cacheTTL: axiosInstance.CACHE_STRATEGIES.SHORT,
      skipCache: options.skipCache || false,
      timeout: 20000
    });
    return response.data;
  },

  /**
   * Get order invoice
   * Medium-term caching (5 minutes) - invoices don't change
   */
  getOrderInvoice: async (id, options = {}) => {
    if (!id) {
      throw new Error('Order ID is required');
    }

    const response = await axiosInstance.get(`/orders/${id}/invoice`, {
      cacheTTL: axiosInstance.CACHE_STRATEGIES.MEDIUM,
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  },

  /**
   * Reorder previous order
   * No caching - mutation operation
   */
  reorder: async (orderId) => {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const response = await axiosInstance.post(`/orders/${orderId}/reorder`, null, {
      skipCache: true,
      timeout: 20000
    });

    // Invalidate cart cache
    invalidateCache.cart();

    return response.data;
  },

  /**
   * Get order timeline
   * Short-term caching (1 minute)
   */
  getOrderTimeline: async (orderId, options = {}) => {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const response = await axiosInstance.get(`/orders/${orderId}/timeline`, {
      params: options.params || {},
      cacheTTL: axiosInstance.CACHE_STRATEGIES.SHORT,
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  },

  /**
   * Get order milestones
   * Short-term caching (1 minute)
   */
  getOrderMilestones: async (orderId, options = {}) => {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const response = await axiosInstance.get(`/orders/${orderId}/timeline/milestones`, {
      cacheTTL: axiosInstance.CACHE_STRATEGIES.SHORT,
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  },

  /**
   * Add note to order timeline
   * No caching - mutation operation
   */
  addOrderNote: async (orderId, note, isImportant = false) => {
    if (!orderId) {
      throw new Error('Order ID is required');
    }
    if (!note) {
      throw new Error('Note is required');
    }

    const response = await axiosInstance.post(`/orders/${orderId}/timeline/note`, {
      note,
      isImportant
    }, {
      skipCache: true,
      timeout: 15000
    });

    // Invalidate order cache
    invalidateCache.orders();

    return response.data;
  },

  /**
   * Get order activity logs (Admin only)
   * Short-term caching (1 minute)
   */
  getOrderActivityLogs: async (orderId, options = {}) => {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const response = await axiosInstance.get(`/orders/${orderId}/activity-logs`, {
      params: options.params || {},
      cacheTTL: axiosInstance.CACHE_STRATEGIES.SHORT,
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  },

  /**
   * Export order timeline as PDF
   * No caching
   */
  exportTimelinePDF: async (orderId) => {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const response = await axiosInstance.get(`/orders/${orderId}/timeline/export/pdf`, {
      skipCache: true,
      timeout: 20000
    });
    return response.data;
  },

  /**
   * Get timeline summary for multiple orders
   * Short-term caching (1 minute)
   */
  getTimelineSummary: async (orderIds, options = {}) => {
    if (!orderIds || !Array.isArray(orderIds)) {
      throw new Error('Order IDs array is required');
    }

    const response = await axiosInstance.get('/orders/timeline/summary', {
      params: { orderIds: orderIds.join(',') },
      cacheTTL: axiosInstance.CACHE_STRATEGIES.SHORT,
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  }
};

// ============================================================================
// Payment API
// ============================================================================

/**
 * ============================================
 * RETURN API
 * ============================================
 */
export const returnApi = {
  /**
   * Create return request
   * No caching - mutation operation
   */
  createReturnRequest: async (returnData) => {
    if (!returnData) {
      throw new Error('Return data is required');
    }

    const response = await axiosInstance.post('/returns', returnData, {
      skipCache: true,
      timeout: 30000
    });

    // Invalidate order and return caches
    invalidateCache.orders();
    invalidateCache.custom('returns');

    return response.data;
  },

  /**
   * Get user's returns with filters
   * Short-term caching (1 minute)
   */
  getUserReturns: async (params = {}, options = {}) => {
    const response = await axiosInstance.get('/returns', {
      params,
      cacheTTL: axiosInstance.CACHE_STRATEGIES.SHORT,
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  },

  /**
   * Get return by ID
   * Short-term caching (1 minute)
   */
  getReturnById: async (id, options = {}) => {
    if (!id) {
      throw new Error('Return ID is required');
    }

    const response = await axiosInstance.get(`/returns/${id}`, {
      cacheTTL: axiosInstance.CACHE_STRATEGIES.SHORT,
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  },

  /**
   * Check return eligibility for order
   * Short-term caching (1 minute)
   */
  checkReturnEligibility: async (orderId, options = {}) => {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const response = await axiosInstance.get(`/returns/check-eligibility/${orderId}`, {
      cacheTTL: axiosInstance.CACHE_STRATEGIES.SHORT,
      skipCache: options.skipCache || false,
      timeout: 10000
    });
    return response.data;
  },

  /**
   * Cancel return request
   * No caching - mutation operation
   */
  cancelReturnRequest: async (id, reason = '') => {
    if (!id) {
      throw new Error('Return ID is required');
    }

    const response = await axiosInstance.post(`/returns/${id}/cancel`,
      { reason },
      {
        skipCache: true,
        timeout: 15000
      }
    );

    // Invalidate return cache
    invalidateCache.custom('returns');

    return response.data;
  }
};
export const paymentApi = {
  /**
   * Get payment methods
   * Medium-term caching (5 minutes)
   */
  getPaymentMethods: async (options = {}) => {
    const response = await axiosInstance.get('/payments/methods', {
      cacheTTL: axiosInstance.CACHE_STRATEGIES.MEDIUM,
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  },

  /**
   * Create payment intent
   * No caching - mutation operation
   */
  createPaymentIntent: async (paymentData) => {
    const response = await axiosInstance.post('/payments/intent', paymentData, {
      skipCache: true,
      skipRetry: true,
      timeout: 30000
    });
    return response.data;
  },

  /**
   * Confirm payment
   * No caching - mutation operation
   */
  confirmPayment: async (paymentId, confirmationData) => {
    const response = await axiosInstance.post(`/payments/${paymentId}/confirm`,
      confirmationData,
      {
        skipCache: true,
        skipRetry: true,
        timeout: 30000
      }
    );

    // Invalidate order cache after payment
    invalidateCache.orders();

    return response.data;
  },

  /**
   * Get payment status
   * No caching - always get fresh status
   */
  getPaymentStatus: async (paymentId) => {
    const response = await axiosInstance.get(`/payments/${paymentId}/status`, {
      skipCache: true,
      timeout: 15000
    });
    return response.data;
  }
};

// ============================================================================
// Wishlist API
// ============================================================================

export const wishlistApi = {
  /**
   * Get user's wishlist
   * Short-term caching (1 minute)
   */
  getWishlist: async (options = {}) => {
    const response = await axiosInstance.get('/wishlist', {
      cacheTTL: axiosInstance.CACHE_STRATEGIES.SHORT,
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  },

  /**
   * Add item to wishlist
   * No caching - mutation operation
   */
  addToWishlist: async (productId) => {
    const response = await axiosInstance.post('/wishlist',
      { productId },
      {
        skipCache: true,
        timeout: 10000
      }
    );

    // Invalidate wishlist cache
    cacheManager.invalidate('/wishlist');

    return response.data;
  },

  /**
   * Remove item from wishlist
   * No caching - mutation operation
   */
  removeFromWishlist: async (productId) => {
    const response = await axiosInstance.delete(`/wishlist/${productId}`, {
      skipCache: true,
      timeout: 10000
    });

    // Invalidate wishlist cache
    cacheManager.invalidate('/wishlist');

    return response.data;
  }
};

// ============================================================================
// Address API
// ============================================================================

export const addressApi = {
  /**
   * Get user's addresses
   * Medium-term caching (5 minutes)
   */
  getAddresses: async (options = {}) => {
    const response = await axiosInstance.get('/addresses', {
      cacheTTL: axiosInstance.CACHE_STRATEGIES.MEDIUM,
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  },

  /**
   * Add new address
   * No caching - mutation operation
   */
  addAddress: async (addressData) => {
    const response = await axiosInstance.post('/addresses', addressData, {
      skipCache: true,
      timeout: 15000
    });

    // Invalidate address cache
    cacheManager.invalidate('/addresses');

    return response.data;
  },

  /**
   * Update address
   * No caching - mutation operation
   */
  updateAddress: async (id, addressData) => {
    const response = await axiosInstance.put(`/addresses/${id}`, addressData, {
      skipCache: true,
      timeout: 15000
    });

    // Invalidate address cache
    cacheManager.invalidate('/addresses');

    return response.data;
  },

  /**
   * Delete address
   * No caching - mutation operation
   */
  deleteAddress: async (id) => {
    const response = await axiosInstance.delete(`/addresses/${id}`, {
      skipCache: true,
      timeout: 10000
    });

    // Invalidate address cache
    cacheManager.invalidate('/addresses');

    return response.data;
  },

  /**
   * Set default address
   * No caching - mutation operation
   */
  setDefaultAddress: async (id) => {
    const response = await axiosInstance.put(`/addresses/${id}/default`, null, {
      skipCache: true,
      timeout: 10000
    });

    // Invalidate address cache
    cacheManager.invalidate('/addresses');

    return response.data;
  }
};

// ============================================================================
// Notification API
// ============================================================================

export { notificationApi } from './notificationApi';

// ============================================================================
// Banner API
// ============================================================================

export const bannerApi = {
  /**
   * Get active banners by position
   * Medium-term caching (10 minutes) - banners don't change frequently
   *
   * @param {string} position - Banner position ('hero', 'sidebar', 'carousel', 'grid')
   * @param {object} options - Additional options
   * @returns {Promise} - Promise resolving to banner data
   */
  getActiveBanners: async (position = 'all', options = {}) => {
    const response = await axiosInstance.get('/banners/active', {
      params: { position },
      cacheTTL: 600000, // 10 minutes TTL
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  },

  /**
   * Get all banners (admin)
   * Short-term caching (1 minute)
   */
  getAllBanners: async (params = {}, options = {}) => {
    const response = await axiosInstance.get('/banners', {
      params,
      cacheTTL: axiosInstance.CACHE_STRATEGIES.SHORT,
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  },

  /**
   * Get banner by ID
   * Medium-term caching (5 minutes)
   */
  getBannerById: async (id, options = {}) => {
    if (!id) {
      throw new Error('Banner ID is required');
    }

    const response = await axiosInstance.get(`/banners/${id}`, {
      cacheTTL: axiosInstance.CACHE_STRATEGIES.MEDIUM,
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  },

  /**
   * Create new banner (admin)
   * No caching - mutation operation
   */
  createBanner: async (bannerData) => {
    if (!bannerData) {
      throw new Error('Banner data is required');
    }

    const response = await axiosInstance.post('/banners', bannerData, {
      skipCache: true,
      timeout: 20000
    });

    // Invalidate banner cache
    cacheManager.invalidate('/banners');

    return response.data;
  },

  /**
   * Update banner (admin)
   * No caching - mutation operation
   */
  updateBanner: async (id, bannerData) => {
    if (!id) {
      throw new Error('Banner ID is required');
    }

    const response = await axiosInstance.put(`/banners/${id}`, bannerData, {
      skipCache: true,
      timeout: 20000
    });

    // Invalidate banner cache
    cacheManager.invalidate('/banners');

    return response.data;
  },

  /**
   * Delete banner (admin)
   * No caching - mutation operation
   */
  deleteBanner: async (id) => {
    if (!id) {
      throw new Error('Banner ID is required');
    }

    const response = await axiosInstance.delete(`/banners/${id}`, {
      skipCache: true,
      timeout: 10000
    });

    // Invalidate banner cache
    cacheManager.invalidate('/banners');

    return response.data;
  },

  /**
   * Toggle banner active status (admin)
   * No caching - mutation operation
   */
  toggleBannerStatus: async (id) => {
    if (!id) {
      throw new Error('Banner ID is required');
    }

    const response = await axiosInstance.patch(`/banners/${id}/toggle`, null, {
      skipCache: true,
      timeout: 10000
    });

    // Invalidate banner cache
    cacheManager.invalidate('/banners');

    return response.data;
  }
};

// ============================================================================
// Pincode API
// ============================================================================

export const pincodeApi = {
  /**
   * Check pincode serviceability
   * Short-term caching (1 minute) - pincode data doesn't change frequently
   */
  checkPincodeServiceability: async (pincode, options = {}) => {
    if (!pincode) {
      throw new Error('Pincode is required');
    }

    const response = await axiosInstance.post('/pincode/check',
      { pincode },
      {
        cacheTTL: axiosInstance.CACHE_STRATEGIES.SHORT,
        skipCache: options.skipCache || false,
        timeout: 15000
      }
    );

    return response.data;
  },

  /**
   * Check product delivery availability for a pincode
   * Short-term caching (1 minute)
   */
  checkProductDelivery: async (pincode, productId, options = {}) => {
    if (!pincode) {
      throw new Error('Pincode is required');
    }
    if (!productId) {
      throw new Error('Product ID is required');
    }

    const response = await axiosInstance.post('/pincode/check-product',
      { pincode, productId },
      {
        cacheTTL: axiosInstance.CACHE_STRATEGIES.SHORT,
        skipCache: options.skipCache || false,
        timeout: 15000
      }
    );

    return response.data;
  }
};

// ============================================================================
// Shipping API (User-facing tracking)
// ============================================================================

export const shippingApi = {
  /**
   * Get user's shipments
   * Short-term caching (1 minute) - shipment status changes frequently
   */
  getMyShipments: async (params = {}, options = {}) => {
    const response = await axiosInstance.get('/shipping/my-shipments', {
      params,
      cacheTTL: axiosInstance.CACHE_STRATEGIES.SHORT,
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  },

  /**
   * Track shipment by ID (authenticated)
   * Short-term caching (1 minute)
   */
  trackShipment: async (shipmentId, options = {}) => {
    if (!shipmentId) {
      throw new Error('Shipment ID is required');
    }

    const response = await axiosInstance.get(`/shipping/${shipmentId}/track`, {
      cacheTTL: axiosInstance.CACHE_STRATEGIES.SHORT,
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  },

  /**
   * Track shipment by tracking number (public - no auth required)
   * Short-term caching (1 minute)
   */
  trackByTrackingNumber: async (trackingNumber, options = {}) => {
    if (!trackingNumber) {
      throw new Error('Tracking number is required');
    }

    const response = await axiosInstance.get('/shipping/track', {
      params: { trackingNumber },
      cacheTTL: axiosInstance.CACHE_STRATEGIES.SHORT,
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  },

  /**
   * Get tracking history for a shipment
   * Short-term caching (1 minute)
   */
  getTrackingHistory: async (shipmentId, options = {}) => {
    if (!shipmentId) {
      throw new Error('Shipment ID is required');
    }

    const response = await axiosInstance.get(`/shipping/${shipmentId}/tracking-history`, {
      cacheTTL: axiosInstance.CACHE_STRATEGIES.SHORT,
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  },

  /**
   * Get shipment details by order ID
   * Short-term caching (1 minute)
   */
  getShipmentByOrderId: async (orderId, options = {}) => {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const response = await axiosInstance.get(`/shipping/order/${orderId}`, {
      cacheTTL: axiosInstance.CACHE_STRATEGIES.SHORT,
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  },

  /**
   * Get estimated delivery date
   * Medium-term caching (5 minutes)
   */
  getEstimatedDelivery: async (shipmentId, options = {}) => {
    if (!shipmentId) {
      throw new Error('Shipment ID is required');
    }

    const response = await axiosInstance.get(`/shipping/${shipmentId}/estimated-delivery`, {
      cacheTTL: axiosInstance.CACHE_STRATEGIES.MEDIUM,
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  },

  /**
   * Request delivery reschedule
   * No caching - mutation operation
   */
  requestReschedule: async (shipmentId, rescheduleData) => {
    if (!shipmentId) {
      throw new Error('Shipment ID is required');
    }

    const response = await axiosInstance.post(`/shipping/${shipmentId}/reschedule`, rescheduleData, {
      skipCache: true,
      timeout: 15000
    });

    // Invalidate shipment cache
    cacheManager.invalidate('/shipping');

    return response.data;
  },

  /**
   * Cancel shipment/delivery
   * No caching - mutation operation
   */
  cancelShipment: async (shipmentId, reason = '') => {
    if (!shipmentId) {
      throw new Error('Shipment ID is required');
    }

    const response = await axiosInstance.post(`/shipping/${shipmentId}/cancel`,
      { reason },
      {
        skipCache: true,
        timeout: 15000
      }
    );

    // Invalidate shipment cache
    cacheManager.invalidate('/shipping');

    return response.data;
  },

  /**
   * Report delivery issue
   * No caching - mutation operation
   */
  reportIssue: async (shipmentId, issueData) => {
    if (!shipmentId) {
      throw new Error('Shipment ID is required');
    }

    const response = await axiosInstance.post(`/shipping/${shipmentId}/report-issue`, issueData, {
      skipCache: true,
      timeout: 15000
    });

    return response.data;
  },

  /**
   * Confirm delivery receipt
   * No caching - mutation operation
   */
  confirmDelivery: async (shipmentId, confirmationData) => {
    if (!shipmentId) {
      throw new Error('Shipment ID is required');
    }

    const response = await axiosInstance.post(`/shipping/${shipmentId}/confirm-delivery`, confirmationData, {
      skipCache: true,
      timeout: 15000
    });

    // Invalidate shipment cache
    cacheManager.invalidate('/shipping');

    return response.data;
  },

  /**
   * Subscribe to shipment notifications
   * No caching - mutation operation
   */
  subscribeNotifications: async (shipmentId, notificationPreferences) => {
    if (!shipmentId) {
      throw new Error('Shipment ID is required');
    }

    const response = await axiosInstance.post(`/shipping/${shipmentId}/subscribe`, notificationPreferences, {
      skipCache: true,
      timeout: 10000
    });

    return response.data;
  },

  /**
   * Unsubscribe from shipment notifications
   * No caching - mutation operation
   */
  unsubscribeNotifications: async (shipmentId) => {
    if (!shipmentId) {
      throw new Error('Shipment ID is required');
    }

    const response = await axiosInstance.post(`/shipping/${shipmentId}/unsubscribe`, null, {
      skipCache: true,
      timeout: 10000
    });

    return response.data;
  },

  /**
   * Get delivery instructions
   * Medium-term caching (5 minutes)
   */
  getDeliveryInstructions: async (shipmentId, options = {}) => {
    if (!shipmentId) {
      throw new Error('Shipment ID is required');
    }

    const response = await axiosInstance.get(`/shipping/${shipmentId}/delivery-instructions`, {
      cacheTTL: axiosInstance.CACHE_STRATEGIES.MEDIUM,
      skipCache: options.skipCache || false,
      timeout: 10000
    });
    return response.data;
  },

  /**
   * Update delivery instructions
   * No caching - mutation operation
   */
  updateDeliveryInstructions: async (shipmentId, instructions) => {
    if (!shipmentId) {
      throw new Error('Shipment ID is required');
    }

    const response = await axiosInstance.put(`/shipping/${shipmentId}/delivery-instructions`,
      { instructions },
      {
        skipCache: true,
        timeout: 15000
      }
    );

    // Invalidate shipment cache
    cacheManager.invalidate('/shipping');

    return response.data;
  },

  /**
   * Get proof of delivery
   * Medium-term caching (5 minutes) - proof doesn't change once uploaded
   */
  getProofOfDelivery: async (shipmentId, options = {}) => {
    if (!shipmentId) {
      throw new Error('Shipment ID is required');
    }

    const response = await axiosInstance.get(`/shipping/${shipmentId}/proof-of-delivery`, {
      cacheTTL: axiosInstance.CACHE_STRATEGIES.MEDIUM,
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  },

  /**
   * Check delivery availability for pincode
   * Short-term caching (1 minute)
   */
  checkDeliveryAvailability: async (pincode, options = {}) => {
    if (!pincode) {
      throw new Error('Pincode is required');
    }

    const response = await axiosInstance.get('/shipping/check-availability', {
      params: { pincode },
      cacheTTL: axiosInstance.CACHE_STRATEGIES.SHORT,
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  },

  /**
   * Calculate shipping cost
   * Short-term caching (1 minute)
   */
  calculateShippingCost: async (shippingData, options = {}) => {
    const response = await axiosInstance.post('/shipping/calculate-cost', shippingData, {
      cacheTTL: axiosInstance.CACHE_STRATEGIES.SHORT,
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  },

  /**
   * Get delivery time slots
   * Short-term caching (1 minute)
   */
  getDeliveryTimeSlots: async (pincode, date, options = {}) => {
    if (!pincode) {
      throw new Error('Pincode is required');
    }

    const response = await axiosInstance.get('/shipping/time-slots', {
      params: { pincode, date },
      cacheTTL: axiosInstance.CACHE_STRATEGIES.SHORT,
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  }
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Batch fetch multiple resources
 * Useful for dashboard/overview pages
 */
export const batchFetch = async (requests) => {
  try {
    const results = await Promise.allSettled(
      requests.map(request => request())
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return { success: true, data: result.value, index };
      } else {
        return { success: false, error: result.reason, index };
      }
    });
  } catch (error) {
    console.error('Batch fetch error:', error);
    throw error;
  }
};

/**
 * Prefetch data for better performance
 * Call this before navigation to cache data
 */
export const prefetch = {
  productDetails: async (productId) => {
    await Promise.all([
      productApi.getProductById(productId),
      productApi.getRelatedProducts(productId),
      reviewApi.getReviews(productId, { page: 1, limit: 10 }),
      reviewApi.getReviewStats(productId)
    ]);
  },

  userDashboard: async () => {
    await Promise.all([
      authApi.getMe(),
      orderApi.getMyOrders({ page: 1, limit: 5 }),
      cartApi.getCart(),
      notificationApi.getNotifications({ page: 1, limit: 10 })
    ]);
  },

  homepage: async () => {
    await Promise.all([
      productApi.getFeaturedProducts(),
      productApi.getCategories()
    ]);
  }
};

/**
 * Cache invalidation utilities
 */
export { invalidateCache };

/**
 * Export axios instance for custom requests
 */
export { axiosInstance };

/**
 * Default export with all APIs
 */
export default {
  auth: authApi,
  product: productApi,
  review: reviewApi,
  cart: cartApi,
  order: orderApi,
  payment: paymentApi,
  wishlist: wishlistApi,
  address: addressApi,
  banner: bannerApi,
  pincode: pincodeApi,
  shipping: shippingApi,
  return: returnApi,
  utils: {
    batchFetch,
    prefetch,
    invalidateCache
  }
};
