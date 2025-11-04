import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useAuth } from '../../libs/hooks/useAuth';
import { getColors } from '../../libs/colors';
import { iOSUIKit } from 'react-native-typography';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AuthService from '../../services/auth.service';
import ApiConfig from '../../libs/utils/api.utils';
import { launchImageLibrary } from 'react-native-image-picker';

interface CreateDealProps {
  navigation: any;
  route?: any;
}

const DEAL_TYPES = [
  { value: 'free_item', label: 'Free Item', icon: 'card-giftcard' },
  { value: 'percentage', label: 'Percentage Off', icon: 'percent' },
  { value: 'bogo', label: 'Buy One Get One', icon: 'local-offer' },
  { value: 'fixed_discount', label: 'Fixed Discount', icon: 'attach-money' },
];

const CreateDeal: React.FC<CreateDealProps> = ({ navigation, route }) => {
  const { isDarkMode, userBusiness } = useAuth();
  const colors = getColors(isDarkMode);

  // Form state
  const [dealTitle, setDealTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dealType, setDealType] = useState('free_item');
  const [dealPrice, setDealPrice] = useState('');
  const [percentageDiscount, setPercentageDiscount] = useState('');
  const [minSharesRequired, setMinSharesRequired] = useState('3');
  const [endDate, setEndDate] = useState('');
  const [selectedImages, setSelectedImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const businessId = userBusiness?.[0]?.businessId;

  const handleImagePicker = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        selectionLimit: 5,
        quality: 0.8,
      },
      (response) => {
        if (response.didCancel) {
          return;
        }
        if (response.errorCode) {
          Alert.alert('Error', 'Failed to select images');
          return;
        }
        if (response.assets) {
          setSelectedImages([...selectedImages, ...response.assets]);
        }
      }
    );
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!dealTitle.trim()) {
      Alert.alert('Validation Error', 'Please enter a deal title');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please enter a description');
      return false;
    }
    if (!dealPrice.trim() || isNaN(parseFloat(dealPrice))) {
      Alert.alert('Validation Error', 'Please enter a valid price');
      return false;
    }
    if (dealType === 'percentage') {
      const discount = parseFloat(percentageDiscount);
      if (!percentageDiscount.trim() || isNaN(discount) || discount <= 0 || discount > 100) {
        Alert.alert('Validation Error', 'Please enter a discount between 1 and 100');
        return false;
      }
    }
    if (!minSharesRequired.trim() || isNaN(parseInt(minSharesRequired)) || parseInt(minSharesRequired) < 1) {
      Alert.alert('Validation Error', 'Minimum shares must be at least 1');
      return false;
    }
    if (!endDate.trim()) {
      Alert.alert('Validation Error', 'Please enter an end date (YYYY-MM-DD)');
      return false;
    }
    if (!businessId) {
      Alert.alert('Error', 'No business profile found');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      
      // Required fields
      formData.append('businessId', businessId);
      formData.append('title', dealTitle.trim());
      formData.append('description', description.trim());
      
      // Optional fields
      formData.append('dealType', dealType);
      formData.append('dealPrice', dealPrice.trim());
      formData.append('percentageDiscount', percentageDiscount.trim() || '0');
      formData.append('minSharesRequired', minSharesRequired.trim());
      formData.append('endTime', endDate.trim());
      formData.append('status', 'active');

      // Add images - main image and additional images
      if (selectedImages.length > 0) {
        // First image as main dealImage
        const mainImage = selectedImages[0];
        if (mainImage.uri) {
          formData.append('dealImage', {
            uri: mainImage.uri,
            type: mainImage.type || 'image/jpeg',
            name: mainImage.fileName || 'deal_image_main.jpg',
          } as any);
        }

        // Additional images
        for (let i = 1; i < Math.min(selectedImages.length, 4); i++) {
          const image = selectedImages[i];
          if (image.uri) {
            formData.append(`additionalImage${i}`, {
              uri: image.uri,
              type: image.type || 'image/jpeg',
              name: image.fileName || `deal_image_${i}.jpg`,
            } as any);
          }
        }
      }

      // Get API URL from config
      const apiURL = ApiConfig.apiURL;

      const response = await AuthService.makeAuthenticatedRequest(
        `${apiURL}/deals/create`,
        {
          method: 'POST',
          body: formData,
          headers: {
            // Don't set Content-Type for FormData, let the browser set it with boundary
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert(
          'Success',
          'Deal created successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', data.message || data.error || 'Failed to create deal');
      }
    } catch (error: any) {
      console.error('Create deal error:', error);
      Alert.alert('Error', error.message || 'Failed to create deal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[iOSUIKit.title3Emphasized, { color: colors.text }]}>Create Deal</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Deal Title */}
        <View style={styles.section}>
          <Text style={[iOSUIKit.subhead, { color: colors.text, marginBottom: 8 }]}>Deal Title *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder="e.g., 50% Off All Pizzas"
            placeholderTextColor={colors.textSecondary}
            value={dealTitle}
            onChangeText={setDealTitle}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[iOSUIKit.subhead, { color: colors.text, marginBottom: 8 }]}>Description *</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder="Describe your deal..."
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Deal Type */}
        <View style={styles.section}>
          <Text style={[iOSUIKit.subhead, { color: colors.text, marginBottom: 8 }]}>Deal Type *</Text>
          <View style={styles.dealTypeGrid}>
            {DEAL_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.dealTypeOption,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  dealType === type.value && { borderColor: colors.primary, backgroundColor: colors.primary + '20' },
                ]}
                onPress={() => setDealType(type.value)}
              >
                <Icon
                  name={type.icon}
                  size={24}
                  color={dealType === type.value ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    iOSUIKit.footnote,
                    { color: dealType === type.value ? colors.primary : colors.textSecondary, marginTop: 4, textAlign: 'center' },
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Price and Discount Row */}
        <View style={styles.rowSection}>
          <View style={[styles.halfInput, { marginRight: 8 }]}>
            <Text style={[iOSUIKit.subhead, { color: colors.text, marginBottom: 8 }]}>Original Price *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="$0.00"
              placeholderTextColor={colors.textSecondary}
              value={dealPrice}
              onChangeText={setDealPrice}
              keyboardType="decimal-pad"
            />
          </View>

          {dealType === 'percentage' && (
            <View style={[styles.halfInput, { marginLeft: 8 }]}>
              <Text style={[iOSUIKit.subhead, { color: colors.text, marginBottom: 8 }]}>Discount % *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                value={percentageDiscount}
                onChangeText={setPercentageDiscount}
                keyboardType="number-pad"
              />
            </View>
          )}
        </View>

        {/* Shares Required and End Date Row */}
        <View style={styles.rowSection}>
          <View style={[styles.halfInput, { marginRight: 8 }]}>
            <Text style={[iOSUIKit.subhead, { color: colors.text, marginBottom: 8 }]}>Min Shares *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="3"
              placeholderTextColor={colors.textSecondary}
              value={minSharesRequired}
              onChangeText={setMinSharesRequired}
              keyboardType="number-pad"
            />
          </View>

          <View style={[styles.halfInput, { marginLeft: 8 }]}>
            <Text style={[iOSUIKit.subhead, { color: colors.text, marginBottom: 8 }]}>End Date *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
              value={endDate}
              onChangeText={setEndDate}
            />
          </View>
        </View>

        {/* Images */}
        <View style={styles.section}>
          <Text style={[iOSUIKit.subhead, { color: colors.text, marginBottom: 8 }]}>Deal Images</Text>
          
          {selectedImages.length > 0 && (
            <ScrollView horizontal style={styles.imagePreviewContainer} showsHorizontalScrollIndicator={false}>
              {selectedImages.map((image, index) => (
                <View key={index} style={styles.imagePreview}>
                  <Image source={{ uri: image.uri }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={[styles.removeImageButton, { backgroundColor: colors.error }]}
                    onPress={() => removeImage(index)}
                  >
                    <Icon name="close" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity
            style={[styles.imagePickerButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleImagePicker}
          >
            <Icon name="add-photo-alternate" size={32} color={colors.primary} />
            <Text style={[iOSUIKit.footnote, { color: colors.textSecondary, marginTop: 8 }]}>
              Add Photos (Max 5)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Icon name="check-circle" size={20} color="#FFFFFF" />
              <Text style={[iOSUIKit.bodyEmphasized, { color: '#FFFFFF', marginLeft: 8 }]}>Create Deal</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  rowSection: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  halfInput: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
  },
  dealTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  dealTypeOption: {
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: 12,
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreviewContainer: {
    marginBottom: 12,
  },
  imagePreview: {
    marginRight: 12,
    position: 'relative',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
});

export default CreateDeal;
