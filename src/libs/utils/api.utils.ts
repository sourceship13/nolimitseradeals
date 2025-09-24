import { Platform } from 'react-native';

// Environment type
type Environment = 'local' | 'staging' | 'production';

// Auto-detect environment based on __DEV__ flag
// You can override this by uncommenting the line below
const getEnvironment = (): Environment => {
  // OPTION 1: Auto-detect based on dev/release build
  if (__DEV__) {
    return 'local'; // Use local server in development
  }
  return 'staging'; // Use staging in release builds
  
  // OPTION 2: Manual override (uncomment to use)
  // return 'staging'; // Force specific environment
};

class ApiConfig {
  private static instance: ApiConfig;
  
  private readonly urls = {
    local: {
      ios: 'http://localhost:8080',
      android: 'http://10.0.2.2:8080',
      // For physical devices, use your computer's IP
      physical: 'http://192.168.1.100:8080', // Replace with your actual IP
    },
    staging: 'https://f3x2ipn2yf.us-east-1.awsapprunner.com',
    production: 'https://f3x2ipn2yf.us-east-1.awsapprunner.com',
  };
  
  // Store the environment
  private currentEnv: Environment;
  
  private constructor() {
    this.currentEnv = getEnvironment();
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
    switch (this.currentEnv) {
      case 'local':
        // Check if running on physical device (you need to implement this check)
        const isPhysicalDevice = false; // Set to true when testing on physical device
        
        if (isPhysicalDevice) {
          return this.urls.local.physical;
        }
        
        return Platform.OS === 'ios'
          ? this.urls.local.ios
          : this.urls.local.android;
          
      case 'staging':
        return this.urls.staging;
        
      case 'production':
        return this.urls.production;
        
      default:
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