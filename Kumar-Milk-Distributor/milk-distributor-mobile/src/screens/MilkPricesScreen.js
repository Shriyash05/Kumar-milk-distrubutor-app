import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import simpleAuthService from '../services/simpleAuthService';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const MilkPricesScreen = () => {
  const navigation = useNavigation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkAuthStatus();
    loadProducts();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadProducts();
    }, [])
  );

  const checkAuthStatus = async () => {
    try {
      const authenticated = await simpleAuthService.isAuthenticated();
      setIsAuthenticated(authenticated);
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await simpleAuthService.makeRequest('/products'); 

      if (response && response.length > 0) {
        setProducts(response);
        await AsyncStorage.setItem('customerProducts', JSON.stringify(response));
      } else {
        const cachedProducts = await AsyncStorage.getItem('customerProducts');
        if (cachedProducts) setProducts(JSON.parse(cachedProducts));
        else setProducts([]);
      }
    } catch (error) {
      console.log('API fetch failed, using cache if available:', error.message);
      const cachedProducts = await AsyncStorage.getItem('customerProducts');
      if (cachedProducts) setProducts(JSON.parse(cachedProducts));
      else setProducts([]);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const getBrandGroupedProducts = () => {
    const grouped = products.reduce((acc, product) => {
      if (!acc[product.brand]) {
        acc[product.brand] = {
          id: product.brand.toLowerCase(),
          name: `${product.brand} Milk Products`,
          color: getBrandColor(product.brand),
          icon: getBrandIcon(product.brand),
          products: [],
        };
      }
      if (product.available) {
        acc[product.brand].products.push({
          name: `${product.name} (${product.packSize} pack)`,
          pricePerCrate: `₹${product.pricePerCrate.toFixed(2)}`,
          pricePerLiter: `₹${product.price.toFixed(2)}`,
        });
      }
      return acc;
    }, {});
    return Object.values(grouped).filter(brand => brand.products.length > 0);
  };

  const getBrandColor = (brand) => {
    switch (brand.toLowerCase()) {
      case 'amul': return '#2196F3';
      case 'gokul': return '#4CAF50';
      case 'mahanand': return '#FF9800';
      default: return '#9C27B0';
    }
  };

  const getBrandIcon = (brand) => {
    switch (brand.toLowerCase()) {
      case 'amul': return 'nutrition';
      case 'gokul': return 'leaf';
      case 'mahanand': return 'water';
      default: return 'cube';
    }
  };

  const handleOrderNow = () => {
    if (isAuthenticated) navigation.navigate('PlaceOrder');
    else navigation.navigate('Login');
  };

  const milkBrands = getBrandGroupedProducts();

  const renderBrandSection = (brand) => (
    <View key={brand.id} style={styles.brandCard}>
      <View style={styles.brandHeader}>
        <View style={[styles.brandIcon, { backgroundColor: brand.color + '20' }]}>
          <Ionicons name={brand.icon} size={24} color={brand.color} />
        </View>
        <Text style={[styles.brandName, { color: brand.color }]}>{brand.name}</Text>
      </View>
      <View style={styles.productsContainer}>
        {brand.products.map((product, index) => (
          <View key={index} style={styles.productRow}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productSubPrice}>Per Liter: {product.pricePerLiter}</Text>
            </View>
            <Text style={styles.productPrice}>{product.pricePerCrate}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Milk Prices</Text>
        <TouchableOpacity style={styles.orderHeaderButton} onPress={handleOrderNow}>
          <Ionicons name="add-circle-outline" size={20} color="#54a9f7" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.titleCard}>
          <Text style={styles.mainTitle}>Milk Prices</Text>
          <Text style={styles.subtitle}>
            Fresh milk from trusted brands • {products.filter(p => p.available).length} products available
          </Text>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#54a9f7" />
              <Text style={styles.loadingText}>Loading latest prices...</Text>
            </View>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#54a9f7" />
            <Text style={styles.loadingStateText}>Loading products...</Text>
          </View>
        ) : milkBrands.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>No products available</Text>
            <Text style={styles.emptyStateSubtext}>
              Products will appear here once they are added by administrators
            </Text>
          </View>
        ) : (
          milkBrands.map(renderBrandSection)
        )}

        <View style={styles.orderSection}>
          <Text style={styles.orderSectionTitle}>Ready to Order?</Text>
          <Text style={styles.orderSectionSubtitle}>
            Choose from our wide range of fresh milk products
          </Text>
          <TouchableOpacity style={styles.orderButton} onPress={handleOrderNow}>
            <Ionicons name="basket" size={20} color="#fff" />
            <Text style={styles.orderButtonText}>Order Now</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.noticeCard}>
          <Ionicons name="information-circle" size={24} color="#54a9f7" />
          <View style={styles.noticeContent}>
            <Text style={styles.noticeTitle}>Important Notice</Text>
            <Text style={styles.noticeText}>
              • Prices may vary based on location and availability{'\n'}
              • Fresh delivery every morning between 4 AM - 7 AM{'\n'}
              • Order before 1 PM for next day delivery{'\n'}
              • All products are quality tested and fresh{'\n'}
              • Pull down to refresh for latest prices
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e9ecef' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  orderHeaderButton: { padding: 4 },
  scrollView: { flex: 1 },
  content: { padding: 16 },
  titleCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, marginBottom: 24, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  mainTitle: { fontSize: 28, fontWeight: 'bold', color: '#6c4836', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center' },
  brandCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  brandHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: '#f0f0f0' },
  brandIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  brandName: { fontSize: 20, fontWeight: 'bold', flex: 1 },
  productsContainer: { gap: 12 },
  productRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#f8f9fa', borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#54a9f7' },
  productInfo: { flex: 1, marginRight: 16 },
  productName: { fontSize: 16, color: '#333', fontWeight: '500' },
  productSubPrice: { fontSize: 14, color: '#555', marginTop: 2 },
  productPrice: { fontSize: 18, fontWeight: 'bold', color: '#ff6b6b' },
  orderSection: { backgroundColor: '#54a9f7', borderRadius: 16, padding: 24, marginVertical: 24, alignItems: 'center' },
  orderSectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 8, textAlign: 'center' },
  orderSectionSubtitle: { fontSize: 16, color: '#fff', opacity: 0.9, marginBottom: 24, textAlign: 'center' },
  orderButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12, gap: 8 },
  orderButtonText: { color: '#54a9f7', fontSize: 16, fontWeight: 'bold' },
  noticeCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, flexDirection: 'row', marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.22, shadowRadius: 2.22 },
  noticeContent: { flex: 1, marginLeft: 12 },
  noticeTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  noticeText: { fontSize: 14, color: '#666', lineHeight: 20 },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, gap: 8 },
  loadingText: { fontSize: 12, color: '#54a9f7', fontWeight: '500' },
  loadingState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 12 },
  loadingStateText: { fontSize: 16, color: '#666', fontWeight: '500' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 12 },
  emptyStateText: { fontSize: 18, fontWeight: '600', color: '#999' },
  emptyStateSubtext: { fontSize: 14, color: '#ccc', textAlign: 'center', paddingHorizontal: 40 },
});

export default MilkPricesScreen;
