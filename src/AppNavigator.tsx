import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SignInScreen from './screens/SignIn/SignIn';
import SignUpScreen from './screens/SignUp/SignUp';
import SwipeScreen from './screens/Swipe/Swipe';
import ExploreScreen from './screens/Explore/Explore';
import DealDetailScreen from './screens/DealDetail/DealDetail';
import ProfileScreen from './screens/Profile/Profile';
import SavedDealsScreen from './screens/SavedDeals/SavedDeals';
import SettingsScreen from './screens/Settings/Settings';
import VerificationScreen from './VerificationScreen/VerificationScreen';
import DebugScreen from './screens/Debug/Debug';
import DemoShareScreen from './screens/DemoShareScreen';
import PermissionTestScreen from './screens/PermissionTestScreen';
import NetworkDebugScreen from './screens/NetworkDebugScreen';
import { useAuth, getColors } from './libs/hooks/useAuth';
import { ActivityIndicator, View } from 'react-native';
import { iOSUIKit } from 'react-native-typography';
import RedemptionScreen from './screens/Redemption/RedemptionScreen';
import BusinessCreationScreen1 from './screens/BusinessCreation/BusinessCreationScreen1';
import { Colors } from './libs/colors';
import BusinessCreationScreen2 from './screens/BusinessCreation/BusinessCreationScreen2';
import BusinessCreationScreen3 from './screens/BusinessCreation/BuinessCreationScreen3';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator for main app screens
const MainTabNavigator = () => {
  const { isDarkMode } = useAuth();
  const colors = getColors(isDarkMode);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          let IconComponent = MaterialIcons;

          if (route.name === 'SwipeTab') {
            iconName = 'swipe';
          } else if (route.name === 'ExploreTab') {
            iconName = 'explore';
          } else if (route.name === 'SavedTab') {
            iconName = 'favorite';
          } else if (route.name === 'ProfileTab') {
            IconComponent = Ionicons;
            iconName = 'person';
          }

          return <IconComponent name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: isDarkMode ? '#FFFFFF' : '#000000', // White for dark mode, black for light mode
        tabBarInactiveTintColor: isDarkMode ? '#9CA3AF' : '#6B7280', // Light gray for dark mode, darker gray for light mode  
        tabBarStyle: {
          backgroundColor: Colors.dark.surface, // More visible dark gray with opacity
          borderTopColor: 'transparent',
          borderTopWidth: 0,
          borderRadius: 20,
          // Optionally add blur effect for iOS
          ...(Platform.OS === 'ios' ? { backdropFilter: 'blur(12px)' } : {}),
          marginHorizontal: 16,
          marginBottom: 20,
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
          position: 'absolute',
          shadowColor: '#000000',
          shadowOffset: {
            width: 0,
            height: 6,
          },
          shadowOpacity: 0.25,
          shadowRadius: 12,
          elevation: 12,
        },
        tabBarLabelStyle: [
          iOSUIKit.largeTitleEmphasized,
          {
            fontSize: 12, // Override the large title size for tab bar
            color: isDarkMode ? '#FFFFFF' : '#000000', // White for dark mode, black for light mode
            marginTop: -12, // Reduce space between icon and label
          }
        ],
        tabBarIconStyle: {
          marginBottom: 2, // Reduce bottom margin of icons
        },
      })}
    >
      <Tab.Screen 
        name="SwipeTab" 
        component={SwipeScreen}
        options={{ tabBarLabel: 'DISCOVER' }}
      />
      <Tab.Screen 
        name="ExploreTab" 
        component={ExploreScreen}
        options={{ tabBarLabel: 'EXPLORE' }}
      />
      <Tab.Screen 
        name="SavedTab" 
        component={SavedDealsScreen}
        options={{ tabBarLabel: 'SAVED' }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'PROFILE' }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    // Show loading screen while checking authentication
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isAuthenticated ? "MainTabs" : "SignIn"}
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      >
        {!isAuthenticated ? (
          // Authentication flow screens
          <>
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="Verification" component={VerificationScreen} />
            <Stack.Screen name="Debug" component={DebugScreen} />
            <Stack.Screen name="NetworkDebug" component={NetworkDebugScreen} />
          </>
        ) : (
          // Authenticated user screens with bottom tabs
          <>
            {/* Main Tab Navigator */}
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            
            {/* Modal/Detail screens that should overlay the tabs */}
            <Stack.Screen 
              name="DealDetail" 
              component={DealDetailScreen}
              options={{ 
                presentation: 'modal',
                gestureEnabled: true,
              }}
            />
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen}
              options={{ 
                presentation: 'modal',
                gestureEnabled: true,
              }}
            />
            
            {/* Debug screens */}
            <Stack.Screen name="Debug" component={DebugScreen} />
            <Stack.Screen name="PermissionTest" component={PermissionTestScreen} />
            <Stack.Screen name="NetworkDebug" component={NetworkDebugScreen} />
            <Stack.Screen name="Redemption" component={RedemptionScreen} />
            <Stack.Screen name="BusinessCreationScreen1" component={BusinessCreationScreen1} />
            <Stack.Screen name="BusinessCreationScreen2" component={BusinessCreationScreen2} />
            <Stack.Screen name="BusinessCreationScreen3" component={BusinessCreationScreen3} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
