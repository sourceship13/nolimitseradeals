import React, { useEffect, useState } from 'react';
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
  Modal,
  SafeAreaView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAuth, getColors } from '../../libs/hooks/useAuth';
import Toolbar from '../../components/Toolbar';
import { iOSUIKit } from 'react-native-typography';
import { useDealSharing } from '../../libs/hooks/useDealSharing';
import { TextInput } from 'react-native-gesture-handler';

// Type definitions for better type safety
interface DealDetailProps {
  navigation?: any;
  route?: {
    params?: {
      deal?: any;
    };
  };
  deal: any;
  requiredShares?: number;
  style?: any;
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
    console.error(
      'DealDetail Error Boundary caught an error:',
      error,
      errorInfo,
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <Text style={[iOSUIKit.body, { marginBottom: 10 }]}>
            Something went wrong
          </Text>
          <Text
            style={[iOSUIKit.subhead, { color: '#666', textAlign: 'center' }]}
          >
            {this.state.error?.message || 'Unknown error occurred'}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const { width: screenWidth } = Dimensions.get('window');

export const DealDetailScreen: React.FC<DealDetailProps> = props => {
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
    dealId: initialDeal?.id || 'no-id',
  });

  const {
    isDarkMode,
    user,
    isAuthenticated,
    heartedDeals,
    isDealHearted,
    toggleHeartDeal,
  } = useAuth();
  const colors = getColors(isDarkMode);

  // Debug hearted deals from context
  console.log('🏠 DealDetail Context Debug:', {
    heartedDealsCount: heartedDeals?.length || 0,
    heartedDealsLoaded: !!heartedDeals,
    isAuthenticated: isAuthenticated,
    currentDealId: initialDeal?.deal_id,
  });

  // Debug logging to help identify navigation issues
  useEffect(() => {
    console.log('DealDetail mounted with:', {
      hasRoute: !!route,
      hasParams: !!route?.params,
      hasDeal: !!initialDeal,
      dealId: initialDeal?.id,
    });
  }, [route, initialDeal]);

  const [deal, _setDeal] = useState(initialDeal || null);
  const [loading, setLoading] = useState(false);
  const [error, _setError] = useState<string | null>(null);

