import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import simpleAuthService from '../services/simpleAuthService';
import * as SecureStore from 'expo-secure-store';
import AuthGuard from '../components/AuthGuard';

const AdminUsersScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    // Filter users based on search text
    if (searchText.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchText.toLowerCase()) ||
        user.phone?.includes(searchText)
      );
      setFilteredUsers(filtered);
    }
  }, [searchText, users]);

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

      loadUsers();
    } catch (error) {
      console.error('Admin access check error:', error);
      navigation.replace('Landing');
    }
  };

  const loadUsers = async () => {
    try {
      console.log('Loading users from database...');
      
      // Try to load users from the backend
      const response = await simpleAuthService.makeRequest('/admin/users');
      let allUsers = [];
      
      if (response && response.users && Array.isArray(response.users)) {
        allUsers = response.users;
      } else if (response && Array.isArray(response)) {
        // Handle direct array response
        allUsers = response;
      } else {
        console.log('No users endpoint available, trying to get from orders...');
        
        // Fallback: Extract unique users from orders
        try {
          const ordersResponse = await simpleAuthService.makeRequest('/admin/orders');
          let orders = [];
          
          if (ordersResponse && ordersResponse.orders && Array.isArray(ordersResponse.orders)) {
            orders = ordersResponse.orders;
          } else if (ordersResponse && Array.isArray(ordersResponse)) {
            orders = ordersResponse;
          }
          
          // Extract unique customers from orders
          const customerMap = new Map();
          orders.forEach(order => {
            const customerEmail = order.customer?.email || order.customerEmail;
            const customerName = order.customer?.name || order.customerName || 'Unknown Customer';
            const customerPhone = order.customer?.phone || order.customerPhone || '';
            
            if (customerEmail && !customerMap.has(customerEmail)) {
              customerMap.set(customerEmail, {
                _id: customerEmail, // Use email as ID since we don't have user IDs
                name: customerName,
                email: customerEmail,
                phone: customerPhone,
                role: 'customer',
                createdAt: order.createdAt || order.orderDate || order.timestamp,
                address: order.address || '',
                orderCount: 1
              });
            } else if (customerEmail && customerMap.has(customerEmail)) {
              // Update order count
              const existingUser = customerMap.get(customerEmail);
              existingUser.orderCount = (existingUser.orderCount || 1) + 1;
              customerMap.set(customerEmail, existingUser);
            }
          });
          
          allUsers = Array.from(customerMap.values());
          console.log('Extracted', allUsers.length, 'unique customers from orders');
        } catch (ordersError) {
          console.log('Could not extract users from orders:', ordersError.message);
          allUsers = [];
        }
      }
      
      // Sort users by creation date (newest first)
      const sortedUsers = allUsers.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.timestamp || Date.now());
        const dateB = new Date(b.createdAt || b.timestamp || Date.now());
        return dateB - dateA;
      });
      
      setUsers(sortedUsers);
      console.log('Successfully loaded', sortedUsers.length, 'users');
      
      if (sortedUsers.length === 0) {
        Toast.show({
          type: 'info',
          text1: 'No Users Found',
          text2: 'No users have registered yet',
        });
      }
      
    } catch (error) {
      console.error('Error loading users:', error);
      Toast.show({
        type: 'error',
        text1: 'Loading Error',
        text2: 'Failed to load users. Please try again.',
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const handleUserAction = (user) => {
    Alert.alert(
      'User Details',
      `${user.name}\n\nEmail: ${user.email}${user.phone ? `\nPhone: ${user.phone}` : ''}${user.address ? `\nAddress: ${user.address}` : ''}${user.orderCount ? `\nTotal Orders: ${user.orderCount}` : ''}\nRole: ${user.role || 'customer'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'View User Orders',
          onPress: async () => {
            try {
              // Load orders for this specific user
              const ordersResponse = await simpleAuthService.makeRequest('/admin/orders');
              let orders = [];
              
              if (ordersResponse && ordersResponse.orders && Array.isArray(ordersResponse.orders)) {
                orders = ordersResponse.orders;
              } else if (ordersResponse && Array.isArray(ordersResponse)) {
                orders = ordersResponse;
              }
              
              // Filter orders for this user
              const userOrders = orders.filter(order => {
                const orderEmail = order.customer?.email || order.customerEmail;
                return orderEmail === user.email;
              });
              
              if (userOrders.length > 0) {
                const ordersSummary = (userOrders || [])
                  .slice(0, 5)
                  .map(order => {
                    const date = new Date(order.createdAt || order.orderDate || order.timestamp).toLocaleDateString();
                    const amount = `₹${parseFloat(order.totalAmount || 0).toFixed(2)}`;
                    return `${date}: ${order.productName} - ${amount} (${order.status})`;
                  })
                  .join('\n');
                
                const totalSpent = userOrders
                  .filter(o => ['confirmed', 'approved', 'delivered'].includes(o.status))
                  .reduce((sum, order) => sum + (parseFloat(order.totalAmount) || 0), 0);
                
                Alert.alert(
                  `Orders for ${user.name}`,
                  `Total Orders: ${userOrders.length}\nTotal Spent: ₹${totalSpent.toFixed(2)}\n\nRecent Orders:\n${ordersSummary}${userOrders.length > 5 ? '\n...and more' : ''}`,
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert(
                  'No Orders Found',
                  `${user.name} hasn't placed any orders yet.`,
                  [{ text: 'OK' }]
                );
              }
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to load user orders',
              });
            }
          },
        },
        {
          text: 'Contact Info',
          onPress: () => {
            const contactInfo = [
              `Name: ${user.name}`,
              `Email: ${user.email}`,
              user.phone ? `Phone: ${user.phone}` : 'Phone: Not provided',
              user.address ? `Address: ${user.address}` : 'Address: Not provided'
            ].join('\n');
            
            Alert.alert(
              'Contact Information',
              contactInfo,
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  };

  const renderUserCard = (user) => {
    const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown';
    const isAdmin = user.role === 'admin';
    
    return (
      <TouchableOpacity
        key={user._id || user.id}
        style={[styles.userCard, isAdmin && styles.adminUserCard]}
        onPress={() => handleUserAction(user)}
      >
        <View style={styles.userHeader}>
          <View style={[styles.userAvatar, isAdmin && styles.adminAvatar]}>
            <Ionicons 
              name={isAdmin ? 'shield-checkmark' : 'person'} 
              size={24} 
              color={isAdmin ? '#e74c3c' : '#54a9f7'} 
            />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.name || 'Unknown User'}</Text>
            <Text style={styles.userEmail}>{user.email || 'No email'}</Text>
            {user.phone && <Text style={styles.userPhone}>📱 {user.phone}</Text>}
            {user.address && <Text style={styles.userAddress}>📍 {user.address}</Text>}
          </View>
          <View style={styles.userMeta}>
            <View style={[styles.roleTag, { backgroundColor: isAdmin ? '#e74c3c' : '#4CAF50' }]}>
              <Text style={styles.roleText}>{user.role || 'customer'}</Text>
            </View>
            {user.orderCount && (
              <Text style={styles.orderCount}>{user.orderCount} orders</Text>
            )}
            <Text style={styles.joinDate}>Joined: {joinDate}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#54a9f7" />
          <Text style={styles.loadingText}>Loading users...</Text>
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
        <Text style={styles.title}>Users Management</Text>
        <View style={styles.headerRight}>
          <Text style={styles.userCount}>{filteredUsers.length} users</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users by name, email, or phone..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#999"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearSearch}>
            <Ionicons name="close" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Users List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>
              {searchText ? 'No matching users found' : 'No users found'}
            </Text>
            <Text style={styles.emptyText}>
              {searchText ? 'Try adjusting your search criteria' : 'Users will appear here once they register'}
            </Text>
          </View>
        ) : (
          <View style={styles.usersList}>
            {(filteredUsers || []).map(renderUserCard)}
          </View>
        )}
      </ScrollView>
      </SafeAreaView>
    </AuthGuard>
  );
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
  headerRight: {
    alignItems: 'flex-end',
  },
  userCount: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  clearSearch: {
    marginLeft: 10,
  },
  scrollView: {
    flex: 1,
  },
  usersList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: '#666',
  },
  userAddress: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  userMeta: {
    alignItems: 'flex-end',
  },
  adminUserCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  adminAvatar: {
    backgroundColor: '#ffebee',
  },
  orderCount: {
    fontSize: 12,
    color: '#54a9f7',
    fontWeight: '600',
    marginBottom: 4,
  },
  roleTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 8,
  },
  roleText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  joinDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default AdminUsersScreen;