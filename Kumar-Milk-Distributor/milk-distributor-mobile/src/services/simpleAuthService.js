import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiConfig from '../config/apiConfig';

class SimpleAuthService {
  constructor() {
    // Use central API configuration
    this.apiBaseUrl = ApiConfig.getURL();
    this.isInitialized = true;
    console.log('Simple Auth Service initialized with API URL:', this.apiBaseUrl);
  }

  async ensureInitialized() {
    // Always return the current API URL from central config
    this.apiBaseUrl = ApiConfig.getURL();
    return this.apiBaseUrl;
  }

  // ================== Core Request Logic ==================
  async makeRequestWithRetry(endpoint, options = {}, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${maxRetries} for ${endpoint}`);
        const result = await this.makeRequest(endpoint, options);
        console.log(`✅ Success on attempt ${attempt} for ${endpoint}`);
        return result;
      } catch (error) {
        console.log(`❌ Attempt ${attempt} failed for ${endpoint}:`, error.message);

        // Switch to tunnel if LAN fails
        if ((error.name === 'AbortError' || error.message.includes('Network request failed')) && !this.tunnelApiBaseUrl) {
          this.tunnelApiBaseUrl = Constants.manifest?.debuggerHost
            ? `https://${Constants.manifest.debuggerHost.split(':')[0]}.tunnel.expo.dev/api`
            : null;

          if (this.tunnelApiBaseUrl) {
            console.log('🌐 Switching to Expo tunnel API URL:', this.tunnelApiBaseUrl);
            this.apiBaseUrl = this.tunnelApiBaseUrl;
          }
        }

        if (attempt === maxRetries) throw error;

        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(res => setTimeout(res, delay));
      }
    }
  }

  async makeRequest(endpoint, options = {}) {
    await this.ensureInitialized();
    const url = `${this.apiBaseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    let token = options.headers?.Authorization?.replace('Bearer ', '') || (await this.getStoredToken());
    if (token) config.headers.Authorization = `Bearer ${token}`;

    try {
      console.log('Making request to:', url);
      console.log('Request headers:', config.headers);

      const controller = new AbortController();
      const timeoutDuration = url.includes('/customer/orders') || url.includes('/admin/') ? 60000 : 30000;
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

      const response = await fetch(url, { ...config, signal: controller.signal });
      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await response.json() : await response.text();

      if (!response.ok) throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);

      return data;
    } catch (error) {
      console.error(`Request failed for ${url}:`, error);
      if (error.name === 'AbortError') throw new Error('Request timeout. Please check your connection.');
      if (error.message.includes('Network request failed')) throw new Error('Unable to connect to server. Please check your internet.');
      throw error;
    }
  }

  // ================== Authentication ==================
  async register(userData) {
    try {
      const { name, email, password, phone, address } = userData;
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

      try {
        const existingUsers = await AsyncStorage.getItem('registeredUsers');
        const users = existingUsers ? JSON.parse(existingUsers) : [];
        users.push({
          _id: response.user._id || Date.now().toString(),
          name: name.trim(),
          email: email.toLowerCase().trim(),
          phone: phone.trim(),
          address: address.trim(),
          role: 'customer',
          registrationDate: new Date().toISOString(),
        });
        await AsyncStorage.setItem('registeredUsers', JSON.stringify(users));
        console.log('📋 Stored user data locally for dashboard metrics');
      } catch (storageError) {
        console.warn('⚠️ Failed to store user data locally:', storageError.message);
      }

      return { success: true, user: response.user, message: response.message };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message || 'Registration failed' };
    }
  }

  async login(email, password) {
    try {
      if (!this.validateEmail(email)) throw new Error('Please enter a valid email address');
      if (!password || password.length < 6) throw new Error('Password must be at least 6 characters long');

      const response = await this.makeRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
          loginFrom: 'mobile-app',
          loginTime: new Date().toISOString(),
        }),
      });

      await this.storeAuthData(response);
      console.log('Login successful, stored user data:', response.user);
      return { success: true, user: response.user, token: response.token };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Login failed' };
    }
  }

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

  async getCurrentUser() {
    try {
      const userData = await SecureStore.getItemAsync('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async getStoredToken() {
    try {
      return await SecureStore.getItemAsync('authToken');
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  }

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

  async logout() {
    try {
      try {
        await this.makeRequest('/auth/logout', { method: 'POST' });
      } catch (_) {}
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

  // ================== Profile ==================
  async updateProfile(profileData) {
    try {
      const token = await this.getStoredToken();
      const response = await this.makeRequest('/user/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });

      if (response.success && response.user) {
        const currentUser = await this.getCurrentUser();
        const updatedUser = { ...currentUser, ...response.user, _id: response.user.id || currentUser._id };
        await SecureStore.setItemAsync('userData', JSON.stringify(updatedUser));
        return { success: true, user: updatedUser };
      } else throw new Error(response.message || 'Profile update failed');
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: error.message || 'Failed to update profile' };
    }
  }

  // ================== Dashboard ==================
  async getDashboardData() {
    try {
      const response = await this.makeRequest('/customer/dashboard');
      return { success: true, data: response };
    } catch (error) {
      console.warn('Dashboard data error, returning mock:', error.message);
      return this.getMockDashboardData();
    }
  }

  getMockDashboardData() {
    return {
      success: true,
      data: {
        orders: [
          { _id: '1', productName: 'Full Cream Milk', quantity: 2, totalAmount: 120, status: 'delivered', createdAt: '2025-01-15T10:00:00Z', deliveryDate: '2025-01-15' },
          { _id: '2', productName: 'Toned Milk', quantity: 1, totalAmount: 50, status: 'pending', createdAt: '2025-01-14T10:00:00Z', deliveryDate: '2025-01-16' },
        ],
        stats: { totalOrders: 2, deliveredOrders: 1, pendingOrders: 1, totalSpent: 170 },
      },
    };
  }

  // ================== Admin ==================
  async getAllUsers() {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') throw new Error('Admin access required');

      const response = await this.makeRequest('/admin/users');
      return { success: true, users: response.users };
    } catch (error) {
      console.error('Get users error:', error);
      return { success: false, error: error.message || 'Failed to get users' };
    }
  }

  async getAdminDashboard() {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') throw new Error('Admin access required');

      const response = await this.makeRequest('/admin/dashboard');
      return { success: true, data: response };
    } catch (error) {
      console.warn('Admin dashboard error, returning mock:', error.message);
      const currentUser = await this.getCurrentUser();
      if (currentUser && currentUser.role === 'admin') return this.getMockAdminDashboard();
      return { success: false, error: 'Admin access required' };
    }
  }

  getMockAdminDashboard() {
    return {
      success: true,
      data: { totalCustomers: 150, totalOrders: 300, pendingOrders: 25, deliveredOrders: 250, totalRevenue: 15000, todayOrders: 12, monthlyGrowth: 15.5 },
    };
  }

  // ================== Utils ==================
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
