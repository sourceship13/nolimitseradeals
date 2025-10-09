import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, FlatList, ImageBackground, Dimensions, Platform } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAuth, getColors } from '../../libs/hooks/useAuth';
import { iOSUIKit } from 'react-native-typography';



const PLACEHOLDER_DEAL = {
  id: 0,
  business: 'No Deals',
  offer: 'No deals available',
  image: '🛍️',
  location: '',
  category: '',
  expires: '',
  backgroundColor: '#888'
};

const SwipeScreen = ({ navigation }: any) => {

  const { isDarkMode, deals, dealsLoading } = useAuth();
  const colors = getColors(isDarkMode);
  const [currentDealIndex, setCurrentDealIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Animated values for swipe gestures
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const likeOpacity = useRef(new Animated.Value(0)).current;
  const dislikeOpacity = useRef(new Animated.Value(0)).current;

  // Deals are now fetched globally via useAuth hook

  const currentDeal = deals.length > 0 ? deals[currentDealIndex] : PLACEHOLDER_DEAL;

  const resetAnimations = () => {
    Animated.parallel([
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
      Animated.spring(rotate, { toValue: 0, useNativeDriver: true }),
      Animated.timing(likeOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(dislikeOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { 
      useNativeDriver: true,
      listener: (event: any) => {
        const { translationX } = event.nativeEvent;
        console.log('🎯 Swipe translationX:', translationX);
        
        // Calculate rotation based on horizontal movement
        const rotateValue = translationX / 10;
        rotate.setValue(rotateValue);
        
        // Show like/dislike indicators based on swipe direction
        if (translationX > 80) {
          // Swiping right - show heart (starts at 80px)
          const opacity = Math.min(1, (translationX - 80) / 70);
          console.log('❤️ Like indicator opacity:', opacity);
          likeOpacity.setValue(opacity);
          dislikeOpacity.setValue(0);
        } else if (translationX < -80) {
          // Swiping left - show X (starts at -80px)
          const opacity = Math.min(1, (-translationX - 80) / 70);
          console.log('❌ Dislike indicator opacity:', opacity);
          dislikeOpacity.setValue(opacity);
          likeOpacity.setValue(0);
        } else {
          // Reset indicators when not swiping far enough
          likeOpacity.setValue(0);
          dislikeOpacity.setValue(0);
        }
      }
    }
  );

  const onHandlerStateChange = (event: any) => {
    const { nativeEvent } = event;
    console.log('🎯 Handler state:', nativeEvent.state, 'translationX:', nativeEvent.translationX);
    
    if (nativeEvent.state === State.END) {
      const { translationX } = nativeEvent;
      
      if (translationX > 150) {
        // Swipe right - like
        console.log('❤️ Swiped RIGHT - Like!');
        handleSwipe('right');
        resetAnimations();
      } else if (translationX < -150) {
        // Swipe left - dislike
        console.log('❌ Swiped LEFT - Dislike!');
        handleSwipe('left');
        resetAnimations();
      } else {
        // Snap back to center
        console.log('🔄 Snap back to center');
        resetAnimations();
      }
    }
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'right') {
      navigation.navigate('DealDetail', { deal: currentDeal });
    } else {
      setCurrentDealIndex((prev) => deals.length > 0 ? (prev + 1) % deals.length : 0);
    }
  };

  const handlePreviousDeal = () => {
    setCurrentDealIndex((prev) => {
      if (deals.length === 0) return 0;
      return prev === 0 ? deals.length - 1 : prev - 1;
    });
  };

  const handleNextDeal = () => {
    setCurrentDealIndex((prev) => deals.length > 0 ? (prev + 1) % deals.length : 0);
  };

  return (
    <View style={[styles.screenContainer, { backgroundColor: colors.background }]}>
      {/* 1. Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>DEALZ</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Settings')}
          style={styles.settingsButton}
        >
          <Text style={[iOSUIKit.title3, { color: colors.primary }]}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Full-screen content area */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View 
          style={[
            styles.contentContainer,
            {
              transform: [
                { translateX: translateX },
                { translateY: translateY },
                { rotate: rotate.interpolate({
                    inputRange: [-200, 200],
                    outputRange: ['-30deg', '30deg'],
                    extrapolate: 'clamp'
                  })
                }
              ]
            }
          ]}
        >
          {/* Background Icons - Behind the swiping card */}
          <View style={styles.backgroundIconsContainer}>
            <Animated.View style={[styles.backgroundIcon, styles.backgroundLikeIcon, { opacity: likeOpacity }]}>
              <MaterialIcons name="favorite" size={120} color="#4CAF50" />
            </Animated.View>
            
            <Animated.View style={[styles.backgroundIcon, styles.backgroundDislikeIcon, { opacity: dislikeOpacity }]}>
              <MaterialIcons name="close" size={120} color="#F44336" />
            </Animated.View>
          </View>

          {dealsLoading ? (
            <View style={styles.centerContent}>
              <Text style={[iOSUIKit.body, { color: colors.text, textAlign: 'center' }]}>Loading deals...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerContent}>
              <Text style={[iOSUIKit.body, { color: colors.error, textAlign: 'center' }]}>{error}</Text>
            </View>
          ) : (
            <>
              {/* Full-screen image background */}
              <View style={styles.imageContainer} pointerEvents="box-none">
                {currentDeal.business_images && currentDeal.business_images.length > 0 ? (
                  <FlatList
                    data={currentDeal.business_images}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item, index) => `image-${index}`}
                    style={styles.imageCarousel}
                    scrollEnabled={false}
                    pointerEvents="none"
                    renderItem={({ item }) => (
                      <ImageBackground
                        source={{ uri: item.image_url }}
                        style={styles.fullScreenImage}
                        resizeMode="cover"
                      >
                        <View style={styles.imageOverlay} />
                      </ImageBackground>
                    )}
                  />
                ) : (
                  <View style={[styles.fullScreenImage, { backgroundColor: currentDeal.backgroundColor || colors.primary }]}>
                    <View style={styles.imageOverlay} />
                  </View>
                )}
                
                {/* Card content overlay on image */}
                <View style={styles.cardOverlay} pointerEvents="none">
                  <View style={{ ...styles.cardContent, justifyContent: 'center' }} pointerEvents="none">
                    <View style={styles.businessRow}>
                      <Text style={styles.dealBusiness}>{currentDeal.business || currentDeal.business_name || ''}</Text>
                      {
                        currentDeal.is_premium_business ? (
                          <MaterialIcons 
                        name={'verified'}
                        size={18}
                        color="#0095f6"
                        style={styles.businessIcon}
                      />)
                      : null
                      }
                      
                    </View>
                    <Text style={styles.dealOffer}>{currentDeal.description || currentDeal.descrption || ''}</Text>
                    <Text style={styles.dealLocation}>{currentDeal.category_name || ''}</Text>
                    <Text style={styles.dealExpires}>{currentDeal.expires || currentDeal.expiry || ''}</Text>
                  </View>
                </View>
              </View>
              
              {/* 4. Action buttons at bottom - 1/10 of screen height */}
              <View style={styles.actionContainer} pointerEvents="box-none">
              {/* Previous deal button */}
              <TouchableOpacity style={[styles.navBtn, { backgroundColor: 'rgba(255, 255, 255, 0.9)' }]} onPress={handlePreviousDeal}>
                <Text style={[iOSUIKit.title3, { color: isDarkMode ? colors.dealArrows : '#000' }]}>←</Text>
              </TouchableOpacity>
              
              {/* Dislike button */}
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(255, 255, 255, 0.9)' }]} onPress={() => handleSwipe('left')}>
                <Text style={[iOSUIKit.title3Emphasized, { color: colors.error }]}>✗</Text>
              </TouchableOpacity>
              
              {/* Like button */}
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(255, 255, 255, 0.9)' }]} onPress={() => handleSwipe('right')}>
                <Text style={[iOSUIKit.title3Emphasized, { color: colors.primary }]}>♥</Text>
              </TouchableOpacity>
              
              {/* Next deal button */}
              <TouchableOpacity style={[styles.navBtn, { backgroundColor: 'rgba(255, 255, 255, 0.9)' }]} onPress={handleNextDeal}>
                <Text style={[iOSUIKit.title3, { color: isDarkMode ? colors.dealArrows : '#000' }]}>→</Text>
              </TouchableOpacity>
            </View>
            </>
          )}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    paddingBottom: 100,
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  topBarTitle: StyleSheet.flatten([
    iOSUIKit.body,
    {
      fontWeight: 'bold',
    }
  ]),
  exploreBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  exploreBtnText: StyleSheet.flatten([
    iOSUIKit.callout,
    {
      fontWeight: 'bold',
    }
  ]),
  contentContainer: {
    flex: 1,
    zIndex: 1, // Above background icons
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
    width: '100%',
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'visible', // Ensure indicators are not clipped
  },
  imageCarousel: {
    flex: 1,
  },
  fullScreenImage: {
    width: screenWidth,
    flex: 1,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
    height: screenHeight * 0.11, // 1/8 of screen height
  },
  cardContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 10,
    alignItems: 'flex-start',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    textAlign: 'center',
  },
  businessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',

  },
  businessIcon: {
    marginTop:8
  },
  dealImage: {
    fontSize: 64,
    marginBottom: 12,
  },
  dealBusiness: StyleSheet.flatten([
    iOSUIKit.title3Emphasized,
    {
      color: '#fff',
      marginTop: 8,
      marginRight: 8,
      fontSize: 20, // Maintain size for overlay readability
    }
  ]),
  dealOffer: StyleSheet.flatten([
    iOSUIKit.callout,
    {
      color: '#fff',
      textAlign: 'center',
      marginVertical: 4,
    }
  ]),
  dealLocation: StyleSheet.flatten([
    iOSUIKit.subhead,
    {
      color: '#fff',
      marginBottom: 2,
      textAlign: 'center',
      marginVertical: 2,
    }
  ]),
  dealExpires: StyleSheet.flatten([
    iOSUIKit.caption2,
    {
      color: '#fff',
      marginBottom: 8,
      textAlign: 'center',
    }
  ]),
  actionContainer: {
    height: screenHeight * 0.1, // 1/10 of screen height
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
  },
  actionBtn: {
    borderRadius: 32,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 15,
    minWidth: 64,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  navBtn: {
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 10,
    minWidth: 50,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 0,
    paddingTop: 50, // Account for status bar
    borderBottomWidth: 1,
  },
  headerTitle: StyleSheet.flatten([
    iOSUIKit.largeTitleEmphasized,
    {
      fontSize: 24, // Override the default large title size to fit header
    }
  ]),
  settingsButton: {
    padding: 8,
  },
  swipeIndicator: {
    position: 'absolute',
    zIndex: 9999, // Maximum z-index to ensure it's on top
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 60,
    width: 120,
    height: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 20,
    borderWidth: 4,
  },
  likeIndicator: {
    top: 120, // Position from top of screen
    right: 30, // Position from right edge
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(76, 175, 80, 0.95)', // Bright green background
  },
  dislikeIndicator: {
    top: 120, // Position from top of screen
    left: 30, // Position from left edge
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(244, 67, 54, 0.95)', // Bright red background
  },
  backgroundIconsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0, // Behind everything
    pointerEvents: 'none', // Allow touches to pass through
  },
  backgroundIcon: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    top: '50%',
    marginTop: -60, // Half of icon size for centering
  },
  backgroundLikeIcon: {
    right: 50,
  },
  backgroundDislikeIcon: {
    left: 50,
  },
});

export default SwipeScreen;