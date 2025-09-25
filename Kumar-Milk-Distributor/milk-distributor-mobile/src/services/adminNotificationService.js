import AsyncStorage from '@react-native-async-storage/async-storage';
import notificationService from './notificationService';
import Toast from 'react-native-toast-message';

class AdminNotificationService {
  constructor() {
    this.orderCheckInterval = null;
    this.lastNotificationTime = {};
    this.isInitialized = false;
  }

  // Initialize admin notifications
  async initialize() {
    try {
      console.log('📱 AdminNotificationService: Initializing...');
      
      // Register notification categories
      await notificationService.initialize();
      
      // Set up periodic order checking
      this.startOrderMonitoring();
      
      this.isInitialized = true;
      console.log('✅ AdminNotificationService: Initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ AdminNotificationService: Initialization failed:', error);
      return false;
    }
  }

  // Start monitoring orders for new submissions
  startOrderMonitoring() {
    if (this.orderCheckInterval) {
      clearInterval(this.orderCheckInterval);
    }

    // Check for new orders every 30 seconds
    this.orderCheckInterval = setInterval(async () => {
      await this.checkForNewOrders();
    }, 30000);

    console.log('⏰ AdminNotificationService: Order monitoring started (30s interval)');
  }

  // Stop monitoring orders
  stopOrderMonitoring() {
    if (this.orderCheckInterval) {
      clearInterval(this.orderCheckInterval);
      this.orderCheckInterval = null;
      console.log('⏹️ AdminNotificationService: Order monitoring stopped');
    }
  }

  // Check for new orders and send notifications
  async checkForNewOrders() {
    try {
      const ordersData = await AsyncStorage.getItem('pendingOrders');
      if (!ordersData) return;

      const orders = JSON.parse(ordersData);
      const currentTime = Date.now();
      
      // Find orders from last 5 minutes that need admin attention
      const fiveMinutesAgo = currentTime - (5 * 60 * 1000);
      
      const newOrders = orders.filter(order => {
        const orderTime = new Date(order.timestamp || order.createdAt || order.orderDate).getTime();
        const isRecent = orderTime > fiveMinutesAgo;
        const needsAttention = order.status === 'pending_verification' || order.status === 'pending';
        const notAlreadyNotified = !this.lastNotificationTime[order.id] || 
                                  (currentTime - this.lastNotificationTime[order.id]) > (60 * 60 * 1000); // 1 hour
        
        return isRecent && needsAttention && notAlreadyNotified;
      });

      // Send notifications for new orders
      for (const order of newOrders) {
        await this.notifyNewOrder(order);
        this.lastNotificationTime[order.id] = currentTime;
      }

      if (newOrders.length > 0) {
        console.log(`📋 AdminNotificationService: Notified about ${newOrders.length} new orders`);
      }
    } catch (error) {
      console.error('❌ AdminNotificationService: Error checking new orders:', error);
    }
  }

  // Send notification for new order
  async notifyNewOrder(order) {
    try {
      const isMultiProduct = order.items && Array.isArray(order.items);
      const productDescription = isMultiProduct 
        ? `${order.items.length} products`
        : order.productName;

      const title = 'New Order Received';
      const body = `${order.customerName || 'Customer'} ordered ${productDescription} - ₹${order.totalAmount}`;
      
      await notificationService.sendLocalNotification(
        title,
        body,
        {
          orderId: order.id,
          type: 'new_order',
          customerName: order.customerName,
          amount: order.totalAmount,
        }
      );

      // Also show toast for immediate feedback if admin is in app
      Toast.show({
        type: 'info',
        text1: 'New Order',
        text2: `${order.customerName} - ${productDescription}`,
        position: 'top',
        visibilityTime: 4000,
      });

      console.log(`📱 AdminNotificationService: Notified about new order from ${order.customerName}`);
    } catch (error) {
      console.error('❌ AdminNotificationService: Error sending new order notification:', error);
    }
  }