  // Simple heart state - just use global state directly
  const dealId = deal?.deal_id || deal?.id;
  const isSaved = dealId ? isDealHearted(dealId) : false;

  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [waitingForPermission, setWaitingForPermission] = useState(false);

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
    loading: sharingLoading,
  } = useDealSharing(dealId, deal?.min_shares_required || 3);

  // Debug heart state changes
  useEffect(() => {
    console.log('💖 HEART STATE CHANGE:', {
      dealId,
      finalIsSaved: isSaved,
      loading,
      heartedDealsCount: heartedDeals?.length || 0,
      timestamp: new Date().toLocaleTimeString(),
    });
  }, [isSaved, loading, heartedDeals, dealId]);

  // Debug deal structure and heart status
  useEffect(() => {
    console.log('🔍 DEAL STRUCTURE DEBUG:', {
      hasInitialDeal: !!initialDeal,
      dealId: dealId,
      isHeartedFromGlobalState: isSaved,
      heartedDealsCount: heartedDeals?.length || 0,
      heartedDealIds: heartedDeals?.map(h => h.deal_id || h.id) || [],
    });
  }, [initialDeal, isSaved, heartedDeals, dealId]);

  useEffect(() => {
    if (
      waitingForPermission &&
      hasContactsPermission === 'granted' &&
      contacts &&
      contacts.length > 0
    ) {
      setWaitingForPermission(false);
      setShowModal(true);
    }
  }, [waitingForPermission, hasContactsPermission, contacts]);

  // When a deal becomes redeemable (enough shares), auto-heart it and ensure UI updates
  useEffect(() => {
    const isNowRedeemable = shareProgress?.canRedeem;
    if (isNowRedeemable && dealId && !isSaved) {
      console.log('🚀 Deal unlocked — auto-hearting and refreshing state for deal', dealId);
      // fire-and-forget toggleHeartDeal to mark the deal as hearted
      (async () => {
        try {
          await toggleHeartDeal(dealId, deal);
        } catch (err) {
          console.warn('Auto-heart failed for deal', dealId, err);
        }
      })();
    }
  }, [shareProgress?.canRedeem, dealId, isSaved, toggleHeartDeal, deal]);

  const handleSave = async () => {
    if (!deal?.deal_id || !user?.id) {
      Alert.alert('Error', 'You must be logged in to heart deals');
      return;
    }

    console.log('💖 Heart button pressed:', {
      dealId: deal.deal_id,
      currentHeartStatus: isSaved,
      heartedDealsCount: heartedDeals?.length || 0,
    });

    setLoading(true);

    try {
      // Use the global toggleHeartDeal function - handles everything!
      const success = await toggleHeartDeal(deal.deal_id, deal);

      if (success) {
        console.log('✅ Heart toggle completed successfully');
      } else {
        console.log('⚠️ Heart toggle failed');
        Alert.alert(
          'Error',
          'Failed to update heart status. Please try again.',
        );
      }
    } catch (error: any) {
      console.error('❌ Heart operation failed:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to update heart status. Please try again.',
      );
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
          <Text style={[styles.errorText, { color: colors.text }]}>
            Navigation error - props missing
          </Text>
          <Text
            style={[
              styles.errorText,
              { color: colors.textSecondary, fontSize: 12, marginTop: 8 },
            ]}
          >
            Check console for details
          </Text>
        </View>
      </View>
    );
  }

  if (!deal) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Toolbar title="Deal Details" onBack={() => navigation.goBack()} />
        <View style={styles.centerContent}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            Deal not found
          </Text>
          <Text
            style={[
              styles.errorText,
              { color: colors.textSecondary, fontSize: 12, marginTop: 8 },
            ]}
          >
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
        <Toolbar title="Deal Details" onBack={() => navigation.goBack()} />
        <View style={styles.centerContent}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            Error: {error}
          </Text>
        </View>
      </View>
    );
  }

  const renderImage = ({ item, index }: { item: string; index: number }) => {
    console.log(`🖼️ Rendering image ${index}:`, {
      url: item,
      isValidUrl: !!item && typeof item === 'string' && item.length > 0,
      startsWithHttp: item?.startsWith('http'),
      fullUrl: item,
    });

    // Try both ImageBackground and fallback to regular Image for debugging
    return (
      <View style={styles.dealImage}>
        {/* Primary: ImageBackground */}
        <ImageBackground
          source={{ uri: item }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onLoad={() =>
            console.log(`✅ ImageBackground ${index} loaded successfully`)
          }
          onError={error => {
            console.error(
              `❌ ImageBackground ${index} failed to load:`,
              error.nativeEvent.error,
            );
            console.error(`❌ Failed URL:`, item);
          }}
          onLoadStart={() =>
            console.log(`🔄 ImageBackground ${index} loading started`)
          }
          onLoadEnd={() =>
            console.log(`🏁 ImageBackground ${index} loading ended`)
          }
        >
          <View style={styles.imageOverlay} />
        </ImageBackground>
      </View>
    );
  };

  const handlePress = async () => {
    console.log('🔄 Button pressed. Permission status:', hasContactsPermission);

    // Check contacts permission first
    if (hasContactsPermission !== 'granted') {
      console.log('❌ Permission not granted, showing permission dialog');
      Alert.alert(
        'Contacts Permission Required',
        'We need access to your contacts to share deals with friends. Would you like to grant permission?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Grant Permission',
            onPress: async () => {
              try {
                setWaitingForPermission(true);
                await requestContactsAccess();
                // useEffect will handle opening modal when permission is granted
              } catch (error) {
                setWaitingForPermission(false);
                Alert.alert(
                  'Permission Error',
                  'Failed to request contacts permission. Please try enabling it in Settings.',
                  [{ text: 'OK' }],
                );
              }
            },
          },
        ],
      );
      return;
    }

    // Permission already granted, show modal directly
    console.log('✅ Permission granted, opening contact modal');
    setShowModal(true);
  };

  const handleShare = async () => {
    if (selectedContacts.length === 0) {
      Alert.alert(
        'No Contacts Selected',
        'Please select at least one contact to share with.',
      );
      return;
    }

    try {
      const contactCount = selectedContacts.length;
      setShowModal(false); // Close modal immediately

      await shareDeal(deal);

      // The shareDeal function automatically updates shareProgress via loadShareProgress()
      // Button text will now show updated count (e.g., "2/3" after sharing with 2 people)
      console.log(
        `✅ Share initiated with ${contactCount} contacts - progress will update after SMS completion`,
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to share deal. Please try again.');
    }
  };

  const renderContactItem = ({ item }: { item: any }) => {
      const isSelected = selectedContacts.some(
        contact => contact.contactId === item.recordID
      );
  
      return (
        <TouchableOpacity
          style={[
            styles.contactItem,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
            isSelected && { 
              backgroundColor: colors.primary + '20', 
              borderColor: colors.primary 
            }
          ]}
          onPress={() => toggleContactSelection(item)}
          activeOpacity={0.7}
        >
          <View style={styles.contactInfo}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={[styles.avatarText, { color: colors.background }]}>
                {item.displayName?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.contactDetails}>
              <Text style={[styles.contactName, { color: colors.text }]}>
                {item.displayName || 'Unknown Contact'}
              </Text>
              <Text style={[styles.contactPhone, { color: colors.textSecondary }]}>
                {item.phoneNumbers?.[0]?.number || 'No phone number'}
              </Text>
            </View>
          </View>
          <View style={[
            styles.checkbox, 
            { borderColor: colors.border },
            isSelected && { 
              backgroundColor: colors.primary, 
              borderColor: colors.primary 
            }
          ]}>
            {isSelected && (
              <MaterialIcons name="check" size={16} color={colors.background} />
            )}
          </View>
        </TouchableOpacity>
      );
    };  

    const filteredContacts = searchContacts(searchQuery);
    const currentShares = shareProgress?.currentShares || 0;
    const canRedeem = shareProgress?.canRedeem || false;

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Toolbar title="Deal Details" onBack={() => navigation.goBack()} />

        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Deal Images */}
          <View style={styles.imageContainer}>
            {(() => {
              // Look for DEAL images (not business images) from the deals API response
              const deal_images = deal.deal_images; // Deal-specific images array
              const deal_image_url = deal.deal_image_url; // Single deal image URL
              const image_url = deal.image_url; // Generic image URL
              const images = deal.images; // Generic images array
              const business_images = deal.business_images; // Business images (fallback)

              // Prioritize deal-specific images over business images
              let finalImages = null;

              // Extract image URLs from deal_images array (objects with image_url property)
              if (
                deal_images &&
                Array.isArray(deal_images) &&
                deal_images.length > 0
              ) {
                finalImages = deal_images
                  .filter(
                    img => img && typeof img === 'object' && img.image_url,
                  )
                  .map(img => img.image_url)
                  .filter(
                    url =>
                      url && typeof url === 'string' && url.trim().length > 0,
                  );
              }
              // Single deal image URL
              else if (
                deal_image_url &&
                typeof deal_image_url === 'string' &&
                deal_image_url.trim().length > 0
              ) {
                finalImages = [deal_image_url];
              }
              // Generic image URL
              else if (
                image_url &&
                typeof image_url === 'string' &&
                image_url.trim().length > 0
              ) {
                finalImages = [image_url];
              }
              // Generic images array (could be strings or objects)
              else if (images && Array.isArray(images) && images.length > 0) {
                finalImages = images
                  .map(img => {
                    // Handle both string URLs and objects with image_url property
                    if (typeof img === 'string') return img;
                    if (typeof img === 'object' && img.image_url)
                      return img.image_url;
                    return null;
                  })
                  .filter(
                    url =>
                      url && typeof url === 'string' && url.trim().length > 0,
                  );
              }
              // Business images as fallback (objects with image_url property)
              else if (
                business_images &&
                Array.isArray(business_images) &&
                business_images.length > 0
              ) {
                finalImages = business_images
                  .filter(
                    img => img && typeof img === 'object' && img.image_url,
                  )
                  .map(img => img.image_url)
                  .filter(
                    url =>
                      url && typeof url === 'string' && url.trim().length > 0,
                  );
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
                imageSource:
                  finalImages === deal_images
                    ? 'deal_images'
                    : finalImages && finalImages[0] === deal_image_url
                    ? 'deal_image_url'
                    : finalImages && finalImages[0] === image_url
                    ? 'image_url'
                    : finalImages === images
                    ? 'images'
                    : finalImages === business_images
                    ? 'business_images (fallback)'
                    : finalImages
                    ? 'unknown_source'
                    : 'no_images_found',

                // Sample image URLs (if any)
                firstImageUrl: finalImages?.[0],

                // Complete deal object for reference
                completeDealObject: deal,
              });

              return finalImages && finalImages.length > 0 ? (
                <View>
                  <FlatList
                    data={finalImages}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item, index) =>
                      `image-${index}-${item?.slice?.(-10) || 'unknown'}`
                    }
                    renderItem={renderImage}
                    onLayout={() => console.log('🖼️ FlatList layout completed')}
                    ListHeaderComponent={() => {
                      console.log('🖼️ FlatList header rendering');
                      return null;
                    }}
                  />
                </View>
              ) : (
                <View
                  style={[
                    styles.dealImage,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <View style={styles.imageOverlay} />
                  <Text style={styles.placeholderEmoji}>🛍️</Text>
                </View>
              );
            })()}
          </View>

          {/* Deal Content */}
          <View
            style={[
              styles.contentContainer,
              { backgroundColor: colors.background },
            ]}
          >
            {/* Business Info */}
            <View style={styles.businessHeader}>
              <View style={styles.businessTitleRow}>
                <Text style={[styles.businessName, { color: colors.text }]}>
                  {deal.business_name || deal.business || 'Unknown Business'}
                </Text>
                {deal.is_premium_business && (
                  <MaterialIcons
                    name="verified"
                    size={20}
                    color="#0095f6"
                    style={styles.verifiedIcon}
                  />
                )}
              </View>
              <Text
                style={[styles.categoryText, { color: colors.textSecondary }]}
              >
                {deal.category_name || deal.category || ''}
              </Text>
            </View>

            {/* Deal Description */}
            <View style={styles.descriptionContainer}>
              <Text style={[styles.dealDescription, { color: colors.text }]}>
                {deal.description ||
                  deal.descrption ||
                  'No description available'}
              </Text>
            </View>

            {/* Deal Info */}
            <View style={styles.infoContainer}>
              {deal.expires && (
                <View style={styles.infoRow}>
                  <MaterialIcons
                    name="schedule"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[styles.infoText, { color: colors.textSecondary }]}
                  >
                    Expires: {deal.expires || deal.expiry}
                  </Text>
                </View>
              )}

              {deal.location && (
                <View style={styles.infoRow}>
                  <MaterialIcons
                    name="location-on"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[styles.infoText, { color: colors.textSecondary }]}
                  >
                    {deal.location}
                  </Text>
                </View>
              )}
            </View>

            <>
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handlePress}
                disabled={sharingLoading}
              >
                <MaterialIcons
                  name="share"
                  size={20}
                  color={colors.background}
                />
                <Text style={[styles.buttonText, { color: colors.background }]}>
                  {canRedeem
                    ? 'Unlocked! Tap to Redeem'
                    : `Share to Unlock (${currentShares}/${
                        deal.min_shares_required || 3
                      })`}
                </Text>
                {sharingLoading && (
                  <MaterialIcons
                    name="hourglass-empty"
                    size={16}
                    color={colors.background}
                  />
                )}
              </TouchableOpacity>

              {/* Contact Selection Modal */}
              <Modal
                visible={showModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowModal(false)}
              >
                <SafeAreaView
                  style={[
                    styles.modalContainer,
                    { backgroundColor: colors.background },
                  ]}
                >
                  {/* Modal Header */}
                  <View
                    style={[
                      styles.modalHeader,
                      { borderBottomColor: colors.border },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => setShowModal(false)}
                      style={styles.closeButton}
                    >
                      <MaterialIcons
                        name="close"
                        size={24}
                        color={colors.text}
                      />
                    </TouchableOpacity>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>
                      Share Deal
                    </Text>
                    <TouchableOpacity
                      onPress={clearSelection}
                      disabled={selectedCount === 0}
                    >
                      <Text
                        style={[
                          styles.clearButton,
                          {
                            color:
                              selectedCount > 0
                                ? colors.primary
                                : colors.disabled,
                          },
                        ]}
                      >
                        Clear
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Deal Badge */}
                  <View
                    style={[
                      styles.dealBadge,
                      { backgroundColor: colors.surface },
                    ]}
                  >
                    <View
                      style={[
                        styles.dealIcon,
                        { backgroundColor: colors.primary },
                      ]}
                    >
                      <Text style={styles.dealEmoji}>🛍️</Text>
                    </View>
                    <View style={styles.dealBadgeContent}>
                      <Text
                        style={[styles.dealBadgeTitle, { color: colors.text }]}
                      >
                        {deal?.business_name || deal?.business || 'Deal'}
                      </Text>
                      <Text
                        style={[
                          styles.dealBadgeDescription,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {deal?.description ||
                          deal?.descrption ||
                          'Share this deal with friends'}
                      </Text>
                    </View>
                  </View>

                  {/* Search Bar */}
                  <View
                    style={[
                      styles.searchContainer,
                      { backgroundColor: colors.surface },
                    ]}
                  >
                    <MaterialIcons
                      name="search"
                      size={20}
                      color={colors.textPlaceholder}
                    />
                    <TextInput
                      style={[styles.searchInput, { color: colors.text }]}
                      placeholder="Search contacts..."
                      placeholderTextColor={colors.textPlaceholder}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      autoCapitalize="none"
                    />
                  </View>

                  {/* Selected Count */}
                  {selectedCount > 0 && (
                    <View style={styles.selectedCountContainer}>
                      <Text
                        style={[
                          styles.selectedCountText,
                          { color: colors.primary },
                        ]}
                      >
                        {selectedCount} contact{selectedCount !== 1 ? 's' : ''}{' '}
                        selected
                      </Text>
                    </View>
                  )}

                  {/* Contacts List */}
                  <FlatList
                    data={filteredContacts}
                    keyExtractor={item => item.recordID}
                    renderItem={renderContactItem}
                    style={styles.contactsList}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                      <View style={styles.emptyContainer}>
                        <MaterialIcons
                          name="contacts"
                          size={48}
                          color={colors.textPlaceholder}
                        />
                        <Text
                          style={[
                            styles.emptyText,
                            { color: colors.textSecondary },
                          ]}
                        >
              {sharingLoading
                ? 'Loading contacts...'
                : searchQuery
                ? 'No contacts found matching your search'
                : 'No contacts found'}
                        </Text>
                        {!sharingLoading && !searchQuery && (
                          <TouchableOpacity
                            style={[
                              styles.retryButton,
                              { backgroundColor: colors.primary },
                            ]}
                            onPress={requestContactsAccess}
                          >
                            <Text
                              style={[
                                styles.retryButtonText,
                                { color: colors.background },
                              ]}
                            >
                              Refresh Contacts
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    }
                  />

                  {/* Share Button */}
                  <View
                    style={[
                      styles.modalFooter,
                      { borderTopColor: colors.border },
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.shareModalButton,
                        {
                          backgroundColor:
                            canShare && selectedCount > 0
                              ? colors.primary
                              : colors.disabled,
                        },
                      ]}
                      onPress={handleShare}
                      disabled={!canShare || selectedCount === 0 || sharingLoading}
                    >
                      <Text
                        style={[
                          styles.shareModalButtonText,
                          { color: colors.background },
                        ]}
                      >
                        {sharingLoading
                          ? 'Sharing...'
                          : selectedCount === 0
                          ? 'Select contacts to share'
                          : `Share with ${selectedCount} contact${
                              selectedCount !== 1 ? 's' : ''
                            }`}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </SafeAreaView>
              </Modal>
            </>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  {
                    backgroundColor: !shareProgress?.canRedeem
                      ? colors.disabled
                      : isSaved
                      ? '#FF69B4'
                      : colors.primary,
                    opacity: loading ? 0.7 : 1,
                  },
                ]}
                onPress={handleSave}
                disabled={loading || !shareProgress?.canRedeem}
              >
                <MaterialIcons
                  name={isSaved ? 'favorite' : 'favorite-border'}
                  size={20}
                  color={isSaved ? '#fff' : colors.background}
                />
                <Text
                  style={[
                    styles.saveButtonText,
                    {
                      color: isSaved ? '#fff' : colors.background,
                    },
                  ]}
                >
                  {loading ? 'Loading...' : isSaved ? 'Hearted' : 'Heart Deal'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.redeemButton,
                  {
                    backgroundColor:
                      loading || !shareProgress?.canRedeem
                        ? colors.disabled
                        : colors.primary,
                  },
                ]}
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
    },
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
    },
  ]),
  verifiedIcon: {
    marginLeft: 8,
  },
  categoryText: StyleSheet.flatten([
    iOSUIKit.callout,
    {
      fontWeight: '500',
    },
  ]),
  descriptionContainer: {
    marginBottom: 20,
  },
  dealDescription: StyleSheet.flatten([
    iOSUIKit.body,
    {
      lineHeight: 24,
    },
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
    },
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
    },
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
    },
  ]),
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: iOSUIKit.calloutObject,
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
    marginLeft: -8,
  },
  modalTitle: iOSUIKit.title3EmphasizedObject,
  clearButton: StyleSheet.flatten([
    iOSUIKit.callout,
    {
      padding: 8,
    },
  ]),
  dealBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    borderRadius: 12,
  },
  dealIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dealEmoji: {
    fontSize: 20,
  },
  dealBadgeContent: {
    flex: 1,
  },
  dealBadgeTitle: StyleSheet.flatten([
    iOSUIKit.callout,
    {
      marginBottom: 2,
    },
  ]),
  dealBadgeDescription: StyleSheet.flatten([
    iOSUIKit.subhead,
    {
      lineHeight: 18,
    },
  ]),
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  searchInput: StyleSheet.flatten([
    iOSUIKit.callout,
    {
      flex: 1,
      marginLeft: 8,
      paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    },
  ]),
  selectedCountContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  selectedCountText: iOSUIKit.subheadObject,
  contactsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: iOSUIKit.calloutObject,
  contactDetails: {
    flex: 1,
  },
  contactName: StyleSheet.flatten([
    iOSUIKit.callout,
    {
      marginBottom: 2,
    },
  ]),
  contactPhone: iOSUIKit.subheadObject,
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: StyleSheet.flatten([
    iOSUIKit.body,
    {
      textAlign: 'center',
      marginTop: 16,
      marginBottom: 24,
      paddingHorizontal: 32,
    },
  ]),
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  retryButtonText: iOSUIKit.subheadObject,
  modalFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  shareModalButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareModalButtonText: iOSUIKit.calloutObject,
});

// Export with Error Boundary wrapper
export default function DealDetailWithErrorBoundary(props: DealDetailProps) {
  return (
    <DealDetailErrorBoundary>
      <DealDetailScreen {...props} />
    </DealDetailErrorBoundary>
  );
}
