import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { cartApi, productApi } from '../api';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const CartContext = createContext(null);
const CartActionsContext = createContext(null);

// Local storage keys
const CART_STORAGE_KEY = 'cart_data'; // For authenticated users (cache)
const GUEST_CART_KEY = 'guest_cart'; // For unauthenticated users
const CART_TIMESTAMP_KEY = 'cart_timestamp';
const CART_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// Helper function to save authenticated cart to localStorage (cache)
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

// Helper function to load authenticated cart from localStorage
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

// Helper function to clear authenticated cart cache
const clearCartFromStorage = () => {
  localStorage.removeItem(CART_STORAGE_KEY);
  localStorage.removeItem(CART_TIMESTAMP_KEY);
};

// Helper function to save guest cart to localStorage
const saveGuestCart = (items) => {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving guest cart:', error);
  }
};

// Helper function to load guest cart from localStorage
const loadGuestCart = () => {
  try {
    const stored = localStorage.getItem(GUEST_CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading guest cart:', error);
    return [];
  }
};

// Helper function to clear guest cart
const clearGuestCart = () => {
  localStorage.removeItem(GUEST_CART_KEY);
};

// Memoized cart calculations
const calculateCartTotals = (cart) => {
  if (!cart || !cart.items || cart.items.length === 0) {
    return { totalItems: 0, total: 0 };
  }

  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.items.reduce((sum, item) => {
    const price = item.price || item.product?.price || 0;
    return sum + (price * item.quantity);
  }, 0);

  return { totalItems, total };
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  // Track pending updates to prevent race conditions
  const pendingUpdates = useRef(0);
  const isMounted = useRef(true);
  const hasShownMergeToast = useRef(false);

  // Debounce timer for updates
  const updateDebounceTimer = useRef(null);

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

  // Fetch cart from server (authenticated users only)
  const fetchCart = useCallback(async (showLoading = true) => {
    if (!isAuthenticated) {
      return;
    }

    try {
      if (showLoading && isMounted.current) {
        setLoading(true);
      }

      const response = await cartApi.getCart();
      console.log('[CartContext] fetchCart response:', response);
      console.log('[CartContext] response.data:', response.data);

      // API returns: { success, message, data: { cart: { items: [...] } } }
      // cartApi.getCart() returns the full response, so:
      // response.data = { cart: { items: [...] } }
      const fetchedCart = response.data?.cart || response.cart || null;
      console.log('[CartContext] fetchedCart:', fetchedCart);

      if (isMounted.current) {
        setCart(fetchedCart);

        // Calculate and save to cache
        const totals = calculateCartTotals(fetchedCart);
        saveCartToStorage(fetchedCart, totals.totalItems, totals.total);
      }
    } catch (error) {
      console.error('[CartContext] Error fetching cart:', error);
      console.error('[CartContext] Error response status:', error.response?.status);
      if (isMounted.current && error.response?.status === 404) {
        // No cart exists yet
        console.log('[CartContext] Cart not found (404), setting cart to null');
        setCart(null);
        clearCartFromStorage();
      }
    } finally {
      console.log('[CartContext] fetchCart finally block - showLoading:', showLoading, 'isMounted:', isMounted.current);
      if (isMounted.current && showLoading) {
        console.log('[CartContext] Setting loading to false');
        setLoading(false);
      }
    }
  }, [isAuthenticated]);

  // Merge guest cart with server cart when user logs in
  const mergeGuestCart = useCallback(async () => {
    const guestItems = loadGuestCart();

    if (!guestItems || guestItems.length === 0) {
      return;
    }

    try {
      // Add each guest cart item to server cart
      for (const item of guestItems) {
        await cartApi.addToCart({
          productId: item.product._id || item.product,
          quantity: item.quantity,
          size: item.size,
          color: item.color
        });
      }

      // Clear guest cart after successful merge
      clearGuestCart();

      // Show success message only once
      if (!hasShownMergeToast.current) {
        toast.success(`${guestItems.length} item(s) added to your cart`);
        hasShownMergeToast.current = true;
      }

      // Fetch updated cart from server
      await fetchCart(false);
    } catch (error) {
      console.error('Error merging guest cart:', error);
      toast.error('Some items could not be added to your cart');
    }
  }, [fetchCart]);

  // Load cart from cache or fetch on auth change
  useEffect(() => {
    let isCancelled = false;

    const initializeCart = async () => {
      try {
        if (isAuthenticated) {
          console.log('[CartContext] User is authenticated, fetching cart...');

          // Always fetch fresh data for authenticated users
          // Don't rely on cache - it might be stale
          if (!isCancelled) {
            setLoading(true);
            await mergeGuestCart();
          }

          // Fetch fresh data
          if (!isCancelled) {
            await fetchCart(true);
          }
        } else {
          console.log('[CartContext] User is NOT authenticated, loading guest cart');
          // User is not logged in - load guest cart
          const guestItems = loadGuestCart();

          if (!isCancelled) {
            if (guestItems && guestItems.length > 0) {
              // Create cart object from guest items
              const guestCart = {
                items: guestItems,
                user: null
              };
              setCart(guestCart);
            } else {
              setCart(null);
            }

            clearCartFromStorage();
          }
        }
      } catch (error) {
        console.error('[CartContext] Error initializing cart:', error);
        if (!isCancelled) {
          setLoading(false);
        }
      } finally {
        // Ensure loading is always set to false after initialization
        console.log('[CartContext] initializeCart finally block');
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    console.log('[CartContext] Starting initializeCart, isAuthenticated:', isAuthenticated);
    initializeCart();

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Add to cart with guest support
  const addToCart = useCallback(async (productId, quantity = 1, size = null, color = null) => {
    if (!isAuthenticated) {
      // Guest user - store in localStorage
      try {
        // Fetch product details
        const response = await productApi.getProductById(productId);
        const product = response.data;

        const guestItems = loadGuestCart();

        // Check if item already exists
        const existingItemIndex = guestItems.findIndex(
          item =>
            (item.product._id || item.product) === productId &&
            item.size === size &&
            item.color === color
        );

        if (existingItemIndex > -1) {
          // Update quantity
          guestItems[existingItemIndex].quantity += quantity;
        } else {
          // Add new item
          guestItems.push({
            _id: `guest-${Date.now()}`,
            product: {
              _id: product._id,
              name: product.name,
              images: product.images,
              price: product.price,
              stock: product.stock,
              category: product.category
            },
            quantity,
            size,
            color,
            price: product.price
          });
        }

        saveGuestCart(guestItems);

        // Update local state
        setCart({ items: guestItems, user: null });

        toast.success('Added to cart!');
        return { success: true };
      } catch (error) {
        console.error('Error adding to guest cart:', error);
        toast.error('Failed to add to cart');
        return { success: false };
      }
    }

    // Authenticated user - use server cart
    try {
      pendingUpdates.current++;

      const response = await cartApi.addToCart({ productId, quantity, size, color });
      const updatedCart = response.data.data?.cart || response.data.cart;

      if (isMounted.current) {
        setCart(updatedCart);
        const totals = calculateCartTotals(updatedCart);
        saveCartToStorage(updatedCart, totals.totalItems, totals.total);
        toast.success('Added to cart!');
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to add to cart';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      pendingUpdates.current--;
    }
  }, [isAuthenticated]);

  // Update quantity with guest support
  const updateQuantity = useCallback(async (itemId, quantity) => {
    if (!isAuthenticated) {
      // Guest user - update localStorage
      if (quantity < 0) return { success: false };

      const guestItems = loadGuestCart();
      const itemIndex = guestItems.findIndex(item => item._id === itemId);

      if (itemIndex === -1) return { success: false };

      if (quantity === 0) {
        // Remove item
        guestItems.splice(itemIndex, 1);
      } else {
        // Update quantity
        guestItems[itemIndex].quantity = quantity;
      }

      saveGuestCart(guestItems);
      setCart({ items: guestItems, user: null });

      return { success: true };
    }

    // Authenticated user
    if (quantity < 0) return { success: false };

    if (quantity === 0) {
      return removeItem(itemId);
    }

    // Debounce the API call
    return new Promise((resolve) => {
      if (updateDebounceTimer.current) {
        clearTimeout(updateDebounceTimer.current);
      }

      updateDebounceTimer.current = setTimeout(async () => {
        try {
          pendingUpdates.current++;

          const response = await cartApi.updateCartItem(itemId, quantity);
          const updatedCart = response.data.data?.cart || response.data.cart;

          if (isMounted.current) {
            setCart(updatedCart);
            const totals = calculateCartTotals(updatedCart);
            saveCartToStorage(updatedCart, totals.totalItems, totals.total);
          }

          resolve({ success: true });
        } catch (error) {
          if (isMounted.current) {
            await fetchCart(false);
          }

          const errorMessage = error.response?.data?.message || 'Failed to update quantity';
          toast.error(errorMessage);
          resolve({ success: false, error: errorMessage });
        } finally {
          pendingUpdates.current--;
        }
      }, 500);
    });
  }, [isAuthenticated, fetchCart]);

  // Remove item with guest support
  const removeItem = useCallback(async (itemId) => {
    if (!isAuthenticated) {
      // Guest user - remove from localStorage
      const guestItems = loadGuestCart();
      const filteredItems = guestItems.filter(item => item._id !== itemId);

      saveGuestCart(filteredItems);
      setCart({ items: filteredItems, user: null });

      toast.success('Item removed from cart');
      return { success: true };
    }

    // Authenticated user
    try {
      pendingUpdates.current++;

      const response = await cartApi.removeFromCart(itemId);
      const updatedCart = response.data.data?.cart || response.data.cart;

      if (isMounted.current) {
        setCart(updatedCart);
        const totals = calculateCartTotals(updatedCart);
        saveCartToStorage(updatedCart, totals.totalItems, totals.total);
        toast.success('Item removed from cart');
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to remove item';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      pendingUpdates.current--;
    }
  }, [isAuthenticated]);

  // Clear entire cart
  const clearCart = useCallback(async () => {
    if (!isAuthenticated) {
      // Guest user - clear localStorage
      clearGuestCart();
      setCart(null);
      toast.success('Cart cleared');
      return { success: true };
    }

    // Authenticated user
    const previousCart = cart;

    setCart(null);
    clearCartFromStorage();

    try {
      if (cart && cart.items) {
        await Promise.all(
          cart.items.map(item => cartApi.removeFromCart(item._id))
        );
      }

      toast.success('Cart cleared');
      return { success: true };
    } catch (error) {
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

    const item = cart.items.find(item => {
      // Convert to strings for comparison (MongoDB ObjectIds)
      const itemProductId = String(item.product?._id || item.product);
      const targetProductId = String(productId);
      return itemProductId === targetProductId;
    });
    return item ? item.quantity : 0;
  }, [cart]);

  // Check if product is in cart
  const isInCart = useCallback((productId) => {
    if (!cart || !cart.items) return false;
    return cart.items.some(item => {
      // Convert to strings for comparison (MongoDB ObjectIds)
      const itemProductId = String(item.product?._id || item.product);
      const targetProductId = String(productId);
      return itemProductId === targetProductId;
    });
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
  console.log("cart moubted")
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
