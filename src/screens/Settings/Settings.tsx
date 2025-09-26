import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAuth } from '../../libs/hooks/useAuth';
import { getColors } from '../../libs/colors';
import Toolbar from '../../components/Toolbar';

const SettingsScreen = ({ navigation }: any) => {
  const { isDarkMode, setDarkMode, categories, setCategories, logout } = useAuth();
  const colors = getColors(isDarkMode);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [radius, setRadius] = useState('5 miles');
  const [notifications, setNotifications] = useState({
    deals: true,
    expiry: true,
    referrals: true,
  });

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚪 Settings: User initiated logout');
              await logout();
              console.log('✅ Settings: Logout successful, navigating to SignIn');
              // Navigation will be handled automatically by AppNavigator when user becomes null
            } catch (error) {
              console.error('❌ Settings: Logout failed:', error);
              Alert.alert('Logout Failed', 'There was an error signing out. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Toolbar title="Preferences" onBack={() => navigation.goBack()} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Theme</Text>
          <View style={styles.row}>
            <Text style={{ color: colors.text }}>Dark Mode</Text>
            <Switch value={isDarkMode} onValueChange={setDarkMode} />
          </View>
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Location Settings</Text>
          <View style={styles.row}>
            <Text style={{ color: colors.text }}>Use my location</Text>
            <Switch value={locationEnabled} onValueChange={setLocationEnabled} />
          </View>
          <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Search radius: {radius}</Text>
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Deal Categories</Text>
          {Object.keys(categories).map(key => (
            <View style={styles.row} key={key}>
              <Text style={{ color: colors.text }}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
              <Switch value={categories[key as keyof typeof categories]} onValueChange={v => setCategories({ ...categories, [key]: v })} />
            </View>
          ))}
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
          <View style={styles.row}>
            <Text style={{ color: colors.text }}>New deals nearby</Text>
            <Switch value={notifications.deals} onValueChange={v => setNotifications({ ...notifications, deals: v })} />
          </View>
          <View style={styles.row}>
            <Text style={{ color: colors.text }}>Deal expiry reminders</Text>
            <Switch value={notifications.expiry} onValueChange={v => setNotifications({ ...notifications, expiry: v })} />
          </View>
          <View style={styles.row}>
            <Text style={{ color: colors.text }}>Friend referrals</Text>
            <Switch value={notifications.referrals} onValueChange={v => setNotifications({ ...notifications, referrals: v })} />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.error, marginTop: 24 }]} 
          onPress={handleLogout}
        > 
          <Text style={{ color: colors.background, fontWeight: 'bold' }}>Sign Out</Text>
        </TouchableOpacity>
        
        {/* Debug Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Developer Options</Text>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.error, marginBottom: 16 }]} 
            onPress={() => navigation.navigate('Debug')}
          >
            <Text style={{ color: colors.background, fontWeight: 'bold' }}>🔧 Debug Console</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 24,
    paddingBottom: 40, // Extra space at bottom
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: 180,
    alignSelf: 'center',
  },
});

export default SettingsScreen;
