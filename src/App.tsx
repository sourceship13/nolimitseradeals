import React, { useEffect } from 'react';
import AppNavigator from './AppNavigator';
import { StatusBar, StyleSheet, Linking } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from './libs/hooks/useAuth';
import AppReturnUtils from './libs/utils/appReturnUtils';


function App() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <AppWithStatusBar />
      </SafeAreaProvider>
    </AuthProvider>
  );
}

function AppWithStatusBar() {
  const { isDarkMode } = useAuth();

  // Handle deep link when user returns to app
  useEffect(() => {
    // Handle initial URL if app is opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        AppReturnUtils.handleAppReturn(url);
      }
    });

    // Listen for deep link events while app is running
    const handleUrl = (event: { url: string }) => {
      AppReturnUtils.handleAppReturn(event.url);
    };

    // Add event listener
    const subscription = Linking.addEventListener('url', handleUrl);

    // Cleanup
    return () => {
      subscription?.remove();
    };
  }, []);

  return (
    <>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppNavigator />
      </GestureHandlerRootView>
    </>
  );
}

export default App;
