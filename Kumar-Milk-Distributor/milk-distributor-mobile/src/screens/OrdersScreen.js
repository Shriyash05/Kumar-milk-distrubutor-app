import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';

const OrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Safe number formatting utility
  const formatNumber = (value, decimals = 2) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '0' + (decimals > 0 ? '.' + '0'.repeat(decimals) : '');
    }
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0' + (decimals > 0 ? '.' + '0'.repeat(decimals) : '');
    return decimals > 0 ? num.toFixed(decimals) : Math.round(num).toString();
  };
  
  const formatCurrency = (value) => {
    return '₹' + formatNumber(value, 2);
  };

  const fetchOrders = async () => {
    try {
      console.log('OrdersScreen: Fetching all orders for admin view...');
      // Get all orders from AsyncStorage for admin view
      const ordersData = await AsyncStorage.getItem('pendingOrders');
      
      if (ordersData) {
        const allOrders = JSON.parse(ordersData);
        
        // Sort orders by date (newest first) - show ALL orders for admin
        allOrders.sort((a, b) => {
          const dateA = new Date(a.timestamp || a.orderDate || a.createdAt);
          const dateB = new Date(b.timestamp || b.orderDate || b.createdAt);
          return dateB - dateA;
        });

        console.log('OrdersScreen: All orders loaded for admin:', allOrders.length);
        setOrders(allOrders);
      } else {
        console.log('OrdersScreen: No orders found');
        setOrders([]);
      }
    } catch (error) {
      console.error('OrdersScreen: Error loading orders:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load orders',
      });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  // Use focus effect to refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('OrdersScreen: Screen focused, refreshing orders...');
      fetchOrders();
    }, [])
  );

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'pending_verification':
        return { name: 'time-outline', color: '#FF9800' };
      case 'confirmed':
      case 'approved':
        return { name: 'checkmark-circle-outline', color: '#4CAF50' };
      case 'delivered':
        return { name: 'checkmark-done-outline', color: '#2196F3' };
      case 'cancelled':
      case 'rejected':
        return { name: 'close-circle-outline', color: '#f44336' };
      default:
        return { name: 'help-circle-outline', color: '#666' };
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending_verification':
        return 'Pending Verification';
      case 'pending':
        return 'Pending';
      case 'confirmed':
      case 'approved':
        return 'Confirmed';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      case 'rejected':
        return 'Rejected';
      default:
        return status || 'Unknown';
    }
  };

  const renderOrderItem = ({ item }) => {
    const statusIcon = getStatusIcon(item.status);
    const orderDate = new Date(item.timestamp || item.orderDate || item.createdAt);
    
    // Handle both single product and multi-product orders
    const isMultiProduct = item.items && Array.isArray(item.items);
    const displayTitle = isMultiProduct 
      ? `${item.items.length} Product${item.items.length > 1 ? 's' : ''}`
      : item.productName || 'Product';
    const displayQuantity = isMultiProduct 
      ? item.items.reduce((sum, i) => sum + (i.quantity || 0), 0)
      : item.quantity || 0;

    return (
      <TouchableOpacity 
        style={styles.orderCard}
        onPress={() => navigation.navigate('MyOrders')}
      >
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>Order #{(item.id || '').slice(-6) || 'N/A'}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: statusIcon.color }
          ]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
        
        <Text style={styles.customerName}>Customer: {item.customerName || 'Unknown'}</Text>
        <Text style={styles.orderDate}>{orderDate.toLocaleDateString()}</Text>
        
        <View style={styles.orderDetails}>
          <Text style={styles.productInfo}>
            {displayTitle} ({displayQuantity} {isMultiProduct ? 'items' : item.unitType === 'crate' ? 'crates' : 'L'})
          </Text>
          <Text style={styles.orderAmount}>{formatCurrency(item.totalAmount)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>All Orders</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="refresh" size={20} color="#54a9f7" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Orders</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={20} color="#54a9f7" />
        </TouchableOpacity>
      </View>

      {orders.length === 0 ? (
        <ScrollView 
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Ionicons name="receipt-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No Orders Found</Text>
          <Text style={styles.emptyMessage}>
            Customer orders will appear here when they are placed
          </Text>
        </ScrollView>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item, index) => item._id || item.id || `order_${index}_${Date.now()}`}
          style={styles.ordersList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.ordersContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  filterButton: {
    padding: 8,
  },
  ordersList: {
    flex: 1,
  },
  ordersContainer: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  customerName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productInfo: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#54a9f7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
  },
  placeOrderButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  placeOrderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OrdersScreen;
