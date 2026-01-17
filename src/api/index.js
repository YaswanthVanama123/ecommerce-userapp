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

    const response = await axiosInstance.post('/cart/items', item, {
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

    const response = await axiosInstance.put(`/cart/items/${itemId}`,
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

    const response = await axiosInstance.delete(`/cart/items/${itemId}`, {
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
   * Cancel order
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
  }
};

// ============================================================================
// Payment API
// ============================================================================

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
    const response = await axiosInstance.post('/wishlist/items',
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
    const response = await axiosInstance.delete(`/wishlist/items/${productId}`, {
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

export const notificationApi = {
  /**
   * Get notifications
   * Short-term caching (1 minute) - notifications update frequently
   */
  getNotifications: async (params = {}, options = {}) => {
    const response = await axiosInstance.get('/notifications', {
      params,
      cacheTTL: axiosInstance.CACHE_STRATEGIES.SHORT,
      skipCache: options.skipCache || false,
      timeout: 15000
    });
    return response.data;
  },

  /**
   * Mark notification as read
   * No caching - mutation operation
   */
  markAsRead: async (id) => {
    const response = await axiosInstance.put(`/notifications/${id}/read`, null, {
      skipCache: true,
      timeout: 10000
    });

    // Invalidate notification cache
    cacheManager.invalidate('/notifications');

    return response.data;
  },

  /**
   * Mark all notifications as read
   * No caching - mutation operation
   */
  markAllAsRead: async () => {
    const response = await axiosInstance.put('/notifications/read-all', null, {
      skipCache: true,
      timeout: 10000
    });

    // Invalidate notification cache
    cacheManager.invalidate('/notifications');

    return response.data;
  },

  /**
   * Delete notification
   * No caching - mutation operation
   */
  deleteNotification: async (id) => {
    const response = await axiosInstance.delete(`/notifications/${id}`, {
      skipCache: true,
      timeout: 10000
    });

    // Invalidate notification cache
    cacheManager.invalidate('/notifications');

    return response.data;
  }
};

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
  notification: notificationApi,
  banner: bannerApi,
  utils: {
    batchFetch,
    prefetch,
    invalidateCache
  }
};
