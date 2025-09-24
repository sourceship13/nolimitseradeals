import React, { createContext, useContext, useState, useMemo, useEffect, useRef } from 'react';
import { Appearance, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getColors } from '../colors';
import AuthService from '../../services/auth.service';

export { getColors };

// User type definition
interface User {
  id: string;
  email: string;
  username?: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  account_type: 'regular' | 'premium' | 'business';
  is_verified: boolean;
  is_active: boolean;
}

// Login credentials types
interface LoginCredentials {
  email?: string;
  phone_number?: string;
  username?: string;
  password: string;
}

// Register data type
interface RegisterData {
  email: string;
  password: string;
  username?: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
}

// Complete Auth Context Type
interface AuthContextType {
  // User authentication state
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  
  // Authentication methods
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<string>; // Returns verification message
  logout: (logoutAll?: boolean) => Promise<void>;
  
  // User management methods
  refreshUser: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  
  // Password management
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  
  // Email verification
  verifyEmail: (token: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  
  // Session management
  getActiveSessions: () => Promise<any[]>;
  revokeSession: (sessionId: string) => Promise<void>;
  
  // Your existing features
  isDarkMode: boolean;
  setDarkMode: (value: boolean) => void;
  categories: Record<string, boolean>;
  setCategories: (value: Record<string, boolean>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Your existing state
  const colorScheme = Appearance.getColorScheme();
  const [isDarkMode, setDarkModeState] = useState(colorScheme === 'dark');
  const [categories, setCategoriesState] = useState<Record<string, boolean>>({
    food: true,
    beauty: true,
    fitness: true,
    electronics: true,
    fashion: true,
  });
  
  // App state reference for background/foreground handling
  const appState = useRef(AppState.currentState);

  // Initialize on mount
  useEffect(() => {
    initializeApp();
    
    // Listen for appearance changes
    const appearanceSubscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (!isDarkMode) { // Only update if user hasn't manually set it
        setDarkModeState(colorScheme === 'dark');
      }
    });
    
    // Listen for app state changes
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      appearanceSubscription.remove();
      appStateSubscription.remove();
    };
  }, []);

  // Initialize app (auth + preferences)
  const initializeApp = async () => {
    try {
      setLoading(true);
      
      // Load saved preferences
      await loadPreferences();
      
      // Check authentication status
      const isAuth = await AuthService.isAuthenticated();
      
      if (isAuth) {
        // Get stored user data
        const currentUser = await AuthService.getCurrentUser();
        setUser(currentUser);
        
        // Try to refresh user data from server
        if (currentUser) {
          try {
            const freshUser = await AuthService.getProfile();
            setUser(freshUser);
          } catch (error) {
            console.log('Using cached user data');
            // Keep using cached data if refresh fails
          }
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error initializing app:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Load saved preferences (dark mode, categories)
  const loadPreferences = async () => {
    try {
      // Load dark mode preference
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme !== null) {
        setDarkModeState(savedTheme === 'dark');
      }
      
      // Load category preferences
      const savedCategories = await AsyncStorage.getItem('categories');
      if (savedCategories !== null) {
        setCategoriesState(JSON.parse(savedCategories));
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  // Handle app state changes (background/foreground)
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      // App has come to the foreground
      if (user) {
        // Refresh user data when app comes back to foreground
        refreshUser();
      }
    }
    appState.current = nextAppState;
  };

  // Enhanced setDarkMode that persists preference
  const setDarkMode = async (value: boolean) => {
    setDarkModeState(value);
    try {
      await AsyncStorage.setItem('theme', value ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Enhanced setCategories that persists preference
  const setCategories = async (value: Record<string, boolean>) => {
    setCategoriesState(value);
    try {
      await AsyncStorage.setItem('categories', JSON.stringify(value));
    } catch (error) {
      console.error('Error saving category preferences:', error);
    }
  };

  // Authentication Methods

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      
      // Get device ID if you're tracking devices
      let deviceId = await AsyncStorage.getItem('deviceId');
      if (!deviceId) {
        // Generate a unique device ID
        deviceId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('deviceId', deviceId);
      }
      
      const loggedInUser = await AuthService.login(credentials, deviceId);
      setUser(loggedInUser);
      
      // Load user-specific preferences if any
      await loadUserPreferences(loggedInUser.id);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<string> => {
    try {
      setLoading(true);
      
      const { user: newUser, message } = await AuthService.register(data);
      setUser(newUser);
      
      return message; // Return verification message
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (logoutAll: boolean = false) => {
    try {
      await AuthService.logout(logoutAll);
      setUser(null);
      
      // Optionally reset preferences on logout
      // setCategories({ food: true, beauty: true, fitness: true, electronics: true, fashion: true });
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API call fails, clear local state
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const freshUser = await AuthService.getProfile();
      setUser(freshUser);
    } catch (error) {
      console.error('Error refreshing user:', error);
      
      // Check if user is still authenticated
      const isAuth = await AuthService.isAuthenticated();
      if (!isAuth) {
        setUser(null);
      }
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      const updatedUser = await AuthService.updateProfile(updates);
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const requestPasswordReset = async (email: string) => {
    await AuthService.requestPasswordReset(email);
  };

  const resetPassword = async (token: string, newPassword: string) => {
    await AuthService.resetPassword(token, newPassword);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await AuthService.changePassword(currentPassword, newPassword);
  };

  const verifyEmail = async (token: string) => {
    await AuthService.verifyEmail(token);
    // Refresh user to update verification status
    await refreshUser();
  };

  const resendVerificationEmail = async () => {
    if (!user?.email) {
      throw new Error('No user email found');
    }
    // This would need to be implemented in your AuthService
    // await AuthService.resendVerificationEmail(user.email);
  };

  const getActiveSessions = async () => {
    return AuthService.getActiveSessions();
  };

  const revokeSession = async (sessionId: string) => {
    // This would need to be implemented in your AuthService
    // await AuthService.revokeSession(sessionId);
  };

  // Load user-specific preferences
  const loadUserPreferences = async (userId: string) => {
    try {
      // Load user-specific category preferences if they exist
      const userCategories = await AsyncStorage.getItem(`categories_${userId}`);
      if (userCategories) {
        setCategoriesState(JSON.parse(userCategories));
      }
      
      // Load user-specific theme preference if it exists
      const userTheme = await AsyncStorage.getItem(`theme_${userId}`);
      if (userTheme) {
        setDarkModeState(userTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  // Memoized context value
  const value = useMemo(() => ({
    // Authentication state
    user,
    loading,
    isAuthenticated: !!user,
    isEmailVerified: user?.is_verified ?? false,
    
    // Authentication methods
    login,
    register,
    logout,
    
    // User management
    refreshUser,
    updateProfile,
    
    // Password management
    requestPasswordReset,
    resetPassword,
    changePassword,
    
    // Email verification
    verifyEmail,
    resendVerificationEmail,
    
    // Session management
    getActiveSessions,
    revokeSession,
    
    // Your existing features
    isDarkMode,
    setDarkMode,
    categories,
    setCategories,
  }), [user, loading, isDarkMode, categories]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}