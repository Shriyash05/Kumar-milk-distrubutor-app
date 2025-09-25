import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';

// Simple notification service for Expo Go compatibility

class NotificationService {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    console.log('Simple notification service initialized (Expo Go compatible)');
    this.initialized = true;
    return true;
  }

  setupListeners(onNotificationReceived, onNotificationResponse) {
    console.log('Notification listeners setup (mock)');
  }

  removeListeners() {
    console.log('Notification listeners removed (mock)');
  }

  async sendLocalNotification(title, body, data = {}) {
    // Use Toast for immediate feedback
    Toast.show({
      type: 'info',
      text1: title,
      text2: body,
      visibilityTime: 5000,
      position: 'top',
    });
    
    console.log('Local notification (Toast):', title, body);
    return 'mock-notification-id';
  }

  async scheduleLocalNotification(title, body, data = {}, delay = 0) {
    if (delay > 0) {
      setTimeout(() => {
        this.sendLocalNotification(title, body, data);
      }, delay * 1000);
    } else {
      return this.sendLocalNotification(title, body, data);
    }
    return 'mock-scheduled-id';
  }

  async cancelNotification(identifier) {
    console.log('Cancel notification (mock):', identifier);
  }

  async cancelAllNotifications() {
    console.log('Cancel all notifications (mock)');
  }

  async setBadgeCount(count) {
    console.log('Set badge count (mock):', count);
  }

  getPushToken() {
    return 'mock-push-token';
  }

  // Order-specific notification methods
  async notifyNewOrder(orderData) {
    return this.sendLocalNotification(
      'New Order Received!',
      `${orderData.customerName} ordered ${orderData.quantity}L ${orderData.productName}`,
      {
        type: 'new_order',
        orderId: orderData.id,
        ...orderData
      }
    );
  }

  async notifyOrderStatusUpdate(orderData, newStatus) {
    const statusMessages = {
      confirmed: 'Your order has been confirmed!',
      delivered: 'Your order has been delivered!',
      cancelled: 'Your order has been cancelled.',
    };

    return this.sendLocalNotification(
      'Order Status Update',
      statusMessages[newStatus] || `Order status updated to ${newStatus}`,
      {
        type: 'status_update',
        orderId: orderData.id,
        status: newStatus,
        ...orderData
      }
    );
  }

  async notifyPaymentVerification(orderData, verified = true) {
    return this.sendLocalNotification(
      verified ? 'Payment Verified' : 'Payment Verification Failed',
      verified 
        ? 'Your payment has been verified successfully!' 
        : 'Payment verification failed. Please contact support.',
      {
        type: 'payment_verification',
        orderId: orderData.id,
        verified,
        ...orderData
      }
    );
  }

  // Admin-specific notifications
  async notifyAdminNewOrder(orderData) {
    console.log('🗑️ Admin Notification: New order alert sent');
    
    // Safe fallback values
    const customerName = orderData.customerName || orderData.customer?.name || 'Unknown Customer';
    const totalAmount = orderData.totalAmount || 0;
    const orderId = orderData.id || orderData._id || orderData.orderGroupId || 'Unknown';
    
    // Handle both single and multi-product orders
    let orderDescription = '';
    if (orderData.items && Array.isArray(orderData.items) && orderData.items.length > 0) {
      // Multi-product order
      const totalItems = orderData.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      orderDescription = `${customerName} ordered ${orderData.items.length} different products (${totalItems} total items)`;
    } else if (orderData.productName && orderData.quantity) {
      // Single product order
      orderDescription = `${customerName} ordered ${orderData.quantity}${orderData.unitType === 'crate' ? ' crates' : 'L'} of ${orderData.productName}`;
    } else {
      // Fallback
      orderDescription = `${customerName} placed a new order`;
    }
    
    return this.sendLocalNotification(
      '🍼 New Milk Order!',
      `${orderDescription}\nAmount: ₹${totalAmount}`,
      {
        type: 'admin_new_order',
        orderId: orderId,
        priority: 'high',
        sound: 'default',
        ...orderData
      }
    );
  }

  async notifyAdminPaymentProof(orderData) {
    console.log('🗗 Admin Notification: Payment proof alert sent');
    
    // Safe fallback values
    const customerName = orderData.customerName || orderData.customer?.name || 'Unknown Customer';
    const totalAmount = orderData.totalAmount || 0;
    const orderId = orderData.id || orderData._id || orderData.orderGroupId || 'Unknown';
    
    return this.sendLocalNotification(
      '💳 Payment Proof Received',
      `Payment screenshot uploaded for order #${orderId}\nCustomer: ${customerName}\nAmount: ₹${totalAmount}`,
      {
        type: 'admin_payment_proof',
        orderId: orderId,
        priority: 'high',
        sound: 'default',
        ...orderData
      }
    );
  }

  // Additional admin notifications
  async notifyAdminOrderCancellation(orderData, reason) {
    console.log('🗎 Admin Notification: Order cancellation alert sent');
    return this.sendLocalNotification(
      '❌ Order Cancelled',
      `Order #${orderData.id} was cancelled by ${orderData.customerName}\nReason: ${reason || 'Not specified'}`,
      {
        type: 'admin_order_cancelled',
        orderId: orderData.id,
        reason,
        ...orderData
      }
    );
  }

  async notifyAdminDailyOrderSummary(summary) {
    console.log('🗎 Admin Notification: Daily summary sent');
    return this.sendLocalNotification(
      '📈 Daily Order Summary',
      `Today: ${summary.totalOrders} orders, ₹${summary.totalRevenue} revenue\nPending: ${summary.pendingOrders} orders`,
      {
        type: 'admin_daily_summary',
        ...summary
      }
    );
  }

  // Admin notification setup for role-based targeting
  async setupAdminNotifications(userRole) {
    if (userRole === 'admin') {
      console.log('🔔 Setting up admin notifications...');
      // In a real app, this would register the admin for push notifications
      // and set up notification categories/channels
      return true;
    }
    return false;
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;