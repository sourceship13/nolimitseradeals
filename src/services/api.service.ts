// src/services/api.service.ts
// src/services/api.service.ts
import { Platform } from 'react-native';
import AuthService from './auth.service';
import ApiConfig, { apiConfig } from '../libs/utils/api.utils';

interface ApiResponse<T = any> {
  data?: T;
  success?: boolean;
  message?: string;
  error?: string;
}

class ApiService {
  // Dynamic getter to always use current API URL configuration
  private get baseURL() {
    return ApiConfig.apiURL;
  }

  // Public endpoints (no authentication required)
  private publicEndpoints = [
    '/auth/login',
    '/auth/register', 
    '/auth/verify-email',
    '/auth/verify-phone',
    '/auth/resend-code',
    '/auth/forgot-password',
    '/auth/reset-password',
    // All other endpoints require authentication
  ];

  /**
   * Determines if an endpoint requires authentication
   */
  private requiresAuth(endpoint: string): boolean {
    return !this.publicEndpoints.some(publicEndpoint => 
      endpoint.includes(publicEndpoint)
    );
  }

  /**
   * Generic API call method
   */
  async makeRequest<T = any>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    // CRITICAL: Check for local IP usage
    if (url.includes('192.168') || url.includes('localhost') || url.includes(':8080')) {
      console.log('🚨 API WORKING WITH LOCAL SERVER', url, this.baseURL);
    }
    
    // Enhanced debug logging for physical device troubleshooting
    console.log('=================================');
    console.log('� API SERVICE DEBUG');
    console.log('=================================');
    console.log(`📍 Endpoint: ${endpoint}`);
    console.log(`🌐 Full URL: ${url}`);
    console.log(`🔒 Requires Auth: ${this.requiresAuth(endpoint)}`);
    console.log(`📱 Platform: ${Platform.OS}`);
    console.log(`🔧 Dev Mode: ${__DEV__ ? 'YES' : 'NO'}`);
    console.log(`🏠 Base URL: ${this.baseURL}`);
    console.log(`📋 API Config:`, {
      environment: apiConfig.environment,
      isLocal: apiConfig.isLocal,
      baseURL: apiConfig.baseURL
    });
    console.log('=================================');
    
    try {
      let response: Response;
      
      if (this.requiresAuth(endpoint)) {
        console.log(`🛡️ ApiService: Making authenticated request to: ${url}`);
        console.log(`📋 ApiService: Original options passed to AuthService:`, options);
        
        // Ensure we have proper options structure for AuthService
        const authOptions = {
          method: 'GET',
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        };
        
        console.log(`📋 ApiService: Modified options for AuthService:`, authOptions);
        response = await AuthService.makeAuthenticatedRequest(url, authOptions);
      } else {
        console.log(`🌐 ApiService: Making public request to: ${url}`);
        // Use regular fetch for public endpoints
        const headers = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        };
        
        response = await fetch(url, {
          method: 'GET',
          ...options,
          headers,
          mode: 'cors',
        });
      }

      console.log(`📡 Response status: ${response.status}`);
      
      const data = await response.json();
      console.log(`📦 Response data:`, data);
      
      if (!response.ok) {
        console.error(`❌ API Error: ${response.status} - ${data.message || data.error}`);
        throw new Error(data.message || data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`💥 API Error (${endpoint}):`, error);
      
      // Enhanced error reporting for network issues
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        console.error(`🚨 Network Error Details:`);
        console.error(`📡 Trying to connect to: ${url}`);
        console.error(`🌐 Current API Config:`, {
          environment: apiConfig.environment,
          baseURL: this.baseURL,
          isLocal: apiConfig.isLocal
        });
        console.error(`💡 Suggestion: Check if device can reach the server`);
        
        // Throw a more user-friendly error
        throw new Error(`Unable to connect to server. Please check your internet connection and try again.`);
      }
      
      throw error;
    }
  }

  // Deals API Methods
  async getDeals(): Promise<ApiResponse<any[]>> {
    return this.makeRequest('/deals/all-v2');
  }

  async getCategories(): Promise<ApiResponse<any[]>> {
    return this.makeRequest('/deals/categories');
  }

  async getDealById(id: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/deals/${id}`);
  }

  async heartDeal(dealId: string): Promise<ApiResponse> {
    return this.makeRequest(`/deals/${dealId}/heart`, {
      method: 'POST',
    });
  }

  async unheartDeal(dealId: string): Promise<ApiResponse> {
    return this.makeRequest(`/deals/${dealId}/heart`, {
      method: 'DELETE',
    });
  }

  async getHeartedDeals(): Promise<ApiResponse<any[]>> {
    // Try multiple possible endpoints for hearted deals
    // const endpointsToTry = [
    //   '/user/hearted',      // Most likely endpoint for user's hearted deals
    //   '/user/favorites',    // Alternative naming
    //   '/user/saved',        // Another common naming
    //   '/deals/hearted',     // Original endpoint (might not exist)
    //   '/user/deals/hearted', // Nested endpoint
    //   '/favorites',         // Simple endpoint
    //   '/saved-deals'        // Another possibility
    // ];
    const endpointsToTry = [
      '/deals/hearted',      // Most likely endpoint for user's hearted deals
    ];

    let lastError: any = null;

    for (const endpoint of endpointsToTry) {
      try {
        console.log(`🧪 Trying ${endpoint} endpoint...`);
        const result = await this.makeRequest(endpoint);
        console.log(`✅ Success with ${endpoint}:`, result);
        return result;
      } catch (error) {
        console.log(`❌ ${endpoint} failed:`, error);
        lastError = error;
        continue;
      }
    }

    // If all endpoints failed, return the last error
    console.log('❌ All hearted deals endpoints failed');
    throw lastError;
  }

  async checkHeartStatus(dealId: string): Promise<ApiResponse<{dealId: string, isHearted: boolean, heartCount: number}>> {
    return this.makeRequest(`/deals/${dealId}/heart`, {
      method: 'GET',
    });
  }

  // User Profile API Methods
  async getUserProfile(): Promise<ApiResponse<any>> {
    return this.makeRequest('/user/profile');
  }

  async updateUserProfile(updates: any): Promise<ApiResponse> {
    return this.makeRequest('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Verification API Methods
  async verifyCode(phoneNumber: string, code: string): Promise<ApiResponse> {
    return this.makeRequest('/auth/verify-phone', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, code }),
    });
  }

  async resendVerificationCode(phoneNumber: string): Promise<ApiResponse> {
    return this.makeRequest('/auth/resend-code', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    });
  }

  // Analytics/Tracking (if needed)
  async trackDealView(dealId: string): Promise<ApiResponse> {
    return this.makeRequest('/analytics/deal-view', {
      method: 'POST',
      body: JSON.stringify({ dealId, timestamp: new Date().toISOString() }),
    });
  }

  async trackDealShare(dealId: string, platform: string): Promise<ApiResponse> {
    return this.makeRequest('/analytics/deal-share', {
      method: 'POST',
      body: JSON.stringify({ dealId, platform, timestamp: new Date().toISOString() }),
    });
  }

  async trackDealUnlocked(dealId: string, shareCount: number): Promise<ApiResponse> {
    return this.makeRequest(`/deals/${dealId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shareCount }),
    });
  }
}

export default new ApiService();