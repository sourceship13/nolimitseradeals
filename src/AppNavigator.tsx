import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SignInScreen from './screens/SignIn/SignIn';
import SignUpScreen from './screens/SignUp/SignUp';
import SwipeScreen from './screens/Swipe/Swipe';
import ExploreScreen from './screens/Explore/Explore';
import DealDetailScreen from './screens/DealDetail/DealDetail';
import ProfileScreen from './screens/Profile/Profile';
import SavedDealsScreen from './screens/SavedDeals/SavedDeals';
import SettingsScreen from './screens/Settings/Settings';
import VerificationScreen from './VerificationScreen/VerificationScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="SignIn"
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      >
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Verification" component={VerificationScreen} />
        <Stack.Screen name="Swipe" component={SwipeScreen} />
        <Stack.Screen name="Explore" component={ExploreScreen} />
        <Stack.Screen name="DealDetail" component={DealDetailScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="SavedDeals" component={SavedDealsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
