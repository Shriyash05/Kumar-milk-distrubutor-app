import Constants from 'expo-constants';
import * as Application from 'expo-application';

class ProductionConfig {
  constructor() {
    this.isProduction = Constants.appOwnership === 'expo' || !__DEV__;
    this.isDevelopment = __DEV__;
    
    // App Information
    this.app = {
      name: 'Kumar Milk Enterprises',
      version: Application.nativeApplicationVersion || '1.0.0',
      buildNumber: Application.nativeBuildVersion || '1',
      bundleId: Application.applicationId || 'com.kumarenterprises.milk',
      environment: this.isProduction ? 'production' : 'development'
    };

    // API Configuration
    this.api = {
      baseUrl: this.getApiBaseUrl(),
      timeout: 30000, // 30 seconds
      retryAttempts: 3,
      retryDelay: 1000, // 1 second
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': `${this.app.name}/${this.app.version} (${Constants.platform?.ios ? 'iOS' : 'Android'})`
      }
    };

    // Security Configuration
    this.security = {
      jwtSecret: process.env.EXPO_PUBLIC_JWT_SECRET || 'kumar-milk-secret-key-2025',
      encryptionEnabled: true,
      biometricAuth: true,
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      maxLoginAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
      passwordRequirements: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true
      },
      httpsOnly: this.isProduction,
      certificatePinning: this.isProduction
    };

    // Database Configuration
    this.database = {
      mongodb: {
        uri: this.getMongoDbUri(),
        options: {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000
        }
      },
      collections: {
        users: 'users',
        products: 'products',
        orders: 'orders',
        sessions: 'sessions',
        logs: 'security_logs'
      }
    };

    // Cache Configuration
    this.cache = {
      enabled: true,
      defaultTtl: 5 * 60 * 1000, // 5 minutes
      maxSize: 100, // Maximum cached items
      strategies: {
        products: 10 * 60 * 1000, // 10 minutes
        userProfile: 30 * 60 * 1000, // 30 minutes
        orders: 2 * 60 * 1000 // 2 minutes
      }
    };

    // Feature Flags
    this.features = {
      biometricLogin: true,
      pushNotifications: true,
      offlineMode: true,
      analytics: this.isProduction,
      crashReporting: this.isProduction,
      socialLogin: false, // Disabled per user request
      geoLocation: true,
      darkMode: true,
      multiLanguage: false,
      voiceOrdering: false
    };

    // Logging Configuration
    this.logging = {
      level: this.isProduction ? 'error' : 'debug',
      console: this.isDevelopment,
      remote: this.isProduction,
      maxLogSize: 1000, // Maximum log entries
      sensitiveDataFiltering: true,
      categories: {
        auth: true,
        api: true,
        security: true,
        performance: this.isProduction,
        user_actions: this.isProduction
      }
    };

    // Performance Configuration
    this.performance = {
      enableHermes: true,
      enableNewArchitecture: false,
      imageOptimization: true,
      lazyLoading: true,
      memoryWarningThreshold: 0.8, // 80% memory usage warning
      networkTimeoutWarning: 10000, // 10 seconds
      renderingOptimization: true
    };

    // UI/UX Configuration
    this.ui = {
      theme: {
        primary: '#007AFF',
        secondary: '#5856D6',
        success: '#4CAF50',
        error: '#F44336',
        warning: '#FF9800',
        info: '#2196F3',
        light: '#F8F9FA',
        dark: '#212529'
      },
      animations: {
        enabled: true,
        duration: 300,
        easing: 'ease-in-out'
      },
      feedback: {
        haptics: true,
        toasts: true,
        loadingIndicators: true
      },
      accessibility: {
        enabled: true,
        announcements: true,
        largeText: true,
        highContrast: false
      }
    };

    // Business Logic Configuration
    this.business = {
      currency: 'INR',
      locale: 'en-IN',
      timezone: 'Asia/Kolkata',
      deliveryRadius: 50, // km
      minimumOrderAmount: 50, // INR
      maxOrderQuantity: 50, // liters
      deliveryHours: {
        start: '06:00',
        end: '22:00'
      },
      subscriptionTypes: ['daily', 'weekly', 'monthly'],
      paymentMethods: ['cash', 'upi', 'card'],
      orderCancellationWindow: 2 * 60 * 60 * 1000 // 2 hours
    };

    // Third-party Integrations
    this.integrations = {
      pushNotifications: {
        enabled: this.features.pushNotifications,
        provider: 'expo-notifications'
      },
      analytics: {
        enabled: this.features.analytics,
        provider: 'expo-analytics'
      },
      crashReporting: {
        enabled: this.features.crashReporting,
        provider: 'expo-crash-reporting'
      },
      maps: {
        enabled: this.features.geoLocation,
        provider: 'react-native-maps'
      }
    };

    // Error Handling
    this.errorHandling = {
      globalHandler: true,
      fallbackUI: true,
      automaticRetry: true,
      userFriendlyMessages: true,
      reportToService: this.isProduction,
      categories: {
        network: 'Network connection error. Please check your internet connection.',
        auth: 'Authentication error. Please login again.',
        permission: 'Permission denied. Please check app permissions.',
        server: 'Server error. Please try again later.',
        validation: 'Invalid input. Please check your data.',
        generic: 'Something went wrong. Please try again.'
      }
    };

    // Development Tools (only in development)
    this.devTools = this.isDevelopment ? {
      debugMode: true,
      networkLogging: true,
      performanceMonitoring: true,
      stateInspector: true,
      hotReload: true
    } : {};
  }

  // Get API base URL based on environment
  getApiBaseUrl() {
    if (this.isProduction) {
      return process.env.EXPO_PUBLIC_API_PRODUCTION_URL || 'https://api.kumarenterprises.com/api';
    } else {
      return process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
    }
  }

  // Get MongoDB URI based on environment
  getMongoDbUri() {
    if (this.isProduction) {
      return process.env.EXPO_PUBLIC_MONGODB_PRODUCTION_URI;
    } else {
      return process.env.EXPO_PUBLIC_MONGODB_URI || 'mongodb://localhost:27017/milk-distributor';
    }
  }

  // Validate configuration
  validateConfig() {
    const errors = [];

    if (!this.security.jwtSecret || this.security.jwtSecret.length < 32) {
      errors.push('JWT secret must be at least 32 characters long');
    }

    if (this.isProduction) {
      if (!this.getMongoDbUri()) {
        errors.push('Production MongoDB URI is required');
      }

      if (!this.api.baseUrl.startsWith('https://')) {
        errors.push('Production API must use HTTPS');
      }
    }

    if (this.api.timeout < 5000) {
      errors.push('API timeout should be at least 5 seconds');
    }

    if (errors.length > 0) {
      console.error('Configuration Validation Errors:', errors);
      return { valid: false, errors };
    }

    return { valid: true, errors: [] };
  }

  // Get environment-specific settings
  getEnvironmentSettings() {
    return {
      isProduction: this.isProduction,
      isDevelopment: this.isDevelopment,
      apiBaseUrl: this.api.baseUrl,
      features: this.features,
      logging: this.logging,
      security: {
        encryptionEnabled: this.security.encryptionEnabled,
        biometricAuth: this.security.biometricAuth,
        httpsOnly: this.security.httpsOnly
      }
    };
  }

  // Get configuration for specific module
  getModuleConfig(moduleName) {
    const moduleConfigs = {
      api: this.api,
      security: this.security,
      database: this.database,
      cache: this.cache,
      features: this.features,
      logging: this.logging,
      performance: this.performance,
      ui: this.ui,
      business: this.business,
      integrations: this.integrations,
      errorHandling: this.errorHandling
    };

    return moduleConfigs[moduleName] || null;
  }

  // Update configuration (for runtime changes)
  updateConfig(moduleName, updates) {
    if (this[moduleName]) {
      this[moduleName] = { ...this[moduleName], ...updates };
      console.log(`Configuration updated for module: ${moduleName}`);
      return true;
    }
    return false;
  }

  // Get all configuration
  getFullConfig() {
    return {
      app: this.app,
      api: this.api,
      security: this.security,
      database: this.database,
      cache: this.cache,
      features: this.features,
      logging: this.logging,
      performance: this.performance,
      ui: this.ui,
      business: this.business,
      integrations: this.integrations,
      errorHandling: this.errorHandling,
      devTools: this.devTools
    };
  }
}

export default new ProductionConfig();