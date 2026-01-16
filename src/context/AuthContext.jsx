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

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Memoized auth check function
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        // First set user from localStorage for instant UI update
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);

        // Then verify with backend
        const response = await authApi.getMe();
        const freshUser = response.data;

        // Only update if user data changed
        if (JSON.stringify(parsedUser) !== JSON.stringify(freshUser)) {
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        }
      } catch (error) {
        // Token is invalid, clear everything
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
      }
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }

    setLoading(false);
    isInitialized.current = true;
  }, []);

  // Login function with optimistic updates
  const login = useCallback(async (credentials) => {
    try {
      const response = await authApi.login(credentials);
      const { user: userData, accessToken, refreshToken } = response.data;

      // Batch localStorage updates
      const updates = [
        ['accessToken', accessToken],
        ['refreshToken', refreshToken],
        ['user', JSON.stringify(userData)]
      ];

      updates.forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });

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
      const { user: newUser, accessToken, refreshToken } = response.data;

      // Batch localStorage updates
      const updates = [
        ['accessToken', accessToken],
        ['refreshToken', refreshToken],
        ['user', JSON.stringify(newUser)]
      ];

      updates.forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });

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
      // Batch localStorage removals
      const keysToRemove = ['accessToken', 'refreshToken', 'user'];
      keysToRemove.forEach(key => localStorage.removeItem(key));

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
