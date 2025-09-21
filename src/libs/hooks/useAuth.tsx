import React, { createContext, useContext, useState, useMemo } from 'react';
import { Appearance } from 'react-native';
import { getColors } from '../colors';
export { getColors };

interface AuthContextType {
  isDarkMode: boolean;
  setDarkMode: (value: boolean) => void;
  categories: Record<string, boolean>;
  setCategories: (value: Record<string, boolean>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const colorScheme = Appearance.getColorScheme();
  const [isDarkMode, setDarkMode] = useState(colorScheme === 'dark');
  const [categories, setCategories] = useState<Record<string, boolean>>({
    food: true,
    beauty: true,
    fitness: true,
    electronics: true,
    fashion: true,
  });

  const value = useMemo(() => ({
    isDarkMode,
    setDarkMode,
    categories,
    setCategories,
  }), [isDarkMode, categories]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
