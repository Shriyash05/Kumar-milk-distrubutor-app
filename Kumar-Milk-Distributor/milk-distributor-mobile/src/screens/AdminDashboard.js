import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Colors, Typography } from '../theme';

const { width } = Dimensions.get('window');
import simpleAuthService from '../services/simpleAuthService';
import AuthGuard from '../components/AuthGuard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notificationService from '../services/notificationService';
import adminNotificationService from '../services/adminNotificationService';
import roleService from '../services/roleService';
import api from '../services/api';

const AdminDashboard = ({ navigation }) => {
  console.log('📱 AdminDashboard: Component initializing...');
  const tabNavigation = useNavigation();
  
  // Safe number formatting utility
  const formatNumber = (value, decimals = 0) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '0';
    }
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    return decimals > 0 ? num.toFixed(decimals) : Math.round(num).toString();
  };
  
  const formatCurrency = (value) => {
    return '₹' + formatNumber(value, 2);
  };
  
  // Calculate dashboard metrics from local orders data
  const calculateDashboardMetrics = async () => {
    try {
      console.log('📋 AdminDashboard: Calculating metrics from local data...');
      
      // Get stored orders
      const ordersData = await AsyncStorage.getItem('pendingOrders');
      const orders = ordersData ? JSON.parse(ordersData) : [];
      
      // Get stored user data to count customers
      const usersData = await AsyncStorage.getItem('registeredUsers');
      const users = usersData ? JSON.parse(usersData) : [];
      
      console.log('📋 Found orders:', orders.length);
      console.log('📋 Found users:', users.length);
      
      // Calculate metrics
      const now = new Date();
      const today = now.toDateString();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      // Today's orders
      const todayOrders = orders.filter(order => {
        const orderDate = new Date(order.timestamp || order.orderDate || order.createdAt);
        return orderDate.toDateString() === today;
      });
      
      // Weekly orders
      const weeklyOrders = orders.filter(order => {
        const orderDate = new Date(order.timestamp || order.orderDate || order.createdAt);
        return orderDate >= weekAgo;
      });
      
      // Monthly orders
      const monthlyOrders = orders.filter(order => {
        const orderDate = new Date(order.timestamp || order.orderDate || order.createdAt);
        return orderDate >= monthAgo;
      });
      
      // Pending orders (pending_verification or pending status)
      const pendingOrders = orders.filter(order => 
        order.status === 'pending_verification' || order.status === 'pending'
      );
      
      // Calculate revenue
      const totalRevenue = orders.reduce((sum, order) => {
        const amount = parseFloat(order.totalAmount || 0);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      
      const monthlyRevenue = monthlyOrders.reduce((sum, order) => {
        const amount = parseFloat(order.totalAmount || 0);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      
      // Count unique customers from orders
      const uniqueCustomerIds = new Set(orders.map(order => order.customerId || order.customerName).filter(Boolean));
      const totalCustomers = Math.max(uniqueCustomerIds.size, users.length);
      
      // Active customers (placed order in last 30 days)
      const activeCustomerIds = new Set(monthlyOrders.map(order => order.customerId || order.customerName).filter(Boolean));
      const activeCustomers = activeCustomerIds.size;
      
      const metrics = {
        totalCustomers,
        todayOrders: todayOrders.length,
        totalRevenue,
        pendingOrders: pendingOrders.length,
        weeklyOrders: weeklyOrders.length,
        monthlyRevenue,
        activeCustomers,
        totalOrders: orders.length,
      };
      
      console.log('✅ AdminDashboard: Calculated metrics:', metrics);
      return {
        metrics,
        recentOrders: orders.slice(-5).reverse() // Last 5 orders, most recent first
      };
      
    } catch (error) {
      console.error('❌ AdminDashboard: Error calculating metrics:', error);
      return {
        metrics: {
          totalCustomers: 0,
          todayOrders: 0,
          totalRevenue: 0,
          pendingOrders: 0,
          weeklyOrders: 0,
          monthlyRevenue: 0,
          activeCustomers: 0,
          totalOrders: 0,
        },
        recentOrders: []
      };
    }
  };
  
  const [dashboardData, setDashboardData] = useState({
    totalCustomers: 0,
    todayOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    weeklyOrders: 0,
    monthlyRevenue: 0,
    activeCustomers: 0,
    totalOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(null);

  const checkAuthentication = async () => {
    console.log('🔍 AdminDashboard: Starting authentication check...');
    try {
      // Try both token keys for compatibility
      const tokenKey1 = await SecureStore.getItemAsync('token');
      const tokenKey2 = await SecureStore.getItemAsync('authToken');
      let token = tokenKey1 || tokenKey2;
      const role = await SecureStore.getItemAsync('userRole');
      const userData = await SecureStore.getItemAsync('userData');
      
      console.log('🔍 AdminDashboard: Raw stored data:');
      console.log('  - token (key "token"):', tokenKey1 ? '[EXISTS]' : '[NULL]');
      console.log('  - authToken (key "authToken"):', tokenKey2 ? '[EXISTS]' : '[NULL]');
      console.log('  - userRole:', role);
      console.log('  - userData:', userData ? '[EXISTS]' : '[NULL]');
      console.log('  - Final token used:', token ? '[EXISTS]' : '[NULL]');
      
      if (userData) {
        try {
          const parsedUserData = JSON.parse(userData);
          console.log('  - Parsed userData:', parsedUserData);
        } catch (e) {
          console.log('  - userData parse error:', e.message);
        }
      }
      
      if (!token) {
        console.log('No token found, redirecting to login');
        Toast.show({
          type: 'error',
          text1: 'Authentication Required',
          text2: 'Please login to access the admin panel',
        });
        navigation.replace('Landing');
        return false;
      }
      
      if (role !== 'admin') {
        console.log('User is not an admin, role:', role);
        Toast.show({
          type: 'error',
          text1: 'Access Denied',
          text2: 'Only administrators can access this panel',
        });
        navigation.replace('Landing');
        return false;
      }
      
      console.log('Authentication successful for admin user');
      setIsAuthenticated(true);
      setUserRole(role);
      
      // Setup admin notifications
      try {
        if (notificationService && typeof notificationService.setupAdminNotifications === 'function') {
          await notificationService.setupAdminNotifications(role);
        }
        if (adminNotificationService && typeof adminNotificationService.initialize === 'function') {
          await adminNotificationService.initialize();
        }
        console.log('🔔 AdminDashboard: Admin notifications configured');
      } catch (notifError) {
        console.log('⚠️ AdminDashboard: Failed to setup notifications:', notifError.message);
      }
      
      return true;
    } catch (error) {
      console.error('Error checking authentication:', error);
      Toast.show({
        type: 'error',
        text1: 'Authentication Error',
        text2: 'Please login again',
      });
      navigation.replace('Landing');
      return false;
    }
  };

  const fetchDashboardData = async () => {
    if (!isAuthenticated) {
      console.log('User not authenticated, skipping data fetch');
      setLoading(false);
      return;
    }
    
    // Double-check authentication by verifying token exists
    try {
      const token = await SecureStore.getItemAsync('authToken') || await SecureStore.getItemAsync('token');
      const role = await SecureStore.getItemAsync('userRole');
      
      if (!token || role !== 'admin') {
        console.log('⚠️ AdminDashboard: Auth verification failed during data fetch, clearing interval');
        if (autoRefreshInterval) {
          clearInterval(autoRefreshInterval);
          setAutoRefreshInterval(null);
        }
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
    } catch (authCheckError) {
      console.log('⚠️ AdminDashboard: Auth check error during data fetch:', authCheckError.message);
      setLoading(false);
      return;
    }

    // Set a timeout to prevent hanging
    const fetchTimeout = setTimeout(() => {
      console.log('⏰ AdminDashboard: Data fetch timeout, forcing completion');
      setLoading(false);
      setRefreshing(false);
    }, 15000); // 15 second timeout

    try {
      console.log('📋 AdminDashboard: Fetching dashboard data...');
      
      // First, get real data from local storage
      const localData = await calculateDashboardMetrics();
      
      // Update dashboard with local data immediately
      setDashboardData({
        totalCustomers: localData.metrics.totalCustomers,
        todayOrders: localData.metrics.todayOrders,
        totalRevenue: localData.metrics.totalRevenue,
        pendingOrders: localData.metrics.pendingOrders,
        weeklyOrders: localData.metrics.weeklyOrders,
        monthlyRevenue: localData.metrics.monthlyRevenue,
        activeCustomers: localData.metrics.activeCustomers,
        totalOrders: localData.metrics.totalOrders,
      });
      
      // Update recent orders with local data
      setRecentOrders(localData.recentOrders);
      
      // Update last refreshed timestamp
      setLastUpdated(new Date());
      
      console.log('✅ AdminDashboard: Dashboard updated with local data:');
      console.log('  - Total Customers:', localData.metrics.totalCustomers);
      console.log('  - Today Orders:', localData.metrics.todayOrders);
      console.log('  - Total Revenue:', localData.metrics.totalRevenue);
      console.log('  - Pending Orders:', localData.metrics.pendingOrders);
      console.log('  - Recent Orders:', localData.recentOrders.length);
      
      // Try to sync with API to get comprehensive dashboard data
      try {
        console.log('🌐 AdminDashboard: Fetching enhanced dashboard data from API...');
        const response = await simpleAuthService.makeRequest('/admin/dashboard');
        
        if (response && response.success) {
          console.log('✅ AdminDashboard: Enhanced API data received');
          
          // Merge API data with local calculations
          const apiData = response.data;
          setDashboardData({
            totalCustomers: apiData.totalCustomers || localData.metrics.totalCustomers,
            todayOrders: apiData.todayOrders || localData.metrics.todayOrders,
            totalRevenue: apiData.totalRevenue || localData.metrics.totalRevenue,
            pendingOrders: apiData.pendingOrders || localData.metrics.pendingOrders,
            weeklyOrders: apiData.totalOrders || localData.metrics.weeklyOrders,
            monthlyRevenue: apiData.totalRevenue || localData.metrics.monthlyRevenue,
            activeCustomers: apiData.totalCustomers || localData.metrics.activeCustomers,
            totalOrders: apiData.totalOrders || localData.metrics.totalOrders,
          });
          
          // Update recent orders with API data if available
          if (apiData.recentOrders && Array.isArray(apiData.recentOrders) && apiData.recentOrders.length > 0) {
            const formattedApiOrders = (apiData.recentOrders || []).map(order => ({
              id: order._id,
              customerName: order.customer?.name || order.customerName || 'Unknown Customer',
              productName: order.productName || 'Mobile Order',
              quantity: order.quantity || 0,
              unitType: order.unitType || 'piece',
              totalAmount: order.totalAmount || 0,
              status: order.status || 'pending',
              timestamp: order.createdAt || order.timestamp
            }));
            setRecentOrders(formattedApiOrders);
          }
        } else {
          console.log('⚠️ AdminDashboard: API returned no data, using local calculations');
        }
      } catch (apiError) {
        console.log('⚠️ AdminDashboard: Enhanced API sync failed, using local data:', apiError.message);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      // If it's an authentication error, redirect to login
      if (error.message.includes('Not authorized') || error.message.includes('token')) {
        Toast.show({
          type: 'error',
          text1: 'Session Expired',
          text2: 'Please login again',
        });
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('authToken');
        await SecureStore.deleteItemAsync('userRole');
        await SecureStore.deleteItemAsync('userData');
        navigation.replace('Landing');
        return;
      }
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch dashboard data',
      });
    } finally {
      clearTimeout(fetchTimeout);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  useEffect(() => {
    console.log('🚀 AdminDashboard: Component mounted, starting initialization...');
    const initializeAdmin = async () => {
      console.log('🔍 AdminDashboard: Starting admin initialization...');
      const isAuth = await checkAuthentication();
      console.log('🔍 AdminDashboard: Authentication check result:', isAuth);
      if (isAuth) {
        console.log('✅ AdminDashboard: User authenticated, fetching data...');
        await fetchDashboardData();
        
        // Setup auto-refresh for real-time updates
        const interval = setInterval(async () => {
          console.log('🔄 AdminDashboard: Auto-refreshing data...');
          
          // Verify authentication before refreshing
          try {
            const token = await SecureStore.getItemAsync('authToken') || await SecureStore.getItemAsync('token');
            const role = await SecureStore.getItemAsync('userRole');
            
            if (!token || role !== 'admin') {
              console.log('❌ AdminDashboard: Auto-refresh cancelled - user no longer authenticated');
              clearInterval(interval);
              setAutoRefreshInterval(null);
              setIsAuthenticated(false);
              return;
            }
            
            // Only fetch data if still authenticated
            if (isAuthenticated) {
              fetchDashboardData();
            }
          } catch (error) {
            console.log('⚠️ AdminDashboard: Auto-refresh auth check failed:', error.message);
            clearInterval(interval);
            setAutoRefreshInterval(null);
          }
        }, 30000); // Refresh every 30 seconds
        
        setAutoRefreshInterval(interval);
        console.log('⏰ AdminDashboard: Auto-refresh enabled (30s interval)');
      } else {
        console.log('❌ AdminDashboard: User not authenticated or not admin');
      }
    };
    
    initializeAdmin();
    
    // Cleanup interval on unmount
    return () => {
      if (autoRefreshInterval) {
        console.log('🗑️ AdminDashboard: Cleaning up auto-refresh interval');
        clearInterval(autoRefreshInterval);
      }
    };
  }, []);
  
  // Fetch data when authentication status changes
  useEffect(() => {
    console.log('🔄 AdminDashboard: Authentication status changed to:', isAuthenticated);
    if (isAuthenticated) {
      console.log('✅ AdminDashboard: User is authenticated, fetching dashboard data...');
      fetchDashboardData();
    } else {
      console.log('❌ AdminDashboard: User not authenticated, skipping data fetch');
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            // Clear both token keys for compatibility
            await SecureStore.deleteItemAsync('token');
            await SecureStore.deleteItemAsync('authToken');
            await SecureStore.deleteItemAsync('userRole');
            await SecureStore.deleteItemAsync('userData');
            await SecureStore.deleteItemAsync('loginTimestamp');
            navigation.replace('Landing');
          },
        },
      ]
    );
  };

  // Show loading while checking authentication and fetching data
  if (loading || !isAuthenticated) {
    return (
      <SafeAreaView style={styles.modernContainer}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
        <LinearGradient
          colors={Colors.gradients.kumar}
          style={styles.loadingHeader}
        >
          <View style={styles.loadingHeaderContent}>
            <View style={styles.adminBranding}>
              <Ionicons name="shield-checkmark" size={28} color={Colors.white} />
              <Text style={styles.adminBrandText}>Kumar Milk Admin</Text>
            </View>
          </View>
        </LinearGradient>
        <View style={styles.modernLoadingContainer}>
          <View style={styles.loadingCard}>
            <View style={styles.loadingIconContainer}>
              <Ionicons name="analytics" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.modernLoadingTitle}>
              {!isAuthenticated ? 'Verifying Admin Access' : 'Loading Dashboard'}
            </Text>
            <Text style={styles.modernLoadingSubtitle}>
              {!isAuthenticated ? 'Please wait while we verify your credentials...' : 'Fetching latest business data...'}
            </Text>
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 24 }} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <AuthGuard requiredRole="admin" navigation={navigation}>
      <SafeAreaView style={styles.modernContainer}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
        
        {/* Modern Admin Header */}
        <LinearGradient
          colors={Colors.gradients.kumar}
          style={styles.adminHeaderGradient}
        >
          <View style={styles.adminHeaderContent}>
            <View style={styles.adminWelcomeSection}>
              <View style={styles.adminBranding}>
                <View style={styles.adminLogoContainer}>
                  <Ionicons name="shield-checkmark" size={24} color={Colors.white} />
                </View>
                <View style={styles.adminBrandInfo}>
                  <Text style={styles.adminBrandText}>Kumar Milk</Text>
                  <Text style={styles.adminRoleText}>Admin Dashboard</Text>
                </View>
              </View>
              {lastUpdated && (
                <Text style={styles.lastUpdatedText}>
                  Last synced: {lastUpdated.toLocaleTimeString()}
                </Text>
              )}
            </View>
            
            <View style={styles.adminHeaderActions}>
              {formatNumber(dashboardData.pendingOrders) > 0 && (
                <TouchableOpacity style={styles.notificationButton}>
                  <Ionicons name="notifications" size={20} color={Colors.white} />
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>{formatNumber(dashboardData.pendingOrders)}</Text>
                  </View>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                onPress={() => navigation.navigate('DevClearAuth')} 
                style={styles.headerActionButton}
              >
                <Ionicons name="refresh" size={20} color={Colors.white} />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={handleLogout} style={styles.headerActionButton}>
                <Ionicons name="log-out-outline" size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
        
        <ScrollView 
          style={styles.modernScrollView}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >

          {/* Modern Business Metrics */}
          <View style={styles.businessMetricsSection}>
            <Text style={styles.sectionTitle}>Business Overview</Text>
            
            <View style={styles.modernStatsGrid}>
              {/* Revenue Card */}
              <View style={styles.primaryMetricCard}>
                <View style={styles.metricCardHeader}>
                  <View style={[styles.metricIcon, { backgroundColor: Colors.success + '20' }]}>
                    <Ionicons name="trending-up" size={24} color={Colors.success} />
                  </View>
                  <View style={styles.metricTrend}>
                    <Ionicons name="arrow-up" size={16} color={Colors.success} />
                    <Text style={[styles.trendText, { color: Colors.success }]}>+12.5%</Text>
                  </View>
                </View>
                <Text style={styles.metricValue}>{formatCurrency(dashboardData.totalRevenue)}</Text>
                <Text style={styles.metricLabel}>Total Revenue</Text>
                <Text style={styles.metricSubtext}>Monthly growth</Text>
              </View>
              
              {/* Orders Card */}
              <View style={styles.primaryMetricCard}>
                <View style={styles.metricCardHeader}>
                  <View style={[styles.metricIcon, { backgroundColor: Colors.primary + '20' }]}>
                    <Ionicons name="receipt" size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.metricTrend}>
                    <Ionicons name="arrow-up" size={16} color={Colors.success} />
                    <Text style={[styles.trendText, { color: Colors.success }]}>+8.3%</Text>
                  </View>
                </View>
                <Text style={styles.metricValue}>{formatNumber(dashboardData.totalOrders)}</Text>
                <Text style={styles.metricLabel}>Total Orders</Text>
                <Text style={styles.metricSubtext}>This month</Text>
              </View>
            </View>
            
            <View style={styles.secondaryMetricsGrid}>
              {/* Customers */}
              <View style={styles.secondaryMetricCard}>
                <View style={[styles.smallMetricIcon, { backgroundColor: Colors.accent + '20' }]}>
                  <Ionicons name="people" size={20} color={Colors.accent} />
                </View>
                <Text style={styles.smallMetricValue}>{formatNumber(dashboardData.totalCustomers)}</Text>
                <Text style={styles.smallMetricLabel}>Active Customers</Text>
              </View>
              
              {/* Today's Orders */}
              <View style={styles.secondaryMetricCard}>
                <View style={[styles.smallMetricIcon, { backgroundColor: Colors.info + '20' }]}>
                  <Ionicons name="today" size={20} color={Colors.info} />
                </View>
                <Text style={styles.smallMetricValue}>{formatNumber(dashboardData.todayOrders)}</Text>
                <Text style={styles.smallMetricLabel}>Today's Orders</Text>
              </View>
              
              {/* Pending */}
              <View style={styles.secondaryMetricCard}>
                <View style={[styles.smallMetricIcon, { backgroundColor: Colors.warning + '20' }]}>
                  <Ionicons name="time" size={20} color={Colors.warning} />
                </View>
                <Text style={styles.smallMetricValue}>{formatNumber(dashboardData.pendingOrders)}</Text>
                <Text style={styles.smallMetricLabel}>Pending Orders</Text>
              </View>
              
              {/* Monthly Revenue */}
              <View style={styles.secondaryMetricCard}>
                <View style={[styles.smallMetricIcon, { backgroundColor: Colors.success + '20' }]}>
                  <Ionicons name="calendar" size={20} color={Colors.success} />
                </View>
                <Text style={styles.smallMetricValue}>{formatCurrency(dashboardData.monthlyRevenue)}</Text>
                <Text style={styles.smallMetricLabel}>Monthly Revenue</Text>
              </View>
            </View>
          </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => tabNavigation.navigate('AdminOrders')}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="receipt" size={24} color="#54a9f7" />
              </View>
              <Text style={styles.actionText}>Manage Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => tabNavigation.navigate('AdminInventory')}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="cube" size={24} color="#4CAF50" />
              </View>
              <Text style={styles.actionText}>Inventory</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => tabNavigation.navigate('AdminUsers')}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="people" size={24} color="#FF9800" />
              </View>
              <Text style={styles.actionText}>Customers</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => tabNavigation.navigate('AdminReports')}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="analytics" size={24} color="#9C27B0" />
              </View>
              <Text style={styles.actionText}>Reports</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Orders Section */}
        {recentOrders && recentOrders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            {(recentOrders || []).map((order, index) => (
              <View key={`${order.id || 'order'}-${index}-${order.timestamp || Date.now()}`} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View style={styles.orderInfo}>
                    <Text style={styles.customerName}>{order.customerName}</Text>
                    <Text style={styles.orderTime}>
                      {new Date(order.timestamp || order.orderDate || order.createdAt).toLocaleString()}
                    </Text>
                  </View>
                  <View style={[
                    styles.statusBadge, 
                    { backgroundColor: order.status === 'pending_verification' ? '#FF9800' : '#f44336' }
                  ]}>
                    <Text style={styles.statusText}>
                      {order.status === 'pending_verification' ? 'Pending' : order.status}
                    </Text>
                  </View>
                </View>
                <View style={styles.orderDetails}>
                  <Text style={styles.productName}>{order.productName}</Text>
                  <View style={styles.orderMeta}>
                    <Text style={styles.quantityText}>{order.quantity}{order.unitType === 'crate' ? ' crates' : 'L'}</Text>
                    <Text style={styles.amountText}>{formatCurrency(order.totalAmount)}</Text>
                  </View>
                </View>
              </View>
            ))}
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => tabNavigation.navigate('AdminOrders')}
            >
              <Text style={styles.viewAllButtonText}>View All Orders</Text>
              <Ionicons name="arrow-forward" size={16} color="#54a9f7" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      </SafeAreaView>
    </AuthGuard>
  );
};

