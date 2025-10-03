import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  Dimensions,
  Platform,
  FlatList,
  Alert,
  Animated,
  ActivityIndicator
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAuth, getColors } from '../../libs/hooks/useAuth';
import Toolbar from '../../components/Toolbar';
import ApiService from '../../services/api.service';
import DealShareButton from '../../components/DealShareButton';

// Type definitions for better type safety
interface DealDetailProps {
  navigation?: any;
  route?: {
    params?: {
      deal?: any;
    };
  };
}

// Error boundary component for catching render errors
class DealDetailErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('DealDetail Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, marginBottom: 10 }}>Something went wrong</Text>
          <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
            {this.state.error?.message || 'Unknown error occurred'}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const { width: screenWidth } = Dimensions.get('window');

const DealDetailScreen: React.FC<DealDetailProps> = (props) => {
  // Bulletproof parameter extraction 
  const safeProps = props || {};
  const navigation = safeProps.navigation || null;
  const route = safeProps.route || null;
  
  let initialDeal = null;
  
  // Super defensive parameter extraction
  if (route && typeof route === 'object' && 'params' in route) {
    const params = route.params;
    if (params && typeof params === 'object' && 'deal' in params) {
      initialDeal = params.deal;
    }
  }
  
  console.log('DealDetailScreen debug:', { 
    propsReceived: !!props,
    navigationExists: !!navigation, 
    routeExists: !!route,
    paramsExists: !!(route && route.params),
    dealExists: !!initialDeal,
    dealId: initialDeal?.id || 'no-id'
  });
    const { isDarkMode, user, isAuthenticated, heartedDeals, isDealHearted, refreshHeartedDeals } = useAuth();
  const colors = getColors(isDarkMode);

  // Debug hearted deals from context
  console.log('🏠 DealDetail Context Debug:', {
    heartedDealsCount: heartedDeals?.length || 0,
    heartedDealsLoaded: !!heartedDeals,
    isAuthenticated: isAuthenticated,
    currentDealId: initialDeal?.deal_id
  });

  // Debug logging to help identify navigation issues
  useEffect(() => {
    console.log('DealDetail mounted with:', {
      hasRoute: !!route,
      hasParams: !!route?.params,
      hasDeal: !!initialDeal,
      dealId: initialDeal?.id
    });
  }, [route, initialDeal]);
  
  const [deal, setDeal] = useState(initialDeal || null);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingHeartStatus, setIsLoadingHeartStatus] = useState(true);
  
  // Animation values for fade transition
  const loadingOpacity = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  // Initialize animation values and debug deal structure
  useEffect(() => {
    console.log('🔍 DEAL STRUCTURE DEBUG:', {
      hasInitialDeal: !!initialDeal,
      dealObject: initialDeal,
      deal_id: initialDeal?.deal_id,
      id: initialDeal?.id,
      dealIdExists: !!(initialDeal?.deal_id || initialDeal?.id)
    });
    
    // Ensure animation values are properly initialized
    loadingOpacity.setValue(1);
    contentOpacity.setValue(0);
    console.log('🎬 Animation values initialized: loading=1, content=0');
  }, []);

  useEffect(() => {
    console.log('🔄 DealDetail useEffect triggered:', {
      hasDeal: !!deal?.deal_id,
      dealId: deal?.deal_id,
      isAuthenticated: isAuthenticated,
      heartedDealsLength: heartedDeals?.length || 0,
      heartedDealsExists: !!heartedDeals
    });
    
    const dealId = deal?.deal_id || deal?.id;
    console.log('🎯 UseEffect logic check:', { 
      dealId, 
      isAuthenticated, 
      shouldCheckHeartStatus: !!(dealId && isAuthenticated) 
    });
    
    if (dealId && isAuthenticated) {
      // Check heart status directly from API for accuracy
      checkDealHeartStatus();
    } else {
      // No authentication or deal, but still show loading for UX
      console.log('📋 Skipping heart status check - no auth or deal');
      setTimeout(() => {
        startFadeTransition();
      }, 600); // Brief loading even when skipping API call
    }
    
    // Safety fallback: ensure content shows after 3 seconds regardless
    const fallbackTimer = setTimeout(() => {
      console.log('⏰ Fallback timer triggered - forcing content to show');
      startFadeTransition();
    }, 3000);
    
    return () => clearTimeout(fallbackTimer);
  }, [deal?.deal_id, isAuthenticated]);

  const checkDealHeartStatus = async () => {
    const dealId = deal?.deal_id || deal?.id;
    console.log('🔍 Deal ID check:', { deal_id: deal?.deal_id, id: deal?.id, finalDealId: dealId });
    
    if (!dealId) {
      console.log('⚠️ No deal_id or id found, skipping heart status check');
      // Still show loading for a brief moment for UX
      await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
      startFadeTransition();
      return;
    }
    
    try {
      console.log('💖 Checking heart status for deal:', dealId);
      setIsLoadingHeartStatus(true);
      
      // Start the API call and minimum duration timer simultaneously
      const [response] = await Promise.all([
        ApiService.checkHeartStatus(dealId),
        new Promise<void>(resolve => setTimeout(() => resolve(), 800)) // Minimum 800ms loading
      ]);
      
      if (response.success && response.data) {
        const { isHearted, heartCount } = response.data;
        console.log('💖 Heart status received:', { isHearted, heartCount });
        setIsSaved(isHearted);
      } else {
        console.log('❌ Failed to get heart status:', response.error || response.message);
        // Fallback to global hearted deals state
        const isAlreadySaved = isDealHearted(deal.deal_id);
        setIsSaved(isAlreadySaved);
      }
    } catch (error) {
      console.error('� Error checking heart status:', error);
      // Fallback to global hearted deals state on error
      const isAlreadySaved = isDealHearted(deal.deal_id);
      setIsSaved(isAlreadySaved);
    } finally {
      // Start fade transition (it will handle setting loading to false)
      startFadeTransition();
    }
  };

  const startFadeTransition = () => {
    console.log('🎬 Starting fade transition - Loading out, Content in');
    
    // First set loading to false, then start the animation
    setIsLoadingHeartStatus(false);
    
    // Use staggered animation for smoother transition
    Animated.sequence([
      // Small delay to ensure state update
      Animated.delay(50),
      // Fade out loading and fade in content with slight overlap
      Animated.parallel([
        Animated.timing(loadingOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ])
    ]).start(() => {
      console.log('✅ Fade transition completed');
    });
  };

  const handleSave = async () => {
    console.log('🔍 handleSave debug - checking auth:', {
      hasDeal: !!deal,
      dealId: deal?.deal_id,
      hasUser: !!user,
      userId: user?.id,
      userObject: user,
      isAuthenticated: isAuthenticated
    });
    
    if (!deal?.deal_id || !user?.id) {
      Alert.alert('Error', 'You must be logged in to heart deals');
      return;
    }
    
    const previousSavedState = isSaved;
    console.log('💖 Heart button pressed:', {
      dealId: deal.deal_id,
      currentState: previousSavedState,
      willHeart: !previousSavedState
    });
    
    setLoading(true);
    try {
      if (previousSavedState) {
        // Unheart the deal
        await ApiService.unheartDeal(deal.deal_id);
        console.log('✅ Deal unhearted successfully');
      } else {
        // Heart the deal
        await ApiService.heartDeal(deal.deal_id);
        console.log('✅ Deal hearted successfully');
      }
      
      // Refresh global hearted deals state
      await refreshHeartedDeals();
      
      // Check actual heart status from API after operation
      const statusResponse = await ApiService.checkHeartStatus(deal.deal_id);
      if (statusResponse.success && statusResponse.data) {
        const { isHearted, heartCount } = statusResponse.data;
        setIsSaved(isHearted);
        console.log('💖 Heart operation completed:', {
          previousState: previousSavedState,
          newState: isHearted,
          heartCount: heartCount,
          success: true
        });
      } else {
        // Fallback to global state if API check fails
        const updatedSavedStatus = isDealHearted(deal.deal_id);
        setIsSaved(updatedSavedStatus);
        console.log('💖 Heart operation completed (fallback):', {
          previousState: previousSavedState,
          newState: updatedSavedStatus,
          success: true
        });
      }
    } catch (error: any) {
      console.error('Error saving/unsaving deal:', error);
      Alert.alert('Error', error.message || 'Something went wrong');
      // Revert local state on error
      setIsSaved(previousSavedState);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = () => {
    Alert.alert(
      'Redeem Deal',
      `Are you sure you want to redeem this deal at ${deal?.business_name || deal?.business}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Redeem', onPress: () => Alert.alert('Success', 'Deal redeemed! Show this to the merchant.') }
      ]
    );
  };

  // Handle missing navigation or deal
  if (!navigation) {
    console.error('DealDetailScreen: navigation is undefined');
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <Text style={[styles.errorText, { color: colors.text }]}>Navigation error - props missing</Text>
          <Text style={[styles.errorText, { color: colors.textSecondary, fontSize: 12, marginTop: 8 }]}>
            Check console for details
          </Text>
        </View>
      </View>
    );
  }

  if (!deal) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Toolbar
          title="Deal Details"
          onBack={() => navigation.goBack()}
        />
        <View style={styles.centerContent}>
          <Text style={[styles.errorText, { color: colors.text }]}>No deal found</Text>
          <Text style={[styles.errorText, { color: colors.textSecondary, fontSize: 14, marginTop: 8 }]}>
            Please navigate to this screen from the deals list
          </Text>
        </View>
      </View>
    );
  }

  const renderImage = ({ item }: { item: any }) => (
    <ImageBackground
      source={{ uri: item.image_url }}
      style={styles.dealImage}
      resizeMode="cover"
    >
      <View style={styles.imageOverlay} />
    </ImageBackground>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Toolbar
        title="Deal Details"
        onBack={() => navigation.goBack()}
      />
      
      {/* Loading Overlay - Always present, controlled by opacity */}
      <Animated.View 
        style={[
          styles.loadingOverlay, 
          { 
            backgroundColor: colors.background,
            opacity: loadingOpacity 
          }
        ]}
        pointerEvents={isLoadingHeartStatus ? 'auto' : 'none'}
      >
        <ActivityIndicator 
          size="large" 
          color={colors.primary} 
          style={styles.loadingIndicator}
        />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading deal details...
        </Text>
      </Animated.View>
      
      {/* Main Content with Fade Animation */}
      <Animated.View style={[styles.contentWrapper, { opacity: contentOpacity }]}>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Deal Images */}
        <View style={styles.imageContainer}>
          {deal.business_images && deal.business_images.length > 0 ? (
            <FlatList
              data={deal.business_images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, index) => `image-${index}`}
              renderItem={renderImage}
            />
          ) : (
            <View style={[styles.dealImage, { backgroundColor: colors.primary }]}>
              <View style={styles.imageOverlay} />
              <Text style={styles.placeholderEmoji}>🛍️</Text>
            </View>
          )}
        </View>

        {/* Deal Content */}
        <View style={[styles.contentContainer, { backgroundColor: colors.background }]}>
          {/* Business Info */}
          <View style={styles.businessHeader}>
            <View style={styles.businessTitleRow}>
              <Text style={[styles.businessName, { color: colors.text }]}>
                {deal.business_name || deal.business || 'Unknown Business'}
              </Text>
              {deal.is_premium_business && (
                <MaterialIcons name="verified" size={20} color="#0095f6" style={styles.verifiedIcon} />
              )}
            </View>
            <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
              {deal.category_name || deal.category || ''}
            </Text>
          </View>

          {/* Deal Description */}
          <View style={styles.descriptionContainer}>
            <Text style={[styles.dealDescription, { color: colors.text }]}>
              {deal.description || deal.descrption || 'No description available'}
            </Text>
          </View>

          {/* Deal Info */}
          <View style={styles.infoContainer}>
            {deal.expires && (
              <View style={styles.infoRow}>
                <MaterialIcons name="schedule" size={16} color={colors.textSecondary} />
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  Expires: {deal.expires || deal.expiry}
                </Text>
              </View>
            )}
            
            {deal.location && (
              <View style={styles.infoRow}>
                <MaterialIcons name="location-on" size={16} color={colors.textSecondary} />
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  {deal.location}
                </Text>
              </View>
            )}
          </View>

          {/* Share Button */}
          <DealShareButton 
            deal={deal}
            requiredShares={3}
            style={styles.shareButton}
          />

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.saveButton, { 
                backgroundColor: isSaved ? '#FF69B4' : colors.border,
                opacity: loading ? 0.7 : 1
              }]}
              onPress={handleSave}
              disabled={loading}
            >
              <MaterialIcons 
                name={isSaved ? "favorite" : "favorite-border"} 
                size={20} 
                color={isSaved ? "#fff" : colors.textSecondary} 
              />
              <Text style={[styles.saveButtonText, { 
                color: isSaved ? "#fff" : colors.textSecondary 
              }]}>
                {loading ? 'Loading...' : (isSaved ? 'Hearted' : 'Heart Deal')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.redeemButton, { backgroundColor: colors.primary }]}
              onPress={handleRedeem}
            >
              <MaterialIcons name="redeem" size={20} color="#fff" />
              <Text style={styles.redeemButtonText}>Redeem Deal</Text>
            </TouchableOpacity>
          </View>
        </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 60, // Below toolbar
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingIndicator: {
    marginBottom: 16,
    transform: [{ scale: 1.2 }], // Make spinner slightly larger
  },
  loadingText: {
    fontSize: 17,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontWeight: '500',
  },
  contentWrapper: {
    flex: 1,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
  },
  imageContainer: {
    height: 300,
  },
  dealImage: {
    width: screenWidth,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  placeholderEmoji: {
    fontSize: 64,
    color: '#fff',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  businessHeader: {
    marginBottom: 20,
  },
  businessTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  businessName: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    marginRight: 8,
  },
  verifiedIcon: {
    marginTop: 2,
  },
  categoryText: {
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  dealDescription: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  infoContainer: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  shareButton: {
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  redeemButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  redeemButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});

// Wrap with error boundary for additional safety
const DealDetailWithErrorBoundary: React.FC<DealDetailProps> = (props) => (
  <DealDetailErrorBoundary>
    <DealDetailScreen {...props} />
  </DealDetailErrorBoundary>
);

export default DealDetailWithErrorBoundary;