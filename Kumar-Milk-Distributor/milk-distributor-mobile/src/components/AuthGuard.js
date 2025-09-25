import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import simpleAuthService from '../services/simpleAuthService';
import Toast from 'react-native-toast-message';

const AuthGuard = ({ children, requiredRole, navigation, fallbackScreen = 'Landing' }) => {
  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const isAuthenticated = await simpleAuthService.isAuthenticated();
      
      if (!isAuthenticated) {
        Toast.show({
          type: 'error',
          text1: 'Access Denied',
          text2: 'Please login to continue',
        });
        navigation.replace('Landing');
        return;
      }

      if (requiredRole) {
        const currentUser = await simpleAuthService.getCurrentUser();
        
        if (!currentUser || currentUser.role !== requiredRole) {
          Toast.show({
            type: 'error',
            text1: 'Access Denied',
            text2: 'You do not have permission to access this feature',
          });
          
          // Redirect based on user's actual role
          if (currentUser?.role === 'admin') {
            navigation.replace('AdminMain');
          } else {
            navigation.replace('CustomerMain');
          }
          return;
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      Toast.show({
        type: 'error',
        text1: 'Authentication Error',
        text2: 'Please login again',
      });
      navigation.replace(fallbackScreen);
    }
  };

  return children;
};

export default AuthGuard;