  // Notify about payment verification required
  async notifyPaymentVerification(order) {
    try {
      const title = 'Payment Verification Required';
      const body = `${order.customerName} uploaded payment proof for order ₹${order.totalAmount}`;
      
      await notificationService.sendLocalNotification(
        title,
        body,
        {
          orderId: order.id,
          type: 'payment_verification',
          customerName: order.customerName,
          amount: order.totalAmount,
        }
      );

      console.log(`💰 AdminNotificationService: Payment verification notification sent for ${order.customerName}`);
    } catch (error) {
      console.error('❌ AdminNotificationService: Error sending payment verification notification:', error);
    }
  }

  // Send summary notifications
  async sendDailySummary() {
    try {
      const ordersData = await AsyncStorage.getItem('pendingOrders');
      if (!ordersData) return;

      const orders = JSON.parse(ordersData);
      const today = new Date().toDateString();
      
      // Count today's orders by status
      const todayOrders = orders.filter(order => {
        const orderDate = new Date(order.timestamp || order.createdAt || order.orderDate);
        return orderDate.toDateString() === today;
      });

      const pending = todayOrders.filter(o => o.status === 'pending' || o.status === 'pending_verification');
      const confirmed = todayOrders.filter(o => o.status === 'confirmed');
      const delivered = todayOrders.filter(o => o.status === 'delivered');
      
      const totalRevenue = delivered.reduce((sum, order) => sum + (parseFloat(order.totalAmount) || 0), 0);

      if (todayOrders.length > 0) {
        const title = 'Daily Order Summary';
        const body = `Today: ${todayOrders.length} orders, ${pending.length} pending, ₹${totalRevenue.toFixed(2)} revenue`;
        
        await notificationService.sendLocalNotification(
          title,
          body,
          {
            type: 'daily_summary',
            todayOrders: todayOrders.length,
            pending: pending.length,
            revenue: totalRevenue,
          }
        );

        console.log(`📊 AdminNotificationService: Daily summary sent - ${todayOrders.length} orders`);
      }
    } catch (error) {
      console.error('❌ AdminNotificationService: Error sending daily summary:', error);
    }
  }

  // Handle notification interactions
  async handleNotificationResponse(notification) {
    const { data } = notification.request.content;
    
    switch (data?.type) {
      case 'new_order':
      case 'payment_verification':
        // Could navigate to specific order details
        console.log(`📱 AdminNotificationService: Handling ${data.type} notification for order ${data.orderId}`);
        break;
        
      case 'daily_summary':
        console.log('📊 AdminNotificationService: Handling daily summary notification');
        break;
        
      default:
        console.log('📱 AdminNotificationService: Handling unknown notification type');
    }
  }

  // Get notification statistics
  async getNotificationStats() {
    try {
      const ordersData = await AsyncStorage.getItem('pendingOrders');
      if (!ordersData) return { newOrders: 0, pendingVerification: 0 };

      const orders = JSON.parse(ordersData);
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);
      
      const newOrders = orders.filter(order => {
        const orderTime = new Date(order.timestamp || order.createdAt || order.orderDate).getTime();
        return orderTime > oneHourAgo && (order.status === 'pending' || order.status === 'pending_verification');
      });

      const pendingVerification = orders.filter(order => order.status === 'pending_verification');

      return {
        newOrders: newOrders.length,
        pendingVerification: pendingVerification.length,
        totalPending: orders.filter(o => o.status === 'pending' || o.status === 'pending_verification').length,
      };
    } catch (error) {
      console.error('❌ AdminNotificationService: Error getting notification stats:', error);
      return { newOrders: 0, pendingVerification: 0, totalPending: 0 };
    }
  }

  // Clear notification history
  clearNotificationHistory() {
    this.lastNotificationTime = {};
    console.log('🗑️ AdminNotificationService: Notification history cleared');
  }

  // Cleanup on app exit
  cleanup() {
    this.stopOrderMonitoring();
    this.clearNotificationHistory();
    this.isInitialized = false;
    console.log('🧹 AdminNotificationService: Cleanup completed');
  }
}

export default new AdminNotificationService();