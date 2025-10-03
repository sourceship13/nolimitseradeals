import React, { createContext, useContext, useState, useMemo, useEffect, useRef } from 'react';
import { Appearance, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getColors } from '../colors';
import AuthService from '../../services/auth.service';
import ApiService from '../../services/api.service';
import ApiConfig from '../utils/api.utils';

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
  
  // Your existing features
  isDarkMode: boolean;
  setDarkMode: (value: boolean) => void;
  categories: Record<string, boolean>;
  setCategories: (value: Record<string, boolean>) => void;
  availableCategories: Category[];
  refreshCategories: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Hearted deals state
  const [heartedDeals, setHeartedDeals] = useState<any[]>([]);
  const [heartedDealsLoading, setHeartedDealsLoading] = useState(false);
  
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

  // Fetch hearted deals from API
  const fetchHeartedDeals = async () => {
    console.log('🔄 fetchHeartedDeals: Starting function...');
    try {
      setHeartedDealsLoading(true);
      console.log('💖 fetchHeartedDeals: Set loading to true, now calling API...');
      
      console.log('🎯 fetchHeartedDeals: Trying getHeartedDeals...');
      const result = await ApiService.getHeartedDeals();
      console.log('✅ fetchHeartedDeals: getHeartedDeals succeeded:', result);
      
      if (result.success && result.data) {
        console.log('✅ Fetched hearted deals response:', result);
        console.log('📋 Result data type:', typeof result.data);
        console.log('📋 Result data content:', result.data);
        
        // Handle new API response format: { dealIds: [...], count: number }
        let heartedDealIds: string[] = [];
        
        if (result.data && typeof result.data === 'object' && !Array.isArray(result.data)) {
          // New format: { dealIds: [...], count: number }
          const dataObj = result.data as any;
          if (dataObj.dealIds && Array.isArray(dataObj.dealIds)) {
            heartedDealIds = dataObj.dealIds;
            console.log('🎯 Using new API format - dealIds array:', heartedDealIds);
            console.log('🎯 Deal count from API:', dataObj.count);
          }
        } else if (Array.isArray(result.data)) {
          // Legacy format: array of deal objects
          heartedDealIds = result.data.map((deal: any) => deal.deal_id || deal.id).filter(Boolean);
          console.log('🎯 Using legacy API format - extracting IDs:', heartedDealIds);
        }
        
        // Convert deal IDs to minimal deal objects for compatibility
        const heartedDealsArray = heartedDealIds.map(dealId => ({
          deal_id: dealId,
          id: dealId, // Also set id for compatibility
          isHearted: true // Flag to indicate this is a hearted deal
        }));
        
        console.log('✅ Processed hearted deals:', heartedDealsArray.length);
        console.log('📋 Hearted deal IDs:', heartedDealIds);
        console.log('� Sample hearted deal object:', heartedDealsArray[0] || 'No deals');
        
        setHeartedDeals(heartedDealsArray);
        return heartedDealsArray;
      } else {
        console.log('⚠️ No hearted deals found or API error:', result);
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
  const fetchCategories = async () => {
    try {
      const result = await ApiService.getCategories();
      
      if (result.success && result.data) {
        console.log('📂 Fetched categories from API:', result.data.length);
        setAvailableCategories(result.data);
        
        // Handle category preferences more intelligently
        const savedCategories = await AsyncStorage.getItem('categories');
        if (savedCategories) {
          // Merge existing preferences with new categories
          const parsedCategories = JSON.parse(savedCategories);
          const mergedCategories: Record<string, boolean> = {};
          
          result.data.forEach((cat: Category) => {
            // Use saved preference if exists, otherwise default to true for new categories
            mergedCategories[cat.slug] = parsedCategories[cat.slug] !== undefined 
              ? parsedCategories[cat.slug] 
              : true;
          });
          
          setCategoriesState(mergedCategories);
          // Re-save the merged categories to storage
          await AsyncStorage.setItem('categories', JSON.stringify(mergedCategories));
        } else {
          // No saved preferences - set all to true
          const defaultCategories: Record<string, boolean> = {};
          result.data.forEach((cat: Category) => {
            defaultCategories[cat.slug] = true;
          });
          setCategoriesState(defaultCategories);
          await AsyncStorage.setItem('categories', JSON.stringify(defaultCategories));
        }
        
        return result.data;
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  };

  // Initialize app (auth + preferences)
  const initializeApp = async () => {
    try {
      setLoading(true);
      console.log('🚀 InitializeApp: Starting app initialization...');
      
      // Load saved preferences
      await loadPreferences();
      
      // Check authentication status
      console.log('🔍 InitializeApp: Checking authentication status...');
      const isAuth = await AuthService.isAuthenticated();
      console.log(`🔍 InitializeApp: isAuthenticated = ${isAuth}`);
      
      if (isAuth) {
        console.log('✅ InitializeApp: User is authenticated, getting user data...');
        // Get stored user data
        const currentUser = await AuthService.getCurrentUser();
        console.log(`👤 InitializeApp: Current user:`, currentUser ? 'Found' : 'Not found');
        setUser(currentUser as User | null);
        
        // Fetch categories after user is authenticated
        console.log('📂 InitializeApp: Fetching categories for authenticated user...');
        await fetchCategories();
        
        // Fetch hearted deals after user is authenticated
        console.log('💖 InitializeApp: Fetching hearted deals for authenticated user...');
        try {
          await fetchHeartedDeals();
        } catch (heartedDealsError) {
          console.error('⚠️ InitializeApp: Failed to fetch hearted deals, but continuing...', heartedDealsError);
        }
        
        // Try to refresh user data from server
        if (currentUser) {
          try {
            console.log('🔄 InitializeApp: Refreshing user data from server...');
            const freshUser = await AuthService.getProfile();
            console.log('✅ InitializeApp: User data refreshed from server');
            setUser(freshUser as User);
          } catch (error) {
            console.log('⚠️ InitializeApp: Using cached user data, server refresh failed:', error);
            // Keep using cached data if refresh fails
          }
        }
      } else {
        console.log('❌ InitializeApp: User is not authenticated');
        setUser(null);
      }
    } catch (error) {
      console.error('💥 InitializeApp: Error initializing app:', error);
      setUser(null);
    } finally {
      setLoading(false);
      console.log('🏁 InitializeApp: App initialization complete');
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
          console.log('⚠️ Loading saved categories without validation (availableCategories empty)');
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
      console.log('📱 App came to foreground, refreshing data...');
      
      // Always try to restore categories from storage first
      restoreCategoriesFromStorage();
      
      // Proactively refresh tokens when app comes to foreground (prevents 401 errors)
      AuthService.proactiveTokenRefresh();
      
      // App has come to the foreground
      if (user) {
        // Refresh user data when app comes back to foreground
        refreshUser();
        // Refresh categories when app comes back to foreground (only if user is authenticated)
        fetchCategories();
        // Refresh hearted deals when app comes back to foreground
        console.log('💖 App foreground: Refreshing hearted deals...');
        fetchHeartedDeals();
      } else {
        // Even without user, try to fetch categories for guest mode
        fetchCategories();
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
        console.log('🔄 Restoring categories from storage:', parsedCategories);
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
    console.log('💾 Saving categories to storage:', value);
    setCategoriesState(value);
    try {
      await AsyncStorage.setItem('categories', JSON.stringify(value));
      console.log('✅ Categories saved successfully');
    } catch (error) {
      console.error('❌ Error saving categories:', error);
    }
  };

  // Refresh categories manually
  const refreshCategories = async () => {
    await fetchCategories();
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
    console.log('💖 heartDeal called:', { dealId, dealObject: !!dealObject });
    
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
        console.log('✅ Added deal to hearted deals optimistically:', dealToAdd);
      }

      // Make API call
      console.log('🚀 Making API call to heart deal:', dealId);
      await ApiService.heartDeal(dealId);
      console.log('✅ API heart call succeeded');
      
      // Refresh in background for consistency
      refreshHeartedDeals().catch(err => {
        console.warn('⚠️ Background refresh failed:', err);
      });

      return true;
    } catch (error: any) {
      console.error('❌ Heart deal failed:', error);
      
      // Revert optimistic update on error
      setHeartedDeals(prev => prev.filter(d => d.deal_id !== dealId && d.id !== dealId));
      console.log('🔄 Reverted optimistic update due to API failure');
      
      return false;
    }
  };

  // Unheart a deal (API + state update)
  const unheartDeal = async (dealId: string): Promise<boolean> => {
    console.log('💔 unheartDeal called:', { dealId });
    
    if (!user?.id) {
      console.error('❌ Cannot unheart deal: user not authenticated');
      return false;
    }

    // Store original deals for potential revert
    const originalDeals = [...heartedDeals];

    try {
      // Optimistic update - remove from global state immediately
      setHeartedDeals(prev => prev.filter(d => d.deal_id !== dealId && d.id !== dealId));
      console.log('✅ Removed deal from local state optimistically');

      // Make API call
      console.log('🚀 Making API call to unheart deal:', dealId);
      await ApiService.unheartDeal(dealId);
      console.log('✅ API unheart call succeeded');
      
      // Refresh in background for consistency
      refreshHeartedDeals().catch(err => {
        console.warn('⚠️ Background refresh failed:', err);
      });

      return true;
    } catch (error: any) {
      console.error('❌ Unheart deal failed:', error);
      
      // Revert optimistic update on error (restore original deals)
      setHeartedDeals(originalDeals);
      console.log('🔄 Reverted optimistic update due to API failure');
      
      return false;
    }
  };

  // Toggle heart status (convenience function)
  const toggleHeartDeal = async (dealId: string, dealObject?: any): Promise<boolean> => {
    const isCurrentlyHearted = isDealHearted(dealId);
    console.log('🔄 toggleHeartDeal called:', { dealId, isCurrentlyHearted });
    
    if (isCurrentlyHearted) {
console.log("*********Called UNHEART",dealId, dealObject);
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
      console.log('📂 Login: Fetching categories for newly authenticated user...');
      await fetchCategories();
      
      // Fetch hearted deals after successful login
      console.log('💖 Login: Fetching hearted deals for newly authenticated user...');
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
    
    // Your existing features
    isDarkMode,
    setDarkMode,
    categories,
    setCategories,
    availableCategories,
    refreshCategories,
  }), [user, loading, isDarkMode, categories, availableCategories, heartedDeals, heartedDealsLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}