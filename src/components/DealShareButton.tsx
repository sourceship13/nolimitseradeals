import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  TextInput,
  Alert,
  Platform
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useDealSharing } from '../libs/hooks/useDealSharing';
import { useAuth, getColors } from '../libs/hooks/useAuth';

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
    isContactSelected,
    sharingComplete,
    remainingShares,
    progressPercentage,
    checkPermissionStatus
  } = useDealSharing(deal?.id, requiredShares);

  const filteredContacts = searchContacts(searchQuery);

  const handleShare = async () => {
    await shareDeal(deal);
    setShowModal(false);
  };

  const handleOpenModal = async () => {
    setShowModal(true);
    // Check permission when modal opens, not on component mount
    if (hasContactsPermission === null) {
      await checkPermissionStatus();
    }
  };

  const renderContact = ({ item }: { item: any }) => {
    const selected = isContactSelected(item.recordID);
    const contactName = item.displayName || item.givenName || item.familyName || 'Unknown Contact';
    const phoneNumber = item.phoneNumbers?.[0]?.number || 'No phone';
    
    return (
      <TouchableOpacity
        style={[styles.contactItem, selected && styles.selectedContact]}
        onPress={() => toggleContactSelection(item)}
      >
        <View style={styles.contactAvatar}>
          <Text style={styles.avatarText}>
            {contactName.charAt(0).toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{contactName}</Text>
          <Text style={styles.contactPhone}>{phoneNumber}</Text>
        </View>
        
        <MaterialIcons 
          name={selected ? "check-circle" : "radio-button-unchecked"} 
          size={24} 
          color={selected ? "#4CAF50" : "#ccc"} 
        />
      </TouchableOpacity>
    );
  };

  // Main share button with progress
  return (
    <View style={[styles.container, style]}>
      {/* Share Progress */}
      {shareProgress && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${progressPercentage}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {sharingComplete ? (
              <Text style={styles.completeText}>✅ Ready to Redeem!</Text>
            ) : (
              `Share ${remainingShares} more time${remainingShares !== 1 ? 's' : ''} to unlock`
            )}
          </Text>
        </View>
      )}

      {/* Share Button */}
      <TouchableOpacity
        style={[
          styles.shareButton,
          { backgroundColor: sharingComplete ? '#4CAF50' : '#007AFF' }
        ]}
        onPress={handleOpenModal}
        disabled={loading}
      >
        <MaterialIcons name="share" size={20} color="#fff" />
        <Text style={styles.shareButtonText}>
          {sharingComplete ? 'Sharing Complete' : 'Share Deal'}
        </Text>
      </TouchableOpacity>

      {/* Share Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Share Deal</Text>
            <TouchableOpacity
              onPress={handleShare}
              disabled={!canShare}
              style={[
                styles.shareActionButton,
                !canShare && styles.shareActionButtonDisabled
              ]}
            >
              <Text style={[
                styles.shareActionButtonText,
                !canShare && styles.shareActionButtonTextDisabled
              ]}>
                Share ({selectedCount})
              </Text>
            </TouchableOpacity>
          </View>

          {/* DEBUG DISPLAY - ADD THIS SECTION */}
          <View style={styles.debugContainer}>
            <Text style={styles.debugTitle}>🐛 Debug Info:</Text>
            <Text style={styles.debugText}>Contacts loaded: {contacts.length}</Text>
            <Text style={styles.debugText}>Permission status: {hasContactsPermission?.toString() || 'null'}</Text>
            <Text style={styles.debugText}>Loading: {loading ? 'YES' : 'NO'}</Text>
            <Text style={styles.debugText}>Filtered contacts: {filteredContacts.length}</Text>
            {contacts.length > 0 && (
              <Text style={styles.debugText}>
                First contact: {JSON.stringify(contacts[0], null, 2).substring(0, 100)}...
              </Text>
            )}
          </View>

          {/* Deal Info */}
          <View style={styles.dealInfo}>
            <Text style={styles.dealTitle}>{deal?.business_name || deal?.business}</Text>
            <Text style={styles.dealDescription}>{deal?.description}</Text>
          </View>

          {/* Contacts Permission Check */}
          {hasContactsPermission !== 'granted' ? (
            <View style={styles.permissionSection}>
              <MaterialIcons name="contacts" size={64} color="#ccc" />
              <Text style={styles.permissionTitle}>Access Your Contacts</Text>
              <Text style={styles.permissionDescription}>
                Share deals with your friends and family via SMS
              </Text>
              <TouchableOpacity
                style={styles.permissionButton}
                onPress={requestContactsAccess}
                disabled={loading}
              >
                <Text style={styles.permissionButtonText}>
                  {loading ? 'Loading...' : 'Allow Contact Access'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Search */}
              <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={20} color="#666" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {/* Selected Contacts Summary */}
              {selectedCount > 0 && (
                <View style={styles.selectedSummary}>
                  <Text style={styles.selectedText}>
                    {selectedCount} contact{selectedCount !== 1 ? 's' : ''} selected
                  </Text>
                  <TouchableOpacity onPress={clearSelection}>
                    <Text style={styles.clearText}>Clear All</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Contacts List */}
              <FlatList
                data={contacts}
                keyExtractor={(item, index) => item.recordID || item.rawContactId || `contact-${index}`}
                renderItem={renderContact}
                style={styles.contactsList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                      {loading ? 'Loading contacts...' : 'No contacts available'}
                    </Text>
                    {!loading && contacts.length === 0 && (
                      <TouchableOpacity 
                        style={styles.retryButton}
                        onPress={() => {
                          console.log('🔄 Manual contact reload triggered');
                          checkPermissionStatus();
                        }}
                      >
                        <Text style={styles.retryButtonText}>Reload Contacts</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              />
            </>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
  },
  completeText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  shareActionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  shareActionButtonDisabled: {
    backgroundColor: '#ccc',
  },
  shareActionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  shareActionButtonTextDisabled: {
    color: '#999',
  },
  debugContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    padding: 10,
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'red',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'red',
    marginBottom: 5,
  },
  debugText: {
    fontSize: 12,
    color: 'red',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 2,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dealInfo: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dealTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dealDescription: {
    fontSize: 14,
    color: '#666',
  },
  permissionSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f1f3f4',
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  selectedSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#e3f2fd',
  },
  selectedText: {
    fontSize: 14,
    fontWeight: '500',
  },
  clearText: {
    fontSize: 14,
    color: '#007AFF',
  },
  contactsList: {
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedContact: {
    backgroundColor: '#e8f5e8',
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
  },
});

export default DealShareButton;