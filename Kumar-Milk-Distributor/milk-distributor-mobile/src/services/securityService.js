import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as Network from 'expo-network';
import * as Application from 'expo-application';
import Constants from 'expo-constants';

// Use a simple encryption method for Expo compatibility
class SimpleEncryption {
  constructor(key) {
    this.key = key;
  }

  encrypt(text) {
    try {
      // Simple XOR encryption for demo purposes
      const textBytes = (text || '').split('').map(char => char.charCodeAt(0));
      const keyBytes = (this.key || '').split('').map(char => char.charCodeAt(0));
      
      const encrypted = (textBytes || []).map((byte, i) => 
        byte ^ (keyBytes[i % (keyBytes.length || 1)] || 0)
      );
      
      return btoa(String.fromCharCode(...encrypted));
    } catch (error) {
      console.warn('Simple encryption failed, using base64:', error);
      return btoa(text);
    }
  }

  decrypt(encryptedText) {
    try {
      const encrypted = (atob(encryptedText) || '').split('').map(char => char.charCodeAt(0));
      const keyBytes = (this.key || '').split('').map(char => char.charCodeAt(0));
      
      const decrypted = (encrypted || []).map((byte, i) => 
        byte ^ (keyBytes[i % (keyBytes.length || 1)] || 0)
      );
      
      return String.fromCharCode(...decrypted);
    } catch (error) {
      console.warn('Simple decryption failed, using base64:', error);
      return atob(encryptedText);
    }
  }
}

class SecurityService {
  constructor() {
    this.encryptionKey = this.generateEncryptionKey();
    this.maxLoginAttempts = 5;
    this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
    this.tokenRefreshInterval = 25 * 60 * 1000; // 25 minutes
    this.deviceId = null;
    
    this.initializeDeviceId();
  }

  // Generate a secure encryption key
  generateEncryptionKey() {
    const baseKey = process.env.EXPO_PUBLIC_JWT_SECRET || 'kumar-milk-secret-key-2025';
    const deviceSpecific = Constants.sessionId || 'default-session';
    // Use simple hash for Expo compatibility
    return (baseKey + deviceSpecific).slice(0, 32);
  }

  // Initialize device ID for tracking
  async initializeDeviceId() {
    try {
      let deviceId = await SecureStore.getItemAsync('device_id');
      if (!deviceId) {
        // Generate simple UUID fallback for Expo compatibility
        deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        await SecureStore.setItemAsync('device_id', deviceId);
      }
      this.deviceId = deviceId;
    } catch (error) {
      console.error('Device ID initialization error:', error);
      this.deviceId = 'fallback-device-id-' + Date.now();
    }
  }

  // Encrypt sensitive data
  encryptData(data) {
    try {
      if (!this.simpleEncryption) {
        this.simpleEncryption = new SimpleEncryption(this.encryptionKey);
      }
      const encrypted = this.simpleEncryption.encrypt(JSON.stringify(data));
      return encrypted;
    } catch (error) {
      console.warn('Encryption failed, storing as base64:', error);
      // Fallback to base64 encoding
      return btoa(JSON.stringify(data));
    }
  }

  // Decrypt sensitive data
  decryptData(encryptedData) {
    try {
      if (!this.simpleEncryption) {
        this.simpleEncryption = new SimpleEncryption(this.encryptionKey);
      }
      const decrypted = this.simpleEncryption.decrypt(encryptedData);
      return JSON.parse(decrypted);
    } catch (error) {
      console.warn('Decryption failed, trying base64:', error);
      // Fallback to base64 decoding
      try {
        return JSON.parse(atob(encryptedData));
      } catch (fallbackError) {
        console.error('All decryption methods failed:', fallbackError);
        throw new Error('Failed to decrypt data');
      }
    }
  }

  // Securely store sensitive data
  async storeSecureData(key, data) {
    try {
      const encryptedData = this.encryptData(data);
      await SecureStore.setItemAsync(key, encryptedData);
    } catch (error) {
      console.error('Secure store error:', error);
      throw new Error('Failed to store secure data');
    }
  }

