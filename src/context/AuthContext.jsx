import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { authApi } from '../api';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

// Separate contexts for auth state and auth actions to prevent unnecessary re-renders
const AuthActionsContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Track if initial auth check is complete
  const isInitialized = useRef(false);
  const isCheckingAuth = useRef(false); // Prevent concurrent auth checks

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Memoized auth check function
  const checkAuth = useCallback(async () => {
    // Prevent concurrent auth checks
    if (isCheckingAuth.current) {
      console.log('[AuthContext] Auth check already in progress, skipping...');
      return;
    }

    isCheckingAuth.current = true;

    // Note: Tokens are now in HttpOnly cookies, so we can't check them from JavaScript
    // We'll check if user data exists in localStorage (for UI purposes) and verify with backend
    const storedUser = localStorage.getItem('user');

    if (storedUser) {
      try {
        // First set user from localStorage for instant UI update
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);

        // Then verify with backend (will use cookie automatically)
        const response = await authApi.getMe();
        const freshUser = response.data;

        // Only update if user data changed
        if (JSON.stringify(parsedUser) !== JSON.stringify(freshUser)) {
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        }
      } catch (error) {
        // If error is network/connection error (backend down), keep user logged in from localStorage
        if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
          console.warn('[AuthContext] Backend unavailable, using cached user data');
          // Keep the user from localStorage, don't log them out
        } else {
          // Cookie is invalid or expired, clear everything
          console.log('[AuthContext] Auth verification failed, clearing session');
          localStorage.removeItem('user');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    } else {
      // No stored user - only try backend if we might have cookies
      // Skip the API call to prevent unnecessary 401 errors and infinite loops
      console.log('[AuthContext] No stored user found, skipping auth check');
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      isInitialized.current = true;
      isCheckingAuth.current = false;
      return;

      /* Original code - causes infinite loops when not logged in
      // Try to fetch user data from backend (in case cookies exist but localStorage was cleared)
      try {
        const response = await authApi.getMe();
        const freshUser = response.data;
        setUser(freshUser);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(freshUser));
      } catch (error) {
        // If backend is down, just set loading to false and don't show error
        if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
          console.warn('[AuthContext] Backend unavailable during initial auth check');
        } else {
          console.log('[AuthContext] No valid session found');
        }
        // No valid session
        setUser(null);
        setIsAuthenticated(false);
      }
      */
    }

    setLoading(false);
    isInitialized.current = true;
    isCheckingAuth.current = false;
  }, []);

  // Login function with optimistic updates
  const login = useCallback(async (credentials) => {
    try {
      const response = await authApi.login(credentials);
      const { user: userData } = response.data;

      // Store only user data in localStorage (tokens are in HttpOnly cookies)
      localStorage.setItem('user', JSON.stringify(userData));

      // Batch state updates
      setUser(userData);
      setIsAuthenticated(true);

      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Register function with optimistic updates
  const register = useCallback(async (userData) => {
    try {
      const response = await authApi.register(userData);
      const { user: newUser } = response.data;

      // Store only user data in localStorage (tokens are in HttpOnly cookies)
      localStorage.setItem('user', JSON.stringify(newUser));

      // Batch state updates
      setUser(newUser);
      setIsAuthenticated(true);

      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear user data from localStorage (cookies are cleared by backend)
      localStorage.removeItem('user');

      // Batch state updates
      setUser(null);
      setIsAuthenticated(false);

      toast.info('Logged out successfully');
    }
  }, []);

  // Update user profile (useful for profile updates without full re-auth)
  const updateUserProfile = useCallback((updates) => {
    setUser(prevUser => {
      if (!prevUser) return null;

      const updatedUser = { ...prevUser, ...updates };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  // Refresh user data from server
  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.getMe();
      const freshUser = response.data;
      setUser(freshUser);
      localStorage.setItem('user', JSON.stringify(freshUser));
      return { success: true, user: freshUser };
    } catch (error) {
      console.error('Error refreshing user:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Memoize auth state separately from actions to minimize re-renders
  const authState = useMemo(() => ({
    user,
    loading,
    isAuthenticated,
    isInitialized: isInitialized.current
  }), [user, loading, isAuthenticated]);

  // Memoize actions - these rarely change
  const authActions = useMemo(() => ({
    login,
    register,
    logout,
    checkAuth,
    updateUserProfile,
    refreshUser
  }), [login, register, logout, checkAuth, updateUserProfile, refreshUser]);

  return (
    <AuthContext.Provider value={authState}>
      <AuthActionsContext.Provider value={authActions}>
        {children}
      </AuthActionsContext.Provider>
    </AuthContext.Provider>
  );
};

// Hook to use auth state (subscribes to state changes)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Hook to use auth actions (doesn't trigger re-renders when state changes)
export const useAuthActions = () => {
  const context = useContext(AuthActionsContext);
  if (!context) {
    throw new Error('useAuthActions must be used within an AuthProvider');
  }
  return context;
};

// Selector hooks for granular subscriptions (prevent unnecessary re-renders)
export const useAuthUser = () => {
  const { user } = useAuth();
  return user;
};

export const useAuthStatus = () => {
  const { isAuthenticated, loading } = useAuth();
  return useMemo(() => ({ isAuthenticated, loading }), [isAuthenticated, loading]);
};

export const useIsAuthenticated = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
};

// Combined hook for convenience (use when you need both state and actions)
export const useAuthWithActions = () => {
  const state = useAuth();
  const actions = useAuthActions();
  return useMemo(() => ({ ...state, ...actions }), [state, actions]);
};
