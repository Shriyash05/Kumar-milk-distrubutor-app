import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Resolve API base URL with sensible mobile defaults
function resolveBaseUrl() {
  let base = process.env.EXPO_PUBLIC_API_BASE_URL || Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:5000/api';
  // Normalize trailing slash
  if (base.endsWith('/')) base = base.replace(/\/$/, '');
  // Ensure /api suffix
  if (!base.endsWith('/api')) base = base + '/api';
  // Android emulator cannot reach localhost; use 10.0.2.2
  if (Platform.OS === 'android' && base.includes('http://localhost')) {
    base = base.replace('http://localhost', 'http://10.0.2.2');
  }
  return base;
}

const API_BASE_URL = resolveBaseUrl();

// Log the current API URL for debugging
console.log('API Base URL:', API_BASE_URL);

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async getAuthToken() {
    try {
      // Try both token keys for compatibility
      let token = await SecureStore.getItemAsync('token');
      if (!token) {
        token = await SecureStore.getItemAsync('authToken');
      }
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  async makeRequest(endpoint, options = {}, attempt = 0) {
    const url = `${this.baseURL}${endpoint}`;
    const token = await this.getAuthToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      timeout: 10000, // 10 second timeout
      ...options,
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      console.log(`Making API request to: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText || 'API request failed' };
        }
        const err = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        err.status = response.status;
        throw err;
      }

      const data = await response.json();
      console.log(`API request successful: ${url}`);
      return data;
    } catch (error) {
      console.error(`API request error for ${url}:`, error);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please check your internet connection.');
      }
      
      if (error.message === 'Network request failed') {
        // Retry transient network issues up to 2 times with backoff
        if (attempt < 2) {
          const backoffMs = 500 * Math.pow(2, attempt);
          await new Promise(r => setTimeout(r, backoffMs));
          return this.makeRequest(endpoint, options, attempt + 1);
        }
        throw new Error('Unable to connect to server. Please check your internet connection and try again.');
      }
      
      // Retry 5xx errors
      if (error.status && error.status >= 500 && attempt < 2) {
        const backoffMs = 500 * Math.pow(2, attempt);
        await new Promise(r => setTimeout(r, backoffMs));
        return this.makeRequest(endpoint, options, attempt + 1);
      }
      
      throw error;
    }
  }

  // Auth endpoints
  async login(email, password) {
    return this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData) {
    return this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    return this.makeRequest('/auth/logout', {
      method: 'POST',
    });
  }

  // User endpoints
  async getUserProfile() {
    return this.makeRequest('/user/profile');
  }

  async updateUserProfile(userData) {
    return this.makeRequest('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // Order endpoints
  async getOrders(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/orders?${queryString}` : '/orders';
    return this.makeRequest(endpoint);
  }

  async createOrder(orderData) {
    return this.makeRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getOrderById(orderId) {
    return this.makeRequest(`/orders/${orderId}`);
  }

  async updateOrderStatus(orderId, status) {
    return this.makeRequest(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async cancelOrder(orderId) {
    return this.makeRequest(`/orders/${orderId}/cancel`, {
      method: 'PUT',
    });
  }

  // Product endpoints
  async getProducts() {
    return this.makeRequest('/products');
  }

  async createProduct(productData) {
    return this.makeRequest('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(productId, productData) {
    return this.makeRequest(`/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(productId) {
    return this.makeRequest(`/products/${productId}`, {
      method: 'DELETE',
    });
  }

  // Admin endpoints
  async getDashboardStats() {
    return this.makeRequest('/admin/dashboard');
  }

  async getAllUsers() {
    return this.makeRequest('/admin/users');
  }

  async updateUserRole(userId, role) {
    return this.makeRequest(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  // Customer endpoints
  async getCustomerDashboard() {
    return this.makeRequest('/customer/dashboard');
  }

  async getCustomerOrders() {
    return this.makeRequest('/customer/orders');
  }

  async placeOrder(orderData) {
    return this.makeRequest('/customer/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  // AI Analytics endpoints
  async getAnalyticsReport(dateRange = 'week', filters = {}) {
    const queryParams = new URLSearchParams({
      dateRange,
      customFilters: JSON.stringify(filters)
    });
    return this.makeRequest(`/admin/analytics/sales-report?${queryParams}`);
  }

  async processAIQuery(query) {
    return this.makeRequest('/admin/analytics/ai-query', {
      method: 'POST',
      body: JSON.stringify({ query })
    });
  }

  async getDashboardInsights() {
    return this.makeRequest('/admin/analytics/dashboard-insights');
  }

  async generateCustomReport(options = {}) {
    return this.makeRequest('/admin/analytics/generate-report', {
      method: 'POST',
      body: JSON.stringify(options)
    });
  }

  // Mobile Orders (for admin)
  async getMobileOrders(filters = {}) {
    const queryParams = new URLSearchParams(filters);
    const endpoint = queryParams.toString() ? `/admin/mobile-orders?${queryParams}` : '/admin/mobile-orders';
    return this.makeRequest(endpoint);
  }

  async updateMobileOrderStatus(orderId, statusUpdate) {
    return this.makeRequest(`/admin/mobile-orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusUpdate)
    });
  }

  // Inventory management
  async getInventoryForDate(date) {
    return this.makeRequest(`/admin/inventory/${date}`);
  }

  async setInventoryForDate(date, inventoryData) {
    return this.makeRequest('/admin/inventory', {
      method: 'POST',
      body: JSON.stringify({ date, ...inventoryData })
    });
  }

  // Reports
  async getMonthlyReport() {
    return this.makeRequest('/admin/monthly-summary');
  }

  async getDailyDeliveryCSV() {
    return this.makeRequest('/admin/deliveries/csv');
  }

  // Health check and connection status
  async healthCheck() {
    try {
      const response = await fetch(this.baseURL.replace('/api', ''), {
        method: 'GET',
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      console.log('Health check failed:', error.message);
      return false;
    }
  }

  async getConnectionStatus() {
    try {
      const isHealthy = await this.healthCheck();
      return {
        connected: isHealthy,
        timestamp: new Date().toISOString(),
        baseURL: this.baseURL
      };
    } catch (error) {
      return {
        connected: false,
        timestamp: new Date().toISOString(),
        baseURL: this.baseURL,
        error: error.message
      };
    }
  }
}

export default new ApiService();
