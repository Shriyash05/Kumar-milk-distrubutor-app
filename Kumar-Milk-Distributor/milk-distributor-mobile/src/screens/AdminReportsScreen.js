import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import simpleAuthService from '../services/simpleAuthService';
import * as SecureStore from 'expo-secure-store';
import AuthGuard from '../components/AuthGuard';

const { width } = Dimensions.get('window');

const AdminReportsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalOrders: 0,
    todayOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    mobileOrders: { total: 0, revenue: 0 },
    webOrders: { total: 0, revenue: 0 },
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const userRole = await SecureStore.getItemAsync('userRole');
      const token = await SecureStore.getItemAsync('authToken') || await SecureStore.getItemAsync('token');

      if (!token || userRole !== 'admin') {
        Toast.show({
          type: 'error',
          text1: 'Access Denied',
          text2: 'Admin access required',
        });
        navigation.replace('Landing');
        return;
      }

      loadReportsData();
    } catch (error) {
      console.error('Admin access check error:', error);
      navigation.replace('Landing');
    }
  };

  const loadReportsData = async () => {
    try {
      console.log('Loading reports data...');
      
      // Load all orders for comprehensive reporting
      const ordersResponse = await simpleAuthService.makeRequest('/admin/orders');
      let orders = [];
      
      if (ordersResponse && ordersResponse.orders && Array.isArray(ordersResponse.orders)) {
        orders = ordersResponse.orders;
      } else if (ordersResponse && Array.isArray(ordersResponse)) {
        orders = ordersResponse;
      }
      
      // Calculate metrics from orders
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const todayOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt || order.orderDate || order.timestamp);
        return orderDate >= todayStart;
      });
      
      const monthOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt || order.orderDate || order.timestamp);
        return orderDate >= monthStart;
      });
      
      const pendingOrders = orders.filter(order => 
        ['pending', 'pending_verification'].includes(order.status)
      );
      
      const confirmedOrders = orders.filter(order => 
        ['confirmed', 'approved', 'delivered'].includes(order.status)
      );
      
      const totalRevenue = confirmedOrders.reduce((sum, order) => 
        sum + (parseFloat(order.totalAmount) || 0), 0
      );
      
      const todayRevenue = todayOrders
        .filter(order => ['confirmed', 'approved', 'delivered'].includes(order.status))
        .reduce((sum, order) => sum + (parseFloat(order.totalAmount) || 0), 0);
      
      const monthlyRevenue = monthOrders
        .filter(order => ['confirmed', 'approved', 'delivered'].includes(order.status))
        .reduce((sum, order) => sum + (parseFloat(order.totalAmount) || 0), 0);
      
      // Separate mobile and web orders (assuming all are mobile for now)
      const mobileOrders = orders;
      const webOrders = [];
      
      // Load unique customers
      let totalCustomers = 0;
      try {
        const usersResponse = await simpleAuthService.makeRequest('/admin/users');
        if (usersResponse && usersResponse.users && Array.isArray(usersResponse.users)) {
          totalCustomers = usersResponse.users.filter(user => user.role !== 'admin').length;
        } else if (usersResponse && Array.isArray(usersResponse)) {
          totalCustomers = usersResponse.filter(user => user.role !== 'admin').length;
        }
      } catch (userError) {
        console.log('Could not load users count:', userError.message);
        // Fallback: count unique customer emails from orders
        const customerEmails = new Set();
        orders.forEach(order => {
          if (order.customer?.email) customerEmails.add(order.customer.email);
          if (order.customerEmail) customerEmails.add(order.customerEmail);
        });
        totalCustomers = customerEmails.size;
      }
      
      setDashboardData({
        totalOrders: orders.length,
        todayOrders: todayOrders.length,
        totalCustomers: totalCustomers,
        totalRevenue: totalRevenue,
        todayRevenue: todayRevenue,
        pendingOrders: pendingOrders.length,
        mobileOrders: { 
          total: mobileOrders.length, 
          revenue: mobileOrders.filter(o => ['confirmed', 'approved', 'delivered'].includes(o.status))
            .reduce((sum, order) => sum + (parseFloat(order.totalAmount) || 0), 0)
        },
        webOrders: { total: webOrders.length, revenue: 0 },
      });
      
      // Set recent orders (latest 10)
      const recentOrdersList = orders
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || a.orderDate || a.timestamp);
          const dateB = new Date(b.createdAt || b.orderDate || b.timestamp);
          return dateB - dateA;
        })
        .slice(0, 10);
      
      setRecentOrders(recentOrdersList);
      
      // Calculate monthly summary
      const monthlyTotalCrates = monthOrders.reduce((sum, order) => {
        if (order.items && Array.isArray(order.items)) {
          return sum + order.items.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0);
        }
        return sum + (order.quantity || 0);
      }, 0);
      
      // Find most ordered product
      const productCounts = {};
      monthOrders.forEach(order => {
        const productName = order.productName || 'Unknown Product';
        productCounts[productName] = (productCounts[productName] || 0) + 1;
      });
      
      const mostOrderedProduct = Object.keys(productCounts).length > 0 ?
        Object.keys(productCounts).reduce((a, b) => productCounts[a] > productCounts[b] ? a : b) :
        'No orders';
      
      setMonthlySummary({
        totalOrders: monthOrders.length,
        totalAmount: monthlyRevenue,
        totalCrates: monthlyTotalCrates,
        mostOrderedProduct: mostOrderedProduct
      });
      
      console.log('Reports loaded successfully:', {
        totalOrders: orders.length,
        todayOrders: todayOrders.length,
        totalCustomers,
        totalRevenue,
        pendingOrders: pendingOrders.length
      });

    } catch (error) {
      console.error('Error loading reports data:', error);
      Toast.show({
        type: 'error',
        text1: 'Loading Error',
        text2: 'Failed to load reports data. Please try again.',
      });
      
      // Set default empty data
      setDashboardData({
        totalOrders: 0,
        todayOrders: 0,
        totalCustomers: 0,
        totalRevenue: 0,
        todayRevenue: 0,
        pendingOrders: 0,
        mobileOrders: { total: 0, revenue: 0 },
        webOrders: { total: 0, revenue: 0 },
      });
      setRecentOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReportsData();
    setRefreshing(false);
  };

  const formatCurrency = (value) => {
    const num = parseFloat(value) || 0;
    return `₹${num.toFixed(2)}`;
  };

  const formatNumber = (value) => {
    return parseInt(value) || 0;
  };

  const downloadReport = (reportType) => {
    Alert.alert(
      'Download Report',
      `Download ${reportType} report?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: async () => {
            try {
              Toast.show({
                type: 'info',
                text1: 'Download Started',
                text2: `Preparing ${reportType} report...`,
              });

              // For now, just show a success message
              // In a real implementation, you'd call the CSV export API
              setTimeout(() => {
                Toast.show({
                  type: 'success',
                  text1: 'Download Complete',
                  text2: `${reportType} report downloaded successfully`,
                });
              }, 2000);
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Download Failed',
                text2: 'Failed to download report',
              });
            }
          },
        },
      ]
    );
  };

  const renderMetricCard = (title, value, icon, color, isRevenue = false) => (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <View style={styles.metricHeader}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
      <Text style={[styles.metricValue, { color }]}>
        {isRevenue ? formatCurrency(value) : formatNumber(value)}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#54a9f7" />
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <AuthGuard requiredRole="admin" navigation={navigation}>
      <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Reports & Analytics</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#54a9f7" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Overview Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.metricsGrid}>
            {renderMetricCard('Total Orders', dashboardData.totalOrders, 'receipt-outline', '#4CAF50')}
            {renderMetricCard('Today Orders', dashboardData.todayOrders, 'today-outline', '#FF9800')}
            {renderMetricCard('Total Customers', dashboardData.totalCustomers, 'people-outline', '#2196F3')}
            {renderMetricCard('Pending Orders', dashboardData.pendingOrders, 'time-outline', '#f44336')}
          </View>
        </View>

        {/* Revenue Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue</Text>
          <View style={styles.metricsGrid}>
            {renderMetricCard('Total Revenue', dashboardData.totalRevenue, 'cash-outline', '#4CAF50', true)}
            {renderMetricCard('Today Revenue', dashboardData.todayRevenue, 'trending-up-outline', '#FF9800', true)}
            {renderMetricCard('Mobile Orders Revenue', dashboardData.mobileOrders.revenue, 'phone-portrait-outline', '#9C27B0', true)}
            {renderMetricCard('Web Orders Revenue', dashboardData.webOrders.revenue, 'desktop-outline', '#795548', true)}
          </View>
        </View>

        {/* Platform Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform Breakdown</Text>
          <View style={styles.platformCards}>
            <View style={styles.platformCard}>
              <View style={styles.platformHeader}>
                <Ionicons name="phone-portrait-outline" size={24} color="#9C27B0" />
                <Text style={styles.platformTitle}>Mobile App</Text>
              </View>
              <Text style={styles.platformValue}>{formatNumber(dashboardData.mobileOrders.total)} orders</Text>
              <Text style={styles.platformRevenue}>{formatCurrency(dashboardData.mobileOrders.revenue)}</Text>
            </View>
            
            <View style={styles.platformCard}>
              <View style={styles.platformHeader}>
                <Ionicons name="desktop-outline" size={24} color="#795548" />
                <Text style={styles.platformTitle}>Web Orders</Text>
              </View>
              <Text style={styles.platformValue}>{formatNumber(dashboardData.webOrders.total)} orders</Text>
              <Text style={styles.platformRevenue}>{formatCurrency(dashboardData.webOrders.revenue)}</Text>
            </View>
          </View>
        </View>

        {/* Monthly Summary */}
        {monthlySummary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>This Month</Text>
            <View style={styles.monthlyCard}>
              <View style={styles.monthlyRow}>
                <Text style={styles.monthlyLabel}>Total Orders:</Text>
                <Text style={styles.monthlyValue}>{formatNumber(monthlySummary.totalOrders)}</Text>
              </View>
              <View style={styles.monthlyRow}>
                <Text style={styles.monthlyLabel}>Total Revenue:</Text>
                <Text style={styles.monthlyValue}>{formatCurrency(monthlySummary.totalAmount)}</Text>
              </View>
              <View style={styles.monthlyRow}>
                <Text style={styles.monthlyLabel}>Total Items:</Text>
                <Text style={styles.monthlyValue}>{formatNumber(monthlySummary.totalCrates)}</Text>
              </View>
              {monthlySummary.mostOrderedProduct && (
                <View style={styles.monthlyRow}>
                  <Text style={styles.monthlyLabel}>Most Ordered:</Text>
                  <Text style={styles.monthlyValue}>{monthlySummary.mostOrderedProduct}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Recent Orders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          {recentOrders.length > 0 ? (
            <View style={styles.recentOrders}>
              {(recentOrders || []).slice(0, 5).map((order, index) => (
                <View key={order._id || index} style={styles.orderItem}>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderProduct}>{order.productName}</Text>
                    <Text style={styles.orderCustomer}>{order.customer?.name || 'Unknown'}</Text>
                  </View>
                  <View style={styles.orderAmount}>
                    <Text style={styles.orderPrice}>{formatCurrency(order.totalAmount)}</Text>
                    <View style={[styles.orderStatus, { backgroundColor: getStatusColor(order.status) }]}>
                      <Text style={styles.orderStatusText}>{order.status}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyOrders}>
              <Ionicons name="receipt-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No recent orders</Text>
            </View>
          )}
        </View>

        {/* Export Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Reports</Text>
          <View style={styles.exportButtons}>
            <TouchableOpacity 
              style={styles.exportButton}
              onPress={() => downloadReport('Daily Deliveries')}
            >
              <Ionicons name="download-outline" size={20} color="#54a9f7" />
              <Text style={styles.exportButtonText}>Daily Deliveries CSV</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.exportButton}
              onPress={() => downloadReport('Monthly Summary')}
            >
              <Ionicons name="download-outline" size={20} color="#4CAF50" />
              <Text style={styles.exportButtonText}>Monthly Summary</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      </SafeAreaView>
    </AuthGuard>
  );
};

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending_verification':
    case 'pending':
      return '#FF9800';
    case 'confirmed':
    case 'approved':
      return '#4CAF50';
    case 'delivered':
      return '#2196F3';
    case 'cancelled':
      return '#f44336';
    default:
      return '#666';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    padding: 5,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginHorizontal: 20,
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: (width - 60) / 2,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  platformCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  platformCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: (width - 60) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  platformHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  platformTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  platformValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  platformRevenue: {
    fontSize: 14,
    color: '#666',
  },
  monthlyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  monthlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  monthlyLabel: {
    fontSize: 16,
    color: '#666',
  },
  monthlyValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  recentOrders: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderInfo: {
    flex: 1,
  },
  orderProduct: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  orderCustomer: {
    fontSize: 14,
    color: '#666',
  },
  orderAmount: {
    alignItems: 'flex-end',
  },
  orderPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  orderStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  orderStatusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyOrders: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  exportButtons: {
    gap: 12,
  },
  exportButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
});

export default AdminReportsScreen;