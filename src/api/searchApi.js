import axiosInstance from './axiosConfig';

/**
 * Search API
 * Handles global search functionality across products, orders, and categories
 */

export const searchApi = {
  /**
   * Global search across all entities
   * @param {string} query - Search query
   * @param {object} options - Additional options
   * @returns {Promise} - Search results
   */
  globalSearch: async (query, options = {}) => {
    if (!query || !query.trim()) {
      throw new Error('Search query is required');
    }

    try {
      const response = await axiosInstance.get('/search/global', {
        params: {
          q: query.trim(),
          limit: options.limit || 10
        },
        cacheTTL: 30000, // 30 seconds cache
        skipCache: options.skipCache || false,
        timeout: 15000
      });

      return response.data;
    } catch (error) {
      console.error('Global search error:', error);
      throw error;
    }
  },

  /**
   * Get search suggestions/autocomplete
   * @param {string} query - Search query
   * @param {object} options - Additional options
   * @returns {Promise} - Search suggestions
   */
  getSearchSuggestions: async (query, options = {}) => {
    if (!query || !query.trim()) {
      return { success: true, data: { suggestions: [] } };
    }

    try {
      const response = await axiosInstance.get('/search/suggestions', {
        params: {
          q: query.trim(),
          limit: options.limit || 5
        },
        cacheTTL: 30000, // 30 seconds cache
        skipCache: options.skipCache || false,
        timeout: 10000
      });

      return response.data;
    } catch (error) {
      console.error('Search suggestions error:', error);
      return { success: true, data: { suggestions: [] } };
    }
  },

  /**
   * Search products only
   * @param {string} query - Search query
   * @param {object} params - Additional parameters (filters, pagination)
   * @param {object} options - Additional options
   * @returns {Promise} - Product search results
   */
  searchProducts: async (query, params = {}, options = {}) => {
    if (!query || !query.trim()) {
      throw new Error('Search query is required');
    }

    try {
      const response = await axiosInstance.get('/products/search', {
        params: {
          q: query.trim(),
          ...params
        },
        cacheTTL: 30000, // 30 seconds cache
        skipCache: options.skipCache || false,
        timeout: 15000
      });

      return response.data;
    } catch (error) {
      console.error('Product search error:', error);
      throw error;
    }
  },

  /**
   * Search orders
   * @param {string} query - Search query
   * @param {object} params - Additional parameters
   * @param {object} options - Additional options
   * @returns {Promise} - Order search results
   */
  searchOrders: async (query, params = {}, options = {}) => {
    if (!query || !query.trim()) {
      throw new Error('Search query is required');
    }

    try {
      const response = await axiosInstance.get('/orders/search', {
        params: {
          q: query.trim(),
          ...params
        },
        cacheTTL: 30000, // 30 seconds cache
        skipCache: options.skipCache || false,
        timeout: 15000
      });

      return response.data;
    } catch (error) {
      console.error('Order search error:', error);
      throw error;
    }
  },

  /**
   * Search categories
   * @param {string} query - Search query
   * @param {object} options - Additional options
   * @returns {Promise} - Category search results
   */
  searchCategories: async (query, options = {}) => {
    if (!query || !query.trim()) {
      throw new Error('Search query is required');
    }

    try {
      const response = await axiosInstance.get('/categories/search', {
        params: {
          q: query.trim()
        },
        cacheTTL: 60000, // 60 seconds cache
        skipCache: options.skipCache || false,
        timeout: 10000
      });

      return response.data;
    } catch (error) {
      console.error('Category search error:', error);
      throw error;
    }
  },

  /**
   * Get trending searches
   * @param {object} options - Additional options
   * @returns {Promise} - Trending searches
   */
  getTrendingSearches: async (options = {}) => {
    try {
      const response = await axiosInstance.get('/search/trending', {
        cacheTTL: 300000, // 5 minutes cache
        skipCache: options.skipCache || false,
        timeout: 10000
      });

      return response.data;
    } catch (error) {
      console.error('Trending searches error:', error);
      return { success: true, data: { trending: [] } };
    }
  },

  /**
   * Get popular searches
   * @param {object} options - Additional options
   * @returns {Promise} - Popular searches
   */
  getPopularSearches: async (options = {}) => {
    try {
      const response = await axiosInstance.get('/search/popular', {
        cacheTTL: 300000, // 5 minutes cache
        skipCache: options.skipCache || false,
        timeout: 10000
      });

      return response.data;
    } catch (error) {
      console.error('Popular searches error:', error);
      return { success: true, data: { popular: [] } };
    }
  }
};

export default searchApi;
