import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import simpleAuthService from '../services/simpleAuthService';
import { Colors } from '../theme';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  // State management with clear naming
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Refs for proper input field management
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  
  // Auto-focus email field when screen loads with proper timing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (emailRef.current) {
        emailRef.current.focus();
      }
    }, 300); // Reduced delay for better UX
    
    return () => clearTimeout(timer);
  }, []);

  // Email validation with proper regex
  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Streamlined login handling with proper validation
  const handleLogin = async () => {
    // Input validation with specific error messages
    if (!email.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Email Required',
        text2: 'Please enter your email address.',
      });
      emailRef.current?.focus();
      return;
    }
    
    if (!validateEmail(email)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Email',
        text2: 'Please enter a valid email address.',
      });
      emailRef.current?.focus();
      return;
    }

    if (!password) {
      Toast.show({
        type: 'error',
        text1: 'Password Required',
        text2: 'Please enter your password.',
      });
      passwordRef.current?.focus();
      return;
    }
    
    if (password.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Password',
        text2: 'Password must be at least 6 characters.',
      });
      passwordRef.current?.focus();
      return;
    }

    // Show loading state
    setLoading(true);

    try {
      // Attempt login with error handling
      const result = await simpleAuthService.login(email.trim(), password);
      
      if (result.success) {
        // Success notification
        Toast.show({
          type: 'success',
          text1: 'Login Successful',
          text2: `Welcome back, ${result.user.name}!`,
        });

        // Role-based navigation with proper routing
        const userRole = result.user.role?.toLowerCase?.() || result.user.role;
        if (userRole === 'admin' || userRole === 'administrator') {
          navigation.replace('AdminMain');
        } else {
          navigation.replace('CustomerMain');
        }
      } else {
        // Error handling with specific message
        Toast.show({
          type: 'error',
          text1: 'Login Failed',
          text2: result.error || 'Invalid credentials. Please try again.',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      Toast.show({
        type: 'error',
        text1: 'Login Error',
        text2: error.message || 'Connection error. Please try again.',
      });
    } finally {
      setLoading(false); // Always reset loading state
    }
  };

  // New bulletproof UI with guaranteed visibility
  return (
    <SafeAreaView style={{
      flex: 1,
      backgroundColor: Colors.white // Pure white background for visibility
    }}>
      {/* Status bar with safe colors */}
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      {/* Company header with high contrast */}
      <View style={{
        width: '100%',
        backgroundColor: Colors.primary,
        paddingVertical: 24,
        paddingHorizontal: 20,
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}>
        {/* Back button with guaranteed visibility */}
        <TouchableOpacity 
          style={{
            position: 'absolute',
            left: 16,
            top: 24,
            width: 40, 
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.3)',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        {/* Company logo with clear visibility */}
        <View style={{
          alignItems: 'center',
        }}>
          {/* Logo icon with high visibility */}
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 5,
            position: 'relative',
          }}>
            <Ionicons name="nutrition" size={40} color={Colors.primary} />
            
            {/* EST badge */}
            <View style={{
              position: 'absolute',
              top: -5,
              right: -5,
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: Colors.accent,
              borderWidth: 2,
              borderColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 8,
                fontWeight: '800',
                textAlign: 'center',
                lineHeight: 9,
              }}>EST</Text>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 10,
                fontWeight: '800',
                textAlign: 'center',
                lineHeight: 11,
              }}>1999</Text>
            </View>
          </View>
          
          {/* Company name - high contrast white text */}
          <Text style={{
            color: '#FFFFFF',
            fontSize: 24,
            fontWeight: '800',
            textAlign: 'center',
            textShadowColor: 'rgba(0,0,0,0.2)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          }}>Kumar Milk</Text>
          
          {/* Company tagline - high visibility */}
          <Text style={{
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: '500',
            textAlign: 'center',
            opacity: 0.9,
          }}>Distributors</Text>
        </View>
      </View>
      
      {/* Main content with keyboard handling */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            padding: 20,
            paddingTop: 30,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Login form with guaranteed visibility */}
          <View style={{
            backgroundColor: '#FFFFFF', // Pure white background
            borderRadius: 12,
            padding: 24,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 2,
            borderWidth: 1,
            borderColor: '#E5E7EB', // Light gray border
          }}>
            <View style={{ marginBottom: 28 }}>
              {/* Form title - pure black text */}
              <Text style={{
                fontSize: 24, 
                fontWeight: '700',
                color: '#000000', // Pure black for maximum visibility
                textAlign: 'center',
                marginBottom: 8,
              }}>Welcome Back</Text>
              
              {/* Form subtitle - dark gray for readability */}
              <Text style={{
                fontSize: 16,
                color: '#374151', // Dark gray for contrast
                textAlign: 'center',
                lineHeight: 22,
              }}>Sign in to your account to continue</Text>
            </View>
            
            {/* Form fields container */}
            <View style={{ gap: 20 }}>
              {/* Email field */}
              <View>
                {/* Field label - black text */}
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#000000', // Pure black
                  marginBottom: 8,
                }}>Email Address</Text>
                
                {/* Input wrapper with border */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#FFFFFF', // Pure white
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#D1D5DB', // Medium gray border
                  paddingHorizontal: 16,
                  height: 52,
                }}>
                  {/* Icon */}
                  <Ionicons name="mail" size={20} color="#6B7280" />
                  
                  {/* Input field with black text */}
                  <TextInput
                    ref={emailRef}
                    style={{
                      flex: 1,
                      fontSize: 16,
                      color: '#000000', // Pure black text
                      paddingLeft: 12,
                      height: '100%',
                    }}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email address"
                    placeholderTextColor="#9CA3AF" // Medium gray placeholder
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    textContentType="emailAddress"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>
              </View>

              {/* Password field */}
              <View>
                {/* Field label - black text */}
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#000000', // Pure black
                  marginBottom: 8,
                }}>Password</Text>
                
                {/* Input wrapper with border */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#FFFFFF', // Pure white
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#D1D5DB', // Medium gray border
                  paddingHorizontal: 16,
                  height: 52,
                  position: 'relative', // For positioning the eye icon
                }}>
                  {/* Icon */}
                  <Ionicons name="lock-closed" size={20} color="#6B7280" />
                  
                  {/* Input field with black text */}
                  <TextInput
                    ref={passwordRef}
                    style={{
                      flex: 1,
                      fontSize: 16,
                      color: '#000000', // Pure black text
                      paddingLeft: 12,
                      paddingRight: 40, // Make room for the eye icon
                      height: '100%',
                    }}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor="#9CA3AF" // Medium gray placeholder
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="password"
                    textContentType="password"
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                  
                  {/* Password visibility toggle */}
                  <TouchableOpacity
                    style={{
                      position: 'absolute',
                      right: 16,
                      height: '100%',
                      justifyContent: 'center',
                    }}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye' : 'eye-off'}
                      size={20}
                      color="#6B7280" // Medium gray
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Login button - high contrast blue with white text */}
              <TouchableOpacity
                style={{
                  backgroundColor: Colors.primary, // Strong blue
                  borderRadius: 8,
                  height: 52,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: 12,
                  shadowColor: Colors.primary,
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 3,
                  opacity: loading ? 0.8 : 1, // Dim when loading
                }}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '700', // Bold text
                      color: '#FFFFFF', // Pure white for contrast
                    }}>Signing In...</Text>
                  </View>
                ) : (
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '700', // Bold text
                    color: '#FFFFFF', // Pure white for contrast
                  }}>Sign In</Text>
                )}
              </TouchableOpacity>

              {/* Register link - clear visible text */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 24,
              }}>
                <Text style={{
                  fontSize: 14,
                  color: '#374151', // Dark gray for visibility
                }}>Don't have an account? </Text>
                
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '700', // Bold for emphasis
                    color: Colors.primary, // Blue color for link
                  }}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  inner: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  showPasswordText: { color: 'blue', textAlign: 'right', marginBottom: 15 },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  registerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  registerText: { color: '#2196F3', fontWeight: 'bold' },
});

export default LoginScreen;
