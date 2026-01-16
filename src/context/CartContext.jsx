import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { cartApi } from '../api';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const CartContext = createContext(null);
const CartActionsContext = createContext(null);

// Local storage key for cart data
const CART_STORAGE_KEY = 'cart_data';
const CART_TIMESTAMP_KEY = 'cart_timestamp';
const CART_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// Helper function to save cart to localStorage
const saveCartToStorage = (cart, totalItems, total) => {
  try {
    const cartData = {
      cart,
      totalItems,
      total,
      timestamp: Date.now()
    };
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));
    localStorage.setItem(CART_TIMESTAMP_KEY, cartData.timestamp.toString());
  } catch (error) {
    console.error('Error saving cart to localStorage:', error);
  }
};

// Helper function to load cart from localStorage
const loadCartFromStorage = () => {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    const timestamp = localStorage.getItem(CART_TIMESTAMP_KEY);

    if (!stored || !timestamp) return null;

    const age = Date.now() - parseInt(timestamp, 10);
    if (age > CART_CACHE_DURATION) {
      // Cache expired
      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.removeItem(CART_TIMESTAMP_KEY);
      return null;
    }

    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading cart from localStorage:', error);
    return null;
  }
};

// Helper function to clear cart from localStorage
const clearCartFromStorage = () => {
  localStorage.removeItem(CART_STORAGE_KEY);
  localStorage.removeItem(CART_TIMESTAMP_KEY);
};

