import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Linking } from 'react-native';
import { useAuth } from '../../libs/hooks/useAuth';
import { getColors } from '../../libs/colors';
import Toolbar from '../../components/Toolbar';
import { iOSUIKit } from 'react-native-typography';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ApiService from '../../services/api.service';

interface BusinessData {
  id: string;
  businessName: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phoneNumber: string;
  websiteUrl?: string;
  logoUrl: string;
  coverImageUrl?: string;
  businessImage1Url?: string;
  businessImage2Url?: string;
}

const BusinessProfile = ({ navigation, route }: any) => {
  const { isDarkMode, userBusiness } = useAuth();
  const colors = getColors(isDarkMode);
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get business ID from route params if available
  const businessId = route?.params?.businessId;

  useEffect(() => {
    loadBusinessData();
  }, [userBusiness, businessId]);

  const loadBusinessData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // If viewing a specific business (businessId provided), fetch from API
      if (businessId) {
        const response = await ApiService.getBusinessProfile(businessId);
        if (response.success && response.data) {
          setBusiness(response.data);
        } else {
          setError(response.message || 'Failed to load business profile');
        }
      } 
      // Otherwise, use the userBusiness from context (already fetched with deals)
      else if (userBusiness && Array.isArray(userBusiness) && userBusiness.length > 0) {
        // userBusiness is an array, get the first business (primary business)
        const primaryBusiness = userBusiness[0];
        
        // Map the API response structure to BusinessData interface
        const mappedBusiness: BusinessData = {
          id: primaryBusiness.businessId,
          businessName: primaryBusiness.businessName,
          description: primaryBusiness.description || '',
          address: primaryBusiness.address || '',
          city: primaryBusiness.city || '',
          state: primaryBusiness.state || '',
          country: primaryBusiness.country || '',
          phoneNumber: primaryBusiness.phoneNumber || '',
          websiteUrl: primaryBusiness.websiteUrl,
          logoUrl: primaryBusiness.images?.logo || primaryBusiness.logoUrl || '',
          coverImageUrl: primaryBusiness.images?.coverImage,
          businessImage1Url: primaryBusiness.images?.businessImages?.[0]?.url,
          businessImage2Url: primaryBusiness.images?.businessImages?.[1]?.url,
        };
        
        setBusiness(mappedBusiness);
      } else {
        setError('No business profile available');
      }
    } catch (err: any) {
      console.error('Error loading business profile:', err);
      setError(err.message || 'An error occurred while loading the business profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhonePress = () => {
    if (business?.phoneNumber) {
      Linking.openURL(`tel:${business.phoneNumber}`);
    }
  };

  const handleWebsitePress = () => {
    if (business?.websiteUrl) {
      Linking.openURL(business.websiteUrl);
    }
  };

  const InfoRow = ({ icon, label, value, onPress }: { icon: string; label: string; value: string; onPress?: () => void }) => (
    <TouchableOpacity 
      style={[styles.infoRow, { borderBottomColor: colors.border }]} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.infoIconContainer}>
        <Icon name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={[iOSUIKit.footnote, { color: colors.textSecondary }]}>
          {label}
        </Text>
        <Text style={[iOSUIKit.body, { color: colors.text, marginTop: 4 }]}>
          {value}
        </Text>
      </View>
      {onPress && <Icon name="chevron-right" size={20} color={colors.textSecondary} />}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Toolbar
          title="Business Profile"
          onBack={() => navigation.goBack()}
          showSettings={false}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[iOSUIKit.body, { color: colors.textSecondary, marginTop: 16 }]}>
            Loading business profile...
          </Text>
        </View>
      </View>
    );
  }

  if (error || !business) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Toolbar
          title="Business Profile"
          onBack={() => navigation.goBack()}
          showSettings={false}
        />
        <View style={styles.centerContainer}>
          <Icon name="error-outline" size={64} color={colors.error} />
          <Text style={[iOSUIKit.title3, { color: colors.text, marginTop: 16, textAlign: 'center' }]}>
            {error || 'Business not found'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={loadBusinessData}
          >
            <Text style={[iOSUIKit.body, { color: colors.background, fontWeight: '600' }]}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Toolbar
        title="Business Profile"
        onBack={() => navigation.goBack()}
        showSettings={false}
      />
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        {business.coverImageUrl ? (
          <Image
            source={{ uri: business.coverImageUrl }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.coverImagePlaceholder, { backgroundColor: colors.border }]}>
            <Icon name="business" size={48} color={colors.textSecondary} />
          </View>
        )}

        {/* Logo and Business Name */}
        <View style={styles.headerContainer}>
          <View style={[styles.logoContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            {business.logoUrl ? (
              <Image
                source={{ uri: business.logoUrl }}
                style={styles.logo}
                resizeMode="contain"
              />
            ) : (
              <Icon name="business" size={48} color={colors.textSecondary} />
            )}
          </View>
          
          <View style={styles.businessNameContainer}>
            <Text style={[iOSUIKit.largeTitleEmphasized, { color: colors.text }]}>
              {business.businessName}
            </Text>
            <Icon name="verified" size={20} color="#0095f6" style={{ marginLeft: 8 }} />
          </View>

          {business.description && (
            <Text style={[iOSUIKit.body, { color: colors.textSecondary, marginTop: 8, marginHorizontal: 24 }]}>
              {business.description}
            </Text>
          )}
        </View>

        {/* Contact Information */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[iOSUIKit.title3, { color: colors.text, marginBottom: 16, paddingHorizontal: 16 }]}>
            Contact Information
          </Text>
          
          <InfoRow 
            icon="phone" 
            label="Phone Number" 
            value={business.phoneNumber}
            onPress={handlePhonePress}
          />
          
          {business.websiteUrl && (
            <InfoRow 
              icon="language" 
              label="Website" 
              value={business.websiteUrl}
              onPress={handleWebsitePress}
            />
          )}
          
          <InfoRow 
            icon="location-on" 
            label="Address" 
            value={`${business.address}, ${business.city}, ${business.state} ${business.country}`}
          />
        </View>

        {/* Business Images */}
        {(business.businessImage1Url || business.businessImage2Url) && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[iOSUIKit.title3, { color: colors.text, marginBottom: 16, paddingHorizontal: 16 }]}>
              Business Photos
            </Text>
            
            <View style={styles.imagesGrid}>
              {business.businessImage1Url && (
                <View style={styles.businessImageContainer}>
                  <Image
                    source={{ uri: business.businessImage1Url }}
                    style={styles.businessImage}
                    resizeMode="cover"
                  />
                </View>
              )}
              
              {business.businessImage2Url && (
                <View style={styles.businessImageContainer}>
                  <Image
                    source={{ uri: business.businessImage2Url }}
                    style={styles.businessImage}
                    resizeMode="cover"
                  />
                </View>
              )}
            </View>
          </View>
        )}

        {/* Edit Button (optional - for business owners) */}
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('EditBusiness', { businessId: business.id })}
        >
          <Icon name="edit" size={20} color={colors.background} style={{ marginRight: 8 }} />
          <Text style={[iOSUIKit.body, { color: colors.background, fontWeight: '600' }]}>
            Edit Business Profile
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  coverImage: {
    width: '100%',
    height: 200,
  },
  coverImagePlaceholder: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: -40,
    paddingBottom: 24,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: 92,
    height: 92,
  },
  businessNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  section: {
    marginTop: 16,
    paddingVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  imagesGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  businessImageContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  businessImage: {
    width: '100%',
    height: 200,
  },
  editButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 24,
    padding: 16,
    borderRadius: 12,
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
});

export default BusinessProfile;
