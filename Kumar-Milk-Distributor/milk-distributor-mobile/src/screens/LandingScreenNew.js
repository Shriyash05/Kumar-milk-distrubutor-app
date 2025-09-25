import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from '@react-navigation/native';
import simpleAuthService from '../services/simpleAuthService';
import Toast from 'react-native-toast-message';

const { width, height } = Dimensions.get('window');

const LandingScreenNew = ({ navigation }) => {
  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Initialize screen
  useEffect(() => {
    initializeScreen();
  }, []);

  // Refresh on focus
  useFocusEffect(
    React.useCallback(() => {
      initializeScreen();
    }, [])
  );

  // ==================== Initialization ====================
  const initializeScreen = async () => {
    setLoading(true);
    try {
      // Check authentication first
      await checkAuthStatus();

      // Only load products if user is authenticated
      if (isAuthenticated) {
        await loadProducts();
      } else {
        // Guest: fallback products only
        const fallbackProducts = [
          { id: 'milk-1', name: 'Fresh Cow Milk', price: 60, unit: 'liter', category: 'milk', description: 'Pure and fresh cow milk delivered daily', isAvailable: true, image: '🥛' },
          { id: 'milk-2', name: 'Buffalo Milk', price: 80, unit: 'liter', category: 'milk', description: 'Rich and creamy buffalo milk', isAvailable: true, image: '🐃' },
          { id: 'dairy-1', name: 'Fresh Butter', price: 350, unit: 'kg', category: 'dairy', description: 'Homemade fresh butter from pure cream', isAvailable: true, image: '🧈' },
        ];
        setProducts(fallbackProducts);
        setFeaturedProducts(fallbackProducts);
      }
    } catch (error) {
      console.error('❌ LandingScreen: Initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==================== Authentication ====================
  const checkAuthStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const role = await SecureStore.getItemAsync('userRole');
      
      setIsAuthenticated(!!token);
      setUserRole(role);
      
      console.log('🔐 Auth Status:', { authenticated: !!token, role });

      // Auto-redirect if authenticated
      if (token && role) {
        setTimeout(() => {
          if (role === 'admin') navigation.replace('AdminMain');
          else navigation.replace('CustomerMain');
        }, 100);
      }
    } catch (error) {
      console.error('❌ Auth check error:', error);
      setIsAuthenticated(false);
      setUserRole(null);
    }
  };

  // ==================== Products ====================
  const getProductEmoji = (category, name) => {
    if (!category && !name) return '🥛';
    const categoryLower = (category || '').toLowerCase();
    const nameLower = (name || '').toLowerCase();

    if (categoryLower.includes('dairy') || nameLower.includes('milk')) {
      if (nameLower.includes('buffalo')) return '🐃';
      if (nameLower.includes('cow')) return '🥛';
      if (nameLower.includes('toned')) return '🥛';
      if (nameLower.includes('cream')) return '🧈';
      return '🥛';
    }
    return '🥛';
  };

  const loadProducts = async () => {
    try {
      const response = await simpleAuthService.makeRequest('/products', { method: 'GET', requireAuth: false });
      if (response?.success && Array.isArray(response.products)) {
        const processedProducts = response.products.map(product => ({
          id: product._id,
          name: product.name,
          price: product.price,
          unit: product.unit || 'piece',
          category: product.category,
          description: product.description,
          isAvailable: true,
          image: getProductEmoji(product.category, product.name),
        }));

        const featured = processedProducts.slice(0, 3);
        setProducts(processedProducts);
        setFeaturedProducts(featured);
      } else {
        console.warn('⚠️ Products API returned invalid data, using fallback');
      }
    } catch (error) {
      console.warn('⚠️ Products API failed, using fallback:', error.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await initializeScreen();
    setRefreshing(false);
  };

  const navigateToLogin = () => navigation.navigate('Login');
  const navigateToRegister = () => navigation.navigate('Register');

  const viewAllProducts = () => {
    if (isAuthenticated) navigation.navigate('CustomerMain', { screen: 'Products' });
    else {
      Toast.show({ type: 'info', text1: 'Login Required', text2: 'Please login to view all products' });
      navigateToLogin();
    }
  };

  const placeOrder = (product) => {
    if (isAuthenticated) {
      navigation.navigate('CustomerMain', { screen: 'Dashboard', params: { screen: 'PlaceOrder', params: { selectedProduct: product } } });
    } else {
      Toast.show({ type: 'info', text1: 'Login Required', text2: 'Please login to place an order' });
      navigateToLogin();
    }
  };

  // ==================== Rendering Sections ====================
  const renderHeroSection = () => (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.heroSection}>
      <View style={styles.heroContent}>
        <View style={styles.brandContainer}>
          <Ionicons name="nutrition" size={48} color="#fff" />
          <Text style={styles.brandName}>Kumar Milk</Text>
          <Text style={styles.brandTagline}>Pure & Fresh Dairy Products</Text>
        </View>
      </View>
    </LinearGradient>
  );

  const renderAuthButtons = () => {
    if (isAuthenticated) return null;
    return (
      <View style={styles.authSection}>
        <Text style={styles.authTitle}>Get Started Today!</Text>
        <Text style={styles.authSubtitle}>Join thousands of satisfied customers</Text>
        <View style={styles.authButtons}>
          <TouchableOpacity style={styles.loginButton} onPress={navigateToLogin}>
            <Ionicons name="log-in-outline" size={20} color="#fff" />
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.registerButton} onPress={navigateToRegister}>
            <Ionicons name="person-add-outline" size={20} color="#667eea" />
            <Text style={styles.registerButtonText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderFeaturedProducts = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🌟 Featured Products</Text>
        <TouchableOpacity onPress={viewAllProducts}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productScroll}>
        {featuredProducts.map((product, index) => (
          <View key={product.id || index} style={styles.productCard}>
            <View style={styles.productImage}>
              <Text style={styles.productEmoji}>{product.image || '🥛'}</Text>
            </View>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productDescription} numberOfLines={2}>{product.description}</Text>
            <View style={styles.productFooter}>
              <Text style={styles.productPrice}>₹{product.price}/{product.unit}</Text>
              <TouchableOpacity style={styles.orderButton} onPress={() => placeOrder(product)}>
                <Ionicons name="add" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  // ==================== Loading / Main Render ====================
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading Kumar Milk...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {renderHeroSection()}
        {renderAuthButtons()}
        {isAuthenticated && renderFeaturedProducts()}
      </ScrollView>
    </SafeAreaView>
  );
};

// ==================== Styles (same as your original) ====================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666', fontWeight: '500' },
  scrollView: { flex: 1 },

  // Hero Section
  heroSection: { minHeight: height * 0.4, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 40 },
  heroContent: { alignItems: 'center', width: '100%' },
  brandContainer: { alignItems: 'center', marginBottom: 40 },
  brandName: { fontSize: 36, fontWeight: 'bold', color: '#fff', marginTop: 16 },
  brandTagline: { fontSize: 16, color: 'rgba(255,255,255,0.9)', marginTop: 8, textAlign: 'center' },

  // Auth Section
  authSection: { paddingHorizontal: 20, paddingVertical: 32, backgroundColor: '#fff', marginTop: -20, marginHorizontal: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  authTitle: { fontSize: 24, fontWeight: 'bold', color: '#2c3e50', textAlign: 'center', marginBottom: 8 },
  authSubtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 24 },
  authButtons: { gap: 12 },
  loginButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#667eea', paddingVertical: 16, borderRadius: 12, gap: 8 },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  registerButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderWidth: 2, borderColor: '#667eea', paddingVertical: 16, borderRadius: 12, gap: 8 },
  registerButtonText: { color: '#667eea', fontSize: 16, fontWeight: '600' },

  // Products
  section: { paddingHorizontal: 20, paddingVertical: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50' },
  viewAllText: { color: '#667eea', fontSize: 16, fontWeight: '600' },
  productScroll: { marginHorizontal: -8 },
  productCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginHorizontal: 8, width: width * 0.7, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  productImage: { alignItems: 'center', marginBottom: 12 },
  productEmoji: { fontSize: 48 },
  productName: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginBottom: 8 },
  productDescription: { fontSize: 14, color: '#666', marginBottom: 12, lineHeight: 20 },
  productFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPrice: { fontSize: 16, fontWeight: 'bold', color: '#4CAF50' },
  orderButton: { backgroundColor: '#667eea', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
});

export default LandingScreenNew;
