import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import simpleAuthService from '../services/simpleAuthService';

const AdminProductsScreenNew = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState('');
  const [pricePerCrate, setPricePerCrate] = useState('');
  const [packSize, setPackSize] = useState('');
  const [unit, setUnit] = useState('liter');
  const [available, setAvailable] = useState(true);

  // Load products
  const loadProducts = async () => {
    try {
      const response = await simpleAuthService.makeRequest('/admin/products');
      const productList = response?.products || response || [];
      setProducts(productList);
      console.log(`✅ Loaded ${productList.length} products`);
    } catch (error) {
      console.error('Load products error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load products',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const resetForm = () => {
    setName('');
    setBrand('');
    setPrice('');
    setPricePerCrate('');
    setPackSize('');
    setUnit('liter');
    setAvailable(true);
    setEditingProduct(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setName(product.name);
    setBrand(product.brand);
    setPrice(product.price.toString());
    setPricePerCrate(product.pricePerCrate.toString());
    setPackSize(product.packSize.toString());
    setUnit(product.unit || 'liter');
    setAvailable(product.available);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const saveProduct = async () => {
    if (!name.trim() || !brand.trim() || !price || !pricePerCrate || !packSize) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fill all fields',
      });
      return;
    }

    const productData = {
      name: name.trim(),
      brand: brand.trim(),
      price: parseFloat(price),
      pricePerCrate: parseFloat(pricePerCrate),
      packSize: parseInt(packSize),
      unit,
      available,
      description: `${brand.trim()} ${name.trim()}`,
      fat: '3.5%',
      protein: '3.2%',
    };

    try {
      let response;
      if (editingProduct) {
        response = await simpleAuthService.makeRequest(`/admin/products/${editingProduct._id}`, {
          method: 'PUT',
          body: JSON.stringify(productData),
        });

        setProducts((prev) =>
          prev.map((p) =>
            p._id === editingProduct._id ? response.product || { ...p, ...productData } : p
          )
        );

        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Product updated successfully',
        });
      } else {
        response = await simpleAuthService.makeRequest('/admin/products', {
          method: 'POST',
          body: JSON.stringify(productData),
        });

        if (response.product) {
          setProducts((prev) => [...prev, response.product]);
        }

        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Product created successfully',
        });
      }

      closeModal();
    } catch (error) {
      console.error('Save error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save product',
      });
    }
  };

  const deleteProduct = (productId) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // DELETE request
              await simpleAuthService.makeRequest(`/admin/products/${productId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
              });

              // Remove locally
              setProducts((prev) => prev.filter((p) => p._id !== productId));

              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Product deleted successfully',
              });
            } catch (error) {
              console.error('Delete error:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to delete product',
              });
            }
          },
        },
      ]
    );
  };

  const toggleAvailability = async (product) => {
    try {
      await simpleAuthService.makeRequest(`/admin/products/${product._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...product,
          available: !product.available,
        }),
      });

      setProducts((prev) =>
        prev.map((p) => (p._id === product._id ? { ...p, available: !p.available } : p))
      );

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Product availability updated',
      });
    } catch (error) {
      console.error('Toggle error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update availability',
      });
    }
  };

  const renderProduct = (product) => (
    <View key={product._id} style={styles.productCard}>
      <View style={styles.productHeader}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productBrand}>{product.brand}</Text>
      </View>

      <View style={styles.productDetails}>
        <Text>Price: ₹{product.price}</Text>
        <Text>Per Crate: ₹{product.pricePerCrate}</Text>
        <Text>Pack Size: {product.packSize}</Text>
        <Text>Unit: {product.unit}</Text>
        <Text style={{ color: product.available ? 'green' : 'red' }}>
          {product.available ? 'Available' : 'Out of Stock'}
        </Text>
      </View>

      <View style={styles.productActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#54a9f7' }]}
          onPress={() => openEditModal(product)}
        >
          <Ionicons name="pencil" size={16} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: product.available ? '#ff9800' : '#4caf50' }]}
          onPress={() => toggleAvailability(product)}
        >
          <Ionicons name={product.available ? 'pause' : 'play'} size={16} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#f44336' }]}
          onPress={() => deleteProduct(product._id)}
        >
          <Ionicons name="trash" size={16} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#54a9f7" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Product Management</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.addBtnText}>Add Product</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {products.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No products found</Text>
            <Text style={styles.emptySubtext}>Add your first product to get started</Text>
          </View>
        ) : (
          products.map(renderProduct)
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingProduct ? 'Edit Product' : 'Add Product'}</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <TextInput
                style={styles.input}
                placeholder="Product Name"
                placeholderTextColor="#666"
                value={name}
                onChangeText={setName}
              />

              <TextInput
                style={styles.input}
                placeholder="Brand"
                placeholderTextColor="#666"
                value={brand}
                onChangeText={setBrand}
              />

              <TextInput
                style={styles.input}
                placeholder="Price per liter"
                placeholderTextColor="#666"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />

              <TextInput
                style={styles.input}
                placeholder="Price per crate"
                placeholderTextColor="#666"
                value={pricePerCrate}
                onChangeText={setPricePerCrate}
                keyboardType="numeric"
              />

              <TextInput
                style={styles.input}
                placeholder="Pack size"
                placeholderTextColor="#666"
                value={packSize}
                onChangeText={setPackSize}
                keyboardType="numeric"
              />

              <TextInput
                style={styles.input}
                placeholder="Unit"
                placeholderTextColor="#666"
                value={unit}
                onChangeText={setUnit}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={saveProduct}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, color: '#666' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2c3e50' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#54a9f7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  addBtnText: { color: 'white', fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  emptyText: { fontSize: 18, color: '#666', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#999' },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productHeader: { marginBottom: 12 },
  productName: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
  productBrand: { fontSize: 14, color: '#666' },
  productDetails: { marginBottom: 16, gap: 4 },
  productActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { backgroundColor: 'white', borderRadius: 16, width: '100%', maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e9ecef' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50' },
  modalForm: { padding: 20, maxHeight: 400 },
  input: { borderWidth: 1, borderColor: '#e9ecef', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16, color: '#333' },
  modalActions: { flexDirection: 'row', padding: 20, gap: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#f8f9fa', alignItems: 'center' },
  cancelBtnText: { color: '#666', fontWeight: '600' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#54a9f7', alignItems: 'center' },
  saveBtnText: { color: 'white', fontWeight: '600' },
});

export default AdminProductsScreenNew;
