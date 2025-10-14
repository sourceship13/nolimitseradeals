import { Platform } from 'react-native';
import DeviceDetector from './deviceDetector';

// Environment type
type Environment = 'local' | 'staging' | 'production';

// Detect if running on physical device (not simulator)
const isPhysicalDevice = (): boolean => {
  // Enhanced detection using multiple signals
  if (__DEV__) {
    // In development, use heuristics to detect physical devices
    
    // Android emulators often have these characteristics
    if (Platform.OS === 'android') {
      const { constants } = Platform;
      const isEmulator = (
        constants?.Brand === 'google' ||
        constants?.Model?.toLowerCase().includes('sdk') ||
        constants?.Model?.toLowerCase().includes('emulator') ||
        constants?.Fingerprint?.includes('generic')
      );
      
      console.log('🤖 ANDROID DEVICE DETECTION:', {
        brand: constants?.Brand,
        model: constants?.Model,
        fingerprint: constants?.Fingerprint,
        isEmulator: isEmulator,
        isPhysical: !isEmulator
      });
      
      return !isEmulator;
    }
    
    // iOS: Since metro bundler loaded from network IP (192.168.26.8:8081)
    // this indicates we're on a physical device, not simulator
    // For now, let's default to physical device for iOS in dev mode
    const isLikelyPhysical = true; // Physical devices need network IP for metro
    
    console.log('📱 iOS DEVICE DETECTION:', {
      platform: 'iOS',
      devMode: __DEV__,
      assumption: 'physical device (metro from network IP)',
      isPhysical: isLikelyPhysical,
      note: 'Metro bundler from 192.168.26.8 indicates physical device'
    });
    
    return isLikelyPhysical;
  }
  
  // In release builds, always assume physical device
  console.log('🏭 RELEASE BUILD - Assuming physical device');
  return true;
};

// Override for testing - can be set via NetworkDebug screen
let FORCE_PHYSICAL_DEVICE: boolean | null = null;

// Override for development - set to true to use local development server
const FORCE_LOCAL_DEVELOPMENT = true; // Set to false to ALWAYS use staging server (recommended)

  // FORCE STAGING: Override everything to use staging (set to true to force staging regardless of device)
const FORCE_STAGING_ALWAYS = false; // Set to true to FORCE staging server for all requests

// IMPORTANT: Verify all URLs point to staging
const STAGING_URL = 'https://f3x2ipn2yf.us-east-1.awsapprunner.com';// Auto-detect environment based on device type and build
const getEnvironment = (): Environment => {
  const actuallyPhysical = FORCE_PHYSICAL_DEVICE !== null ? FORCE_PHYSICAL_DEVICE : isPhysicalDevice();
  
  console.log('🌍 ENVIRONMENT SELECTION:', {
    forcePhysical: FORCE_PHYSICAL_DEVICE,
    detectedPhysical: isPhysicalDevice(),
    finalPhysical: actuallyPhysical,
    devMode: __DEV__,
    forceLocalDev: FORCE_LOCAL_DEVELOPMENT,
    forceStagingAlways: FORCE_STAGING_ALWAYS
  });
  
  // HIGHEST PRIORITY: Force staging override (bypasses all other logic)
  if (FORCE_STAGING_ALWAYS) {
    console.log('   → Selected: STAGING (FORCED OVERRIDE - ignoring all device detection)');
    return 'staging';
  }
  
  // Override for local development: Use local environment even for physical devices
  if (__DEV__ && FORCE_LOCAL_DEVELOPMENT) {
    console.log('   → Selected: LOCAL (Development Override - Physical Device will use Mac IP)');
    return 'local';
  }
  
  // Always use staging/cloud for physical devices (when not in local dev mode)
  if (actuallyPhysical) {
    console.log('   → Selected: STAGING (Physical Device)');
    return 'staging';
  }
  
  // Use staging for simulators when local development is disabled
  if (__DEV__) {
    console.log('   → Selected: STAGING (Simulator Dev - Local Development Disabled)');
    return 'staging'; // Use staging server since FORCE_LOCAL_DEVELOPMENT is false
  }
  
  console.log('   → Selected: STAGING (Release Build)');
  return 'staging'; // Default to staging for release builds
};

class ApiConfig {
  private static instance: ApiConfig;
  
  private readonly urls = {
    local: {
      ios: STAGING_URL, // FORCED to staging
      android: STAGING_URL, // FORCED to staging
      // For physical devices, use your Mac's network IP
      physical: STAGING_URL, // FORCED to staging - was 192.168.26.8:8080
    },
    staging: STAGING_URL,
    production: STAGING_URL,
  };
  
  // Store the environment
  private currentEnv: Environment;
  
  private constructor() {
    this.currentEnv = getEnvironment();
    console.log(`📍 ApiConfig initialized with environment: ${this.currentEnv}`);
    console.log(`📍 Physical device URL configured: ${this.urls.local.physical}`);
  }
  
  static getInstance(): ApiConfig {
    if (!ApiConfig.instance) {
      ApiConfig.instance = new ApiConfig();
    }
    return ApiConfig.instance;
  }
  
  // Method to manually override environment (useful for testing)
  setEnvironment(env: Environment): void {
    this.currentEnv = env;
    console.log(`Environment manually set to: ${env}`);
    console.log(`New Base URL: ${this.baseURL}`);
  }
  
