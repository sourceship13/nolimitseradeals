/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { NewAppScreen } from '@react-native/new-app-screen';

import AppNavigator from './AppNavigator';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './libs/hooks/useAuth';


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
  return (
    <>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppNavigator />
    </>
  );
}

export default App;
