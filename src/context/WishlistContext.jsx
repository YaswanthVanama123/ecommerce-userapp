import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { wishlistApi, productApi } from '../api';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const WishlistContext = createContext(null);
const WishlistActionsContext = createContext(null);

// Local storage keys
const WISHLIST_STORAGE_KEY = 'wishlist_data';
const GUEST_WISHLIST_KEY = 'guest_wishlist';
const WISHLIST_TIMESTAMP_KEY = 'wishlist_timestamp';
const WISHLIST_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// Helper function to save authenticated wishlist to localStorage (cache)
const saveWishlistToStorage = (wishlist) => {
  try {
    const wishlistData = {
      wishlist,
      timestamp: Date.now()
    };
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistData));
    localStorage.setItem(WISHLIST_TIMESTAMP_KEY, wishlistData.timestamp.toString());
  } catch (error) {
    console.error('Error saving wishlist to localStorage:', error);
  }
};

// Helper function to load authenticated wishlist from localStorage
const loadWishlistFromStorage = () => {
  try {
    const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
    const timestamp = localStorage.getItem(WISHLIST_TIMESTAMP_KEY);

    if (!stored || !timestamp) return null;

    const age = Date.now() - parseInt(timestamp, 10);
    if (age > WISHLIST_CACHE_DURATION) {
      localStorage.removeItem(WISHLIST_STORAGE_KEY);
      localStorage.removeItem(WISHLIST_TIMESTAMP_KEY);
      return null;
    }

    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading wishlist from localStorage:', error);
    return null;
  }
};

// Helper function to clear authenticated wishlist cache
const clearWishlistFromStorage = () => {
  localStorage.removeItem(WISHLIST_STORAGE_KEY);
  localStorage.removeItem(WISHLIST_TIMESTAMP_KEY);
};

// Helper function to save guest wishlist to localStorage
const saveGuestWishlist = (items) => {
  try {
    localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving guest wishlist:', error);
  }
};

