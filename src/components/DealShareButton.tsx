import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  Modal, 
  FlatList, 
  TextInput,
  Platform,
  SafeAreaView
} from 'react-native';
import { useAuth, getColors } from '../libs/hooks/useAuth';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useDealSharing } from '../libs/hooks/useDealSharing';

interface DealShareButtonProps {
  deal: any;
  requiredShares?: number;
  style?: any;
}

const DealShareButton: React.FC<DealShareButtonProps> = ({ 
  deal, 
  requiredShares = 3,
  style 
}) => {
  const { isDarkMode } = useAuth();
  const colors = getColors(isDarkMode);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [waitingForPermission, setWaitingForPermission] = useState(false);

  const {
    contacts,
    selectedContacts,
    shareProgress,
    loading,
    hasContactsPermission,
    requestContactsAccess,
    toggleContactSelection,
    shareDeal,
    searchContacts,
    clearSelection,
    canShare,
    selectedCount,
  } = useDealSharing(deal?.id, requiredShares);

  // Auto-open modal when permission is granted after user requested it
  useEffect(() => {
    if (waitingForPermission && hasContactsPermission === 'granted' && contacts && contacts.length > 0) {
      setWaitingForPermission(false);
      setShowModal(true);
    }
  }, [waitingForPermission, hasContactsPermission, contacts]);

  const handlePress = async () => {
    // Check contacts permission first
    if (hasContactsPermission !== 'granted') {
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
                  [{ text: 'OK' }]
                );
              }
            },
          },
        ]
      );
      return;
    }
    
    // Permission already granted, show modal
    setShowModal(true);
  };

  const handleShare = async () => {
    if (selectedContacts.length === 0) {
      Alert.alert('No Contacts Selected', 'Please select at least one contact to share with.');
      return;
    }

    try {
      await shareDeal(deal);
      setShowModal(false);
      clearSelection();
      Alert.alert(
        'Success!', 
        `Deal shared with ${selectedContacts.length} contact(s)!`
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
    <>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }, style]}
        onPress={handlePress}
        disabled={loading}
      >
        <MaterialIcons name="share" size={20} color={colors.background} />
        <Text style={[styles.buttonText, { color: colors.background }]}>
          {canRedeem 
            ? 'Unlocked! Tap to Redeem' 
            : `Share to Unlock (${currentShares}/${requiredShares})`
          }
        </Text>
        {loading && (
          <MaterialIcons name="hourglass-empty" size={16} color={colors.background} />
        )}
      </TouchableOpacity>

      {/* Contact Selection Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity 
              onPress={() => setShowModal(false)}
              style={styles.closeButton}
            >
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Share Deal
            </Text>
            <TouchableOpacity 
              onPress={clearSelection}
              disabled={selectedCount === 0}
            >
              <Text style={[
                styles.clearButton, 
                { color: selectedCount > 0 ? colors.primary : colors.disabled }
              ]}>
                Clear
              </Text>
            </TouchableOpacity>
          </View>

          {/* Deal Badge */}
          <View style={[styles.dealBadge, { backgroundColor: colors.surface }]}>
            <View style={[styles.dealIcon, { backgroundColor: colors.primary }]}>
              <Text style={styles.dealEmoji}>🛍️</Text>
            </View>
            <View style={styles.dealBadgeContent}>
              <Text style={[styles.dealBadgeTitle, { color: colors.text }]}>
                {deal?.business_name || deal?.business || 'Deal'}
              </Text>
              <Text style={[styles.dealBadgeDescription, { color: colors.textSecondary }]}>
                {deal?.description || deal?.descrption || 'Share this deal with friends'}
              </Text>
            </View>
          </View>

          {/* Search Bar */}
          <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
            <MaterialIcons name="search" size={20} color={colors.textPlaceholder} />
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
              <Text style={[styles.selectedCountText, { color: colors.primary }]}>
                {selectedCount} contact{selectedCount !== 1 ? 's' : ''} selected
              </Text>
            </View>
          )}

          {/* Contacts List */}
          <FlatList
            data={filteredContacts}
            keyExtractor={(item) => item.recordID}
            renderItem={renderContactItem}
            style={styles.contactsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="contacts" size={48} color={colors.textPlaceholder} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {loading ? 'Loading contacts...' : 
                   searchQuery ? 'No contacts found matching your search' : 'No contacts found'}
                </Text>
                {!loading && !searchQuery && (
                  <TouchableOpacity
                    style={[styles.retryButton, { backgroundColor: colors.primary }]}
                    onPress={requestContactsAccess}
                  >
                    <Text style={[styles.retryButtonText, { color: colors.background }]}>
                      Refresh Contacts
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />

          {/* Share Button */}
          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.shareModalButton,
                { 
                  backgroundColor: canShare && selectedCount > 0 ? colors.primary : colors.disabled 
                }
              ]}
              onPress={handleShare}
              disabled={!canShare || selectedCount === 0 || loading}
            >
              <Text style={[styles.shareModalButtonText, { color: colors.background }]}>
                {loading ? 'Sharing...' : 
                 selectedCount === 0 ? 'Select contacts to share' :
                 `Share with ${selectedCount} contact${selectedCount !== 1 ? 's' : ''}`
                }
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
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
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  clearButton: {
    fontSize: 16,
    fontWeight: '600',
    padding: 8,
  },
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
  dealBadgeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  dealBadgeDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
  },
  selectedCountContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  selectedCountText: {
    fontSize: 14,
    fontWeight: '600',
  },
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
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
  },
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
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
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
  shareModalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DealShareButton;
