import { Platform } from 'react-native';

// Environment type
type Environment = 'local' | 'staging' | 'production';

// Set your current environment here
const CURRENT_ENV: Environment = 'staging'; // Change this to switch environments

class ApiConfig {
  private static instance: ApiConfig;
  
  private readonly urls = {
    local: {
      ios: 'http://localhost:8080',
      android: 'http://10.0.2.2:8080',
    },
    staging: 'https://f3x2ipn2yf.us-east-1.awsapprunner.com', // Replace with your actual staging URL
    production: 'https://f3x2ipn2yf.us-east-1.awsapprunner.com', // Replace with your actual production URL
  };
  
  private constructor() {}
  
  static getInstance(): ApiConfig {
    if (!ApiConfig.instance) {
      ApiConfig.instance = new ApiConfig();
    }
    return ApiConfig.instance;
  }
  
  get baseURL(): string {
    switch (CURRENT_ENV) {
      case 'local':
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
    return CURRENT_ENV;
  }
}

export const apiConfig = ApiConfig.getInstance();
export default apiConfig;

// Log the configuration (for debugging)
console.log('=================================');
console.log('API Configuration Loaded:');
console.log('Environment:', apiConfig.environment);
console.log('Base URL:', apiConfig.baseURL);
console.log('API URL:', apiConfig.apiURL);
console.log('=================================');
console.log('API Configuration Loaded:');