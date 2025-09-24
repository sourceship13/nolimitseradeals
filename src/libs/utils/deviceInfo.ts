import { Platform } from 'react-native';

export const getDeviceId = async (): Promise<string> => {
  // You can use react-native-device-info library for better device identification
  // For now, returning a simple identifier
  const deviceId = await AsyncStorage.getItem('deviceId');
  
  if (!deviceId) {
    const newDeviceId = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await AsyncStorage.setItem('deviceId', newDeviceId);
    return newDeviceId;
  }
  
  return deviceId;
};