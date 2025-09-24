import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../../libs/hooks/useAuth';
import { getColors } from '../../libs/colors';
import Toolbar from '../../components/Toolbar';

const ProfileScreen = ({ navigation }: any) => {
  const { isDarkMode } = useAuth();
  const colors = getColors(isDarkMode);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Toolbar
        title="Profile"
        onBack={() => navigation.goBack()}
        showSettings={true}
        onSettings={() => navigation.navigate('Settings')}
      />
      <View style={styles.container}>
  <View style={[styles.avatar, { backgroundColor: colors.primary }]}><Text style={[styles.avatarText, { color: colors.background }]}>U</Text></View>
  <Text style={[styles.userName, { color: colors.text }]}>User Name</Text>
  <Text style={[styles.accountType, { color: colors.textSecondary }]}>Regular Account</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}><Text style={[styles.statValue, { color: colors.secondary }]}>12</Text><Text style={[styles.statLabel, { color: colors.disabled }]}>Deals Saved</Text></View>
          <View style={styles.stat}><Text style={[styles.statValue, { color: colors.secondary }]}>8</Text><Text style={[styles.statLabel, { color: colors.disabled }]}>Redeemed</Text></View>
          <View style={styles.stat}><Text style={[styles.statValue, { color: colors.secondary }]}>24</Text><Text style={[styles.statLabel, { color: colors.disabled }]}>Referrals</Text></View>
        </View>
        <TouchableOpacity style={[styles.menuBtn, { backgroundColor: colors.surface }]} onPress={() => navigation.navigate('SavedDeals')}><Text style={[styles.menuBtnText, { color: colors.text }]}>My Deals</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.menuBtn, { backgroundColor: colors.surface }]} onPress={() => navigation.navigate('Settings')}><Text style={[styles.menuBtnText, { color: colors.text }]}>Preferences</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.menuBtn, { backgroundColor: colors.surface }]}><Text style={[styles.menuBtnText, { color: colors.text }]}>Invite Friends</Text></TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 36,
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
  },
  statLabel: {
    fontSize: 12,
  },
  menuBtn: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  menuBtnText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ProfileScreen;
