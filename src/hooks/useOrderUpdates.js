import { useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Custom hook for real-time order updates via WebSocket
 * Provides automatic connection management, reconnection logic, and event handling
 *
 * @param {Object} options Configuration options
 * @param {boolean} options.enabled - Whether to enable WebSocket connection
 * @param {Function} options.onOrderCreated - Callback for order created events
 * @param {Function} options.onOrderUpdated - Callback for order updated events
 * @param {Function} options.onStatusChanged - Callback for status change events
 * @param {Function} options.onPaymentUpdated - Callback for payment update events
 * @param {Function} options.onOrderCancelled - Callback for order cancelled events
 * @param {boolean} options.showNotifications - Whether to show toast notifications
 * @returns {Object} Socket connection state and methods
 */
const useOrderUpdates = (options = {}) => {
  const {
    enabled = true,
    onOrderCreated,
    onOrderUpdated,
    onStatusChanged,
    onPaymentUpdated,
    onOrderCancelled,
    showNotifications = true
  } = options;

  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  // Get auth token from localStorage
  const getAuthToken = useCallback(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.token;
      }
    } catch (err) {
      console.error('Failed to get auth token:', err);
    }
    return null;
  }, []);

  // Connect to WebSocket server
  const connect = useCallback(() => {
    if (!enabled || socketRef.current?.connected) {
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setError('Authentication token not found');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const newSocket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: RECONNECT_DELAY,
        reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
        timeout: 10000
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      // Connection successful
      newSocket.on('connect', () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        reconnectAttemptsRef.current = 0;
        setReconnectAttempts(0);
      });

      // Connection confirmation from server
      newSocket.on('connected', (data) => {
        console.log('WebSocket connection confirmed:', data);
      });

      // Order created event
      newSocket.on('order:created', (data) => {
        console.log('Order created:', data);
        if (showNotifications) {
          toast.success(`Order #${data.orderNumber} created successfully!`);
        }
        if (onOrderCreated) {
          onOrderCreated(data);
        }
      });

      // Order updated event
      newSocket.on('order:updated', (data) => {
        console.log('Order updated:', data);
        if (onOrderUpdated) {
          onOrderUpdated(data);
        }
      });

      // Order status changed event
      newSocket.on('order:status_changed', (data) => {
        console.log('Order status changed:', data);
        if (showNotifications && data.notification) {
          const notificationType = data.notification.type || 'info';
          const message = data.notification.message;

          switch (notificationType) {
            case 'success':
              toast.success(message);
              break;
            case 'warning':
              toast.error(message);
              break;
            case 'error':
              toast.error(message);
              break;
            default:
              toast(message);
          }
        }
        if (onStatusChanged) {
          onStatusChanged(data);
        }
      });

      // Payment status updated event
      newSocket.on('order:payment_updated', (data) => {
        console.log('Payment updated:', data);
        if (showNotifications && data.notification) {
          if (data.notification.type === 'success') {
            toast.success(data.notification.message);
          } else {
            toast(data.notification.message);
          }
        }
        if (onPaymentUpdated) {
          onPaymentUpdated(data);
        }
      });

      // Order cancelled event
      newSocket.on('order:cancelled', (data) => {
        console.log('Order cancelled:', data);
        if (showNotifications && data.notification) {
          toast.error(data.notification.message);
        }
        if (onOrderCancelled) {
          onOrderCancelled(data);
        }
      });

      // Disconnection
      newSocket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        setIsConnected(false);
        setIsConnecting(false);

        // Attempt reconnection if it wasn't a manual disconnect
        if (reason !== 'io client disconnect' && enabled) {
          handleReconnect();
        }
      });

      // Connection error
      newSocket.on('connect_error', (err) => {
        console.error('WebSocket connection error:', err.message);
        setIsConnecting(false);
        setError(err.message);

        if (enabled) {
          handleReconnect();
        }
      });

      // General error
      newSocket.on('error', (err) => {
        console.error('WebSocket error:', err);
        setError(err.message || 'WebSocket error occurred');
      });

    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError(err.message);
      setIsConnecting(false);
    }
  }, [enabled, getAuthToken, onOrderCreated, onOrderUpdated, onStatusChanged, onPaymentUpdated, onOrderCancelled, showNotifications]);

  // Handle reconnection logic
  const handleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.log('Max reconnection attempts reached');
      setError('Failed to connect after multiple attempts. Please refresh the page.');
      return;
    }

    reconnectAttemptsRef.current += 1;
    setReconnectAttempts(reconnectAttemptsRef.current);

    console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})...`);

    // Clear existing timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    // Attempt reconnection after delay
    reconnectTimeoutRef.current = setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.connect();
      } else {
        connect();
      }
    }, RECONNECT_DELAY);
  }, [connect]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('Disconnecting WebSocket...');
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      setIsConnecting(false);
    }

    // Clear reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Subscribe to specific order updates
  const subscribeToOrder = useCallback((orderId) => {
    if (socketRef.current && isConnected) {
      console.log(`Subscribing to order: ${orderId}`);
      socketRef.current.emit('subscribe:order', orderId);
    }
  }, [isConnected]);

  // Unsubscribe from specific order updates
  const unsubscribeFromOrder = useCallback((orderId) => {
    if (socketRef.current && isConnected) {
      console.log(`Unsubscribing from order: ${orderId}`);
      socketRef.current.emit('unsubscribe:order', orderId);
    }
  }, [isConnected]);

  // Connect on mount if enabled
  useEffect(() => {
    if (enabled) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    socket: socketRef.current,
    isConnected,
    isConnecting,
    error,
    reconnectAttempts,
    connect,
    disconnect,
    subscribeToOrder,
    unsubscribeFromOrder
  };
};

export default useOrderUpdates;
