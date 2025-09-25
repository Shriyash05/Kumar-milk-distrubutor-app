import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';

class RoleService {
  // Check if user has specific role
  async hasRole(requiredRole) {
    try {
      const userRole = await SecureStore.getItemAsync('userRole');
      return userRole === requiredRole;
    } catch (error) {
      console.error('Error checking role:', error);
      return false;
    }
  }

  // Check if user is admin
  async isAdmin() {
    return await this.hasRole('admin');
  }

  // Check if user is customer
  async isCustomer() {
    return await this.hasRole('customer');
  }

  // Prevent admin from accessing customer screens
  async preventAdminAccess(navigation, screenName) {
    const isAdmin = await this.isAdmin();
    if (isAdmin) {
      console.log(`🚫 Admin tried to access customer screen: ${screenName}`);
      Toast.show({
        type: 'error',
        text1: 'Access Restricted',
        text2: 'This feature is only available to customers',
      });
      // Navigate back or to admin dashboard
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.replace('AdminMain');
      }
      return true; // Access was prevented
    }
    return false; // Access allowed
  }

  // Prevent customer from accessing admin screens
  async preventCustomerAccess(navigation, screenName) {
    const isCustomer = await this.isCustomer();
    if (isCustomer) {
      console.log(`🚫 Customer tried to access admin screen: ${screenName}`);
      Toast.show({
        type: 'error',
        text1: 'Access Denied',
        text2: 'Admin privileges required',
      });
      // Navigate back or to customer dashboard
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.replace('CustomerMain');
      }
      return true; // Access was prevented
    }
    return false; // Access allowed
  }

  // Get user role
  async getUserRole() {
    try {
      return await SecureStore.getItemAsync('userRole');
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }

  // Check authentication and role
  async checkAuthAndRole() {
    try {
      const token = await SecureStore.getItemAsync('authToken') || await SecureStore.getItemAsync('token');
      const role = await SecureStore.getItemAsync('userRole');
      
      return {
        isAuthenticated: !!token,
        role: role,
        isAdmin: role === 'admin',
        isCustomer: role === 'customer'
      };
    } catch (error) {
      console.error('Error checking auth and role:', error);
      return {
        isAuthenticated: false,
        role: null,
        isAdmin: false,
        isCustomer: false
      };
    }
  }

  // Navigate to appropriate main screen based on role
  async navigateToRoleBasedMain(navigation) {
    const { isAuthenticated, isAdmin, isCustomer } = await this.checkAuthAndRole();
    
    if (!isAuthenticated) {
      navigation.replace('Landing');
      return;
    }

    if (isAdmin) {
      navigation.replace('AdminMain');
    } else if (isCustomer) {
      navigation.replace('CustomerMain');
    } else {
      // Unknown role, logout
      await this.clearAuth();
      navigation.replace('Landing');
    }
  }

  // Clear authentication data
  async clearAuth() {
    try {
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('userRole');
      await SecureStore.deleteItemAsync('userData');
      await SecureStore.deleteItemAsync('loginTimestamp');
    } catch (error) {
      console.error('Error clearing auth:', error);
    }
  }
}

export default new RoleService();