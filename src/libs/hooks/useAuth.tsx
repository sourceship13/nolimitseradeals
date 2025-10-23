import React, { createContext, useContext, useState, useMemo, useEffect, useRef } from 'react';
import { Appearance, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getColors } from '../colors';
import AuthService from '../../services/auth.service';
import ApiService from '../../services/api.service';

export { getColors };
import { Category, User, LoginCredentials, RegisterData } from '../../types/global.types';

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
  
  // Hearted deals management
  heartedDeals: any[];
  heartedDealsLoading: boolean;
  refreshHeartedDeals: () => Promise<void>;
  isDealHearted: (dealId: string) => boolean;
  heartDeal: (dealId: string, dealObject?: any) => Promise<boolean>;
  unheartDeal: (dealId: string) => Promise<boolean>;
  toggleHeartDeal: (dealId: string, dealObject?: any) => Promise<boolean>;
  
  // All deals management
  deals: any[];
  dealsLoading: boolean;
  refreshDeals: () => Promise<void>;
  
  // Your existing features
  isDarkMode: boolean;
  setDarkMode: (value: boolean) => void;
  categories: Record<string, boolean>;
  setCategories: (value: Record<string, boolean>) => void;
  availableCategories: Category[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Hearted deals state
  const [heartedDeals, setHeartedDeals] = useState<any[]>([]);
  const [heartedDealsLoading, setHeartedDealsLoading] = useState(false);
  
  // All deals state
  const [deals, setDeals] = useState<any[]>([]);
  const [dealsLoading, setDealsLoading] = useState(false);
  
  // Your existing state
  const colorScheme = Appearance.getColorScheme();
  const [isDarkMode, setDarkModeState] = useState(colorScheme === 'dark');
  const [categories, setCategoriesState] = useState<Record<string, boolean>>({});
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  
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

  // Fetch all deals from API
  const fetchDeals = async () => {
    try {
      setDealsLoading(true);
      const result = await ApiService.getDeals();
      if (result.success && result.data) {
        // Handle both direct array and object with data property
        const dealsData = result.data || result;
        const finalDeals = Array.isArray(dealsData) ? dealsData : [];
        setDeals(finalDeals);
        // Extract categories from deals
        const extractedCategories: Category[] = [];
        const categoryMap: Record<string, Category> = {};
        finalDeals.forEach((deal: any) => {
          const catSlug = deal.category_slug || deal.category || deal.category_name;
          const catName = deal.category_name || deal.category || deal.category_slug;
          if (catSlug && !categoryMap[catSlug]) {
            categoryMap[catSlug] = {
              id: catSlug,
              slug: catSlug,
              name: catName || catSlug,
              description: '',
              sort_order: 0,
              active_deal_count: '0',
              business_count: '0',
            };
          }
        });
        Object.values(categoryMap).forEach((cat: Category) => extractedCategories.push(cat));
        setAvailableCategories(extractedCategories);
        // Build categories state object (all true by default, or restore from storage)
        const savedCategories = await AsyncStorage.getItem('categories');
        let mergedCategories: Record<string, boolean> = {};
        if (savedCategories) {
          const parsedCategories = JSON.parse(savedCategories);
          extractedCategories.forEach((cat: Category) => {
            mergedCategories[cat.slug] = parsedCategories[cat.slug] !== undefined ? parsedCategories[cat.slug] : true;
          });
        } else {
          extractedCategories.forEach((cat: Category) => {
            mergedCategories[cat.slug] = true;
          });
        }
        setCategoriesState(mergedCategories);
        await AsyncStorage.setItem('categories', JSON.stringify(mergedCategories));
        return finalDeals;
      } else {
        setDeals([]);
        setAvailableCategories([]);
        setCategoriesState({});
        return [];
      }
    } catch (error) {
      console.error('❌ Error fetching deals:', error);
      setDeals([]);
      setAvailableCategories([]);
      setCategoriesState({});
      return [];
    } finally {
      setDealsLoading(false);
    }
  };

  // Fetch hearted deals from API
  const fetchHeartedDeals = async () => {
    try {
      setHeartedDealsLoading(true);
      
      const result = await ApiService.getHeartedDeals();
      
      if (result.success && result.data) {
        // Handle new API response format: { dealIds: [...], count: number }
        let heartedDealIds: string[] = [];
        
        if (result.data && typeof result.data === 'object' && !Array.isArray(result.data)) {
          // New format: { dealIds: [...], count: number }
          const dataObj = result.data as any;
          if (dataObj.dealIds && Array.isArray(dataObj.dealIds)) {
            heartedDealIds = dataObj.dealIds;
          }
        } else if (Array.isArray(result.data)) {
          // Legacy format: array of deal objects
          heartedDealIds = result.data.map((deal: any) => deal.deal_id || deal.id).filter(Boolean);
        }
        
        // Convert deal IDs to minimal deal objects for compatibility
        const heartedDealsArray = heartedDealIds.map(dealId => ({
          deal_id: dealId,
          id: dealId, // Also set id for compatibility
          isHearted: true // Flag to indicate this is a hearted deal
        }));
        
        setHeartedDeals(heartedDealsArray);
        return heartedDealsArray;
      } else {
        setHeartedDeals([]);
        return [];
      }
    } catch (error) {
      console.error('❌ Error fetching hearted deals:', error);
      console.error('❌ Full error details:', {
        message: (error as any)?.message,
        stack: (error as any)?.stack
      });
      setHeartedDeals([]);
      return [];
    } finally {
      setHeartedDealsLoading(false);
    }
  };

  // Fetch categories from API

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
        setUser(currentUser as User | null);
        // Fetch all deals (available for all users)
        try {
          await fetchDeals();
        } catch (dealsError) {
          console.error('⚠️ InitializeApp: Failed to fetch deals, but continuing...', dealsError);
        }
        // Fetch hearted deals after user is authenticated
        try {
          await fetchHeartedDeals();
        } catch (heartedDealsError) {
          console.error('⚠️ InitializeApp: Failed to fetch hearted deals, but continuing...', heartedDealsError);
        }
        // Try to refresh user data from server
        if (currentUser) {
          try {
            const freshUser = await AuthService.getProfile();
            setUser(freshUser as User);
          } catch (error) {
            console.error('⚠️ InitializeApp: Using cached user data, server refresh failed:', error);
            // Keep using cached data if refresh fails
          }
        }
      } else {
        setUser(null);
        // Even for non-authenticated users, fetch deals
        try {
          await fetchDeals();
        } catch (dealsError) {
          console.error('⚠️ InitializeApp: Failed to fetch deals for guest, but continuing...', dealsError);
        }
      }
    } catch (error) {
      console.error('💥 InitializeApp: Error initializing app:', error);
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
        const parsedCategories = JSON.parse(savedCategories);
        
        if (availableCategories.length > 0) {
          // Validate saved categories against available categories
          const validCategories: Record<string, boolean> = {};
          availableCategories.forEach(cat => {
            // Use the saved preference if it exists, otherwise default to true
            validCategories[cat.slug] = parsedCategories[cat.slug] !== undefined 
              ? parsedCategories[cat.slug] 
              : true;
          });
          setCategoriesState(validCategories);
        } else {
          // If availableCategories is empty, just restore the saved categories as-is
          // This prevents clearing categories when availableCategories hasn't loaded yet
          setCategoriesState(parsedCategories);
        }
      } else if (availableCategories.length > 0) {
        // If no saved preferences but we have categories, set all to true
        const defaultCategories: Record<string, boolean> = {};
        availableCategories.forEach(cat => {
          defaultCategories[cat.slug] = true;
        });
        setCategoriesState(defaultCategories);
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
      
      // Always try to restore categories from storage first
      restoreCategoriesFromStorage();
      
      // Proactively refresh tokens when app comes to foreground (prevents 401 errors)
      AuthService.proactiveTokenRefresh();
      
      // App has come to the foreground
      // Always refresh deals when app comes to foreground (for all users)
      fetchDeals();
      
      if (user) {
        // Refresh user data when app comes back to foreground
        refreshUser();
        // Refresh categories when app comes back to foreground (only if user is authenticated)
        // Refresh hearted deals when app comes back to foreground
        fetchHeartedDeals();
      } else {
        // Even without user, try to fetch categories for guest mode
      }
    }
    appState.current = nextAppState;
  };

  // Restore categories from storage without validation against availableCategories
  const restoreCategoriesFromStorage = async () => {
    try {
      const savedCategories = await AsyncStorage.getItem('categories');
      if (savedCategories !== null) {
        const parsedCategories = JSON.parse(savedCategories);
        setCategoriesState(parsedCategories);
        return parsedCategories;
      }
    } catch (error) {
      console.error('Error restoring categories from storage:', error);
    }
    return null;
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
      console.error('❌ Error saving categories:', error);
    }
  };

  // Refresh categories manually
  const refreshCategories = async () => {
  };

  // Refresh deals manually
  const refreshDeals = async () => {
    await fetchDeals();
  };

  // Refresh hearted deals manually
  const refreshHeartedDeals = async () => {
    if (user) {
      await fetchHeartedDeals();
    }
  };

  // Check if a deal is hearted
  const isDealHearted = (dealId: string): boolean => {
    return heartedDeals.some(deal => deal.deal_id === dealId || deal.id === dealId);
  };

  // Heart a deal (API + state update)
  const heartDeal = async (dealId: string, dealObject?: any): Promise<boolean> => {
    
    if (!user?.id) {
      console.error('❌ Cannot heart deal: user not authenticated');
      return false;
    }

    try {
      // Optimistic update - add to global state immediately
      const alreadyHearted = heartedDeals.some(d => d.deal_id === dealId || d.id === dealId);
      if (!alreadyHearted) {
        // Create minimal deal object for hearted deals state
        const dealToAdd = {
          deal_id: dealId,
          id: dealId,
          isHearted: true,
          // Include any additional deal data if provided
          ...(dealObject && typeof dealObject === 'object' ? dealObject : {})
        };
        setHeartedDeals(prev => [...prev, dealToAdd]);
      }
      // Make API call
      await ApiService.heartDeal(dealId);
      // Refresh both hearted deals and all deals in background for consistency
      Promise.all([
        refreshHeartedDeals().catch(err => {
          console.warn('⚠️ Background refresh failed:', err);
        }),
        refreshDeals().catch(err => {
          console.warn('⚠️ Deals refresh failed:', err);
        })
      ]);

      return true;
    } catch (error: any) {
      console.error('❌ Heart deal failed:', error);
      // Revert optimistic update on error
      setHeartedDeals(prev => prev.filter(d => d.deal_id !== dealId && d.id !== dealId));
      return false;
    }
  };

  // Unheart a deal (API + state update)
  const unheartDeal = async (dealId: string): Promise<boolean> => {
    
    if (!user?.id) {
      console.error('❌ Cannot unheart deal: user not authenticated');
      return false;
    }

    // Store original deals for potential revert
    const originalDeals = [...heartedDeals];

    try {
      // Optimistic update - remove from global state immediately
      setHeartedDeals(prev => prev.filter(d => d.deal_id !== dealId && d.id !== dealId));
      // Make API call
      await ApiService.unheartDeal(dealId);
      // Refresh both hearted deals and all deals in background for consistency
      Promise.all([
        refreshHeartedDeals().catch(err => {
          console.warn('⚠️ Background refresh failed:', err);
        }),
        refreshDeals().catch(err => {
          console.warn('⚠️ Deals refresh failed:', err);
        })
      ]);

      return true;
    } catch (error: any) {
      console.error('❌ Unheart deal failed:', error);
      
      // Revert optimistic update on error (restore original deals)
      setHeartedDeals(originalDeals);
      
      return false;
    }
  };

  // Toggle heart status (convenience function)
  const toggleHeartDeal = async (dealId: string, dealObject?: any): Promise<boolean> => {
    const isCurrentlyHearted = isDealHearted(dealId);
    
    if (isCurrentlyHearted) {
      return await unheartDeal(dealId);
    } else {
      return await heartDeal(dealId, dealObject);
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
      setUser(loggedInUser as User);
      
      // Fetch categories after successful login
      // Fetch hearted deals after successful login
      try {
        await fetchHeartedDeals();
      } catch (heartedDealsError) {
        console.error('⚠️ Login: Failed to fetch hearted deals, but continuing login...', heartedDealsError);
      }
      
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
      // Reset categories to all true
      if (availableCategories.length > 0) {
        const defaultCategories: Record<string, boolean> = {};
        availableCategories.forEach(cat => {
          defaultCategories[cat.slug] = true;
        });
        setCategories(defaultCategories);
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API call fails, clear local state
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const freshUser = await AuthService.getProfile();
      setUser(freshUser as User);
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
      setUser(updatedUser as User);
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
        const parsedCategories = JSON.parse(userCategories);
        
        // Validate against available categories
        const validCategories: Record<string, boolean> = {};
        availableCategories.forEach(cat => {
          validCategories[cat.slug] = parsedCategories[cat.slug] !== undefined 
            ? parsedCategories[cat.slug] 
            : true;
        });
        
        setCategoriesState(validCategories);
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
    
    // Hearted deals management
    heartedDeals,
    heartedDealsLoading,
    refreshHeartedDeals,
    isDealHearted,
    heartDeal,
    unheartDeal,
    toggleHeartDeal,
    
    // All deals management
    deals,
    dealsLoading,
    refreshDeals,
    
    // Your existing features
    isDarkMode,
    setDarkMode,
    categories,
    setCategories,
    availableCategories,
    refreshCategories,
  }), [user, loading, isDarkMode, categories, availableCategories, heartedDeals, heartedDealsLoading, deals, dealsLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}