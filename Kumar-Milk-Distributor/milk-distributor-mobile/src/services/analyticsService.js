/**
 * Analytics Service for Kumar Milk Distributor Mobile App
 * Tracks user interactions, app usage, and business metrics
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

class AnalyticsService {
  constructor() {
    this.isEnabled = true;
    this.sessionId = null;
    this.userId = null;
    this.events = [];
    this.maxEventsInMemory = 100;
    
    this.initialize();
  }

  async initialize() {
    try {
      // Generate session ID
      this.sessionId = this.generateSessionId();
      
      // Get device info
      this.deviceInfo = await this.getDeviceInfo();
      
      // Load persisted events
      await this.loadPersistedEvents();
      
      console.log('📊 Analytics Service initialized');
    } catch (error) {
      console.error('Analytics initialization error:', error);
    }
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getDeviceInfo() {
    return {
      deviceId: Application.androidId || await Application.getIosIdForVendorAsync(),
      deviceType: Device.deviceType,
      deviceName: Device.deviceName,
      osName: Device.osName,
      osVersion: Device.osVersion,
      brand: Device.brand,
      manufacturer: Device.manufacturer,
      modelName: Device.modelName,
      appVersion: Application.nativeApplicationVersion || '1.0.0',
      buildNumber: Application.nativeBuildVersion || '1',
      expoVersion: Constants.expoVersion,
    };
  }

  setUserId(userId) {
    this.userId = userId;
  }

  // Event tracking methods
  async trackEvent(eventName, properties = {}) {
    if (!this.isEnabled) return;

    try {
      const event = {
        id: this.generateEventId(),
        name: eventName,
        properties: {
          ...properties,
          timestamp: new Date().toISOString(),
          sessionId: this.sessionId,
          userId: this.userId,
          ...this.deviceInfo
        }
      };

      this.events.push(event);
      
      // Keep only recent events in memory
      if (this.events.length > this.maxEventsInMemory) {
        this.events = this.events.slice(-this.maxEventsInMemory);
      }

      // Persist events
      await this.persistEvents();

      console.log('📊 Event tracked:', eventName, properties);
    } catch (error) {
      console.error('Event tracking error:', error);
    }
  }

  generateEventId() {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // User behavior tracking
  async trackUserLogin(userRole, method = 'email') {
    await this.trackEvent('user_login', {
      role: userRole,
      method: method
    });
  }

  async trackUserLogout() {
    await this.trackEvent('user_logout');
  }

  async trackScreenView(screenName) {
    await this.trackEvent('screen_view', {
      screen_name: screenName
    });
  }

  async trackOrderPlaced(orderData) {
    await this.trackEvent('order_placed', {
      order_id: orderData.id,
      total_amount: orderData.totalAmount,
      item_count: orderData.items?.length || 1,
      delivery_date: orderData.deliveryDate,
      payment_method: orderData.paymentMethod || 'cod'
    });
  }

  async trackOrderStatusChanged(orderId, oldStatus, newStatus) {
    await this.trackEvent('order_status_changed', {
      order_id: orderId,
      old_status: oldStatus,
      new_status: newStatus
    });
  }

  async trackProductViewed(productId, productName) {
    await this.trackEvent('product_viewed', {
      product_id: productId,
      product_name: productName
    });
  }

  async trackCartAction(action, productId, quantity) {
    await this.trackEvent('cart_action', {
      action: action, // 'add', 'remove', 'update'
      product_id: productId,
      quantity: quantity
    });
  }

  async trackAdminAction(action, details = {}) {
    await this.trackEvent('admin_action', {
      action: action,
      ...details
    });
  }

  async trackError(errorType, errorMessage, context = {}) {
    await this.trackEvent('app_error', {
      error_type: errorType,
      error_message: errorMessage,
      context: context
    });
  }

  async trackPerformance(metricName, value, unit = 'ms') {
    await this.trackEvent('performance_metric', {
      metric_name: metricName,
      value: value,
      unit: unit
    });
  }

  // Business analytics
  async trackRevenue(amount, currency = 'INR', source = 'order') {
    await this.trackEvent('revenue', {
      amount: amount,
      currency: currency,
      source: source
    });
  }

  async trackCustomerAction(action, details = {}) {
    await this.trackEvent('customer_action', {
      action: action,
      ...details
    });
  }

  // Data persistence
  async persistEvents() {
    try {
      await AsyncStorage.setItem('analytics_events', JSON.stringify(this.events));
    } catch (error) {
      console.error('Error persisting events:', error);
    }
  }

  async loadPersistedEvents() {
    try {
      const storedEvents = await AsyncStorage.getItem('analytics_events');
      if (storedEvents) {
        this.events = JSON.parse(storedEvents);
      }
    } catch (error) {
      console.error('Error loading persisted events:', error);
    }
  }

  // Analytics reports
  async getEventsSummary(days = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentEvents = this.events.filter(event => 
      new Date(event.properties.timestamp) > cutoffDate
    );

    const eventCounts = recentEvents.reduce((counts, event) => {
      counts[event.name] = (counts[event.name] || 0) + 1;
      return counts;
    }, {});

    return {
      totalEvents: recentEvents.length,
      uniqueEvents: Object.keys(eventCounts).length,
      eventBreakdown: eventCounts,
      dateRange: {
        from: cutoffDate.toISOString(),
        to: new Date().toISOString()
      }
    };
  }

  async getUserSessionSummary() {
    const sessionEvents = this.events.filter(event => 
      event.properties.sessionId === this.sessionId
    );

    const sessionStart = sessionEvents.length > 0 
      ? new Date(sessionEvents[0].properties.timestamp)
      : new Date();
    
    const sessionDuration = Date.now() - sessionStart.getTime();

    return {
      sessionId: this.sessionId,
      sessionStart: sessionStart.toISOString(),
      sessionDuration: Math.round(sessionDuration / 1000), // in seconds
      eventsInSession: sessionEvents.length,
      screensViewed: (sessionEvents || [])
        .filter(e => e?.name === 'screen_view')
        .map(e => e?.properties?.screen_name || 'unknown')
    };
  }

  // Data export for reporting
  async exportAnalyticsData() {
    try {
      const summary = await this.getEventsSummary(30); // Last 30 days
      const sessionSummary = await this.getUserSessionSummary();
      
      const exportData = {
        summary: summary,
        currentSession: sessionSummary,
        deviceInfo: this.deviceInfo,
        exportedAt: new Date().toISOString(),
        totalStoredEvents: this.events.length
      };

      return exportData;
    } catch (error) {
      console.error('Error exporting analytics data:', error);
      return null;
    }
  }

  // Privacy controls
  async clearAnalyticsData() {
    try {
      this.events = [];
      await AsyncStorage.removeItem('analytics_events');
      console.log('📊 Analytics data cleared');
    } catch (error) {
      console.error('Error clearing analytics data:', error);
    }
  }

  setAnalyticsEnabled(enabled) {
    this.isEnabled = enabled;
    if (enabled) {
      console.log('📊 Analytics enabled');
    } else {
      console.log('📊 Analytics disabled');
    }
  }

  isAnalyticsEnabled() {
    return this.isEnabled;
  }

  // Utility methods for screen timing
  startScreenTimer(screenName) {
    this.screenStartTimes = this.screenStartTimes || {};
    this.screenStartTimes[screenName] = Date.now();
  }

  async endScreenTimer(screenName) {
    if (!this.screenStartTimes || !this.screenStartTimes[screenName]) {
      return;
    }

    const duration = Date.now() - this.screenStartTimes[screenName];
    delete this.screenStartTimes[screenName];

    await this.trackPerformance(`screen_time_${screenName}`, duration);
  }
}

export default new AnalyticsService();