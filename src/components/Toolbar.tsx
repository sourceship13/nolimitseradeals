import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../libs/hooks/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';


interface ToolbarProps {
  title?: string;
  onBack?: () => void;
  onSettings?: () => void;
  showSettings?: boolean;
  onRedemptions?: () => void;
  showRedemptions?: boolean;
}


const Toolbar: React.FC<ToolbarProps> = ({ title = '', onBack, onSettings, showSettings, onRedemptions, showRedemptions }) => {
  const { isDarkMode } = useAuth();
  
  // Transparent background with 5% opacity
  const transparentBg = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  
  return (
    <SafeAreaView edges={["top"]} style={{ backgroundColor: transparentBg }}>
      <View style={[styles.toolbar, { backgroundColor: transparentBg, borderBottomWidth: 0 }]}>  
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backBtn}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={32} color={isDarkMode ? '#fff' : '#222'} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
        <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#111' }]}>{title}</Text>
        <View style={styles.rightButtons}>
          {showRedemptions ? (
            <TouchableOpacity
              onPress={onRedemptions}
              style={styles.redemptionsBtn}
              hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
              activeOpacity={0.7}
            >
              <Ionicons name="bookmark" size={24} color={isDarkMode ? '#fff' : '#222'} />
            </TouchableOpacity>
          ) : null}
          {showSettings ? (
            <TouchableOpacity
              onPress={onSettings}
              style={styles.settingsBtn}
              hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
              activeOpacity={0.7}
            >
              <Ionicons name="settings-sharp" size={28} color={isDarkMode ? '#fff' : '#222'} />
            </TouchableOpacity>
          ) : null}
          {!showSettings && !showRedemptions ? <View style={{ width: 40 }} /> : null}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderBottomWidth: 1,
    paddingHorizontal: 8,
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  settingsBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  redemptionsBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    marginRight: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
});

export default Toolbar;
