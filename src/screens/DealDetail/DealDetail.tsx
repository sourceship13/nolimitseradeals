import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Image,
  ScrollView,
  Dimensions,
  Platform,
  FlatList,
  Alert
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAuth, getColors } from '../../libs/hooks/useAuth';
import Toolbar from '../../components/Toolbar';
import ApiService from '../../services/api.service';
import DealShareButton from '../../components/DealShareButton';
import { iOSUIKit } from 'react-native-typography';
import { useDealSharing } from '../../libs/hooks/useDealSharing';

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
          <Text style={[iOSUIKit.body, { marginBottom: 10 }]}>Something went wrong</Text>
          <Text style={[iOSUIKit.subhead, { color: '#666', textAlign: 'center' }]}>
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

  const { isDarkMode, user, isAuthenticated, heartedDeals, isDealHearted, toggleHeartDeal } = useAuth();
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Simple heart state - just use global state directly
  const dealId = deal?.deal_id || deal?.id;
  const isSaved = dealId ? isDealHearted(dealId) : false;

  const {
      contacts,
      selectedContacts,
      shareProgress,
      hasContactsPermission,
      requestContactsAccess,
      toggleContactSelection,
      shareDeal,
      searchContacts,
      clearSelection,
      canShare,
      selectedCount,
    } = useDealSharing(deal?.id, deal.min_shares_required);
  
  // Debug heart state changes
  useEffect(() => {
    console.log('💖 HEART STATE CHANGE:', {
      dealId,
      finalIsSaved: isSaved,
      loading,
      heartedDealsCount: heartedDeals?.length || 0,
      timestamp: new Date().toLocaleTimeString()
    });
  }, [isSaved, loading, heartedDeals, dealId]);

  // Debug deal structure and heart status
  useEffect(() => {
    console.log('🔍 DEAL STRUCTURE DEBUG:', {
      hasInitialDeal: !!initialDeal,
      dealId: dealId,
      isHeartedFromGlobalState: isSaved,
      heartedDealsCount: heartedDeals?.length || 0,
      heartedDealIds: heartedDeals?.map(h => h.deal_id || h.id) || []
    });
  }, [initialDeal, isSaved, heartedDeals, dealId]);

  const handleSave = async () => {
    if (!deal?.deal_id || !user?.id) {
      Alert.alert('Error', 'You must be logged in to heart deals');
      return;
    }

    console.log('💖 Heart button pressed:', {
      dealId: deal.deal_id,
      currentHeartStatus: isSaved,
      heartedDealsCount: heartedDeals?.length || 0
    });

    setLoading(true);

    try {
      // Use the global toggleHeartDeal function - handles everything!
      const success = await toggleHeartDeal(deal.deal_id, deal);
      
      if (success) {
        console.log('✅ Heart toggle completed successfully');
      } else {
        console.log('⚠️ Heart toggle failed');
        Alert.alert('Error', 'Failed to update heart status. Please try again.');
      }
    } catch (error: any) {
      console.error('❌ Heart operation failed:', error);
      Alert.alert('Error', error.message || 'Failed to update heart status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = () => {
    navigation.navigate('Redemption', { deal });
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
          <Text style={[styles.errorText, { color: colors.text }]}>Deal not found</Text>
          <Text style={[styles.errorText, { color: colors.textSecondary, fontSize: 12, marginTop: 8 }]}>
            Unable to load deal details
          </Text>
        </View>
      </View>
    );
  }

  // Handle display issues
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Toolbar
          title="Deal Details"
          onBack={() => navigation.goBack()}
        />
        <View style={styles.centerContent}>
          <Text style={[styles.errorText, { color: colors.text }]}>Error: {error}</Text>
        </View>
      </View>
    );
  }

  const renderImage = ({ item, index }: { item: string; index: number }) => {
    console.log(`🖼️ Rendering image ${index}:`, {
      url: item,
      isValidUrl: !!item && typeof item === 'string' && item.length > 0,
      startsWithHttp: item?.startsWith('http'),
      fullUrl: item
    });
    
    // Try both ImageBackground and fallback to regular Image for debugging
    return (
      <View style={styles.dealImage}>
        {/* Primary: ImageBackground */}
        <ImageBackground
          source={{ uri: item }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onLoad={() => console.log(`✅ ImageBackground ${index} loaded successfully`)}
          onError={(error) => {
            console.error(`❌ ImageBackground ${index} failed to load:`, error.nativeEvent.error);
            console.error(`❌ Failed URL:`, item);
          }}
          onLoadStart={() => console.log(`🔄 ImageBackground ${index} loading started`)}
          onLoadEnd={() => console.log(`🏁 ImageBackground ${index} loading ended`)}
        >
          <View style={styles.imageOverlay} />
        </ImageBackground>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Toolbar
        title="Deal Details"
        onBack={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Deal Images */}
        <View style={styles.imageContainer}>
          {(() => {
            // Look for DEAL images (not business images) from the deals API response
            const deal_images = deal.deal_images;           // Deal-specific images array
            const deal_image_url = deal.deal_image_url;     // Single deal image URL
            const image_url = deal.image_url;               // Generic image URL
            const images = deal.images;                     // Generic images array
            const business_images = deal.business_images;   // Business images (fallback)
            
            // Prioritize deal-specific images over business images
            let finalImages = null;
            
            // Extract image URLs from deal_images array (objects with image_url property)
            if (deal_images && Array.isArray(deal_images) && deal_images.length > 0) {
              finalImages = deal_images
                .filter(img => img && typeof img === 'object' && img.image_url)
                .map(img => img.image_url)
                .filter(url => url && typeof url === 'string' && url.trim().length > 0);
            } 
            // Single deal image URL
            else if (deal_image_url && typeof deal_image_url === 'string' && deal_image_url.trim().length > 0) {
              finalImages = [deal_image_url];
            } 
            // Generic image URL
            else if (image_url && typeof image_url === 'string' && image_url.trim().length > 0) {
              finalImages = [image_url];
            } 
            // Generic images array (could be strings or objects)
            else if (images && Array.isArray(images) && images.length > 0) {
              finalImages = images
                .map(img => {
                  // Handle both string URLs and objects with image_url property
                  if (typeof img === 'string') return img;
                  if (typeof img === 'object' && img.image_url) return img.image_url;
                  return null;
                })
                .filter(url => url && typeof url === 'string' && url.trim().length > 0);
            } 
            // Business images as fallback (objects with image_url property)
            else if (business_images && Array.isArray(business_images) && business_images.length > 0) {
              finalImages = business_images
                .filter(img => img && typeof img === 'object' && img.image_url)
                .map(img => img.image_url)
                .filter(url => url && typeof url === 'string' && url.trim().length > 0);
            }
            
            console.log('🖼️ DEAL IMAGES FROM API RESPONSE:', {
              // Current deal info
              dealId: deal.deal_id,
              dealTitle: deal.deal_title,
              businessName: deal.business_name,
              
              // Raw image data exactly as returned from API
              deal_images_from_api: deal_images,
              deal_image_url_from_api: deal_image_url,
              business_images_from_api: business_images,
              
              // Type and validation checks
              deal_images_type: typeof deal_images,
              deal_images_isArray: Array.isArray(deal_images),
              deal_images_isNull: deal_images === null,
              deal_image_url_type: typeof deal_image_url,
              deal_image_url_isNull: deal_image_url === null,
              
              // Final processing result
              finalImages: finalImages,
              finalImagesCount: finalImages?.length || 0,
              showingImages: !!(finalImages && finalImages.length > 0),
              
              // Source determination
              imageSource: finalImages === deal_images ? 'deal_images' : 
                          finalImages && finalImages[0] === deal_image_url ? 'deal_image_url' :
                          finalImages && finalImages[0] === image_url ? 'image_url' :
                          finalImages === images ? 'images' :
                          finalImages === business_images ? 'business_images (fallback)' : 
                          finalImages ? 'unknown_source' : 'no_images_found',
              
              // Sample image URLs (if any)
              firstImageUrl: finalImages?.[0],
              
              // Complete deal object for reference
              completeDealObject: deal
            });
            
            return finalImages && finalImages.length > 0 ? (
              <View>
                <FlatList
                  data={finalImages}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item, index) => `image-${index}-${item?.slice?.(-10) || 'unknown'}`}
                  renderItem={renderImage}
                  onLayout={() => console.log('🖼️ FlatList layout completed')}
                  ListHeaderComponent={() => {
                    console.log('🖼️ FlatList header rendering');
                    return null;
                  }}
                />

              </View>
            ) : (
              <View style={[styles.dealImage, { backgroundColor: colors.primary }]}>
                <View style={styles.imageOverlay} />
                <Text style={styles.placeholderEmoji}>🛍️</Text>

              </View>
            );
          })()
          }
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
                backgroundColor: !shareProgress?.canRedeem ? colors.disabled : colors.border || isSaved ? '#FF69B4' : colors.border,
                opacity: loading ? 0.7 : 1
              }]}
              onPress={handleSave}
              disabled={loading || !shareProgress?.canRedeem} 
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
              style={[styles.redeemButton, { backgroundColor: (loading || !shareProgress?.canRedeem) ? colors.disabled : colors.primary }]}
              onPress={handleRedeem}
              disabled={loading || !shareProgress?.canRedeem} 
            >
              <MaterialIcons name="redeem" size={20} color="#fff" />
              <Text style={styles.redeemButtonText}>Redeem Deal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: StyleSheet.flatten([
    iOSUIKit.callout,
    {
      textAlign: 'center',
      fontWeight: '500',
    }
  ]),
  imageContainer: {
    height: 250,
  },
  dealImage: {
    width: screenWidth,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  placeholderEmoji: {
    fontSize: 48,
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  businessHeader: {
    marginBottom: 16,
  },
  businessTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  businessName: StyleSheet.flatten([
    iOSUIKit.title3Emphasized,
    {
      flex: 1,
    }
  ]),
  verifiedIcon: {
    marginLeft: 8,
  },
  categoryText: StyleSheet.flatten([
    iOSUIKit.callout,
    {
      fontWeight: '500',
    }
  ]),
  descriptionContainer: {
    marginBottom: 20,
  },
  dealDescription: StyleSheet.flatten([
    iOSUIKit.body,
    {
      lineHeight: 24,
    }
  ]),
  infoContainer: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: StyleSheet.flatten([
    iOSUIKit.subhead,
    {
      marginLeft: 8,
    }
  ]),
  shareButton: {
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: StyleSheet.flatten([
    iOSUIKit.callout,
    {
      fontWeight: '600',
    }
  ]),
  redeemButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  redeemButtonText: StyleSheet.flatten([
    iOSUIKit.callout,
    {
      color: '#fff',
      fontWeight: '600',
    }
  ]),
});

// Export with Error Boundary wrapper
export default function DealDetailWithErrorBoundary(props: DealDetailProps) {
  return (
    <DealDetailErrorBoundary>
      <DealDetailScreen {...props} />
    </DealDetailErrorBoundary>
  );
}