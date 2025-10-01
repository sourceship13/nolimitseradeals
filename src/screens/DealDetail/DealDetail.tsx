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
  Alert
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAuth, getColors } from '../../libs/hooks/useAuth';
import Toolbar from '../../components/Toolbar';
import ApiService from '../../services/api.service';
import DealShareButton from '../../components/DealShareButton';

const { width: screenWidth } = Dimensions.get('window');

const DealDetailScreen = ({ navigation, route }: any) => {
  const { deal: initialDeal } = route.params || {};
  const { isDarkMode, user } = useAuth();
  const colors = getColors(isDarkMode);
  
  const [deal, setDeal] = useState(initialDeal || null);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (deal?.id && user?.id) {
      checkIfSaved();
    }
  }, [deal?.id, user?.id]);

  const checkIfSaved = async () => {
    try {
      const savedDeals = await ApiService.getSavedDeals();
      const isAlreadySaved = savedDeals.some((savedDeal: any) => savedDeal.id === deal?.id);
      setIsSaved(isAlreadySaved);
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  const handleSave = async () => {
    if (!deal?.id) return;
    
    setLoading(true);
    try {
      if (isSaved) {
        await ApiService.unsaveDeal(deal.id);
        setIsSaved(false);
        Alert.alert('Success', 'Deal removed from saved deals');
      } else {
        await ApiService.saveDeal(deal.id);
        setIsSaved(true);
        Alert.alert('Success', 'Deal saved successfully!');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong');
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

  if (!deal) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Toolbar
          title="Deal Details"
          showBack={true}
          onBack={() => navigation.goBack()}
        />
        <View style={styles.centerContent}>
          <Text style={[styles.errorText, { color: colors.text }]}>No deal found</Text>
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
        showBack={true}
        onBack={() => navigation.goBack()}
      />
      
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
                backgroundColor: isSaved ? colors.success : colors.border,
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
                {loading ? 'Loading...' : (isSaved ? 'Saved' : 'Save Deal')}
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

export default DealDetailScreen;