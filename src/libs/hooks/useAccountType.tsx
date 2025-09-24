import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { getColors } from '../colors';

export function useAccountType(requiredType: string | string[]) {
  const { user } = useAuth();
  
  const types = Array.isArray(requiredType) ? requiredType : [requiredType];
  const hasRequiredType = user ? types.includes(user.account_type) : false;
  
  return hasRequiredType;
}

// Hook to get theme colors based on dark mode
export function useThemeColors() {
  const { isDarkMode } = useAuth();
  return getColors(isDarkMode);
}

// Hook to check if a specific category is enabled
export function useCategoryEnabled(category: string) {
  const { categories } = useAuth();
  return categories[category] ?? false;
}

// Hook for protected features
export function useRequireAuth() {
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && !user) {
      // You could navigate to login here or throw an error
      console.warn('User must be authenticated to access this feature');
    }
  }, [user, loading]);
  
  return { user, loading, isAuthenticated: !!user };
}