  // Retrieve and decrypt sensitive data
  async getSecureData(key) {
    try {
      const encryptedData = await SecureStore.getItemAsync(key);
      if (!encryptedData) return null;
      
      return this.decryptData(encryptedData);
    } catch (error) {
      console.error('Secure retrieve error:', error);
      return null;
    }
  }

  // Validate password strength
  validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasNonalphas = /\W/.test(password);

    const score = [
      password.length >= minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasNonalphas
    ].reduce((acc, curr) => acc + curr, 0);

    return {
      isValid: score >= 3 && password.length >= minLength,
      score: score,
      suggestions: [
        password.length < minLength ? `Password must be at least ${minLength} characters` : null,
        !hasUpperCase ? 'Add uppercase letters' : null,
        !hasLowerCase ? 'Add lowercase letters' : null,
        !hasNumbers ? 'Add numbers' : null,
        !hasNonalphas ? 'Add special characters' : null,
      ].filter(Boolean)
    };
  }

  // Rate limiting for login attempts
  async checkRateLimit(identifier) {
    try {
      const key = `rate_limit_${identifier}`;
      const attempts = await this.getSecureData(key);
      
      if (!attempts) return { allowed: true, remaining: this.maxLoginAttempts };

      const now = Date.now();
      
      // Remove old attempts (older than lockout duration)
      const validAttempts = attempts.filter(
        attempt => now - attempt.timestamp < this.lockoutDuration
      );

      if (validAttempts.length >= this.maxLoginAttempts) {
        const oldestAttempt = Math.min(...(validAttempts || []).map(a => a?.timestamp || 0));
        const timeUntilReset = this.lockoutDuration - (now - oldestAttempt);
        
        return {
          allowed: false,
          remaining: 0,
          resetTime: timeUntilReset,
          lockedUntil: new Date(now + timeUntilReset)
        };
      }

      return {
        allowed: true,
        remaining: this.maxLoginAttempts - validAttempts.length
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      return { allowed: true, remaining: this.maxLoginAttempts };
    }
  }

  // Record failed login attempt
  async recordFailedAttempt(identifier) {
    try {
      const key = `rate_limit_${identifier}`;
      const attempts = await this.getSecureData(key) || [];
      
      attempts.push({
        timestamp: Date.now(),
        deviceId: this.deviceId,
        ip: await this.getDeviceIP()
      });

      // Keep only recent attempts
      const recentAttempts = attempts.filter(
        attempt => Date.now() - attempt.timestamp < this.lockoutDuration
      );

      await this.storeSecureData(key, recentAttempts);
    } catch (error) {
      console.error('Record failed attempt error:', error);
    }
  }

  // Clear rate limiting after successful login
  async clearRateLimit(identifier) {
    try {
      const key = `rate_limit_${identifier}`;
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Clear rate limit error:', error);
    }
  }

  // Get device IP for security logging
  async getDeviceIP() {
    try {
      const networkState = await Network.getNetworkStateAsync();
      return networkState.details?.ipAddress || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  // Generate secure session token
  async generateSessionToken(userId, role) {
    try {
      const sessionData = {
        userId,
        role,
        deviceId: this.deviceId,
        timestamp: Date.now(),
        expires: Date.now() + this.sessionTimeout,
        ip: await this.getDeviceIP(),
        appVersion: Application.nativeApplicationVersion || '1.0.0'
      };

      const token = this.encryptData(sessionData);
      return token;
    } catch (error) {
      console.error('Session token generation error:', error);
      throw new Error('Failed to generate session token');
    }
  }

  // Validate session token
  async validateSessionToken(token) {
    try {
      if (!token) return { valid: false, reason: 'No token provided' };

      const sessionData = this.decryptData(token);
      const now = Date.now();

      // Check expiration
      if (now > sessionData.expires) {
        return { valid: false, reason: 'Token expired' };
      }

      // Check device ID
      if (sessionData.deviceId !== this.deviceId) {
        return { valid: false, reason: 'Invalid device' };
      }

      // Check if token needs refresh
      const needsRefresh = now > (sessionData.timestamp + this.tokenRefreshInterval);

      return {
        valid: true,
        sessionData,
        needsRefresh
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return { valid: false, reason: 'Invalid token format' };
    }
  }

  // Sanitize input to prevent injection attacks
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .replace(/[;]/g, '') // Remove semicolons
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .trim();
  }

  // Validate email format with strict rules
  validateEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const sanitizedEmail = this.sanitizeInput(email);
    
    return {
      isValid: emailRegex.test(sanitizedEmail) && sanitizedEmail.length <= 254,
      sanitized: sanitizedEmail
    };
  }

  // Validate phone number (Indian format)
  validatePhone(phone) {
    const phoneRegex = /^[6-9]\d{9}$/;
    const sanitizedPhone = this.sanitizeInput(phone).replace(/\D/g, '');
    
    return {
      isValid: phoneRegex.test(sanitizedPhone),
      sanitized: sanitizedPhone
    };
  }

  // Generate secure API key for requests
  generateAPIKey(timestamp = Date.now()) {
    const data = `${this.deviceId}:${timestamp}:${this.encryptionKey}`;
    // Simple hash for Expo compatibility
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Log security events
  async logSecurityEvent(event, details = {}) {
    try {
      const securityLog = {
        event,
        timestamp: Date.now(),
        deviceId: this.deviceId,
        ip: await this.getDeviceIP(),
        userAgent: Constants.platform,
        appVersion: Application.nativeApplicationVersion,
        ...details
      };

      const logs = await this.getSecureData('security_logs') || [];
      logs.push(securityLog);

      // Keep only last 50 logs to prevent storage bloat
      const recentLogs = logs.slice(-50);
      await this.storeSecureData('security_logs', recentLogs);

      // For critical events, you might want to send to server
      if (['login_failure', 'account_lockout', 'suspicious_activity'].includes(event)) {
        console.warn('Security Event:', securityLog);
      }
    } catch (error) {
      console.error('Security logging error:', error);
    }
  }

  // Check for rooted/jailbroken device (basic check)
  async checkDeviceSecurity() {
    try {
      // Basic checks - in production, use a dedicated library like react-native-jailbreak-detector
      const warnings = [];

      // Check if running in development mode
      if (__DEV__) {
        warnings.push('Running in development mode');
      }

      // Check for debugging
      if (Constants.debugMode) {
        warnings.push('Debug mode enabled');
      }

      return {
        isSecure: warnings.length === 0,
        warnings
      };
    } catch (error) {
      console.error('Device security check error:', error);
      return { isSecure: false, warnings: ['Security check failed'] };
    }
  }

  // Secure logout - clear all sensitive data
  async secureLogout() {
    try {
      const keysToDelete = [
        'userData',
        'authToken',
        'userRole',
        'loginTimestamp',
        'session_token'
      ];

      await Promise.all(keysToDelete.map(key => 
        SecureStore.deleteItemAsync(key).catch(() => {})
      ));

      await this.logSecurityEvent('logout', { timestamp: Date.now() });
    } catch (error) {
      console.error('Secure logout error:', error);
    }
  }

  // Generate CSRF token for API requests
  generateCSRFToken() {
    const data = `${this.deviceId}:${Date.now()}:${Math.random()}`;
    // Simple hash for CSRF token
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  // Validate API response integrity
  validateResponseIntegrity(response, expectedChecksum) {
    try {
      const responseData = JSON.stringify(response);
      let hash = 0;
      for (let i = 0; i < responseData.length; i++) {
        const char = responseData.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      const responseChecksum = Math.abs(hash).toString(36);
      return responseChecksum === expectedChecksum;
    } catch (error) {
      console.error('Response integrity check error:', error);
      return false;
    }
  }
}

export default new SecurityService();