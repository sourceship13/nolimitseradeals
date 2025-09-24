import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

export const useSecureStorage = () => {
  const saveSecureData = async (key: string, value: string, isHighSecurity: boolean = false) => {
    if (isHighSecurity) {
      // Use Keychain for sensitive data
      await Keychain.setInternetCredentials(
        `com.yourapp.${key}`,
        key,
        value
      );
    } else {
      // Use AsyncStorage for less sensitive data
      await AsyncStorage.setItem(key, value);
    }
  };

  const getSecureData = async (key: string, isHighSecurity: boolean = false): Promise<string | null> => {
    if (isHighSecurity) {
      const credentials = await Keychain.getInternetCredentials(`com.yourapp.${key}`);
      return credentials ? credentials.password : null;
    } else {
      return AsyncStorage.getItem(key);
    }
  };

  const removeSecureData = async (key: string, isHighSecurity: boolean = false) => {
    if (isHighSecurity) {
      await Keychain.resetInternetCredentials(`com.yourapp.${key}`);
    } else {
      await AsyncStorage.removeItem(key);
    }
  };

  return { saveSecureData, getSecureData, removeSecureData };
};