import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import simpleAuthService from '../services/simpleAuthService';
import Toast from 'react-native-toast-message';

const ProfileScreen = ({ navigation }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const currentUser = await simpleAuthService.getCurrentUser();
      
      if (currentUser) {
        setUserInfo({
          name: currentUser.name || currentUser.email || 'User',
          email: currentUser.email || 'Not provided',
          phone: currentUser.phone || 'Not provided',
          address: currentUser.address || 'Not provided',
          memberSince: currentUser.createdAt 
            ? new Date(currentUser.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long'
              })
            : 'Recently',
        });
      } else {
        // If no user data, redirect to login
        Toast.show({
          type: 'error',
          text1: 'Not Logged In',
          text2: 'Please login to view your profile.',
        });
        navigation.replace('Landing');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load user data.',
      });
      // Use fallback data
      setUserInfo({
        name: 'User',
        email: 'Not available',
        phone: 'Not available',
        address: 'Not available',
        memberSince: 'Recently',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚪 Starting logout process...');
              
              // Clear all authentication data
              await SecureStore.deleteItemAsync('token');
              await SecureStore.deleteItemAsync('authToken');
              await SecureStore.deleteItemAsync('userRole');
              await SecureStore.deleteItemAsync('userData');
              await SecureStore.deleteItemAsync('loginTimestamp');
              
              console.log('🚪 Authentication data cleared');
              
              // Show success message
              Toast.show({
                type: 'success',
                text1: 'Logged Out',
                text2: 'You have been successfully logged out.',
                visibilityTime: 2000,
              });
              
              // Navigate to Landing screen
              console.log('🚪 Navigating to Landing screen...');
              navigation.reset({
                index: 0,
                routes: [{ name: 'Landing' }],
              });
              
            } catch (error) {
              console.error('Logout error:', error);
              Toast.show({
                type: 'error',
                text1: 'Logout Failed',
                text2: 'There was an issue logging out. Please try again.',
              });
            }
          },
        },
      ]
    );
  };

  const ProfileItem = ({ icon, title, value, onPress, showArrow = true }) => (
    <TouchableOpacity 
      style={styles.profileItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.profileItemLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color="#54a9f7" />
        </View>
        <View style={styles.profileItemInfo}>
          <Text style={styles.profileItemTitle}>{title}</Text>
          {value && <Text style={styles.profileItemValue}>{value}</Text>}
        </View>
      </View>
      {showArrow && onPress && (
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#54a9f7" />
          <Text style={{ marginTop: 16, color: '#666' }}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userInfo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
          <Text style={{ marginTop: 16, color: '#666', textAlign: 'center' }}>Unable to load profile data</Text>
          <TouchableOpacity 
            style={{ marginTop: 16, padding: 12, backgroundColor: '#54a9f7', borderRadius: 8 }}
            onPress={loadUserData}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#54a9f7" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userInfo.name}</Text>
            <Text style={styles.userEmail}>{userInfo.email}</Text>
            <Text style={styles.memberSince}>Member since {userInfo.memberSince}</Text>
          </View>
        </View>

        {/* Profile Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <ProfileItem
            icon="person-outline"
            title="Full Name"
            value={userInfo.name}
            onPress={() => {}}
          />
          
          <ProfileItem
            icon="mail-outline"
            title="Email"
            value={userInfo.email}
            onPress={() => {}}
          />
          
          <ProfileItem
            icon="call-outline"
            title="Phone Number"
            value={userInfo.phone}
            onPress={() => {}}
          />
          
          <ProfileItem
            icon="location-outline"
            title="Address"
            value={userInfo.address}
            onPress={() => {}}
          />
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          <ProfileItem
            icon="notifications-outline"
            title="Notifications"
            onPress={() => {}}
          />
          
          <ProfileItem
            icon="shield-outline"
            title="Privacy & Security"
            onPress={() => {}}
          />
          
          <ProfileItem
            icon="help-circle-outline"
            title="Help & Support"
            onPress={() => {}}
          />
          
          <ProfileItem
            icon="information-circle-outline"
            title="About"
            onPress={() => {}}
          />
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <ProfileItem
            icon="log-out-outline"
            title="Logout"
            onPress={handleLogout}
            showArrow={false}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
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
  userCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  avatar: {
    width: 80,
    height: 80,
    backgroundColor: '#f0f8ff',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 12,
    color: '#999',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#f0f8ff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileItemInfo: {
    flex: 1,
  },
  profileItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  profileItemValue: {
    fontSize: 14,
    color: '#666',
  },
});

export default ProfileScreen;