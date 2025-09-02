import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../libs/hooks/useAuth';
import Toolbar from '../components/Toolbar';

const ProfileScreen = ({ navigation }: any) => {
  const { isDarkMode } = useAuth();

  return (
    <View style={{ flex: 1, backgroundColor: isDarkMode ? '#000' : '#fff' }}>
      <Toolbar title="Profile" onBack={() => navigation.goBack()} />
      <View style={styles.container}>
        <View style={styles.avatar}><Text style={styles.avatarText}>U</Text></View>
        <Text style={[styles.userName, { color: isDarkMode ? '#fff' : '#000' }]}>User Name</Text>
        <Text style={[styles.accountType, { color: isDarkMode ? '#aaa' : '#333' }]}>Regular Account</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}><Text style={styles.statValue}>12</Text><Text style={styles.statLabel}>Deals Saved</Text></View>
          <View style={styles.stat}><Text style={styles.statValue}>8</Text><Text style={styles.statLabel}>Redeemed</Text></View>
          <View style={styles.stat}><Text style={styles.statValue}>24</Text><Text style={styles.statLabel}>Referrals</Text></View>
        </View>
        <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.navigate('SavedDeals')}><Text style={styles.menuBtnText}>My Deals</Text></TouchableOpacity>
        <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.navigate('Settings')}><Text style={styles.menuBtnText}>Preferences</Text></TouchableOpacity>
        <TouchableOpacity style={styles.menuBtn}><Text style={styles.menuBtnText}>Invite Friends</Text></TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 36,
    color: '#fff',
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  accountType: {
    fontSize: 14,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
  },
  menuBtn: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    marginBottom: 12,
  },
  menuBtnText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
});

export default ProfileScreen;
