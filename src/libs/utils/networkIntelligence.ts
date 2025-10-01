/**
 * Network Intelligence Utility
 * 
 * This utility enhances device and network detection by optionally using:
 * - @react-native-netinfo/netinfo (for network state)
 * - react-native-device-info (for device detection)
 * 
 * Falls back to built-in React Native APIs when packages aren't available
 */

import { Platform } from 'react-native';

// Optional imports - gracefully handle missing packages
let NetInfo: any = null;
let DeviceInfo: any = null;

try {
  NetInfo = require('@react-native-netinfo/netinfo');
} catch (e) {
  console.log('📡 NetInfo not available - using basic network detection');
}

try {
  DeviceInfo = require('react-native-device-info');
} catch (e) {
  console.log('📱 DeviceInfo not available - using fallback device detection');
}

export interface NetworkState {
  isConnected: boolean;
  connectionType: string;
  isPhysicalDevice: boolean;
  shouldUseLocalhost: boolean;
  recommendedEnvironment: 'local' | 'staging' | 'production';
}

class NetworkIntelligence {
  private static cachedState: NetworkState | null = null;
  private static listeners: ((state: NetworkState) => void)[] = [];

  /**
   * Get comprehensive network and device state
   */
  static async getNetworkState(): Promise<NetworkState> {
    const isPhysical = await this.isPhysicalDevice();
    const networkInfo = await this.getNetworkInfo();
    
    const state: NetworkState = {
      isConnected: networkInfo.isConnected,
      connectionType: networkInfo.type,
      isPhysicalDevice: isPhysical,
      shouldUseLocalhost: this.shouldUseLocalhost(isPhysical, networkInfo),
      recommendedEnvironment: this.getRecommendedEnvironment(isPhysical, networkInfo)
    };

    this.cachedState = state;
    this.notifyListeners(state);
    
    return state;
  }

  /**
   * Enhanced physical device detection
   */
  private static async isPhysicalDevice(): Promise<boolean> {
    // Method 1: Use DeviceInfo if available (most accurate)
    if (DeviceInfo) {
      try {
        const isEmulator = await DeviceInfo.isEmulator();
        return !isEmulator;
      } catch (error) {
        console.log('DeviceInfo detection failed, using fallback');
      }
    }

    // Method 2: Platform-specific heuristics
    if (Platform.OS === 'android') {
      const { constants } = Platform;
      
      // Android emulator indicators
      const emulatorIndicators = [
        constants?.Brand === 'google',
        constants?.Model?.toLowerCase().includes('sdk'),
        constants?.Model?.toLowerCase().includes('emulator'),
        constants?.Fingerprint?.includes('generic'),
        (constants as any)?.Hardware?.includes('goldfish'), // Common emulator hardware
        (constants as any)?.Product?.includes('sdk')
      ];

      return !emulatorIndicators.some(Boolean);
    }

    // iOS: Harder to detect without DeviceInfo
    // In dev mode, conservative approach assumes simulator
    return !__DEV__;
  }

  /**
   * Get network information with NetInfo or fallback
   */
  private static async getNetworkInfo(): Promise<{ isConnected: boolean; type: string }> {
    if (NetInfo) {
      try {
        const state = await NetInfo.fetch();
        return {
          isConnected: state.isConnected ?? false,
          type: state.type || 'unknown'
        };
      } catch (error) {
        console.log('NetInfo fetch failed, using fallback');
      }
    }

    // Fallback: Assume connected (can't reliably detect without NetInfo)
    return {
      isConnected: true,
      type: 'unknown'
    };
  }

  /**
   * Determine if localhost should be used
   */
  private static shouldUseLocalhost(isPhysical: boolean, networkInfo: any): boolean {
    // Never use localhost on physical devices
    if (isPhysical) return false;
    
    // Only use localhost in development on simulators
    if (!__DEV__) return false;
    
    // If we have WiFi connection info, localhost might work on simulator
    return networkInfo.type === 'wifi' || networkInfo.type === 'unknown';
  }

  /**
   * Get recommended environment based on device and network state
   */
  private static getRecommendedEnvironment(isPhysical: boolean, networkInfo: any): 'local' | 'staging' | 'production' {
    // Physical devices: always use cloud
    if (isPhysical) {
      return __DEV__ ? 'staging' : 'production';
    }
    
    // Simulators in development: prefer local if network allows
    if (__DEV__) {
      return networkInfo.isConnected ? 'local' : 'staging';
    }
    
    // Release builds: always production
    return 'production';
  }

  /**
   * Subscribe to network state changes
   */
  static subscribe(callback: (state: NetworkState) => void): () => void {
    this.listeners.push(callback);
    
    // If we have NetInfo, listen for changes
    if (NetInfo) {
      const unsubscribe = NetInfo.addEventListener((state: any) => {
        this.getNetworkState(); // This will trigger notifications
      });
      
      return () => {
        this.listeners = this.listeners.filter(l => l !== callback);
        unsubscribe();
      };
    }
    
    // Fallback: just remove listener
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Notify all listeners of state changes
   */
  private static notifyListeners(state: NetworkState): void {
    this.listeners.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Network state listener error:', error);
      }
    });
  }

  /**
   * Test reachability of a specific host
   */
  static async testReachability(url: string, timeout: number = 10000): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        method: 'HEAD', // Lightweight request
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get detailed debug information
   */
  static async getDebugInfo(): Promise<any> {
    const networkState = await this.getNetworkState();
    
    const debugInfo: any = {
      ...networkState,
      platform: Platform.OS,
      platformConstants: Platform.constants,
      hasNetInfo: !!NetInfo,
      hasDeviceInfo: !!DeviceInfo,
      isDev: __DEV__,
      timestamp: new Date().toISOString()
    };

    // Add DeviceInfo details if available
    if (DeviceInfo) {
      try {
        debugInfo.deviceDetails = {
          deviceId: await DeviceInfo.getDeviceId(),
          brand: await DeviceInfo.getBrand(),
          model: await DeviceInfo.getModel(),
          systemName: await DeviceInfo.getSystemName(),
          systemVersion: await DeviceInfo.getSystemVersion(),
          isEmulator: await DeviceInfo.isEmulator(),
        };
      } catch (error) {
        debugInfo.deviceDetailsError = (error as Error)?.message || 'Unknown error';
      }
    }

    // Add NetInfo details if available
    if (NetInfo) {
      try {
        const netState = await NetInfo.fetch();
        debugInfo.networkDetails = {
          type: netState.type,
          isConnected: netState.isConnected,
          isInternetReachable: netState.isInternetReachable,
          details: netState.details
        };
      } catch (error) {
        debugInfo.networkDetailsError = (error as Error)?.message || 'Unknown error';
      }
    }

    return debugInfo;
  }
}

export default NetworkIntelligence;

// Installation instructions for enhanced functionality
export const INSTALLATION_GUIDE = {
  netinfo: {
    command: 'npm install @react-native-netinfo/netinfo',
    ios: 'cd ios && pod install',
    benefits: [
      'Real-time network state monitoring',
      'Connection type detection (WiFi, Cellular, etc.)',
      'Internet reachability testing',
      'Network change notifications'
    ]
  },
  deviceInfo: {
    command: 'npm install react-native-device-info',
    ios: 'cd ios && pod install',
    benefits: [
      'Accurate physical device vs emulator detection',
      'Device model and brand information', 
      'System version details',
      'Unique device identification'
    ]
  }
};