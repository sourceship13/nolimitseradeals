import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../libs/hooks/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { iOSUIKit } from 'react-native-typography';


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
        <View style={styles.leftContainer}>
          {onBack ? (
            <TouchableOpacity
              onPress={onBack}
              style={styles.backBtn}
              hitSlop={{ top: 32, bottom: 32, left: 32, right: 32 }}
              activeOpacity={0.6}
              delayPressIn={0}
              delayPressOut={50}
            >
              <Ionicons name="chevron-back" size={32} color={isDarkMode ? '#fff' : '#222'} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 48 }} />
          )}
        </View>
        
        <View style={styles.titleContainer} pointerEvents="none">
          <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#111' }]}>{title}</Text>
        </View>
        
        <View style={styles.rightButtons}>
          {showRedemptions ? (
            <TouchableOpacity
              onPress={onRedemptions}
              style={styles.redemptionsBtn}
              hitSlop={{ top: 32, bottom: 32, left: 32, right: 32 }}
              activeOpacity={0.6}
              delayPressIn={0}
              delayPressOut={50}
            >
              <Ionicons name="bookmark" size={24} color={isDarkMode ? '#fff' : '#222'} />
            </TouchableOpacity>
          ) : null}
          {showSettings ? (
            <TouchableOpacity
              onPress={onSettings}
              style={styles.settingsBtn}
              hitSlop={{ top: 32, bottom: 32, left: 32, right: 32 }}
              activeOpacity={0.6}
              delayPressIn={0}
              delayPressOut={50}
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
  },
  backBtn: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.1)',
    zIndex: 10,
  },
  settingsBtn: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.1)',
    zIndex: 10,
  },
  rightButtons: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  redemptionsBtn: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    marginRight: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    zIndex: 10,
  },
  leftContainer: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  title: StyleSheet.flatten([
    iOSUIKit.title3Emphasized,
    {
      textAlign: 'center',
    },
  ]),
});

export default Toolbar;
