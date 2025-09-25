import * as Network from 'expo-network';
import Constants from 'expo-constants';

class NetworkUtils {
  static async getLocalIPAddress() {
    try {
      // Try to get the local IP address using Expo Network
      const networkState = await Network.getNetworkStateAsync();
      
      if (networkState.isConnected) {
        // For development, try to extract IP from debugger host
        const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
        
        if (debuggerHost) {
          // Extract IP from debugger host (format: "192.168.1.100:19000")
          const ip = debuggerHost.split(':')[0];
          if (this.isValidIP(ip)) {
            console.log('📡 Found IP from debugger host:', ip);
            return ip;
          }
        }

        // Try to get IP from Constants
        const hostUri = Constants.expoConfig?.hostUri;
        if (hostUri) {
          const ip = hostUri.split(':')[0];
          if (this.isValidIP(ip)) {
            console.log('📡 Found IP from host URI:', ip);
            return ip;
          }
        }
      }

      // Fallback: return localhost for emulator/simulator
      console.log('📡 Using localhost as fallback');
      return 'localhost';
      
    } catch (error) {
      console.warn('⚠️ Failed to detect local IP:', error.message);
      return 'localhost';
    }
  }

  static isValidIP(ip) {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  }

  static async buildApiUrl(port = 5000) {
    const ip = await this.getLocalIPAddress();
    const baseUrl = `http://${ip}:${port}/api`;
    console.log('🌐 Dynamic API URL:', baseUrl);
    return baseUrl;
  }

  static async getExpotunnel() {
    try {
      // Check if we're in Expo development mode with tunnel
      const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
      
      if (debuggerHost && debuggerHost.includes('exp://')) {
        // Extract the tunnel URL
        const tunnelId = debuggerHost.match(/exp:\/\/([^.]+)/)?.[1];
        if (tunnelId) {
          return `https://${tunnelId}.tunnel.expo.dev/api`;
        }
      }
      
      return null;
    } catch (error) {
      console.warn('⚠️ Failed to get Expo tunnel URL:', error.message);
      return null;
    }
  }

  static async testConnection(url, timeout = 5000) {
    try {
      console.log('🔍 Testing connection to:', url);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${url}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);
      
      if (response.ok || response.status === 404) {
        // 404 is acceptable - server is responding, just no health endpoint
        console.log('✅ Connection successful to:', url);
        return true;
      }
      
      console.log('❌ Connection failed to:', url, 'Status:', response.status);
      return false;
    } catch (error) {
      console.log('❌ Connection error to:', url, error.message);
      return false;
    }
  }

  static async findWorkingApiUrl() {
    const port = 5000;
    const possibleUrls = [];

    // 1. Try dynamic IP detection
    try {
      const dynamicUrl = await this.buildApiUrl(port);
      possibleUrls.push(dynamicUrl);
    } catch (error) {
      console.warn('Failed to build dynamic URL:', error.message);
    }

    // 2. Add localhost
    possibleUrls.push(`http://localhost:${port}/api`);

    // 3. Add common local network IPs
    const commonIPs = ['192.168.1.1', '192.168.0.1', '10.0.0.1', '172.16.0.1'];
    for (let i = 1; i <= 255; i++) {
      possibleUrls.push(`http://192.168.1.${i}:${port}/api`);
      possibleUrls.push(`http://192.168.0.${i}:${port}/api`);
      if (i <= 50) { // Limit to first 50 for performance
        possibleUrls.push(`http://10.0.0.${i}:${port}/api`);
      }
    }

    // 4. Try Expo tunnel
    try {
      const tunnelUrl = await this.getExpotunnel();
      if (tunnelUrl) {
        possibleUrls.unshift(tunnelUrl); // Add to front for priority
      }
    } catch (error) {
      console.warn('Failed to get tunnel URL:', error.message);
    }

    console.log('🔍 Testing', possibleUrls.length, 'possible API URLs...');

    // Test URLs in batches to avoid overwhelming the network
    const batchSize = 10;
    for (let i = 0; i < possibleUrls.length; i += batchSize) {
      const batch = possibleUrls.slice(i, i + batchSize);
      const promises = batch.map(url => 
        this.testConnection(url, 3000).then(works => ({ url, works }))
      );

      try {
        const results = await Promise.allSettled(promises);
        for (const result of results) {
          if (result.status === 'fulfilled' && result.value.works) {
            console.log('🎯 Found working API URL:', result.value.url);
            return result.value.url;
          }
        }
      } catch (error) {
        console.warn('Batch testing failed:', error.message);
      }
    }

    console.warn('⚠️ No working API URL found, falling back to localhost');
    return `http://localhost:${port}/api`;
  }
}

export default NetworkUtils;