  get baseURL(): string {
    const physicalDevice = isPhysicalDevice();
    
    console.log('🔧 BASE URL SELECTION DEBUG:');
    console.log(`   Environment: ${this.currentEnv}`);
    console.log(`   Is Physical Device: ${physicalDevice}`);
    console.log(`   Platform: ${Platform.OS}`);
    
    switch (this.currentEnv) {
      case 'local':
        // Smart local URL selection based on device type
        if (physicalDevice) {
          // Physical devices use Mac's network IP to connect to localhost
          console.log(`   Selected: Physical Device URL → ${this.urls.local.physical}`);
          return this.urls.local.physical;
        }
        
        // Simulators use standard localhost
        const simulatorURL = Platform.OS === 'ios'
          ? this.urls.local.ios
          : this.urls.local.android;
        console.log(`   Selected: Simulator URL → ${simulatorURL}`);
        return simulatorURL;
          
      case 'staging':
        console.log(`   Selected: Staging URL → ${this.urls.staging}`);
        return this.urls.staging;
        
      case 'production':
        console.log(`   Selected: Production URL → ${this.urls.production}`);
        return this.urls.production;
        
      default:
        // Fallback to staging for safety
        console.log(`   Selected: Fallback to Staging → ${this.urls.staging}`);
        return this.urls.staging;
    }
  }
  
  get apiURL(): string {
    return `${this.baseURL}/api`;
  }
  
  get environment(): Environment {
    return this.currentEnv;
  }
  
  // Helper to check if we're using local server
  get isLocal(): boolean {
    return this.currentEnv === 'local';
  }
  
  // Helper to get all configured URLs (for debugging)
  get allUrls() {
    return {
      local_ios: this.urls.local.ios,
      local_android: this.urls.local.android,
      local_physical: this.urls.local.physical,
      staging: this.urls.staging,
      production: this.urls.production,
    };
  }
}

// Create and export singleton instance
export const apiConfig = ApiConfig.getInstance();
export default apiConfig;

// Log configuration on load
console.log('=================================');
console.log('🔧 API Configuration Loaded');
console.log('=================================');
console.log('📍 Environment:', apiConfig.environment);
console.log('🌐 Base URL:', apiConfig.baseURL);
console.log('🚀 API URL:', apiConfig.apiURL);
console.log('🔨 Dev Mode:', __DEV__ ? 'YES' : 'NO');
console.log('📱 Platform:', Platform.OS);
console.log('=================================');

// Export helper function to switch environments during runtime (useful for testing)
export const switchEnvironment = (env: Environment) => {
  apiConfig.setEnvironment(env);
};

// Export helper to force physical device detection (for testing)
export const forcePhysicalDevice = (isPhysical: boolean | null) => {
  // Only allow this if FORCE_STAGING_ALWAYS is false
  if (FORCE_STAGING_ALWAYS) {
    console.log('🚫 Cannot override device detection - FORCE_STAGING_ALWAYS is enabled');
    return;
  }
  
  FORCE_PHYSICAL_DEVICE = isPhysical;
  console.log('🔧 FORCE PHYSICAL DEVICE:', isPhysical);
  // Refresh the configuration
  const newEnv = getEnvironment();
  apiConfig.setEnvironment(newEnv);
};

// Export helper to verify current configuration
export const getCurrentConfig = () => {
  console.log('=================================');
  console.log('🔍 CURRENT API CONFIGURATION');
  console.log('=================================');
  console.log('📍 Environment:', apiConfig.environment);
  console.log('🌐 Base URL:', apiConfig.baseURL);
  console.log('🚀 API URL:', apiConfig.apiURL);
  console.log('🔧 FORCE_STAGING_ALWAYS:', FORCE_STAGING_ALWAYS);
  console.log('🔧 FORCE_LOCAL_DEVELOPMENT:', FORCE_LOCAL_DEVELOPMENT);
  console.log('🔧 FORCE_PHYSICAL_DEVICE:', FORCE_PHYSICAL_DEVICE);
  console.log('📱 Is Physical Device:', isPhysicalDevice());
  console.log('📋 ALL URLs now point to:', STAGING_URL);
  console.log('⚠️  Local development DISABLED - all requests go to staging server');
  console.log('=================================');
  return {
    environment: apiConfig.environment,
    baseURL: apiConfig.baseURL,
    apiURL: apiConfig.apiURL,
    isStaging: apiConfig.environment === 'staging'
  };
};

// Export helper to force complete configuration refresh
export const forceRefreshConfig = () => {
  console.log('🔄 FORCING COMPLETE API CONFIGURATION REFRESH...');
  
  // Reset all overrides
  FORCE_PHYSICAL_DEVICE = null;
  
  // Force re-evaluation of environment
  const newEnv = getEnvironment();
  console.log('🔄 New environment selected:', newEnv);
  
  // Update the singleton instance
  apiConfig.setEnvironment(newEnv);
  
  // Verify all URLs are correct
  console.log('✅ VERIFICATION: All URLs should now point to:', STAGING_URL);
  console.log('✅ Current base URL:', apiConfig.baseURL);
  console.log('✅ Current API URL:', apiConfig.apiURL);
  
  // Double check no local IPs are being used
  if (apiConfig.baseURL.includes('192.168') || apiConfig.baseURL.includes('localhost')) {
    console.error('🚨 ERROR: Still using local IP! Base URL:', apiConfig.baseURL);
  } else {
    console.log('✅ SUCCESS: No local IPs detected in base URL');
  }
  
  // Log the results
  getCurrentConfig();
  
  return apiConfig;
};

// Export helper to get current detection status
export const getDeviceDetectionStatus = () => {
  return {
    forced: FORCE_PHYSICAL_DEVICE,
    detected: isPhysicalDevice(),
    final: FORCE_PHYSICAL_DEVICE !== null ? FORCE_PHYSICAL_DEVICE : isPhysicalDevice(),
    environment: apiConfig.environment,
    baseURL: apiConfig.baseURL
  };
};