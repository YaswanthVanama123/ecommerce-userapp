import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * WebSocket connection manager for centralized socket connection handling
 * Provides singleton pattern to ensure single WebSocket connection across the app
 */
class WebSocketManager {
  constructor() {
    this.socket = null;
    this.isConnecting = false;
    this.subscribers = new Map();
    this.eventListeners = new Map();
  }

  /**
   * Get authentication token from localStorage
   */
  getAuthToken() {
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
  }

  /**
   * Connect to WebSocket server
   * @param {Object} options Connection options
   * @returns {Promise} Resolves when connected
   */
  connect(options = {}) {
    return new Promise((resolve, reject) => {
      // Return existing socket if already connected
      if (this.socket && this.socket.connected) {
        resolve(this.socket);
        return;
      }

      // Prevent multiple simultaneous connection attempts
      if (this.isConnecting) {
        reject(new Error('Connection already in progress'));
        return;
      }

      const token = this.getAuthToken();
      if (!token) {
        reject(new Error('Authentication token not found'));
        return;
      }

      this.isConnecting = true;

      try {
        const socketOptions = {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: options.reconnectionDelay || 3000,
          reconnectionAttempts: options.reconnectionAttempts || 5,
          timeout: options.timeout || 10000,
          ...options
        };

        this.socket = io(SOCKET_URL, socketOptions);

        // Connection successful
        this.socket.on('connect', () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          resolve(this.socket);
        });

        // Connection error
        this.socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error.message);
          this.isConnecting = false;
          reject(error);
        });

        // Disconnection
        this.socket.on('disconnect', (reason) => {
          console.log('WebSocket disconnected:', reason);
          this.isConnecting = false;
        });

      } catch (err) {
        console.error('Failed to create WebSocket connection:', err);
        this.isConnecting = false;
        reject(err);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.socket) {
      console.log('Disconnecting WebSocket...');

      // Remove all event listeners
      this.eventListeners.forEach((listeners, event) => {
        listeners.forEach(callback => {
          this.socket.off(event, callback);
        });
      });
      this.eventListeners.clear();

      // Disconnect socket
      this.socket.disconnect();
      this.socket = null;
    }

    this.subscribers.clear();
    this.isConnecting = false;
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected() {
    return this.socket && this.socket.connected;
  }

  /**
   * Get current socket instance
   */
  getSocket() {
    return this.socket;
  }

  /**
   * Subscribe to an event
   * @param {string} event Event name
   * @param {Function} callback Event callback
   */
  on(event, callback) {
    if (!this.socket) {
      console.warn('Socket not connected. Call connect() first.');
      return;
    }

    // Track event listener
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);

    // Add socket listener
    this.socket.on(event, callback);
  }

  /**
   * Unsubscribe from an event
   * @param {string} event Event name
   * @param {Function} callback Event callback
   */
  off(event, callback) {
    if (!this.socket) {
      return;
    }

    // Remove from tracking
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
      if (this.eventListeners.get(event).size === 0) {
        this.eventListeners.delete(event);
      }
    }

    // Remove socket listener
    this.socket.off(event, callback);
  }

  /**
   * Emit an event
   * @param {string} event Event name
   * @param {*} data Event data
   */
  emit(event, data) {
    if (!this.socket || !this.socket.connected) {
      console.warn('Socket not connected. Cannot emit event:', event);
      return;
    }

    this.socket.emit(event, data);
  }

  /**
   * Subscribe to specific order updates
   * @param {string} orderId Order ID
   */
  subscribeToOrder(orderId) {
    if (!this.socket || !this.socket.connected) {
      console.warn('Socket not connected. Cannot subscribe to order:', orderId);
      return;
    }

    console.log(`Subscribing to order: ${orderId}`);
    this.subscribers.set(orderId, true);
    this.socket.emit('subscribe:order', orderId);
  }

  /**
   * Unsubscribe from specific order updates
   * @param {string} orderId Order ID
   */
  unsubscribeFromOrder(orderId) {
    if (!this.socket || !this.socket.connected) {
      return;
    }

    console.log(`Unsubscribing from order: ${orderId}`);
    this.subscribers.delete(orderId);
    this.socket.emit('unsubscribe:order', orderId);
  }

  /**
   * Unsubscribe from all orders
   */
  unsubscribeFromAllOrders() {
    this.subscribers.forEach((_, orderId) => {
      this.unsubscribeFromOrder(orderId);
    });
  }
}

// Create singleton instance
const socketManager = new WebSocketManager();

export default socketManager;

// Export for testing or direct use
export { WebSocketManager };
