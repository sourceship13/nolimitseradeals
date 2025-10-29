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
  register: (data: RegisterData) => Promise<string>;
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
  
  // Track if we're currently handling app state change to prevent duplicate calls
  const isHandlingAppStateChange = useRef(false);

  // Initialize on mount
  useEffect(() => {
    initializeApp();
    
    // Listen for appearance changes
    const appearanceSubscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (!isDarkMode) {
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

  // Helper to wait for storage to be ready
  const waitForStorageReady = async (): Promise<void> => {
    const MAX_WAIT_TIME = 2000; // 2 seconds max
    const CHECK_INTERVAL = 100;
    const startTime = Date.now();
    
    while (Date.now() - startTime < MAX_WAIT_TIME) {
      try {
        await AsyncStorage.getItem('_storage_ready_test');
        console.log('✅ Storage is ready');
        return;
      } catch (error) {
        console.log('⏳ Waiting for storage to be ready...');
        await new Promise<void>(resolve => setTimeout(() => resolve(), CHECK_INTERVAL));
      }
    }
    
    console.warn('⚠️ Storage readiness timeout - proceeding anyway');
  };

  // Fetch all deals from API
  const fetchDeals = async () => {
    try {
      setDealsLoading(true);
      const result = await ApiService.getDeals();
      if (result.success && result.data) {
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
        
        // Build categories state object
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
        let heartedDealIds: string[] = [];
        
        if (result.data && typeof result.data === 'object' && !Array.isArray(result.data)) {
          const dataObj = result.data as any;
          if (dataObj.dealIds && Array.isArray(dataObj.dealIds)) {
            heartedDealIds = dataObj.dealIds;
          }
        } else if (Array.isArray(result.data)) {
          heartedDealIds = result.data.map((deal: any) => deal.deal_id || deal.id).filter(Boolean);
        }
        
        const heartedDealsArray = heartedDealIds.map(dealId => ({
          deal_id: dealId,
          id: dealId,
          isHearted: true
        }));
        
        setHeartedDeals(heartedDealsArray);
        return heartedDealsArray;
      } else {
        setHeartedDeals([]);
        return [];
      }
    } catch (error) {
      console.error('❌ Error fetching hearted deals:', error);
      setHeartedDeals([]);
      return [];
    } finally {
      setHeartedDealsLoading(false);
    }
  };

  // Initialize app (auth + preferences)
  const initializeApp = async () => {
    try {
      setLoading(true);
      console.log('🚀 Initializing app...');
      
      // CRITICAL: Wait for storage to be ready before proceeding
      await waitForStorageReady();
      
      // Load saved preferences
      await loadPreferences();
      
      // Check authentication status
      const isAuth = await AuthService.isAuthenticated();
      console.log('Authentication check result:', isAuth);
      
      if (isAuth) {
        // Get stored user data
        const currentUser = await AuthService.getCurrentUser();
        console.log('Current user loaded:', !!currentUser);
        setUser(currentUser as User | null);
        
        // Fetch all deals
        try {
          await fetchDeals();
        } catch (dealsError) {
          console.error('⚠️ InitializeApp: Failed to fetch deals, but continuing...', dealsError);
        }
        
        // Fetch hearted deals
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
          }
        }
      } else {
        console.log('User not authenticated');
        setUser(null);
        
        // Fetch deals for guest users
        try {
          await fetchDeals();
        } catch (dealsError) {
          console.error('⚠️ InitializeApp: Failed to fetch deals for guest, but continuing...', dealsError);
        }
      }
      console.log('✅ App initialization completed');
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
          const validCategories: Record<string, boolean> = {};
          availableCategories.forEach(cat => {
            validCategories[cat.slug] = parsedCategories[cat.slug] !== undefined 
              ? parsedCategories[cat.slug] 
              : true;
          });
          setCategoriesState(validCategories);
        } else {
          setCategoriesState(parsedCategories);
        }
      } else if (availableCategories.length > 0) {
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
  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    console.log('📱 App state change detected:', appState.current, '→', nextAppState);
    
    // Prevent duplicate handling
    if (isHandlingAppStateChange.current) {
      console.log('⏭️ Already handling app state change, skipping...');
      return;
    }
    
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      isHandlingAppStateChange.current = true;
      
      try {
        console.log('🔄 App returned to foreground - refreshing...');
        
        // CRITICAL: Wait for storage to be ready after app resume
        await waitForStorageReady();
        
        // Add extra delay to ensure storage is fully accessible
        await new Promise<void>(resolve => setTimeout(() => resolve(), 250));
        
        // Always restore categories from storage first
        await restoreCategoriesFromStorage();
        
        // Proactively refresh tokens (prevents 401 errors)
        try {
          console.log('🔐 Attempting proactive token refresh...');
          await AuthService.proactiveTokenRefresh();
          console.log('✅ Proactive token refresh completed');
        } catch (error) {
          console.error('❌ Failed to proactively refresh tokens:', error);
        }
        
        // Always refresh deals
        fetchDeals().catch(err => console.error('❌ Failed to refresh deals:', err));
        
        if (user) {
          // Refresh user data
          refreshUser().catch(err => console.error('❌ Failed to refresh user:', err));
          
          // Refresh hearted deals
          fetchHeartedDeals().catch(err => console.error('❌ Failed to refresh hearted deals:', err));
        }
      } finally {
        // Reset the flag after a short delay
        setTimeout(() => {
          isHandlingAppStateChange.current = false;
        }, 1000);
      }
    }
    
    appState.current = nextAppState;
  };

  // Restore categories from storage without validation
  const restoreCategoriesFromStorage = async () => {
    try {
      const savedCategories = await AsyncStorage.getItem('categories');
      if (savedCategories !== null) {
        const parsedCategories = JSON.parse(savedCategories);
        setCategoriesState(parsedCategories);
        console.log('✅ Categories restored from storage');
        return parsedCategories;
      }
    } catch (error) {
      console.error('❌ Error restoring categories from storage:', error);
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
    // Implementation if needed
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

  // Heart a deal
  const heartDeal = async (dealId: string, dealObject?: any): Promise<boolean> => {
    if (!user?.id) {
      console.error('❌ Cannot heart deal: user not authenticated');
      return false;
    }

    try {
      const alreadyHearted = heartedDeals.some(d => d.deal_id === dealId || d.id === dealId);
      if (!alreadyHearted) {
        const dealToAdd = {
          deal_id: dealId,
          id: dealId,
          isHearted: true,
          ...(dealObject && typeof dealObject === 'object' ? dealObject : {})
        };
        setHeartedDeals(prev => [...prev, dealToAdd]);
      }
      
      await ApiService.heartDeal(dealId);
      
      Promise.all([
        refreshHeartedDeals().catch(err => console.warn('⚠️ Background refresh failed:', err)),
        refreshDeals().catch(err => console.warn('⚠️ Deals refresh failed:', err))
      ]);

      return true;
    } catch (error: any) {
      console.error('❌ Heart deal failed:', error);
      setHeartedDeals(prev => prev.filter(d => d.deal_id !== dealId && d.id !== dealId));
      return false;
    }
  };

  // Unheart a deal
  const unheartDeal = async (dealId: string): Promise<boolean> => {
    if (!user?.id) {
      console.error('❌ Cannot unheart deal: user not authenticated');
      return false;
    }

    const originalDeals = [...heartedDeals];

    try {
      setHeartedDeals(prev => prev.filter(d => d.deal_id !== dealId && d.id !== dealId));
      
      await ApiService.unheartDeal(dealId);
      
      Promise.all([
        refreshHeartedDeals().catch(err => console.warn('⚠️ Background refresh failed:', err)),
        refreshDeals().catch(err => console.warn('⚠️ Deals refresh failed:', err))
      ]);

      return true;
    } catch (error: any) {
      console.error('❌ Unheart deal failed:', error);
      setHeartedDeals(originalDeals);
      return false;
    }
  };

  // Toggle heart status
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
      
      let deviceId = await AsyncStorage.getItem('deviceId');
      if (!deviceId) {
        deviceId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('deviceId', deviceId);
      }
      
      const loggedInUser = await AuthService.login(credentials, deviceId);
      setUser(loggedInUser as User);
      
      try {
        await fetchHeartedDeals();
      } catch (heartedDealsError) {
        console.error('⚠️ Login: Failed to fetch hearted deals, but continuing login...', heartedDealsError);
      }
      
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
      
      return message;
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
      
      if (availableCategories.length > 0) {
        const defaultCategories: Record<string, boolean> = {};
        availableCategories.forEach(cat => {
          defaultCategories[cat.slug] = true;
        });
        setCategories(defaultCategories);
      }
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const freshUser = await AuthService.getProfile();
      setUser(freshUser as User);
    } catch (error) {
      console.error('Error refreshing user:', error);
      
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
    await refreshUser();
  };

  const resendVerificationEmail = async () => {
    if (!user?.email) {
      throw new Error('No user email found');
    }
  };

  const getActiveSessions = async () => {
    return AuthService.getActiveSessions();
  };

  const revokeSession = async (sessionId: string) => {
    // Implementation needed
  };

  const loadUserPreferences = async (userId: string) => {
    try {
      const userCategories = await AsyncStorage.getItem(`categories_${userId}`);
      if (userCategories) {
        const parsedCategories = JSON.parse(userCategories);
        
        const validCategories: Record<string, boolean> = {};
        availableCategories.forEach(cat => {
          validCategories[cat.slug] = parsedCategories[cat.slug] !== undefined 
            ? parsedCategories[cat.slug] 
            : true;
        });
        
        setCategoriesState(validCategories);
      }
      
      const userTheme = await AsyncStorage.getItem(`theme_${userId}`);
      if (userTheme) {
        setDarkModeState(userTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated: !!user,
    isEmailVerified: user?.is_verified ?? false,
    login,
    register,
    logout,
    refreshUser,
    updateProfile,
    requestPasswordReset,
    resetPassword,
    changePassword,
    verifyEmail,
    resendVerificationEmail,
    getActiveSessions,
    revokeSession,
    heartedDeals,
    heartedDealsLoading,
    refreshHeartedDeals,
    isDealHearted,
    heartDeal,
    unheartDeal,
    toggleHeartDeal,
    deals,
    dealsLoading,
    refreshDeals,
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

