import { Platform } from 'react-native';

// Optional: Import DeviceInfo if available (npm install react-native-device-info)
let DeviceInfo: any = null;
try {
  DeviceInfo = require('react-native-device-info');
} catch (e) {
  // DeviceInfo not available - will use fallback methods
}

/**
 * Enhanced device detection utility
 * Combines multiple signals to determine if we're on a physical device
 */
class DeviceDetector {
  private static _isPhysicalDevice: boolean | null = null;
  private static _deviceInfo: any = null;

  /**
   * Comprehensive physical device detection
   * Uses multiple heuristics for accuracy
   */
  static async isPhysicalDevice(): Promise<boolean> {
    if (this._isPhysicalDevice !== null) {
      return this._isPhysicalDevice;
    }

    try {
      // Method 1: Check if DeviceInfo is available (requires react-native-device-info)
      if (DeviceInfo) {
        const isEmulator = await DeviceInfo.isEmulator();
        this._isPhysicalDevice = !isEmulator;
        return this._isPhysicalDevice;
      }
    } catch (error) {
      console.error('DeviceInfo not available, using fallback detection');
    }

    // Method 2: Fallback heuristics without extra packages
    this._isPhysicalDevice = this.detectPhysicalDeviceFallback();
    return this._isPhysicalDevice;
  }

  /**
   * Fallback detection method using built-in React Native APIs
   */
  private static detectPhysicalDeviceFallback(): boolean {
    // In development, assume simulator unless proven otherwise
    if (__DEV__) {
      // Check for common simulator indicators
      const isAndroidEmulator = Platform.OS === 'android' && (
        // Android emulator often has these characteristics
        Platform.constants?.Brand === 'google' ||
        Platform.constants?.Model?.includes('sdk') ||
        Platform.constants?.Model?.includes('Emulator')
      );

      // iOS simulators are harder to detect without DeviceInfo
      // For now, assume iOS dev = simulator, Android dev = might be physical
      if (Platform.OS === 'ios') {
        return false; // Assume simulator in development
      }
      
      return !isAndroidEmulator;
    }

    // In release builds, assume physical device
    return true;
  }

  /**
   * Get device information for debugging
   */
  static async getDeviceInfo(): Promise<any> {
    if (this._deviceInfo) {
      return this._deviceInfo;
    }

    const info: any = {
      platform: Platform.OS,
      isDev: __DEV__,
      isPhysical: await this.isPhysicalDevice(),
    };

    try {
      if (DeviceInfo) {
        info.deviceId = await DeviceInfo.getDeviceId();
        info.brand = await DeviceInfo.getBrand();
        info.model = await DeviceInfo.getModel();
        info.isEmulator = await DeviceInfo.isEmulator();
        info.systemName = await DeviceInfo.getSystemName();
      } else {
        info.platformConstants = Platform.constants;
      }
    } catch (error) {
      console.error('Could not get extended device info:', error);
    }

    this._deviceInfo = info;
    return info;
  }

  /**
   * Reset cached values (useful for testing)
   */
  static reset(): void {
    this._isPhysicalDevice = null;
    this._deviceInfo = null;
  }

  /**
   * Force set physical device status (for testing)
   */
  static forcePhysicalDevice(isPhysical: boolean): void {
    this._isPhysicalDevice = isPhysical;
  }
}

export default DeviceDetector;