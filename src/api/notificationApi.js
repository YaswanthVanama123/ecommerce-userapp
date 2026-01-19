import axiosInstance, { cacheManager } from './axiosConfig';

/**
 * Notification API
 * Complete notification management system
 */

export const notificationApi = {
  /**
   * Get notifications with filters
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
    if (!id) {
      throw new Error('Notification ID is required');
    }

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
    if (!id) {
      throw new Error('Notification ID is required');
    }

    const response = await axiosInstance.delete(`/notifications/${id}`, {
      skipCache: true,
      timeout: 10000
    });

    // Invalidate notification cache
    cacheManager.invalidate('/notifications');

    return response.data;
  },

  /**
   * Get unread notification count
   * Short-term caching (30 seconds)
   */
  getUnreadCount: async (options = {}) => {
    const response = await axiosInstance.get('/notifications/unread-count', {
      cacheTTL: 30000, // 30 seconds
      skipCache: options.skipCache || false,
      timeout: 10000
    });
    return response.data;
  },

  /**
   * Get notification preferences
   * Medium-term caching (5 minutes)
   */
  getPreferences: async (options = {}) => {
    const response = await axiosInstance.get('/notifications/preferences', {
      cacheTTL: axiosInstance.CACHE_STRATEGIES.MEDIUM,
      skipCache: options.skipCache || false,
      timeout: 10000
    });
    return response.data;
  },

  /**
   * Update notification preferences
   * No caching - mutation operation
   */
  updatePreferences: async (preferences) => {
    if (!preferences) {
      throw new Error('Preferences data is required');
    }

    const response = await axiosInstance.put('/notifications/preferences', preferences, {
      skipCache: true,
      timeout: 10000
    });

    // Invalidate notification cache
    cacheManager.invalidate('/notifications');

    return response.data;
  },

  /**
   * Delete all notifications
   * No caching - mutation operation
   */
  deleteAll: async () => {
    const response = await axiosInstance.delete('/notifications', {
      skipCache: true,
      timeout: 10000
    });

    // Invalidate notification cache
    cacheManager.invalidate('/notifications');

    return response.data;
  }
};

export default notificationApi;
