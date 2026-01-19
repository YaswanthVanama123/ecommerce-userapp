import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { notificationApi } from '../api/notificationApi';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    email: true,
    push: true,
    inApp: true,
    orderUpdates: true,
    shipmentUpdates: true,
    promotions: true,
    newsletter: false
  });

  const { isAuthenticated } = useAuth();
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      // Get WebSocket URL from environment or construct from API URL
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const wsUrl = apiUrl
        .replace('http://', 'ws://')
        .replace('https://', 'wss://')
        .replace('/api', '');

      const ws = new WebSocket(`${wsUrl}?token=${token}`);

      ws.onopen = () => {
        console.log('WebSocket connected');
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        wsRef.current = null;

        // Attempt to reconnect
        if (
          isAuthenticated &&
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, reconnectDelay * reconnectAttemptsRef.current);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
    }
  }, [isAuthenticated]);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((data) => {
    if (data.type === 'notification') {
      const notification = data.payload;

      // Add new notification to the list
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Show toast notification
      showToastNotification(notification);
    } else if (data.type === 'notification_read') {
      // Update notification as read
      const notificationId = data.payload.id;
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId || n.id === notificationId
            ? { ...n, read: true }
            : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } else if (data.type === 'notification_deleted') {
      // Remove deleted notification
      const notificationId = data.payload.id;
      setNotifications((prev) =>
        prev.filter((n) => n._id !== notificationId && n.id !== notificationId)
      );
      // Recalculate unread count
      setNotifications((prev) => {
        const unread = prev.filter((n) => !n.read).length;
        setUnreadCount(unread);
        return prev;
      });
    }
  }, []);

  // Show toast notification
  const showToastNotification = useCallback((notification) => {
    const { type, title, message } = notification;

    const toastOptions = {
      position: 'top-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true
    };

    switch (type) {
      case 'order_placed':
      case 'order_confirmed':
        toast.success(message || title, toastOptions);
        break;
      case 'shipped':
      case 'out_for_delivery':
        toast.info(message || title, {
          ...toastOptions,
          icon: '📦'
        });
        break;
      case 'delivered':
        toast.success(message || title, {
          ...toastOptions,
          icon: '✅'
        });
        break;
      case 'order_cancelled':
      case 'delivery_failed':
        toast.error(message || title, toastOptions);
        break;
      case 'refund_initiated':
      case 'refund_completed':
        toast.info(message || title, toastOptions);
        break;
      default:
        toast.info(message || title, toastOptions);
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async (page = 1, limit = 20) => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const response = await notificationApi.getNotifications(
        { page, limit },
        { skipCache: true }
      );

      if (response.success) {
        const notificationsList = response.data.notifications || [];
        setNotifications(notificationsList);

        // Calculate unread count
        const unread = notificationsList.filter((n) => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await notificationApi.getUnreadCount({ skipCache: true });
      if (response.success) {
        setUnreadCount(response.data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [isAuthenticated]);

  // Fetch preferences
  const fetchPreferences = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await notificationApi.getPreferences();
      if (response.success && response.data.preferences) {
        setPreferences(response.data.preferences);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  }, [isAuthenticated]);

  // Mark notification as read
  const markAsRead = useCallback(async (id) => {
    try {
      await notificationApi.markAsRead(id);

      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id || n.id === id ? { ...n, read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationApi.markAllAsRead();

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (id) => {
    try {
      await notificationApi.deleteNotification(id);

      setNotifications((prev) => {
        const filtered = prev.filter(
          (n) => n._id !== id && n.id !== id
        );
        // Recalculate unread count
        const unread = filtered.filter((n) => !n.read).length;
        setUnreadCount(unread);
        return filtered;
      });

      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  }, []);

  // Delete all notifications
  const deleteAllNotifications = useCallback(async () => {
    try {
      await notificationApi.deleteAll();
      setNotifications([]);
      setUnreadCount(0);
      toast.success('All notifications deleted');
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      toast.error('Failed to delete all notifications');
    }
  }, []);

  // Update preferences
  const updatePreferences = useCallback(async (newPreferences) => {
    try {
      await notificationApi.updatePreferences(newPreferences);
      setPreferences(newPreferences);
      toast.success('Preferences updated successfully');
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
    }
  }, []);

  // Initialize notifications on mount and auth change
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      fetchUnreadCount();
      fetchPreferences();
      connectWebSocket();
    } else {
      // Clear notifications on logout
      setNotifications([]);
      setUnreadCount(0);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isAuthenticated, fetchNotifications, fetchUnreadCount, fetchPreferences, connectWebSocket]);

  // Periodic refresh of unread count (every 2 minutes)
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchUnreadCount]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      preferences,
      fetchNotifications,
      fetchUnreadCount,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      deleteAllNotifications,
      updatePreferences,
      refreshNotifications: () => fetchNotifications(1, 20)
    }),
    [
      notifications,
      unreadCount,
      loading,
      preferences,
      fetchNotifications,
      fetchUnreadCount,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      deleteAllNotifications,
      updatePreferences
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