const styles = StyleSheet.create({
  // Modern Container
  modernContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  // Loading State Styles
  loadingHeader: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  
  loadingHeaderContent: {
    alignItems: 'center',
  },
  
  adminBranding: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  adminBrandText: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
    color: Colors.white,
    marginLeft: 12,
  },
  
  modernLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  
  loadingCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    maxWidth: 320,
    width: '100%',
  },
  
  loadingIconContainer: {
    backgroundColor: Colors.primaryExtraLight,
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  
  modernLoadingTitle: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  
  modernLoadingSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 21,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  
  // Admin Header Styles
  adminHeaderGradient: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  
  adminHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  
  adminWelcomeSection: {
    flex: 1,
  },
  
  adminLogoContainer: {
    backgroundColor: Colors.white + '20',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  
  adminBrandInfo: {
    justifyContent: 'center',
  },
  
  adminRoleText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 21,
    color: Colors.white,
    opacity: 0.9,
  },
  
  lastUpdatedText: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 17,
    letterSpacing: 0.25,
    color: Colors.white,
    opacity: 0.8,
    marginTop: 12,
  },
  
  adminHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  
  headerActionButton: {
    backgroundColor: Colors.white + '20',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: Colors.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
    letterSpacing: 0.25,
    color: Colors.white,
  },
  
  // Modern Scroll View
  modernScrollView: {
    flex: 1,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: Colors.background,
  },
  
  // Business Metrics Section
  businessMetricsSection: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
  },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  
  modernStatsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  
  primaryMetricCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  
  metricCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  metricTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
    letterSpacing: 0.25,
  },
  
  metricValue: {
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
    letterSpacing: -0.25,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  
  metricLabel: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  
  metricSubtext: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 17,
    letterSpacing: 0.25,
    color: Colors.textSecondary,
  },
  
  secondaryMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  
  secondaryMetricCard: {
    width: (width - 52) / 2,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  
  smallMetricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  smallMetricValue: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 25,
    color: Colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  
  smallMetricLabel: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    letterSpacing: 0.25,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationIndicator: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF6B00',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  statCard: {
    width: '47%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  actionItem: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  orderInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  orderTime: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  orderDetails: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  orderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 14,
    color: '#666',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    gap: 8,
  },
  viewAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#54a9f7',
  },
});

export default AdminDashboard;
