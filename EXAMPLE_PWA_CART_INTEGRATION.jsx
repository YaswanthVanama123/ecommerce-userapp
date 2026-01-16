/**
 * Example: PWA-Enhanced Cart Context
 *
 * This file demonstrates how to enhance your existing CartContext
 * with PWA features like offline support and background sync.
 *
 * Copy the relevant parts into your existing CartContext.jsx
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { cartApi } from '../api';
import { triggerBackgroundSync, isOnline } from '../utils/serviceWorkerRegistration';
import { useOnlineStatus } from '../utils/useServiceWorker';
import { toast } from 'react-toastify';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pendingOperations, setPendingOperations] = useState([]);
  const online = useOnlineStatus();

  // Load cart on mount
  useEffect(() => {
    loadCart();
  }, []);

  // Sync pending operations when coming back online
  useEffect(() => {
    if (online && pendingOperations.length > 0) {
      syncPendingOperations();
    }
  }, [online, pendingOperations]);

  // Listen for successful background sync
  useEffect(() => {
    const handleSyncSuccess = (event) => {
      if (event.detail.url.includes('/cart')) {
        console.log('Cart synced successfully');
        loadCart(); // Reload cart after sync
        toast.success('Cart synced successfully!');
      }
    };

    window.addEventListener('swSyncSuccess', handleSyncSuccess);
    return () => window.removeEventListener('swSyncSuccess', handleSyncSuccess);
  }, []);

  // Load cart from API
  const loadCart = async () => {
    try {
      setLoading(true);
      const response = await cartApi.getCart();
      setCart(response.data);

      // Save to localStorage as backup
      localStorage.setItem('cart', JSON.stringify(response.data));
    } catch (error) {
      console.error('Failed to load cart:', error);

      // If offline, load from localStorage
      if (!isOnline()) {
        const cachedCart = localStorage.getItem('cart');
        if (cachedCart) {
          setCart(JSON.parse(cachedCart));
          toast.info('Loaded cart from local cache');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Add item to cart with offline support
  const addToCart = async (productId, quantity = 1) => {
    try {
      setLoading(true);

      // Optimistic update
      const tempItem = {
        id: `temp-${Date.now()}`,
        productId,
        quantity,
        pending: true,
      };
      setCart(prev => ({
        ...prev,
        items: [...(prev?.items || []), tempItem],
      }));

      // Try to add to cart
      const response = await cartApi.addToCart({ productId, quantity });
      setCart(response.data);

      // Update localStorage
      localStorage.setItem('cart', JSON.stringify(response.data));

      toast.success('Added to cart');
    } catch (error) {
      console.error('Failed to add to cart:', error);

      if (!isOnline()) {
        // Queue for background sync
        const operation = {
          type: 'add',
          productId,
          quantity,
          timestamp: Date.now(),
        };
        setPendingOperations(prev => [...prev, operation]);

        // Store in localStorage
        const pending = JSON.parse(localStorage.getItem('pendingCartOps') || '[]');
        localStorage.setItem('pendingCartOps', JSON.stringify([...pending, operation]));

        // Trigger background sync
        await triggerBackgroundSync('cart-sync');

        toast.info('Added to cart. Will sync when online.');
      } else {
        // Remove optimistic update
        loadCart();
        toast.error('Failed to add to cart');
      }
    } finally {
      setLoading(false);
    }
  };

  // Update cart item with offline support
  const updateCartItem = async (itemId, quantity) => {
    try {
      setLoading(true);

      // Optimistic update
      setCart(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.id === itemId ? { ...item, quantity, pending: true } : item
        ),
      }));

      // Try to update
      const response = await cartApi.updateCartItem(itemId, quantity);
      setCart(response.data);

      // Update localStorage
      localStorage.setItem('cart', JSON.stringify(response.data));

      toast.success('Cart updated');
    } catch (error) {
      console.error('Failed to update cart:', error);

      if (!isOnline()) {
        // Queue for background sync
        const operation = {
          type: 'update',
          itemId,
          quantity,
          timestamp: Date.now(),
        };
        setPendingOperations(prev => [...prev, operation]);

        // Store in localStorage
        const pending = JSON.parse(localStorage.getItem('pendingCartOps') || '[]');
        localStorage.setItem('pendingCartOps', JSON.stringify([...pending, operation]));

        // Trigger background sync
        await triggerBackgroundSync('cart-update');

        toast.info('Cart updated. Will sync when online.');
      } else {
        // Revert optimistic update
        loadCart();
        toast.error('Failed to update cart');
      }
    } finally {
      setLoading(false);
    }
  };

  // Remove item from cart with offline support
  const removeFromCart = async (itemId) => {
    try {
      setLoading(true);

      // Optimistic update
      setCart(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== itemId),
      }));

      // Try to remove
      const response = await cartApi.removeFromCart(itemId);
      setCart(response.data);

      // Update localStorage
      localStorage.setItem('cart', JSON.stringify(response.data));

      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Failed to remove from cart:', error);

      if (!isOnline()) {
        // Queue for background sync
        const operation = {
          type: 'remove',
          itemId,
          timestamp: Date.now(),
        };
        setPendingOperations(prev => [...prev, operation]);

        // Store in localStorage
        const pending = JSON.parse(localStorage.getItem('pendingCartOps') || '[]');
        localStorage.setItem('pendingCartOps', JSON.stringify([...pending, operation]));

        // Trigger background sync
        await triggerBackgroundSync('cart-sync');

        toast.info('Item removed. Will sync when online.');
      } else {
        // Revert optimistic update
        loadCart();
        toast.error('Failed to remove item');
      }
    } finally {
      setLoading(false);
    }
  };

  // Sync pending operations when back online
  const syncPendingOperations = async () => {
    const pending = JSON.parse(localStorage.getItem('pendingCartOps') || '[]');

    if (pending.length === 0) {
      setPendingOperations([]);
      return;
    }

    console.log(`Syncing ${pending.length} pending cart operations...`);

    for (const operation of pending) {
      try {
        switch (operation.type) {
          case 'add':
            await cartApi.addToCart({
              productId: operation.productId,
              quantity: operation.quantity,
            });
            break;
          case 'update':
            await cartApi.updateCartItem(operation.itemId, operation.quantity);
            break;
          case 'remove':
            await cartApi.removeFromCart(operation.itemId);
            break;
        }
      } catch (error) {
        console.error('Failed to sync operation:', operation, error);
      }
    }

    // Clear pending operations
    localStorage.removeItem('pendingCartOps');
    setPendingOperations([]);

    // Reload cart to get latest state
    await loadCart();

    toast.success('Cart synced successfully!');
  };

  // Clear cart
  const clearCart = () => {
    setCart(null);
    localStorage.removeItem('cart');
    localStorage.removeItem('pendingCartOps');
    setPendingOperations([]);
  };

  const value = {
    cart,
    loading,
    pendingOperations: pendingOperations.length,
    isOnline: online,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    loadCart,
    syncPendingOperations,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}

/**
 * Example: Cart Component with PWA Features
 */
