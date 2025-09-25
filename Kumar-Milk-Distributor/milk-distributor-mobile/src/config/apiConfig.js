import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Central API Configuration
 * Change the URL here and it will update everywhere in the app
 */
class ApiConfig {
  constructor() {
    // MAIN CONFIGURATION - CHANGE THIS URL TO SWITCH BACKEND
    this.PRODUCTION_URL = 'https://api-kumarmilk.vercel.app/api';
    this.DEVELOPMENT_URL = 'http://localhost:5000/api';
    
    // Auto-detect environment and set base URL
    this.baseURL = this.getBaseURL();
    
    console.log(`🌐 API Config initialized: ${this.baseURL}`);
    console.log(`📱 Environment: ${__DEV__ ? 'Development' : 'Production'}`);
    console.log(`🔧 Platform: ${Platform.OS}`);
  }

  getBaseURL() {
    // 1. Check for environment variable override first
    const envURL = process.env.EXPO_PUBLIC_API_URL;
    if (envURL && envURL !== 'undefined') {
      console.log('📡 Using URL from environment variable:', envURL);
      return this.normalizeURL(envURL);
    }

    // 2. Use production URL for production builds
    if (!__DEV__) {
      console.log('📡 Using production URL:', this.PRODUCTION_URL);
      return this.PRODUCTION_URL;
    }

    // 3. Development mode - use development URL
    let devURL = this.DEVELOPMENT_URL;
    
    // Android emulator cannot reach localhost, use 10.0.2.2
    if (Platform.OS === 'android' && devURL.includes('localhost')) {
      devURL = devURL.replace('localhost', '10.0.2.2');
      console.log('📱 Android emulator detected, using:', devURL);
    }

    console.log('📡 Using development URL:', devURL);
    return devURL;
  }

  normalizeURL(url) {
    // Remove trailing slash
    if (url.endsWith('/')) {
      url = url.replace(/\/$/, '');
    }
    
    // Ensure /api suffix
    if (!url.endsWith('/api')) {
      url = url + '/api';
    }
    
    return url;
  }

  // Get the current base URL
  getURL() {
    return this.baseURL;
  }

  // Update the URL (useful for switching between environments)
  setURL(newURL) {
    this.baseURL = this.normalizeURL(newURL);
    console.log('🔄 API URL updated to:', this.baseURL);
    return this.baseURL;
  }

  // Quick switch between production and development
  switchToProduction() {
    return this.setURL(this.PRODUCTION_URL);
  }

  switchToDevelopment() {
    return this.setURL(this.DEVELOPMENT_URL);
  }

  // Get health check URL
  getHealthURL() {
    return this.baseURL.replace('/api', '/api/health');
  }

  // Test connection to the API
  async testConnection(timeout = 5000) {
    try {
      console.log('🔍 Testing connection to:', this.baseURL);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(this.getHealthURL(), {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('✅ Connection successful to:', this.baseURL);
        return true;
      }
      
      console.log('❌ Connection failed to:', this.baseURL, 'Status:', response.status);
      return false;
    } catch (error) {
      console.log('❌ Connection error to:', this.baseURL, error.message);
      return false;
    }
  }

  // Get configuration info for debugging
  getConfig() {
    return {
      currentURL: this.baseURL,
      productionURL: this.PRODUCTION_URL,
      developmentURL: this.DEVELOPMENT_URL,
      environment: __DEV__ ? 'development' : 'production',
      platform: Platform.OS,
      healthURL: this.getHealthURL()
    };
  }
}

// Export singleton instance
export default new ApiConfig();