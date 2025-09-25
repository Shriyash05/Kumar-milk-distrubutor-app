/**
 * Authentication Cleaner Utility
 * Use this to clear all stored authentication data and force fresh login
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const clearAllAuthData = async () => {
  try {
    console.log('🧹 Clearing all authentication data...');
    
    // Clear SecureStore tokens
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('authToken'); 
    await SecureStore.deleteItemAsync('userRole');
    await SecureStore.deleteItemAsync('userData');
    await SecureStore.deleteItemAsync('loginTimestamp');
    
    // Clear AsyncStorage data
    await AsyncStorage.removeItem('userData');
    await AsyncStorage.removeItem('userRole');
    await AsyncStorage.removeItem('authToken');
    
    console.log('✅ All authentication data cleared');
    return true;
  } catch (error) {
    console.error('❌ Error clearing auth data:', error);
    return false;
  }
};

export const clearAuthAndReload = async () => {
  await clearAllAuthData();
  
  // Force app reload (requires manual restart in Expo Go)
  console.log('🔄 Please restart the app to complete the authentication reset');
  
  // In development, you can uncomment this to reload:
  // import { Updates } from 'expo-updates';
  // await Updates.reloadAsync();
};

export default {
  clearAllAuthData,
  clearAuthAndReload
};