// Memoized cart calculations
const calculateCartTotals = (cart) => {
  if (!cart || !cart.items || cart.items.length === 0) {
    return { totalItems: 0, total: 0 };
  }

  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.items.reduce((sum, item) => {
    const price = item.product?.price || 0;
    return sum + (price * item.quantity);
  }, 0);

  return { totalItems, total };
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  // Track pending updates to prevent race conditions
  const pendingUpdates = useRef(0);
  const isMounted = useRef(true);

  // Debounce timer for updates
  const updateDebounceTimer = useRef(null);

  // Optimistic update queue
  const optimisticQueue = useRef([]);

  // Effect to handle component unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (updateDebounceTimer.current) {
        clearTimeout(updateDebounceTimer.current);
      }
    };
  }, []);

  // Memoized cart totals (recalculated only when cart changes)
  const { totalItems, total } = useMemo(() => calculateCartTotals(cart), [cart]);

  // Load cart from cache or fetch on auth change
  useEffect(() => {
    if (isAuthenticated) {
      // Try to load from cache first for instant UI
      const cachedData = loadCartFromStorage();
      if (cachedData) {
        setCart(cachedData.cart);
      }

      // Then fetch fresh data
      fetchCart();
    } else {
      // User logged out - clear cart
      setCart(null);
      clearCartFromStorage();
    }
  }, [isAuthenticated]);

  // Fetch cart from server
  const fetchCart = useCallback(async (showLoading = true) => {
    if (!isAuthenticated) return;

    try {
      if (showLoading) setLoading(true);

      const response = await cartApi.getCart();
      const fetchedCart = response.data.cart;

      if (isMounted.current) {
        setCart(fetchedCart);

        // Calculate and save to cache
        const totals = calculateCartTotals(fetchedCart);
        saveCartToStorage(fetchedCart, totals.totalItems, totals.total);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      if (isMounted.current && error.response?.status === 404) {
        // No cart exists yet
        setCart(null);
        clearCartFromStorage();
      }
    } finally {
      if (isMounted.current && showLoading) {
        setLoading(false);
      }
    }
  }, [isAuthenticated]);

  // Optimistic update helper
  const applyOptimisticUpdate = useCallback((updateFn) => {
    setCart(prevCart => {
      if (!prevCart) return prevCart;
      const updatedCart = updateFn(prevCart);
      return updatedCart;
    });
  }, []);

  // Add to cart with optimistic updates
  const addToCart = useCallback(async (productId, quantity = 1, size = null, color = null) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return { success: false };
    }

    // Optimistic update
    const optimisticId = Date.now();
    applyOptimisticUpdate(prevCart => {
      const newItem = {
        _id: `temp-${optimisticId}`,
        product: { _id: productId },
        quantity,
        size,
        color,
        isOptimistic: true
      };

      if (!prevCart) {
        return { items: [newItem] };
      }

      return {
        ...prevCart,
        items: [...prevCart.items, newItem]
      };
    });

    try {
      pendingUpdates.current++;

      const response = await cartApi.addToCart({ productId, quantity, size, color });
      const updatedCart = response.data.cart;

      if (isMounted.current) {
        setCart(updatedCart);
        const totals = calculateCartTotals(updatedCart);
        saveCartToStorage(updatedCart, totals.totalItems, totals.total);
        toast.success('Added to cart!');
      }

      return { success: true };
    } catch (error) {
      // Revert optimistic update on error
      if (isMounted.current) {
        await fetchCart(false);
      }

      const errorMessage = error.response?.data?.message || 'Failed to add to cart';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      pendingUpdates.current--;
    }
  }, [isAuthenticated, applyOptimisticUpdate, fetchCart]);

  // Update quantity with debouncing and optimistic updates
  const updateQuantity = useCallback(async (itemId, quantity) => {
    if (!isAuthenticated || quantity < 0) {
      return { success: false };
    }

    // If quantity is 0, remove the item
    if (quantity === 0) {
      return removeItem(itemId);
    }

    // Optimistic update
    applyOptimisticUpdate(prevCart => {
      if (!prevCart) return prevCart;

      return {
        ...prevCart,
        items: prevCart.items.map(item =>
          item._id === itemId ? { ...item, quantity } : item
        )
      };
    });

    // Clear existing debounce timer
    if (updateDebounceTimer.current) {
      clearTimeout(updateDebounceTimer.current);
    }

    // Debounce the API call
    return new Promise((resolve) => {
      updateDebounceTimer.current = setTimeout(async () => {
        try {
          pendingUpdates.current++;

          const response = await cartApi.updateCartItem(itemId, quantity);
          const updatedCart = response.data.cart;

          if (isMounted.current) {
            setCart(updatedCart);
            const totals = calculateCartTotals(updatedCart);
            saveCartToStorage(updatedCart, totals.totalItems, totals.total);
          }

          resolve({ success: true });
        } catch (error) {
          // Revert on error
          if (isMounted.current) {
            await fetchCart(false);
          }

          const errorMessage = error.response?.data?.message || 'Failed to update quantity';
          toast.error(errorMessage);
          resolve({ success: false, error: errorMessage });
        } finally {
          pendingUpdates.current--;
        }
      }, 500); // 500ms debounce
    });
  }, [isAuthenticated, applyOptimisticUpdate, fetchCart]);

  // Remove item with optimistic update
  const removeItem = useCallback(async (itemId) => {
    if (!isAuthenticated) {
      return { success: false };
    }

    // Store item for potential rollback
    let removedItem = null;

    // Optimistic update
    applyOptimisticUpdate(prevCart => {
      if (!prevCart) return prevCart;

      removedItem = prevCart.items.find(item => item._id === itemId);

      return {
        ...prevCart,
        items: prevCart.items.filter(item => item._id !== itemId)
      };
    });

    try {
      pendingUpdates.current++;

      const response = await cartApi.removeFromCart(itemId);
      const updatedCart = response.data.cart;

      if (isMounted.current) {
        setCart(updatedCart);
        const totals = calculateCartTotals(updatedCart);
        saveCartToStorage(updatedCart, totals.totalItems, totals.total);
        toast.success('Item removed from cart');
      }

      return { success: true };
    } catch (error) {
      // Revert on error
      if (isMounted.current && removedItem) {
        applyOptimisticUpdate(prevCart => {
          if (!prevCart) return prevCart;
          return {
            ...prevCart,
            items: [...prevCart.items, removedItem]
          };
        });
      }

      const errorMessage = error.response?.data?.message || 'Failed to remove item';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      pendingUpdates.current--;
    }
  }, [isAuthenticated, applyOptimisticUpdate]);

  // Clear entire cart
  const clearCart = useCallback(async () => {
    if (!isAuthenticated) {
      return { success: false };
    }

    // Store cart for rollback
    const previousCart = cart;

    // Optimistic update
    setCart(null);
    clearCartFromStorage();

    try {
      // Assuming there's a clearCart API endpoint
      // If not, we'll need to remove items one by one
      if (cart && cart.items) {
        await Promise.all(
          cart.items.map(item => cartApi.removeFromCart(item._id))
        );
      }

      toast.success('Cart cleared');
      return { success: true };
    } catch (error) {
      // Revert on error
      if (isMounted.current) {
        setCart(previousCart);
      }

      toast.error('Failed to clear cart');
      return { success: false };
    }
  }, [isAuthenticated, cart]);

  // Get item count for a specific product
  const getItemQuantity = useCallback((productId) => {
    if (!cart || !cart.items) return 0;

    const item = cart.items.find(item => item.product?._id === productId);
    return item ? item.quantity : 0;
  }, [cart]);

  // Check if product is in cart
  const isInCart = useCallback((productId) => {
    if (!cart || !cart.items) return false;
    return cart.items.some(item => item.product?._id === productId);
  }, [cart]);

  // Memoize cart state
  const cartState = useMemo(() => ({
    cart,
    items: cart?.items || [],
    totalItems,
    total,
    loading,
    isEmpty: !cart || !cart.items || cart.items.length === 0,
    hasPendingUpdates: pendingUpdates.current > 0
  }), [cart, totalItems, total, loading]);

  // Memoize cart actions
  const cartActions = useMemo(() => ({
    fetchCart,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    getItemQuantity,
    isInCart
  }), [fetchCart, addToCart, updateQuantity, removeItem, clearCart, getItemQuantity, isInCart]);

  return (
    <CartContext.Provider value={cartState}>
      <CartActionsContext.Provider value={cartActions}>
        {children}
      </CartActionsContext.Provider>
    </CartContext.Provider>
  );
};

// Hook to use cart state
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Hook to use cart actions
export const useCartActions = () => {
  const context = useContext(CartActionsContext);
  if (!context) {
    throw new Error('useCartActions must be used within a CartProvider');
  }
  return context;
};

// Selector hooks for granular subscriptions

// Get only cart items (most commonly used)
export const useCartItems = () => {
  const { items } = useCart();
  return items;
};

// Get only cart totals
export const useCartTotals = () => {
  const { totalItems, total } = useCart();
  return useMemo(() => ({ totalItems, total }), [totalItems, total]);
};

// Get only total items count (for badge display)
export const useCartItemCount = () => {
  const { totalItems } = useCart();
  return totalItems;
};

// Get cart loading state
export const useCartLoading = () => {
  const { loading } = useCart();
  return loading;
};

// Get cart empty state
export const useIsCartEmpty = () => {
  const { isEmpty } = useCart();
  return isEmpty;
};

// Combined hook for full cart functionality
export const useCartWithActions = () => {
  const state = useCart();
  const actions = useCartActions();
  return useMemo(() => ({ ...state, ...actions }), [state, actions]);
};
