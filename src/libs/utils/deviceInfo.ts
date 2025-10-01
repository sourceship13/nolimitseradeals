import { Platform } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

export const getDeviceId = async (): Promise<string> => {
  try {
    // Get existing device ID or generate new one
    const deviceId = await AsyncStorage.getItem('deviceId');
    if (deviceId) {
      return deviceId;
    }
    const newDeviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await AsyncStorage.setItem('deviceId', newDeviceId);
    return newDeviceId;
  } catch (error) {
    // Fallback if AsyncStorage fails
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
};