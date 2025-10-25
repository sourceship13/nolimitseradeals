import React, { useRef, useState } from 'react';
import { View, Text, PanResponder, Animated, StyleSheet, Dimensions } from 'react-native';
import { getColors } from '../libs/colors';
import { useAuth } from '../libs/hooks/useAuth';

const SLIDE_WIDTH = Dimensions.get('window').width - 64;
const SLIDER_SIZE = 56;

interface SlideToUnlockProps {
  onUnlock: () => void;
  label?: string;
}

const SlideToUnlock: React.FC<SlideToUnlockProps> = ({ onUnlock, label = 'Slide to Redeem' }) => {
  const { isDarkMode } = useAuth();
  const colors = getColors(isDarkMode);
  const [unlocked, setUnlocked] = useState(false);
  const pan = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !unlocked,
      onMoveShouldSetPanResponder: () => !unlocked,
      onPanResponderMove: Animated.event([
        null,
        { dx: pan },
      ], { useNativeDriver: false }),
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SLIDE_WIDTH - SLIDER_SIZE - 16) {
          Animated.timing(pan, {
            toValue: SLIDE_WIDTH - SLIDER_SIZE,
            duration: 120,
            useNativeDriver: false,
          }).start(() => {
            setUnlocked(true);
            onUnlock();
          });
        } else {
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}> 
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View style={styles.track}>
        <Animated.View
          {...panResponder.panHandlers}
          style={[styles.slider, {
          backgroundColor: unlocked ? colors.secondary : colors.primary,
            transform: [{ translateX: pan }],
          }]}
        >
          <Text style={{ color: colors.background, fontWeight: 'bold' }}>
            {unlocked ? 'Redeemed!' : '→'}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SLIDE_WIDTH,
    padding: 8,
    borderRadius: 32,
    borderWidth: 1.5,
    alignItems: 'center',
    marginVertical: 24,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  track: {
    width: SLIDE_WIDTH,
    height: SLIDER_SIZE,
    backgroundColor: '#eee',
    borderRadius: 32,
    justifyContent: 'center',
  },
  slider: {
    position: 'absolute',
    left: 0,
    width: SLIDER_SIZE,
    height: SLIDER_SIZE,
    borderRadius: SLIDER_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});

export default SlideToUnlock;
