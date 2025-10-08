import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, FlatList, ImageBackground, Dimensions, Platform } from 'react-native';
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

  // Deals are now fetched globally via useAuth hook

  const currentDeal = deals.length > 0 ? deals[currentDealIndex] : PLACEHOLDER_DEAL;

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
    <View style={styles.screenContainer}>
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
      <View style={styles.contentContainer}>
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
            <View style={styles.imageContainer}>
              {currentDeal.business_images && currentDeal.business_images.length > 0 ? (
                <FlatList
                  data={currentDeal.business_images}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item, index) => `image-${index}`}
                  style={styles.imageCarousel}
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
              <View style={styles.cardOverlay}>
                <View style={{ ...styles.cardContent, justifyContent: 'center' }}>
                  {/* <Text style={styles.dealImage}>{currentDeal.image ? currentDeal.image : '🛍️'}</Text> */}
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
            <View style={styles.actionContainer}>
              {/* Previous deal button */}
              <TouchableOpacity style={[styles.navBtn, { backgroundColor: 'rgba(255, 255, 255, 0.9)' }]} onPress={handlePreviousDeal}>
                <Text style={[iOSUIKit.title3, { color: colors.dealArrows }]}>←</Text>
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
                <Text style={[iOSUIKit.title3, { color: colors.dealArrows }]}>→</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
};


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#000',
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
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
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
});

export default SwipeScreen;