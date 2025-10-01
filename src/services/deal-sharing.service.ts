import { PermissionsAndroid, Platform, Alert } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Contacts from 'react-native-contacts';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Contact {
  recordID: string;
  displayName: string;
  givenName?: string;
  familyName?: string;
  phoneNumbers: Array<{
    label: string;
    number: string;
  }>;
}

interface ShareProgress {
  dealId: string;
  currentShares: number;
  requiredShares: number;
  canRedeem: boolean;
  progress: number;
}

class DealSharingService {
  private static instance: DealSharingService;

  static getInstance(): DealSharingService {
    if (!DealSharingService.instance) {
      DealSharingService.instance = new DealSharingService();
    }
    return DealSharingService.instance;
  }

  async checkContactsPermissionStatus(): Promise<'granted' | 'denied' | 'blocked' | 'unavailable'> {
    console.log('🔍 Checking contacts permission status...');
    
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.CONTACTS 
        : PERMISSIONS.ANDROID.READ_CONTACTS;

      const result = await check(permission);
      console.log('📱 Permission check result:', result);
      
      switch (result) {
        case RESULTS.GRANTED:
          return 'granted';
        case RESULTS.DENIED:
          return 'denied';
        case RESULTS.BLOCKED:
          return 'blocked';
        case RESULTS.UNAVAILABLE:
          return 'unavailable';
        default:
          return 'denied';
      }
    } catch (error) {
      console.error('❌ Error checking permission:', error);
      return 'denied';
    }
  }

  async requestContactsPermission(): Promise<boolean> {
    console.log('📞 Requesting contacts permission...');
    
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.CONTACTS 
        : PERMISSIONS.ANDROID.READ_CONTACTS;

      const result = await request(permission);
      console.log('📱 Permission request result:', result);
      
      return result === RESULTS.GRANTED;
    } catch (error) {
      console.error('❌ Error requesting permission:', error);
      Alert.alert(
        'Permission Error',
        'Could not request contacts permission. Please check your settings.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }

  async loadContacts(): Promise<Contact[]> {
    console.log('📞 Loading contacts from device...');
    
    try {
      // Check permission first
      const permissionStatus = await this.checkContactsPermissionStatus();
      if (permissionStatus !== 'granted') {
        console.log('❌ No permission to load contacts:', permissionStatus);
        return [];
      }

      // Load real contacts using react-native-contacts
      const contacts = await Contacts.getAll();
      console.log(`📱 Loaded ${contacts.length} contacts from device`);
      
      // Filter contacts that have phone numbers
      const contactsWithPhones = contacts.filter(contact => 
        contact.phoneNumbers && contact.phoneNumbers.length > 0
      );
      
      console.log(`📞 Filtered to ${contactsWithPhones.length} contacts with phone numbers`);
      
      if (contactsWithPhones.length > 0) {
        console.log('📞 Sample contact:', JSON.stringify(contactsWithPhones[0], null, 2));
      }
      
      // Return the real contacts, NOT mock data
      return contactsWithPhones;
      
    } catch (error) {
      console.error('❌ Error loading contacts:', error);
      Alert.alert(
        'Error Loading Contacts',
        'Could not load your contacts. Please check your permissions.',
        [{ text: 'OK' }]
      );
      return [];
    }
  }

  async shareWithContacts(dealId: string, selectedContacts: Contact[], dealInfo: any): Promise<boolean> {
    console.log(`📤 Sharing deal ${dealId} with ${selectedContacts.length} contacts`);
    
    try {
      // Create SMS content
      const shareMessage = this.createShareMessage(dealInfo);
      
      // For now, we'll simulate SMS sending by logging
      // Later we can integrate with react-native-sms
      console.log('📱 SMS Content:', shareMessage);
      console.log('📞 Recipients:', selectedContacts.map(c => c.phoneNumbers[0]?.number));
      
      // Track the shares locally
      await this.trackShares(dealId, selectedContacts.length);
      
      // TODO: Integrate with SMS sending
      Alert.alert(
        'Sharing Complete',
        `Deal shared with ${selectedContacts.length} contacts!`,
        [{ text: 'OK' }]
      );
      
      return true;
    } catch (error) {
      console.error('❌ Error sharing with contacts:', error);
      Alert.alert(
        'Sharing Failed',
        'Could not share the deal. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }

  private createShareMessage(dealInfo: any): string {
    return `🎉 Check out this amazing deal at ${dealInfo.business_name || dealInfo.business}!\n\n${dealInfo.description}\n\nDownload the app to see more deals: [App Store Link]`;
  }

  private async trackShares(dealId: string, shareCount: number): Promise<void> {
    try {
      const key = `shares_${dealId}`;
      const existingShares = await AsyncStorage.getItem(key);
      const currentShares = existingShares ? parseInt(existingShares, 10) : 0;
      const newTotal = currentShares + shareCount;
      
      await AsyncStorage.setItem(key, newTotal.toString());
      console.log(`📊 Tracked ${shareCount} new shares for deal ${dealId}. Total: ${newTotal}`);
    } catch (error) {
      console.error('❌ Error tracking shares:', error);
    }
  }

  async getShareProgress(dealId: string, requiredShares: number = 3): Promise<ShareProgress> {
    try {
      const key = `shares_${dealId}`;
      const sharesString = await AsyncStorage.getItem(key);
      const currentShares = sharesString ? parseInt(sharesString, 10) : 0;
      
      return {
        dealId,
        currentShares,
        requiredShares,
        canRedeem: currentShares >= requiredShares,
        progress: Math.min(currentShares / requiredShares, 1)
      };
    } catch (error) {
      console.error('❌ Error getting share progress:', error);
      return {
        dealId,
        currentShares: 0,
        requiredShares,
        canRedeem: false,
        progress: 0
      };
    }
  }
}

export default DealSharingService.getInstance();