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
  Image,
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

  // Initialize screen data
  const initializeScreen = async () => {
    setLoading(true);
    try {
      await Promise.all([
        checkAuthStatus(),
        loadProducts()
      ]);
    } catch (error) {
      console.error('❌ LandingScreen: Initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check authentication status
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
          if (role === 'admin') {
            navigation.replace('AdminMain');
          } else {
            navigation.replace('CustomerMain');
          }
        }, 100);
      }
    } catch (error) {
      console.error('❌ Auth check error:', error);
      setIsAuthenticated(false);
      setUserRole(null);
    }
  };

  // Get product emoji based on category and name
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

  // Load products
  const loadProducts = async () => {
    try {
      console.log('📦 Loading products for homepage...');
      
      // Try to load from API first
      try {
        const response = await simpleAuthService.makeRequest('/products', {
          method: 'GET',
          requireAuth: false
        });
        
        if (response?.success && response?.products && Array.isArray(response.products)) {
          // Process products similar to ProductsScreen logic
          const processedProducts = response.products.map(product => ({
            id: product._id,
            name: product.name,
            price: product.price,
            unit: product.unit || 'piece',
            category: product.category,
            description: product.description,
            isAvailable: true, // Override to show all products as available for now
            image: getProductEmoji(product.category, product.name)
          }));
          
          // Show first few products for featured section
          const featuredProducts = processedProducts.slice(0, 6);
          
          setProducts(processedProducts);
          setFeaturedProducts(featuredProducts.slice(0, 3));
          console.log('✅ Loaded', processedProducts.length, 'products from API');
          return;
        }
      } catch (apiError) {
        console.log('⚠️ API products not available, using fallback');
      }
      
      // Fallback products
      const fallbackProducts = [
        {
          id: 'milk-1',
          name: 'Fresh Cow Milk',
          price: 60,
          unit: 'liter',
          category: 'milk',
          description: 'Pure and fresh cow milk delivered daily',
          isAvailable: true,
          image: '🥛'
        },
        {
          id: 'milk-2', 
          name: 'Buffalo Milk',
          price: 80,
          unit: 'liter',
          category: 'milk',
          description: 'Rich and creamy buffalo milk',
          isAvailable: true,
          image: '🐃'
        },
        {
          id: 'dairy-1',
          name: 'Fresh Butter',
          price: 350,
          unit: 'kg',
          category: 'dairy',
          description: 'Homemade fresh butter from pure cream',
          isAvailable: true,
          image: '🧈'
        }
      ];
      
      setProducts(fallbackProducts);
      setFeaturedProducts(fallbackProducts);
      console.log('✅ Using fallback products');
      
    } catch (error) {
      console.error('❌ Error loading products:', error);
      setProducts([]);
      setFeaturedProducts([]);
    }
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await initializeScreen();
    setRefreshing(false);
  };

  // Navigate to login
  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  // Navigate to register
  const navigateToRegister = () => {
    navigation.navigate('Register');
  };

  // Navigate to products
  const viewAllProducts = () => {
    if (isAuthenticated) {
      navigation.navigate('CustomerMain', { screen: 'Products' });
    } else {
      Toast.show({
        type: 'info',
        text1: 'Login Required',
        text2: 'Please login to view all products',
      });
      navigateToLogin();
    }
  };

  // Place order
  const placeOrder = (product) => {
    if (isAuthenticated) {
      navigation.navigate('CustomerMain', { 
        screen: 'Dashboard',
        params: { screen: 'PlaceOrder', params: { selectedProduct: product } }
      });
    } else {
      Toast.show({
        type: 'info',
        text1: 'Login Required',
        text2: 'Please login to place an order',
      });
      navigateToLogin();
    }
  };

  // Render hero section
  const renderHeroSection = () => (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.heroSection}>
      <View style={styles.heroContent}>
        <View style={styles.brandContainer}>
          <Ionicons name="nutrition" size={48} color="#fff" />
          <Text style={styles.brandName}>Kumar Milk</Text>
          <Text style={styles.brandTagline}>Pure & Fresh Dairy Products</Text>
        </View>
        
        <View style={styles.heroStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>1000+</Text>
            <Text style={styles.statLabel}>Happy Customers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>5+</Text>
            <Text style={styles.statLabel}>Years Experience</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>100%</Text>
            <Text style={styles.statLabel}>Pure & Natural</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );

  // Render auth buttons
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

  // Render featured products
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
            <Text style={styles.productDescription} numberOfLines={2}>
              {product.description}
            </Text>
            <View style={styles.productFooter}>
              <Text style={styles.productPrice}>₹{product.price}/{product.unit}</Text>
              <TouchableOpacity 
                style={styles.orderButton}
                onPress={() => placeOrder(product)}
              >
                <Ionicons name="add" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  // Render features
  const renderFeatures = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🎯 Why Choose Us?</Text>
      
      <View style={styles.featuresGrid}>
        <View style={styles.featureCard}>
          <Ionicons name="shield-checkmark" size={32} color="#4CAF50" />
          <Text style={styles.featureTitle}>100% Pure</Text>
          <Text style={styles.featureDescription}>
            No chemicals or preservatives added
          </Text>
        </View>
        
        <View style={styles.featureCard}>
          <Ionicons name="time" size={32} color="#FF9800" />
          <Text style={styles.featureTitle}>Daily Fresh</Text>
          <Text style={styles.featureDescription}>
            Delivered fresh every morning
          </Text>
        </View>
        
        <View style={styles.featureCard}>
          <Ionicons name="car" size={32} color="#2196F3" />
          <Text style={styles.featureTitle}>Home Delivery</Text>
          <Text style={styles.featureDescription}>
            Free delivery to your doorstep
          </Text>
        </View>
        
        <View style={styles.featureCard}>
          <Ionicons name="call" size={32} color="#E91E63" />
          <Text style={styles.featureTitle}>24/7 Support</Text>
          <Text style={styles.featureDescription}>
            Always here to help you
          </Text>
        </View>
      </View>
    </View>
  );

  // Render contact info
  const renderContactInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📞 Contact Us</Text>
      
      <View style={styles.contactCard}>
        <View style={styles.contactItem}>
          <Ionicons name="call" size={24} color="#667eea" />
          <View style={styles.contactText}>
            <Text style={styles.contactTitle}>Phone</Text>
            <Text style={styles.contactValue}>+91 7738608580</Text>
          </View>
        </View>
        
        <View style={styles.contactItem}>
          <Ionicons name="location" size={24} color="#667eea" />
          <View style={styles.contactText}>
            <Text style={styles.contactTitle}>Address</Text>
            <Text style={styles.contactValue}>Local Dairy Farm, Your City</Text>
          </View>
        </View>
        
        <View style={styles.contactItem}>
          <Ionicons name="time" size={24} color="#667eea" />
          <View style={styles.contactText}>
            <Text style={styles.contactTitle}>Delivery Hours</Text>
            <Text style={styles.contactValue}>6:00 AM - 8:00 PM</Text>
          </View>
        </View>
      </View>
    </View>
  );

  // Loading state
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
        {renderFeaturedProducts()}
        {renderFeatures()}
        {renderContactInfo()}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            🥛 Kumar Milk - Delivering Pure Joy Since 2019
          </Text>
          <Text style={styles.footerSubtext}>
            Made with ❤️ for healthy families
          </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  
  // Hero Section
  heroSection: {
    minHeight: height * 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  heroContent: {
    alignItems: 'center',
    width: '100%',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  brandName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  brandTagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
    textAlign: 'center',
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 16,
  },
  
  // Auth Section
  authSection: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    backgroundColor: '#fff',
    marginTop: -20,
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  authButtons: {
    gap: 12,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#667eea',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  registerButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Sections
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  viewAllText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Products
  productScroll: {
    marginHorizontal: -8,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 8,
    width: width * 0.7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  productImage: {
    alignItems: 'center',
    marginBottom: 12,
  },
  productEmoji: {
    fontSize: 48,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  orderButton: {
    backgroundColor: '#667eea',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Features
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  featureCard: {
    backgroundColor: '#fff',
    width: (width - 52) / 2,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 12,
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  
  // Contact
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactText: {
    marginLeft: 16,
    flex: 1,
  },
  contactTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  
  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  footerText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '600',
    textAlign: 'center',
  },
  footerSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default LandingScreenNew;
