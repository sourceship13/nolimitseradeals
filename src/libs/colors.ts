// src/libs/colors.ts
// Centralized color palette for light and dark mode

export const Colors = {
  light: {
    background: '#fff',
    surface: '#f5f5f5',
    primary: '#FF6B35',
    secondary: '#4ECDC4',
    accent: '#1877F3',
    error: '#e74c3c',
    text: '#111',
    textSecondary: '#333',
    textTertiary: '#666',
    textPlaceholder: '#aaa',
    border: '#eee',
    borderStrong: '#ddd',
    card: '#f5f5f5',
    chip: '#fff',
    icon: '#222',
    google: '#EA4335',
    facebook: '#1877F3',
    instagram: '#E1306C',
    apple: '#000',
    disabled: '#888',
  },
  dark: {
    background: '#000',
    surface: '#111',
    primary: '#FF6B35',
    secondary: '#4ECDC4',
    accent: '#BB86FC',
    error: '#CF6679',
    text: '#fff',
    textSecondary: '#E0E0E0',
    textTertiary: '#B0B0B0',
    textPlaceholder: '#888',
    border: '#222',
    borderStrong: '#444',
    card: '#222',
    chip: '#222',
    icon: '#fff',
    google: '#EA4335',
    facebook: '#1877F3',
    instagram: '#E1306C',
    apple: '#fff',
    disabled: '#888',
  },
};

export function getColors(isDarkMode: boolean) {
  return isDarkMode ? Colors.dark : Colors.light;
}