export function CartComponent() {
  const {
    cart,
    loading,
    pendingOperations,
    isOnline,
    updateCartItem,
    removeFromCart,
    syncPendingOperations,
  } = useCart();

  return (
    <div className="cart">
      {/* Offline indicator */}
      {!isOnline && (
        <div className="offline-banner">
          You are offline. Changes will sync when you reconnect.
        </div>
      )}

      {/* Pending operations indicator */}
      {pendingOperations > 0 && (
        <div className="sync-banner">
          {pendingOperations} pending changes
          {isOnline && (
            <button onClick={syncPendingOperations}>Sync Now</button>
          )}
        </div>
      )}

      {/* Cart items */}
      {loading ? (
        <div>Loading cart...</div>
      ) : (
        <div className="cart-items">
          {cart?.items?.map(item => (
            <div
              key={item.id}
              className={item.pending ? 'cart-item pending' : 'cart-item'}
            >
              <h3>{item.product.name}</h3>
              <div className="quantity">
                <button onClick={() => updateCartItem(item.id, item.quantity - 1)}>
                  -
                </button>
                <span>{item.quantity}</span>
                <button onClick={() => updateCartItem(item.id, item.quantity + 1)}>
                  +
                </button>
              </div>
              <button onClick={() => removeFromCart(item.id)}>Remove</button>
              {item.pending && <span className="badge">Pending sync</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Example: Order Submission with Offline Support
 */
export async function submitOrder(orderData) {
  try {
    // Try to submit order
    const response = await orderApi.createOrder(orderData);
    toast.success('Order placed successfully!');
    return response.data;
  } catch (error) {
    console.error('Failed to submit order:', error);

    if (!isOnline()) {
      // Store order in localStorage
      const pendingOrders = JSON.parse(localStorage.getItem('pendingOrders') || '[]');
      const order = {
        ...orderData,
        id: `temp-${Date.now()}`,
        timestamp: Date.now(),
        status: 'pending_sync',
      };
      localStorage.setItem('pendingOrders', JSON.stringify([...pendingOrders, order]));

      // Trigger background sync
      await triggerBackgroundSync('order-sync');

      toast.info('Order saved. Will be submitted when you are online.');
      return order;
    } else {
      toast.error('Failed to place order');
      throw error;
    }
  }
}

/**
 * CSS Example for PWA-enhanced components
 */
const styles = `
/* Offline banner */
.offline-banner {
  background: #f59e0b;
  color: white;
  padding: 0.75rem 1rem;
  text-align: center;
  font-weight: 600;
}

/* Sync banner */
.sync-banner {
  background: #3b82f6;
  color: white;
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Pending cart item */
.cart-item.pending {
  opacity: 0.7;
  border-left: 3px solid #f59e0b;
}

/* Pending badge */
.badge {
  background: #f59e0b;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}
`;

export default CartProvider;
