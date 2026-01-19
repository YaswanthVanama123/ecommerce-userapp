import axiosInstance from './axiosConfig';

/**
 * Return API
 * Handles all return and exchange related operations
 */

/**
 * Get all returns for the current user
 * @param {Object} params - Query parameters (status, page, limit, etc.)
 * @param {Object} options - API options (skipCache, etc.)
 * @returns {Promise} - Promise resolving to return data
 */
export const getMyReturns = async (params = {}, options = {}) => {
  const response = await axiosInstance.get('/returns', {
    params,
    cacheTTL: axiosInstance.CACHE_STRATEGIES.SHORT,
    skipCache: options.skipCache || false,
    timeout: 15000
  });
  return response.data;
};

/**
 * Create a new return request
 * @param {Object} returnData - Return request data
 * @param {string} returnData.order - Order ID
 * @param {Array} returnData.items - Items to return
 * @param {string} returnData.type - Return type (refund/exchange)
 * @param {string} returnData.reason - Reason for return
 * @param {string} returnData.description - Additional details
 * @returns {Promise} - Promise resolving to created return
 */
export const createReturnRequest = async (returnData) => {
  if (!returnData) {
    throw new Error('Return data is required');
  }

  if (!returnData.order) {
    throw new Error('Order ID is required');
  }

  if (!returnData.items || returnData.items.length === 0) {
    throw new Error('At least one item must be selected for return');
  }

  if (!returnData.reason) {
    throw new Error('Reason for return is required');
  }

  const response = await axiosInstance.post('/returns', returnData, {
    skipCache: true,
    timeout: 30000
  });

  return response.data;
};

/**
 * Get return request by ID
 * @param {string} returnId - Return request ID
 * @param {Object} options - API options
 * @returns {Promise} - Promise resolving to return details
 */
export const getReturnById = async (returnId, options = {}) => {
  if (!returnId) {
    throw new Error('Return ID is required');
  }

  const response = await axiosInstance.get(`/returns/${returnId}`, {
    cacheTTL: axiosInstance.CACHE_STRATEGIES.SHORT,
    skipCache: options.skipCache || false,
    timeout: 15000
  });
  return response.data;
};

/**
 * Track return request status
 * @param {string} returnId - Return request ID
 * @param {Object} options - API options
 * @returns {Promise} - Promise resolving to tracking information
 */
export const trackReturn = async (returnId, options = {}) => {
  if (!returnId) {
    throw new Error('Return ID is required');
  }

  const response = await axiosInstance.get(`/returns/${returnId}/tracking`, {
    cacheTTL: axiosInstance.CACHE_STRATEGIES.SHORT,
    skipCache: options.skipCache || false,
    timeout: 15000
  });
  return response.data;
};

/**
 * Cancel a return request
 * @param {string} returnId - Return request ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise} - Promise resolving to cancellation result
 */
export const cancelReturn = async (returnId, reason = '') => {
  if (!returnId) {
    throw new Error('Return ID is required');
  }

  const response = await axiosInstance.post(`/returns/${returnId}/cancel`,
    { reason },
    {
      skipCache: true,
      timeout: 15000
    }
  );

  return response.data;
};

/**
 * Check if order is eligible for return
 * @param {string} orderId - Order ID to check
 * @param {Object} options - API options
 * @returns {Promise} - Promise resolving to eligibility status
 */
export const checkReturnEligibility = async (orderId, options = {}) => {
  if (!orderId) {
    throw new Error('Order ID is required');
  }

  const response = await axiosInstance.get(`/returns/check-eligibility/${orderId}`, {
    cacheTTL: axiosInstance.CACHE_STRATEGIES.SHORT,
    skipCache: options.skipCache || false,
    timeout: 10000
  });
  return response.data;
};

/**
 * Upload images for return request
 * @param {string} returnId - Return request ID
 * @param {FormData} formData - Form data with images
 * @returns {Promise} - Promise resolving to upload result
 */
export const uploadReturnImages = async (returnId, formData) => {
  if (!returnId) {
    throw new Error('Return ID is required');
  }

  if (!formData) {
    throw new Error('Form data with images is required');
  }

  const response = await axiosInstance.post(`/returns/${returnId}/images`, formData, {
    skipCache: true,
    timeout: 60000, // Longer timeout for image uploads
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data;
};

/**
 * Get return policy information
 * @param {Object} options - API options
 * @returns {Promise} - Promise resolving to return policy
 */
export const getReturnPolicy = async (options = {}) => {
  const response = await axiosInstance.get('/returns/policy', {
    cacheTTL: axiosInstance.CACHE_STRATEGIES.VERY_LONG, // Cache for 1 hour
    skipCache: options.skipCache || false,
    timeout: 10000
  });
  return response.data;
};

/**
 * Export return API methods
 */
export default {
  getMyReturns,
  createReturnRequest,
  getReturnById,
  trackReturn,
  cancelReturn,
  checkReturnEligibility,
  uploadReturnImages,
  getReturnPolicy
};
