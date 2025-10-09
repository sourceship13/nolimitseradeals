import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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

const Stack = createNativeStackNavigator();
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
        tabBarActiveTintColor: '#FFFFFF', // Nike white for active tabs
        tabBarInactiveTintColor: '#9CA3AF', // Light gray for inactive tabs  
        tabBarStyle: {
          backgroundColor: 'rgba(31, 41, 55, 0.25)', // Nike dark gray/black with 90% opacity
          borderTopColor: 'transparent',
          borderTopWidth: 0,
          borderRadius: 20,
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
            color: '#FFFFFF', // Ensure white color for Nike theme
            marginTop: -14, // Reduce space between icon and label
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
        options={{ tabBarLabel: 'Discover' }}
      />
      <Tab.Screen 
        name="ExploreTab" 
        component={ExploreScreen}
        options={{ tabBarLabel: 'Explore' }}
      />
      <Tab.Screen 
        name="SavedTab" 
        component={SavedDealsScreen}
        options={{ tabBarLabel: 'Saved' }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
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
            <Stack.Screen name="DemoShare" component={DemoShareScreen} />
            <Stack.Screen name="PermissionTest" component={PermissionTestScreen} />
            <Stack.Screen name="NetworkDebug" component={NetworkDebugScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