// Helper function to load guest wishlist from localStorage
const loadGuestWishlist = () => {
  try {
    const stored = localStorage.getItem(GUEST_WISHLIST_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading guest wishlist:', error);
    return [];
  }
};

// Helper function to clear guest wishlist
const clearGuestWishlist = () => {
  localStorage.removeItem(GUEST_WISHLIST_KEY);
};

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const isMounted = useRef(true);
  const hasShownMergeToast = useRef(false);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Fetch wishlist from server (authenticated users only)
  const fetchWishlist = useCallback(async (showLoading = true) => {
    if (!isAuthenticated) {
      return;
    }

    try {
      if (showLoading && isMounted.current) {
        setLoading(true);
      }

      const response = await wishlistApi.getWishlist();
      console.log('[WishlistContext] fetchWishlist response:', response);
      console.log('[WishlistContext] response.data:', response.data);
      console.log('[WishlistContext] response.data.wishlist:', response.data?.wishlist);

      // API returns { success, message, data: { wishlist: { items: [...] } } }
      // wishlistApi.getWishlist() returns response.data, so: { success, data: { wishlist: {...} } }
      // Therefore we access response.data.wishlist.items
      const fetchedWishlist = response.data?.wishlist?.items || [];

      console.log('[WishlistContext] fetchedWishlist:', fetchedWishlist);
      console.log('[WishlistContext] fetchedWishlist length:', fetchedWishlist?.length);
      console.log('[WishlistContext] fetchedWishlist first item:', fetchedWishlist[0]);

      if (isMounted.current) {
        console.log('[WishlistContext] Setting wishlist state to:', fetchedWishlist);
        setWishlist(fetchedWishlist);
        saveWishlistToStorage(fetchedWishlist);
        console.log('[WishlistContext] Wishlist state updated, length:', fetchedWishlist?.length);
      }
    } catch (error) {
      console.error('[WishlistContext] Error fetching wishlist:', error);
      console.error('[WishlistContext] Error response:', error.response);
      console.error('[WishlistContext] Error response status:', error.response?.status);
      if (isMounted.current && error.response?.status !== 404) {
        setWishlist([]);
        clearWishlistFromStorage();
      }
    } finally {
      console.log('[WishlistContext] fetchWishlist finally block - showLoading:', showLoading, 'isMounted:', isMounted.current);
      if (isMounted.current && showLoading) {
        console.log('[WishlistContext] Setting loading to false');
        setLoading(false);
      }
    }
  }, [isAuthenticated]);

  // Merge guest wishlist with server wishlist when user logs in
  const mergeGuestWishlist = useCallback(async () => {
    const guestItems = loadGuestWishlist();

    if (!guestItems || guestItems.length === 0) {
      return;
    }

    try {
      for (const productId of guestItems) {
        await wishlistApi.addToWishlist(productId);
      }

      clearGuestWishlist();

      if (!hasShownMergeToast.current) {
        toast.success(`${guestItems.length} item(s) added to your wishlist`);
        hasShownMergeToast.current = true;
      }

      await fetchWishlist(false);
    } catch (error) {
      console.error('Error merging guest wishlist:', error);
    }
  }, [fetchWishlist]);

  // Load wishlist from cache or fetch on auth change
  useEffect(() => {
    let isCancelled = false;

    const initializeWishlist = async () => {
      try {
        if (isAuthenticated) {
          console.log('[WishlistContext] User is authenticated, fetching wishlist...');

          // Always fetch fresh data for authenticated users
          if (!isCancelled) {
            setLoading(true);
            await mergeGuestWishlist();

            // ALWAYS clear guest wishlist after login - use backend data only
            clearGuestWishlist();
          }

          if (!isCancelled) {
            await fetchWishlist(true);
          }
        } else {
          console.log('[WishlistContext] User is NOT authenticated, loading guest wishlist');
          const guestItems = loadGuestWishlist();
          if (!isCancelled) {
            setWishlist(guestItems || []);
            clearWishlistFromStorage();
          }
        }
      } catch (error) {
        console.error('[WishlistContext] Error initializing wishlist:', error);
        if (!isCancelled) {
          setLoading(false);
        }
      } finally {
        // Ensure loading is always set to false after initialization
        console.log('[WishlistContext] initializeWishlist finally block');
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    console.log('[WishlistContext] Starting initializeWishlist, isAuthenticated:', isAuthenticated);
    initializeWishlist();

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Add to wishlist with guest support
  const addToWishlist = useCallback(async (productId) => {
    console.log('[WishlistContext] addToWishlist called:', { productId, isAuthenticated });

    if (!isAuthenticated) {
      // Guest user - store in localStorage
      const guestItems = loadGuestWishlist();

      if (guestItems.includes(productId)) {
        toast.info('Already in wishlist');
        return { success: false };
      }

      guestItems.push(productId);
      saveGuestWishlist(guestItems);
      setWishlist(guestItems);

      toast.success('Added to wishlist!');
      return { success: true };
    }

    // Authenticated user
    try {
      console.log('[WishlistContext] Calling wishlistApi.addToWishlist...');
      await wishlistApi.addToWishlist(productId);

      if (isMounted.current) {
        console.log('[WishlistContext] Fetching updated wishlist...');
        await fetchWishlist(false);
        toast.success('Added to wishlist!');
      }

      return { success: true };
    } catch (error) {
      console.error('[WishlistContext] Error adding to wishlist:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add to wishlist';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [isAuthenticated, fetchWishlist]);

  // Remove from wishlist with guest support
  const removeFromWishlist = useCallback(async (productId) => {
    if (!isAuthenticated) {
      // Guest user
      const guestItems = loadGuestWishlist();
      const filteredItems = guestItems.filter(id => id !== productId);

      saveGuestWishlist(filteredItems);
      setWishlist(filteredItems);

      toast.success('Removed from wishlist');
      return { success: true };
    }

    // Authenticated user
    try {
      await wishlistApi.removeFromWishlist(productId);

      if (isMounted.current) {
        await fetchWishlist(false);
        toast.success('Removed from wishlist');
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to remove from wishlist';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [isAuthenticated, fetchWishlist]);

  // Check if product is in wishlist
  const isInWishlist = useCallback((productId) => {
    console.log('[WishlistContext] isInWishlist check:', {
      productId,
      wishlist,
      isAuthenticated,
      wishlistLength: wishlist?.length
    });

    if (!isAuthenticated) {
      const result = wishlist.includes(productId);
      console.log('[WishlistContext] Guest user check result:', result);
      return result;
    }

    const result = wishlist.some(item => {
      // Convert to strings for comparison (MongoDB ObjectIds)
      const itemProductId = String(item.product?._id || item.product || item);
      const targetProductId = String(productId);
      const matches = itemProductId === targetProductId;

      console.log('[WishlistContext] Checking item:', {
        itemProductId,
        targetProductId,
        matches,
        rawItem: item
      });
      return matches;
    });

    console.log('[WishlistContext] Authenticated user check result:', result);
    return result;
  }, [wishlist, isAuthenticated]);

  // Toggle wishlist item
  const toggleWishlist = useCallback(async (productId) => {
    const inWishlist = isInWishlist(productId);
    console.log('[WishlistContext] toggleWishlist:', { productId, inWishlist });

    if (inWishlist) {
      console.log('[WishlistContext] Removing from wishlist...');
      return removeFromWishlist(productId);
    } else {
      console.log('[WishlistContext] Adding to wishlist...');
      return addToWishlist(productId);
    }
  }, [addToWishlist, removeFromWishlist, isInWishlist]);

  // Memoize wishlist state
  const wishlistState = useMemo(() => ({
    wishlist,
    loading,
    isEmpty: !wishlist || wishlist.length === 0,
    count: wishlist ? wishlist.length : 0
  }), [wishlist, loading]);

  // Memoize wishlist actions
  const wishlistActions = useMemo(() => ({
    fetchWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist
  }), [fetchWishlist, addToWishlist, removeFromWishlist, toggleWishlist, isInWishlist]);

  return (
    <WishlistContext.Provider value={wishlistState}>
      <WishlistActionsContext.Provider value={wishlistActions}>
        {children}
      </WishlistActionsContext.Provider>
    </WishlistContext.Provider>
  );
};

// Hook to use wishlist state
export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

// Hook to use wishlist actions
export const useWishlistActions = () => {
  const context = useContext(WishlistActionsContext);
  if (!context) {
    throw new Error('useWishlistActions must be used within a WishlistProvider');
  }
  return context;
};

// Combined hook for full wishlist functionality
export const useWishlistWithActions = () => {
  const state = useWishlist();
  const actions = useWishlistActions();
  return useMemo(() => ({ ...state, ...actions }), [state, actions]);
};
