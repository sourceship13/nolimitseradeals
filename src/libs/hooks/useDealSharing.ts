import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import DealSharingService from '../../services/deal-sharing.service';
import { useAuth } from './useAuth';

interface Contact {
  recordID: string;
  displayName: string;
  givenName: string | null;
  familyName: string;
  middleName: string;
  company: string | null;
  phoneNumbers: Array<{
    label: string;
    number: string;
  }>;
  emailAddresses: Array<{
    label: string;
    email: string;
  }>;
  [key: string]: any; // For additional properties from react-native-contacts
}

interface ShareProgress {
  currentShares: number;
  requiredShares: number;
  canRedeem: boolean;
  shareHistory: Array<{
    contactName: string;
    phoneNumber: string;
    sharedAt: string;
  }>;
}

export const useDealSharing = (dealId?: string, requiredShares: number = 3) => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Array<{
    contactId: string;
    name: string;
    phoneNumber: string;
  }>>([]);
  const [shareProgress, setShareProgress] = useState<ShareProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasContactsPermission, setHasContactsPermission] = useState<'granted' | 'denied' | 'blocked' | 'unavailable' | null>(null);

  // Load share progress when dealId changes
  useEffect(() => {
    if (dealId && user?.id) {
      loadShareProgress();
    }
  }, [dealId, user?.id]);

  const checkPermissionStatus = async () => {
    console.log('🔄 Checking permission status...');
    try {
      const permissionStatus = await DealSharingService.checkContactsPermissionStatus();
      console.log('📱 Permission status:', permissionStatus);
      setHasContactsPermission(permissionStatus);
      
      if (permissionStatus === 'granted') {
        await loadContacts();
      }
    } catch (error) {
      console.error('❌ Error checking permission status:', error);
      setHasContactsPermission('denied');
    }
  };

  const requestContactsAccess = async () => {
    try {
      setLoading(true);
      const granted = await DealSharingService.requestContactsPermission();
      
      if (granted) {
        setHasContactsPermission('granted');
        await loadContacts();
        Alert.alert('Success', 'Contacts loaded successfully!');
      } else {
        setHasContactsPermission('denied');
        Alert.alert(
          'Permission Denied',
          'We need access to your contacts to share deals with friends.'
        );
      }
    } catch (error) {
      console.error('❌ Error requesting contacts access:', error);
      Alert.alert('Error', 'Failed to access contacts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading contacts...');
      const importedContacts = await DealSharingService.loadContacts();
      console.log(`✅ Contacts loaded successfully: ${importedContacts.length} contacts`);
      
      if (importedContacts.length > 0) {
        console.log('📞 First contact:', JSON.stringify(importedContacts[0], null, 2));
      }
      
      setContacts(importedContacts);
    } catch (error) {
      console.error('❌ Error loading contacts:', error);
      Alert.alert('Error', 'Failed to load contacts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleContactSelection = (contact: Contact) => {
    const phoneNumber = contact.phoneNumbers[0]?.number;
    if (!phoneNumber) {
      Alert.alert('No Phone Number', 'This contact does not have a phone number.');
      return;
    }

    setSelectedContacts(prev => {
      const exists = prev.find(c => c.contactId === contact.recordID);
      if (exists) {
        return prev.filter(c => c.contactId !== contact.recordID);
      } else {
        return [...prev, {
          contactId: contact.recordID,
          name: contact.displayName,
          phoneNumber: phoneNumber.replace(/\D/g, '') // Remove non-digits
        }];
      }
    });
  };

  const shareDeal = async (deal: any) => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to share deals.');
      return;
    }

    if (selectedContacts.length === 0) {
      Alert.alert('No Contacts Selected', 'Please select at least one contact to share with.');
      return;
    }

    try {
      setLoading(true);
      
      // Convert selected contacts to Contact format for the service
      const contactsToShare = selectedContacts.map(sc => {
        const originalContact = contacts.find(c => c.recordID === sc.contactId);
        return originalContact || {
          recordID: sc.contactId,
          displayName: sc.name,
          givenName: null,
          familyName: '',
          middleName: '',
          company: null,
          phoneNumbers: [{ label: 'mobile', number: sc.phoneNumber }],
          emailAddresses: []
        };
      });
      
      const success = await DealSharingService.shareWithContacts(dealId || '', contactsToShare, deal);
      
      if (success) {
        // Clear selection and reload progress
        setSelectedContacts([]);
        await loadShareProgress();
      }
      
    } catch (error) {
      console.error('❌ Error sharing deal:', error);
      Alert.alert('Error', 'Failed to share deal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadShareProgress = async () => {
    if (!dealId || !user?.id) return;

    try {
      const progress = await DealSharingService.getShareProgress(dealId, requiredShares);
      
      setShareProgress({
        currentShares: progress.currentShares,
        requiredShares: progress.requiredShares,
        canRedeem: progress.canRedeem,
        shareHistory: [] // TODO: Add share history tracking
      });

    } catch (error) {
      console.error('❌ Error loading share progress:', error);
    }
  };

  const searchContacts = (query: string) => {
    if (!query.trim()) return contacts;
    
    return contacts.filter(contact =>
      contact.displayName?.toLowerCase().includes(query.toLowerCase()) ||
      contact.givenName?.toLowerCase().includes(query.toLowerCase()) ||
      contact.familyName?.toLowerCase().includes(query.toLowerCase()) ||
      contact.phoneNumbers.some(phone => 
        phone.number.replace(/\D/g, '').includes(query.replace(/\D/g, ''))
      )
    );
  };

  const clearSelection = () => {
    setSelectedContacts([]);
  };

  return {
    // State
    contacts,
    selectedContacts,
    shareProgress,
    loading,
    hasContactsPermission,
    
    // Actions  
    requestContactsAccess,
    loadContacts,
    toggleContactSelection,
    shareDeal,
    loadShareProgress,
    searchContacts,
    clearSelection,
    checkPermissionStatus,
    
    // Computed
    canShare: selectedContacts.length > 0,
    selectedCount: selectedContacts.length,
    isContactSelected: (contactId: string) => 
      selectedContacts.some(c => c.contactId === contactId),
    
    // Progress info
    sharingComplete: shareProgress?.canRedeem || false,
    remainingShares: shareProgress ? 
      Math.max(0, shareProgress.requiredShares - shareProgress.currentShares) : requiredShares,
    progressPercentage: shareProgress ? 
      Math.min(100, (shareProgress.currentShares / shareProgress.requiredShares) * 100) : 0
  };
};