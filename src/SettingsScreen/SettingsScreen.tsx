import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { useAuth } from '../libs/hooks/useAuth';
import Toolbar from '../components/Toolbar';

const SettingsScreen = ({ navigation }: any) => {
  const { isDarkMode, setDarkMode, categories, setCategories } = useAuth();
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [radius, setRadius] = useState('5 miles');
  const [notifications, setNotifications] = useState({
    deals: true,
    expiry: true,
    referrals: true,
  });

  return (
    <View style={{ flex: 1, backgroundColor: isDarkMode ? '#000' : '#fff' }}>
      <Toolbar title="Preferences" onBack={() => navigation.goBack()} />
      <View style={styles.container}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>Theme</Text>
          <View style={styles.row}>
            <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>Dark Mode</Text>
            <Switch value={isDarkMode} onValueChange={setDarkMode} />
          </View>
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>Location Settings</Text>
          <View style={styles.row}>
            <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>Use my location</Text>
            <Switch value={locationEnabled} onValueChange={setLocationEnabled} />
          </View>
          <Text style={{ color: isDarkMode ? '#aaa' : '#333', marginTop: 8 }}>Search radius: {radius}</Text>
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>Deal Categories</Text>
          {Object.keys(categories).map(key => (
            <View style={styles.row} key={key}>
              <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
              <Switch value={categories[key as keyof typeof categories]} onValueChange={v => setCategories({ ...categories, [key]: v })} />
            </View>
          ))}
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>Notifications</Text>
          <View style={styles.row}>
            <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>New deals nearby</Text>
            <Switch value={notifications.deals} onValueChange={v => setNotifications({ ...notifications, deals: v })} />
          </View>
          <View style={styles.row}>
            <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>Deal expiry reminders</Text>
            <Switch value={notifications.expiry} onValueChange={v => setNotifications({ ...notifications, expiry: v })} />
          </View>
          <View style={styles.row}>
            <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>Friend referrals</Text>
            <Switch value={notifications.referrals} onValueChange={v => setNotifications({ ...notifications, referrals: v })} />
          </View>
        </View>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#FF6B35', marginTop: 24 }]}> 
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
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
