// Install required packages (no axios needed!):
// npm install @react-native-async-storage/async-storage react-native-keychain

// src/services/auth.service.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import ApiConfig from '../libs/utils/api.utils';

const API_BASE_URL = ApiConfig.apiURL;

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface User {
  id: string;
  email: string;
  username?: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  account_type: 'regular' | 'premium' | 'business';
  is_verified: boolean;
}

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  errors?: any[];
}

class AuthService {
  private refreshPromise: Promise<string> | null = null;

  // Helper method for fetch requests
  private async fetchWithConfig(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add auth token if not explicitly excluded
    if (!options.headers || !('Authorization' in options.headers)) {
      const token = await this.getAccessToken();
      if (token) {
        defaultHeaders.Authorization = `Bearer ${token}`;
      }
    }

    return fetch(url, {
      ...options,
      headers: defaultHeaders,
    });
  }

  // Helper to handle API responses
  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    
    if (!response.ok) {
      let error: any;
      
      if (contentType && contentType.includes('application/json')) {
        error = await response.json();
      } else {
        error = { error: await response.text() };
      }
      
      throw new Error(error.error || error.message || 'Request failed');
    }

    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    return response.text() as any;
  }

  // Store tokens securely
  private async storeTokens(tokens: AuthTokens): Promise<void> {
    try {
      // Store refresh token in Keychain (most secure)
      await Keychain.setInternetCredentials(
        'com.yourapp.auth',
        'refreshToken',
        tokens.refreshToken
      );

      // Store access token in AsyncStorage (for quick access)
      await AsyncStorage.setItem('accessToken', tokens.accessToken);
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw error;
    }
  }

  // Get access token
  private async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('accessToken');
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  // Get refresh token
  private async getRefreshToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getInternetCredentials('com.yourapp.auth');
      return credentials ? credentials.password : null;
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  // Clear all tokens
  private async clearTokens(): Promise<void> {
    try {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('user');
      await Keychain.resetInternetCredentials('com.yourapp.auth');
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  // Make authenticated request with automatic token refresh
  private async authenticatedRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      // First attempt
      const response = await this.fetchWithConfig(url, options);
      
      // If not 401, return the response
      if (response.status !== 401) {
        return this.handleResponse<T>(response);
      }

      // If 401, try to refresh token
      const newAccessToken = await this.refreshAccessToken();
      
      // Retry with new token
      const retryResponse = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${newAccessToken}`,
        },
      });

      return this.handleResponse<T>(retryResponse);
    } catch (error) {
      // If refresh failed, clear tokens and throw
      if (error instanceof Error && error.message.includes('refresh')) {
        await this.clearTokens();
      }
      throw error;
    }
  }

  // Refresh access token
  private async refreshAccessToken(): Promise<string> {
    // Prevent multiple simultaneous refresh calls
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshToken = await this.getRefreshToken();
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
          throw new Error('Token refresh failed');
        }

        const data = await response.json();
        const { accessToken, refreshToken: newRefreshToken } = data;

        await this.storeTokens({
          accessToken,
          refreshToken: newRefreshToken,
        });

        return accessToken;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  async verifyCode(identifier: string, code: string) {
  try {
    const url = `${API_BASE_URL}/auth/verify-code`;
    console.log('Verifying code at:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier, // phone number or email
        code
      }),
    });

    const text = await response.text();
    console.log('Verification response:', text);
    
    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      throw new Error('Invalid response from server');
    }

    if (!response.ok) {
      throw new Error(result.error || 'Verification failed');
    }

    return result;
  } catch (error) {
    console.error('Verification error:', error);
    throw error;
  }
}

async resendVerificationCode(identifier: string) {
  try {
    const url = `${API_BASE_URL}/auth/resend-code`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifier }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to resend code');
    }

    return result;
  } catch (error) {
    console.error('Resend error:', error);
    throw error;
  }
}

  async register(data: {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
}) {
  try {
    const url = `${API_BASE_URL}/auth/register`;
    console.log('🔴 FULL URL:', url);
    console.log('🔴 API_BASE_URL:', API_BASE_URL);
    console.log('🔴 Sending data:', data);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    console.log('🔴 Response status:', response.status);
    
    // Log the raw response first
    const responseText = await response.text();
    console.log('🔴 Response text:', responseText);
    
    // Check if it's HTML
    if (responseText.startsWith('<')) {
      console.error('Received HTML instead of JSON:', responseText.substring(0, 200));
      throw new Error('Server error - received HTML instead of JSON. Check if backend is running.');
    }
    
    // Try to parse as JSON
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      throw new Error('Invalid response from server');
    }
    
    // Check if the request was successful
    if (!response.ok) {
      throw new Error(result.error || 'Registration failed');
    }
    
    // Success! Return the result
    console.log('✅ Registration successful:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Registration error:', error);
    throw error;
  }
}

  // Login user
  async login(
    credentials: {
      email?: string;
      phone_number?: string;
      username?: string;
      password: string;
    },
    deviceId?: string
  ): Promise<User> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (deviceId) {
        headers['X-Device-ID'] = deviceId;
      }

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers,
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const result = await response.json();
      const { user, accessToken, refreshToken, sessionToken } = result;

      await this.storeTokens({ accessToken, refreshToken });
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      if (sessionToken) {
        await AsyncStorage.setItem('sessionToken', sessionToken);
      }

      return user;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Login failed');
    }
  }

  // Logout user
  async logout(logoutAll: boolean = false): Promise<void> {
    try {
      const accessToken = await this.getAccessToken();
      const refreshToken = await this.getRefreshToken();
      
      if (accessToken) {
        // Call logout endpoint if we have a token
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ refreshToken, logoutAll }),
        }).catch(error => {
          console.error('Error calling logout endpoint:', error);
        });
      }
    } finally {
      // Always clear local tokens
      await this.clearTokens();
      await AsyncStorage.removeItem('sessionToken');
    }
  }

  // Get current user from storage
  async getCurrentUser(): Promise<User | null> {
    try {
      const userStr = await AsyncStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Get user profile from API
  async getProfile(): Promise<User> {
    const data = await this.authenticatedRequest<{ user: User }>(
      `${API_BASE_URL}/auth/profile`
    );
    
    const user = data.user;
    await AsyncStorage.setItem('user', JSON.stringify(user));
    return user;
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  }

  // Verify email
  async verifyEmail(token: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/verify-email/${token}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Email verification failed');
    }
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/password-reset/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Password reset request failed');
    }

    return response.json();
  }

  // Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/password-reset/${token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Password reset failed');
    }

    return response.json();
  }

  // Get active sessions
  async getActiveSessions(): Promise<any[]> {
    const data = await this.authenticatedRequest<{ sessions: any[] }>(
      `${API_BASE_URL}/auth/sessions`
    );
    return data.sessions;
  }

  // Update profile
  async updateProfile(updates: Partial<User>): Promise<User> {
    const data = await this.authenticatedRequest<{ user: User }>(
      `${API_BASE_URL}/auth/profile`,
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      }
    );
    
    const user = data.user;
    await AsyncStorage.setItem('user', JSON.stringify(user));
    return user;
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.authenticatedRequest(
      `${API_BASE_URL}/auth/change-password`,
      {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      }
    );
  }

  // Enable two-factor authentication
  async enableTwoFactor(): Promise<{ secret: string; qrCode: string }> {
    return this.authenticatedRequest(
      `${API_BASE_URL}/auth/2fa/enable`,
      { method: 'POST' }
    );
  }

  // Verify two-factor code
  async verifyTwoFactor(code: string): Promise<void> {
    await this.authenticatedRequest(
      `${API_BASE_URL}/auth/2fa/verify`,
      {
        method: 'POST',
        body: JSON.stringify({ code }),
      }
    );
  }
}

export default new AuthService();
