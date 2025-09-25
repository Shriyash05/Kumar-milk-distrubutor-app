import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import simpleAuthService from '../services/simpleAuthService';
import AuthGuard from '../components/AuthGuard';

const AdminProductManagement = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    description: '',
    price: '',
    pricePerCrate: '',
    packSize: '',
    unit: 'piece',
    fat: '',
    protein: '',
    available: true,
  });

  useEffect(() => {
    loadProducts();
  }, []);

  // Stable callback functions to prevent re-renders
  const updateFormData = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const toggleAvailability = useCallback(() => {
    setFormData(prev => ({ ...prev, available: !prev.available }));
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const result = await simpleAuthService.getAllProducts();
      
      if (result.success) {
        setProducts(result.products);
      } else {
        // Use mock data if API fails
        setProducts([
          {
            _id: '1',
            name: 'Full Cream Milk 1L',
            brand: 'Amul',
            description: 'Rich and creamy whole milk',
            price: 60,
            pricePerCrate: 720,
            packSize: 12,
            unit: 'piece',
            available: true,
            isActive: true
          },
          {
            _id: '2',
            name: 'Toned Milk 1L',
            brand: 'Amul',
            description: 'Reduced fat milk with great taste',
            price: 50,
            pricePerCrate: 600,
            packSize: 12,
            unit: 'piece',
            available: true,
            isActive: true
          },
        ]);
      }
    } catch (error) {
      console.error('Load products error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load products',
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      brand: '',
      description: '',
      price: '',
      pricePerCrate: '',
      packSize: '',
      unit: 'piece',
      fat: '',
      protein: '',
      available: true,
    });
    setEditingProduct(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (product) => {
    setFormData({
      name: product.name || '',
      brand: product.brand || '',
      description: product.description || '',
      price: product.price ? product.price.toString() : '',
      pricePerCrate: product.pricePerCrate ? product.pricePerCrate.toString() : '',
      packSize: product.packSize ? product.packSize.toString() : '',
      unit: product.unit || 'piece',
      fat: product.fat || '',
      protein: product.protein || '',
      available: product.available !== undefined ? product.available : true,
    });
    setEditingProduct(product);
    setShowAddModal(true);
  };

  const handleSave = useCallback(async () => {
    if (saving) return; // Prevent multiple submissions
    
    try {
      setSaving(true);
      
      if (!formData.name || !formData.brand || !formData.price || !formData.pricePerCrate || !formData.packSize) {
        Toast.show({
          type: 'error',
          text1: 'Validation Error',
          text2: 'Please fill all required fields (Name, Brand, Price, Price Per Crate, Pack Size)',
        });
        return;
      }

      const productData = {
        name: formData.name,
        brand: formData.brand,
        description: formData.description,
        price: parseFloat(formData.price),
        pricePerCrate: parseFloat(formData.pricePerCrate),
        packSize: parseInt(formData.packSize),
        unit: formData.unit,
        available: formData.available,
      };

      let result;
      if (editingProduct) {
        result = await simpleAuthService.updateProduct(editingProduct._id, productData);
      } else {
        result = await simpleAuthService.createProduct(productData);
      }

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: editingProduct ? 'Product updated successfully' : 'Product created successfully',
        });
        
        // Close modal first
        setShowAddModal(false);
        // Reset form
        resetForm();
        // Reload products
        setTimeout(() => loadProducts(), 100);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result.error || 'Failed to save product',
        });
      }
    } catch (error) {
      console.error('Save product error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save product',
      });
    } finally {
      setSaving(false);
    }
  }, [formData, editingProduct, saving]);

  const handleDelete = (product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to deactivate "${product.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteProduct(product._id),
        },
      ]
    );
  };

  const deleteProduct = async (productId) => {
    try {
      const result = await simpleAuthService.deleteProduct(productId);
      
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Product deactivated successfully',
        });
        await loadProducts();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result.error || 'Failed to delete product',
        });
      }
    } catch (error) {
      console.error('Delete product error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete product',
      });
    }
  };

  const renderProductItem = ({ item }) => (
    <View style={[styles.productCard, !item.isActive && styles.inactiveCard]}>
      <View style={styles.productHeader}>
        <View style={styles.productIcon}>
          <Ionicons name="nutrition" size={24} color="#54a9f7" />
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productDescription}>{item.description}</Text>
        </View>
        <View style={styles.productActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openEditModal(item)}
          >
            <Ionicons name="pencil" size={16} color="#4CAF50" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item)}
          >
            <Ionicons name="trash" size={16} color="#f44336" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.productDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Brand:</Text>
          <Text style={styles.detailValue}>{item.brand}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Unit Price:</Text>
          <Text style={styles.detailValue}>₹{item.price}/{item.unit}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Crate Price:</Text>
          <Text style={styles.detailValue}>₹{item.pricePerCrate}/{item.packSize}pack</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Available:</Text>
          <Text style={[
            styles.detailValue,
            { color: item.available ? '#4CAF50' : '#f44336' }
          ]}>
            {item.available ? 'Yes' : 'No'}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <AuthGuard requiredRole="admin" navigation={navigation}>
      <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Management</Text>
        <TouchableOpacity
          onPress={openAddModal}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color="#54a9f7" />
        </TouchableOpacity>
      </View>

      {/* Products List */}
      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={(item) => item._id}
        style={styles.productsList}
        contentContainerStyle={styles.productsContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Add/Edit Product Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowAddModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </Text>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.modalSaveButton, saving && styles.modalSaveButtonDisabled]}
              disabled={saving}
            >
              <Text style={styles.modalSaveText}>{saving ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalForm}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Product Name *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.name}
                onChangeText={(text) => updateFormData('name', text)}
                placeholder="Enter product name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Brand *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.brand}
                onChangeText={(text) => updateFormData('brand', text)}
                placeholder="Enter brand name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => updateFormData('description', text)}
                placeholder="Enter product description"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formRow}>
              <View style={styles.formGroupHalf}>
                <Text style={styles.formLabel}>Unit Price *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.price}
                  onChangeText={(text) => updateFormData('price', text)}
                  placeholder="Enter unit price"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroupHalf}>
                <Text style={styles.formLabel}>Unit</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.unit}
                  onChangeText={(text) => updateFormData('unit', text)}
                  placeholder="piece"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formGroupHalf}>
                <Text style={styles.formLabel}>Price Per Crate *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.pricePerCrate}
                  onChangeText={(text) => updateFormData('pricePerCrate', text)}
                  placeholder="Enter crate price"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroupHalf}>
                <Text style={styles.formLabel}>Pack Size *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.packSize}
                  onChangeText={(text) => updateFormData('packSize', text)}
                  placeholder="Pieces per crate"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Availability</Text>
              <TouchableOpacity
                style={[styles.toggleButton, formData.available && styles.toggleButtonActive]}
                onPress={toggleAvailability}
              >
                <Text style={[styles.toggleText, formData.available && styles.toggleTextActive]}>
                  {formData.available ? 'Available' : 'Not Available'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
      </SafeAreaView>
    </AuthGuard>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    padding: 4,
  },
  productsList: {
    flex: 1,
  },
  productsContainer: {
    padding: 16,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  inactiveCard: {
    opacity: 0.6,
    backgroundColor: '#f5f5f5',
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  productIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#f0f8ff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  productDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalSaveButton: {
    backgroundColor: '#54a9f7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalSaveButtonDisabled: {
    backgroundColor: '#cccccc',
    opacity: 0.6,
  },
  modalSaveText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalForm: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formGroupHalf: {
    flex: 1,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  toggleButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#54a9f7',
    borderColor: '#54a9f7',
  },
  toggleText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default AdminProductManagement;