import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import simpleAuthService from '../services/simpleAuthService';

const ProductsScreenNew = () => {
  const navigation = useNavigation();

  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState(['all']);

  // Load products on mount and on focus
  useEffect(() => {
    loadProducts();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadProducts();
    }, [])
  );

  // Fetch products from API (robust handling of different response shapes)
  const loadProducts = async () => {
    try {
      console.log('🆕 Fetching products from database API...');
      setLoading(true);

      // Try with a retry helper if available, otherwise normal request
      let response;
      try {
        // try a single attempt first
        response = await simpleAuthService.makeRequest('/products', { method: 'GET' });
      } catch (err) {
        console.warn('⚠️ First attempt to fetch products failed, retrying once...', err);
        // fallback retry
        response = await simpleAuthService.makeRequest('/products', { method: 'GET' });
      }

      console.log('🔍 Raw API response:', response);

      // Normalize response into an array of product objects
      let rawProducts = [];

      if (!response) {
        rawProducts = [];
        console.log('⚠️ /products returned empty response');
      } else if (Array.isArray(response)) {
        rawProducts = response;
        console.log(`📥 API returned array of products (${rawProducts.length})`);
      } else if (Array.isArray(response.products)) {
        rawProducts = response.products;
        console.log(`📥 API returned response.products (${rawProducts.length})`);
      } else if (response.data && Array.isArray(response.data.products)) {
        rawProducts = response.data.products;
        console.log(`📥 API returned response.data.products (${rawProducts.length})`);
      } else if (response.result && Array.isArray(response.result)) {
        rawProducts = response.result;
        console.log(`📥 API returned response.result (${rawProducts.length})`);
      } else {
        // Try to discover arrays in top-level keys
        const potentialArrays = Object.values(response).filter((v) => Array.isArray(v) && v.length > 0);
        if (potentialArrays.length > 0) {
          rawProducts = potentialArrays[0];
          console.log(`📥 API returned array under an unexpected key (using first array with length ${rawProducts.length})`);
        } else {
          rawProducts = [];
          console.log('⚠️ No product array discovered in API response. Response keys:', Object.keys(response));
        }
      }

      // Map and normalize product fields defensively
      const processedProducts = (rawProducts || []).map((product, idx) => {
        const id = product._id ?? product.id ?? product.productId ?? `product-${idx}`;
        const name = product.name ?? product.title ?? product.productName ?? `Product ${idx + 1}`;
        const price = Number(product.price ?? product.literPrice ?? product.unitPrice ?? 0) || 0;
        const unit = product.unit ?? product.unitType ?? 'piece';
        const description = product.description ?? product.desc ?? product.shortDescription ?? '';
        const category = product.category ?? product.type ?? 'uncategorized';
        const brand = product.brand ?? product.manufacturer ?? '';
        const stockQuantity = Number(product.stockQuantity ?? product.qty ?? product.availableQuantity ?? 0) || 0;
        const pricePerCrate = Number(product.pricePerCrate ?? product.cratePrice ?? 0) || null;
        const packSize = Number(product.packSize ?? product.pack_size ?? product.pack ?? 0) || null;
        const nutritionalInfo = product.nutritionalInfo ?? product.nutrition ?? {};
        const fat = extractNutritionalValue(nutritionalInfo, 'fat');
        const protein = extractNutritionalValue(nutritionalInfo, 'protein');

        return {
          id,
          _id: id,
          name,
          price,
          unit,
          description,
          category,
          brand,
          available: product.isActive !== undefined ? Boolean(product.isActive) : true,
          isOrderable: product.isOrderable !== undefined ? Boolean(product.isOrderable) : true,
          stockQuantity,
          pricePerCrate,
          packSize,
          nutritionalInfo,
          image: getProductIcon(category, name),
          fat,
          protein,
          raw: product,
        };
      });

      setProducts(processedProducts);

      // build categories list
      const uniqueCategories = [
        'all',
        ...Array.from(new Set(processedProducts.map((p) => (p.category ? String(p.category) : 'uncategorized')))),
      ];
      setCategories(uniqueCategories);

      // preserve selectedCategory if possible, else default to 'all'
      const catToUse = uniqueCategories.includes(selectedCategory) ? selectedCategory : 'all';
      setSelectedCategory(catToUse);
      filterProducts(processedProducts, catToUse);
    } catch (error) {
      console.error('❌ Error loading products:', error);
      Toast.show({
        type: 'error',
        text1: 'Error Loading Products',
        text2: 'Failed to fetch products from database',
      });
      setProducts([]);
      setFilteredProducts([]);
      setCategories(['all']);
    } finally {
      setLoading(false);
    }
  };

  const getProductIcon = (category, name) => {
    if (!category && !name) return 'nutrition';
    const categoryLower = (category || '').toString().toLowerCase();
    const nameLower = (name || '').toString().toLowerCase();

    if (categoryLower.includes('dairy') || nameLower.includes('milk')) {
      if (nameLower.includes('buffalo')) return 'water';
      if (nameLower.includes('cow')) return 'nutrition-outline';
      if (nameLower.includes('toned')) return 'water-outline';
      if (nameLower.includes('cream')) return 'nutrition';
      return 'nutrition';
    }

    return 'nutrition';
  };

  const extractNutritionalValue = (info, key) => {
    if (!info || typeof info !== 'object') return 'N/A';
    const possibleKeys = [
      key,
      key.toLowerCase(),
      key.toUpperCase(),
      `${key}Content`,
      `${key}Percentage`,
      `${key}_content`,
      `${key}_percentage`,
    ];
    for (const k of possibleKeys) {
      if (info[k] !== undefined && info[k] !== null) return info[k];
    }
    if (key === 'fat') return '3.5%';
    if (key === 'protein') return '3.2%';
    return 'N/A';
  };

  const filterProducts = (productList, category) => {
    if (!Array.isArray(productList)) {
      setFilteredProducts([]);
      return;
    }
    if (category === 'all') {
      setFilteredProducts(productList);
    } else {
      const filtered = productList.filter(
        (p) => (p.category ?? '').toString().toLowerCase() === category.toString().toLowerCase()
      );
      setFilteredProducts(filtered);
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    filterProducts(products, category);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const handleOrderPress = (product) => {
    if (!product.available) {
      Alert.alert('Product Unavailable', `${product.name} is out of stock.`, [{ text: 'OK' }]);
      return;
    }
    if (!product.isOrderable) {
      Alert.alert('Product Not Orderable', `${product.name} is not available for ordering at the moment.`, [{ text: 'OK' }]);
      return;
    }
    navigation.navigate('PlaceOrderFromProducts', { selectedProduct: product });
  };

  const renderCategoryFilter = () => (
    <View style={styles.categoryFilter}>
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === item && styles.categoryButtonActive,
            ]}
            onPress={() => handleCategoryChange(item)}
          >
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategory === item && styles.categoryButtonTextActive,
              ]}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderProductItem = ({ item }) => (
    <View style={styles.productCard}>
      <View style={styles.productIcon}>
        <Ionicons
          name={item.image || 'nutrition'}
          size={32}
          color={item.available ? '#54a9f7' : '#ccc'}
        />
      </View>

      <View style={styles.productInfo}>
        <View style={styles.productHeader}>
          <Text style={[styles.productName, !item.available && styles.unavailableText]}>
            {item.name}
          </Text>
          {item.brand && <Text style={styles.brandText}>{item.brand}</Text>}
        </View>

        <Text style={[styles.productDescription, !item.available && styles.unavailableText]}>
          {item.description}
        </Text>

        <View style={styles.stockInfo}>
          {!item.available && (
            <View style={styles.stockBadge}>
              <Text style={styles.stockBadgeText}>Out of Stock</Text>
            </View>
          )}
          {item.available && item.stockQuantity <= 10 && item.stockQuantity > 0 && (
            <View style={[styles.stockBadge, styles.lowStockBadge]}>
              <Text style={styles.lowStockText}>Low Stock ({item.stockQuantity})</Text>
            </View>
          )}
        </View>

        <View style={styles.nutritionInfo}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionLabel}>Fat</Text>
            <Text style={styles.nutritionValue}>{item.fat}</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionLabel}>Protein</Text>
            <Text style={styles.nutritionValue}>{item.protein}</Text>
          </View>
          {item.packSize && (
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Pack Size</Text>
              <Text style={styles.nutritionValue}>{item.packSize}</Text>
            </View>
          )}
        </View>

        <View style={styles.priceAndActions}>
          <View style={styles.priceContainer}>
            <Text style={[styles.price, !item.available && styles.unavailableText]}>₹{item.price}</Text>
            <Text style={[styles.unit, !item.available && styles.unavailableText]}>per {item.unit}</Text>
            {item.pricePerCrate && <Text style={styles.cratePrice}>₹{item.pricePerCrate}/crate</Text>}
          </View>

          <TouchableOpacity
            style={[styles.orderButton, !item.available && styles.orderButtonDisabled]}
            onPress={() => handleOrderPress(item)}
          >
            <Ionicons name={item.available ? 'add-circle' : 'close-circle'} size={20} color={item.available ? '#fff' : '#ccc'} />
            <Text style={[styles.orderButtonText, !item.available && styles.orderButtonTextDisabled]}>
              {item.available ? 'Order Now' : 'Unavailable'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="storefront-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No Products Found</Text>
      <Text style={styles.emptyStateText}>
        {selectedCategory === 'all'
          ? 'No products are currently available.'
          : `No products found in ${selectedCategory} category.`}
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadProducts}>
        <Text style={styles.retryButtonText}>Refresh Products</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#54a9f7" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Our Products</Text>
        <TouchableOpacity
          style={styles.placeOrderHeaderButton}
          onPress={() => navigation.navigate('PlaceOrderFromProducts')}
        >
          <Ionicons name="add-circle-outline" size={20} color="#54a9f7" />
          <Text style={styles.placeOrderHeaderText}>Place Order</Text>
        </TouchableOpacity>
      </View>

      {categories.length > 1 && renderCategoryFilter()}

      {filteredProducts.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          style={styles.productsList}
          contentContainerStyle={styles.productsContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666', fontWeight: '500' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  placeOrderHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#54a9f7',
    gap: 6,
  },
  placeOrderHeaderText: { color: '#54a9f7', fontSize: 14, fontWeight: '600' },
  categoryFilter: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  categoryButtonActive: {
    backgroundColor: '#54a9f7',
    borderColor: '#54a9f7',
  },
  categoryButtonText: { fontSize: 14, color: '#666', fontWeight: '500' },
  categoryButtonTextActive: { color: '#fff', fontWeight: '600' },
  productsList: { flex: 1 },
  productsContainer: { padding: 16 },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#f8f9fa',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  productInfo: { flex: 1 },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productName: { fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1 },
  brandText: {
    fontSize: 12,
    color: '#54a9f7',
    fontWeight: '600',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  stockInfo: { flexDirection: 'row', marginBottom: 12 },
  stockBadge: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  stockBadgeText: { fontSize: 12, color: '#d32f2f', fontWeight: '600' },
  lowStockBadge: { backgroundColor: '#fff3e0' },
  lowStockText: { color: '#f57c00', fontSize: 12, fontWeight: '600' },
  nutritionInfo: { flexDirection: 'row', marginBottom: 16, gap: 16 },
  nutritionItem: { flex: 1 },
  nutritionLabel: { fontSize: 12, color: '#999', marginBottom: 2 },
  nutritionValue: { fontSize: 14, color: '#333', fontWeight: '600' },
  priceAndActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceContainer: { flex: 1 },
  price: { fontSize: 20, fontWeight: 'bold', color: '#4CAF50' },
  unit: { fontSize: 14, color: '#666', marginTop: 2 },
  cratePrice: { fontSize: 12, color: '#999', marginTop: 2 },
  orderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#54a9f7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 6,
  },
  orderButtonDisabled: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  orderButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  orderButtonTextDisabled: { color: '#ccc' },
  unavailableText: { color: '#ccc' },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#54a9f7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default ProductsScreenNew;
