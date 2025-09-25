import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SimpleAuthService {
  constructor() {
    this.apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.124:5000/api';
    console.log('Simple Auth Service initialized with API URL:', this.apiBaseUrl);
  }

  // Retry logic for critical operations
  async makeRequestWithRetry(endpoint, options = {}, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${maxRetries} for ${endpoint}`);
        const result = await this.makeRequest(endpoint, options);
        console.log(`✅ Success on attempt ${attempt} for ${endpoint}`);
        return result;
      } catch (error) {
        console.log(`❌ Attempt ${attempt}/${maxRetries} failed for ${endpoint}:`, error.message);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Exponential backoff: wait longer between retries
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Make API request with timeout and error handling
  async makeRequest(endpoint, options = {}) {
    const url = `${this.apiBaseUrl}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      timeout: 30000, // Increased timeout to 30 seconds
      ...options,
    };

  // Add auth token if available - try multiple approaches
    let token = options.headers && options.headers.Authorization ? 
      options.headers.Authorization.replace('Bearer ', '') : null;
    
    if (!token) {
      token = await this.getStoredToken();
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('⚠️ No authentication token available for request to:', endpoint);
    }

    try {
      console.log(`Making request to: ${url}`);
      console.log('Request headers:', config.headers);
      
      const controller = new AbortController();
      // Longer timeout for critical operations like orders (60 seconds)
      const isOrderOperation = url.includes('/customer/orders') || url.includes('/admin/');
      const timeoutDuration = isOrderOperation ? 60000 : 30000;
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
      
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Log response headers and status for debugging
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON response received:', textResponse);
        throw new Error(`Server returned non-JSON response: ${textResponse.substring(0, 200)}...`);
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        // Log detailed error information for debugging
        console.error('API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          errorData: data,
          url: url
        });
        
        // If it's a validation error, show more details
        if (data.errors || data.validationErrors || data.required) {
          console.error('Validation Details:', {
            errors: data.errors,
            validationErrors: data.validationErrors, 
            required: data.required,
            missing: data.missing
          });
        }
        
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`Request successful: ${url}`);
      return data;
    } catch (error) {
      console.error(`Request failed for ${url}:`, error);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please check your connection.');
      }
      
      if (error.message === 'Network request failed') {
        throw new Error('Unable to connect to server. Please check your internet connection.');
      }
      
      throw error;
    }
  }

  // Register new user
  async register(userData) {
    try {
      const { name, email, password, phone, address } = userData;

      // Basic validation
      if (!name?.trim()) throw new Error('Name is required');
      if (!this.validateEmail(email)) throw new Error('Please enter a valid email address');
      if (!password || password.length < 6) throw new Error('Password must be at least 6 characters long');
      if (!phone?.trim()) throw new Error('Phone number is required');
      if (!address?.trim()) throw new Error('Address is required');

      const response = await this.makeRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password,
          phone: phone.trim(),
          address: address.trim(),
          role: 'customer',
          registeredFrom: 'mobile-app',
          registrationDate: new Date().toISOString(),
        }),
      });

      // Store user data locally for admin dashboard metrics
      try {
        const existingUsers = await AsyncStorage.getItem('registeredUsers');
        const users = existingUsers ? JSON.parse(existingUsers) : [];
        
        const newUser = {
          _id: response.user._id || Date.now().toString(),
          name: name.trim(),
          email: email.toLowerCase().trim(),
          phone: phone.trim(),
          address: address.trim(),
          role: 'customer',
          registrationDate: new Date().toISOString(),
        };
        
        users.push(newUser);
        await AsyncStorage.setItem('registeredUsers', JSON.stringify(users));
        console.log('📋 Stored user data locally for dashboard metrics');
      } catch (storageError) {
        console.log('⚠️ Failed to store user data locally:', storageError.message);
      }

      return {
        success: true,
        user: response.user,
        message: response.message
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.message || 'Registration failed'
      };
    }
  }

  // Login user
  async login(email, password) {
    try {
      if (!this.validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }
      
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      const response = await this.makeRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
          loginFrom: 'mobile-app',
          loginTime: new Date().toISOString(),
        }),
      });

      // Store authentication data
      await this.storeAuthData(response);
      
      console.log('Login successful, stored user data:', response.user);

      return {
        success: true,
        user: response.user,
        token: response.token
      };
    } catch (error) {
      console.error('Login error:', error);
      
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    }
  }


  // Store authentication data
  async storeAuthData(authData) {
    try {
      await SecureStore.setItemAsync('userData', JSON.stringify(authData.user));
      await SecureStore.setItemAsync('authToken', authData.token);
      await SecureStore.setItemAsync('userRole', authData.user.role);
      await SecureStore.setItemAsync('loginTimestamp', Date.now().toString());
      
      console.log('Auth data stored successfully');
    } catch (error) {
      console.error('Store auth data error:', error);
      throw error;
    }
  }

  // Get current user
  async getCurrentUser() {
    try {
      const userData = await SecureStore.getItemAsync('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Get stored token
  async getStoredToken() {
    try {
      return await SecureStore.getItemAsync('authToken');
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  }

  // Check if user is authenticated
  async isAuthenticated() {
    try {
      const userData = await SecureStore.getItemAsync('userData');
      const token = await SecureStore.getItemAsync('authToken');
      return !!(userData && token);
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  }

  // Logout user
  async logout() {
    try {
      // Try to logout from server (optional)
      try {
        await this.makeRequest('/auth/logout', { method: 'POST' });
      } catch (error) {
        console.log('Server logout failed (continuing with local logout)');
      }

      // Clear local storage
      await SecureStore.deleteItemAsync('userData');
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('userRole');
      await SecureStore.deleteItemAsync('loginTimestamp');
      
      console.log('User logged out successfully');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      console.log('updateProfile called with data:', profileData);
      const token = await this.getStoredToken();
      console.log('Stored token for profile update:', token ? 'Present' : 'Missing');
      
      const response = await this.makeRequest('/user/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
      
      console.log('Profile update response:', response);

      if (response.success && response.user) {
        // Update stored user data with the new profile data
        const currentUser = await this.getCurrentUser();
        const updatedUser = {
          ...currentUser,
          ...response.user,
          _id: response.user.id || currentUser._id, // Ensure _id is preserved
        };
        await SecureStore.setItemAsync('userData', JSON.stringify(updatedUser));
        
        return {
          success: true,
          user: updatedUser
        };
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update profile'
      };
    }
  }

  // Get user dashboard data
  async getDashboardData() {
    try {
      const response = await this.makeRequest('/customer/dashboard');
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('Dashboard data error:', error);
      // Return mock data for demo
      return this.getMockDashboardData();
    }
  }

  // Get mock dashboard data (fallback)
  getMockDashboardData() {
    return {
      success: true,
      data: {
        orders: [
          {
            _id: '1',
            productName: 'Full Cream Milk',
            quantity: 2,
            totalAmount: 120,
            status: 'delivered',
            createdAt: '2025-01-15T10:00:00Z',
            deliveryDate: '2025-01-15'
          },
          {
            _id: '2',
            productName: 'Toned Milk',
            quantity: 1,
            totalAmount: 50,
            status: 'pending',
            createdAt: '2025-01-14T10:00:00Z',
            deliveryDate: '2025-01-16'
          }
        ],
        stats: {
          totalOrders: 2,
          deliveredOrders: 1,
          pendingOrders: 1,
          totalSpent: 170
        }
      }
    };
  }

  // Admin: Get all users for reports
  async getAllUsers() {
    try {
      // Check if user is admin before making the request
      const currentUser = await this.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        console.log('🚫 Customer attempted to access admin users - blocked');
        throw new Error('Admin access required');
      }
      
      const response = await this.makeRequest('/admin/users');
      return {
        success: true,
        users: response.users
      };
    } catch (error) {
      console.error('Get users error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get users'
      };
    }
  }

  // Admin: Get admin dashboard stats
  async getAdminDashboard() {
    try {
      // Check if user is admin before making the request
      const currentUser = await this.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        console.log('🚫 Customer attempted to access admin dashboard - blocked');
        throw new Error('Admin access required');
      }
      
      const response = await this.makeRequest('/admin/dashboard');
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('Admin dashboard error:', error);
      // Only return mock data for actual admins
      const currentUser = await this.getCurrentUser();
      if (currentUser && currentUser.role === 'admin') {
        return this.getMockAdminDashboard();
      } else {
        return {
          success: false,
          error: 'Admin access required'
        };
      }
    }
  }

  // Get mock admin dashboard (fallback)
  getMockAdminDashboard() {
    return {
      success: true,
      data: {
        totalCustomers: 150,
        totalOrders: 300,
        pendingOrders: 25,
        deliveredOrders: 250,
        totalRevenue: 15000,
        todayOrders: 12,
        monthlyGrowth: 15.5
      }
    };
  }

  // Utility functions
  validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  validatePhone(phone) {
    const regex = /^[6-9]\d{9}$/;
    return regex.test(phone.replace(/\s/g, ''));
  }
}

export default new SimpleAuthService();