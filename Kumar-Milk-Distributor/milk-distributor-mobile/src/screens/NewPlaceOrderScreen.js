// PlaceOrderScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import * as SecureStore from "expo-secure-store";
import * as ImagePicker from "expo-image-picker";
import simpleAuthService from "../services/simpleAuthService";
import notificationService from "../services/notificationService";
import GooglePayQR from "../components/GooglePayQR";

const PlaceOrderScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState("1");
  const [unitType, setUnitType] = useState("liter");
  const [showAddToCartModal, setShowAddToCartModal] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false); // 🆕
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProof, setPaymentProof] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startDate] = useState(new Date().toISOString().split("T")[0]);

  const safeNumber = (v, fallback = 0) => {
    const n = Number(v);
    return isNaN(n) ? fallback : n;
  };

  const normalizeProduct = (p = {}, idx = 0) => {
    const price = safeNumber(p.literPrice ?? p.price ?? 0, 0);
    const packSize = safeNumber(p.packSize, 12);
    const cratePrice = p.cratePrice ?? p.pricePerCrate ?? price * packSize;
    const isActive = p.isActive !== undefined ? Boolean(p.isActive) : true;
    const isInStock = p.isInStock !== undefined ? Boolean(p.isInStock) : true;
    return {
      _id: p._id ?? `product-${idx}`,
      name: p.name ?? `Product ${idx + 1}`,
      brand: p.brand ?? "",
      price,
      cratePrice,
      packSize,
      unit: p.unit ?? "liter",
      available: isActive && isInStock,
      raw: p,
    };
  };

  useEffect(() => {
    let mounted = true;
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        const resp = await simpleAuthService.makeRequest("/products");
        let list = [];
        if (resp && Array.isArray(resp)) list = resp;
        else if (resp && Array.isArray(resp.products)) list = resp.products;
        const processed = (list || []).map((p, i) => normalizeProduct(p, i));
        if (mounted) setProducts(processed);
      } catch (err) {
        console.error("Error fetching products:", err);
        Toast.show({ type: "error", text1: "Unable to load products" });
        if (mounted) setProducts([]);
      } finally {
        if (mounted) setLoadingProducts(false);
      }
    };
    fetchProducts();
    return () => (mounted = false);
  }, []);

  const pickImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (!res.canceled) setPaymentProof(res.assets[0].uri);
    } catch (err) {
      console.error("Image pick error:", err);
      Toast.show({ type: "error", text1: "Image error" });
    }
  };

  const addSelectedProductToCart = () => {
    if (!selectedProduct) return;
    const qty = Math.max(1, parseInt(quantity || "0"));
    if (!qty || isNaN(qty)) {
      Toast.show({ type: "error", text1: "Invalid quantity" });
      return;
    }
    const price = unitType === "crate" ? selectedProduct.cratePrice : selectedProduct.price;
    const totalAmount = Number((price * qty).toFixed(2));
    const totalPieces = unitType === "crate" ? qty * selectedProduct.packSize : qty;
    const item = {
      productId: String(selectedProduct._id),
      productName: String(selectedProduct.name),
      quantity: qty,
      unitType,
      unitPrice: price,
      totalAmount,
      packSize: selectedProduct.packSize,
      totalPieces,
      product: selectedProduct,
      id: `${selectedProduct._id}-${unitType}-${Date.now()}`,
    };
    setCart((prev) => [...prev, item]);
    setShowAddToCartModal(false);
    setQuantity("1");
    Keyboard.dismiss();
    Toast.show({ type: "success", text1: "Added to cart", text2: selectedProduct.name });
  };

  const removeCartItem = (id) => setCart((prev) => prev.filter((c) => c.id !== id));
  const totalCartAmount = cart.reduce((sum, it) => sum + Number(it.totalAmount || 0), 0);

  const handleCompleteOrder = async () => {
    if (!paymentProof) {
      Toast.show({ type: "error", text1: "Payment proof required" });
      return;
    }
    if (!cart.length) {
      Toast.show({ type: "error", text1: "Cart empty" });
      return;
    }
    setLoading(true);
    try {
      const ud = await SecureStore.getItemAsync("userData");
      let user = ud ? JSON.parse(ud) : await simpleAuthService.getCurrentUser();
      if (!user) throw new Error("User not found");

      const orderGroupId = `OG_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const createdIds = [];
      for (const it of cart) {
        const singleOrderData = {
          customer: user._id || user.id || null,
          productId: it.productId,
          productName: it.productName,
          quantity: it.quantity,
          unitType: it.unitType,
          unitPrice: it.unitPrice,
          totalAmount: it.totalAmount,
          packSize: it.packSize,
          totalPieces: it.totalPieces,
          startDate,
          orderType: "daily",
          status: "pending_verification",
          customerName: user.name,
          customerPhone: user.phone || "",
          deliveryAddress: user.address || "",
          orderDate: new Date().toISOString(),
          paymentStatus: "paid_pending_verification",
          paymentMethod: "UPI/Google Pay",
          paymentProof: String(paymentProof),
          needsAdminVerification: true,
          registeredFrom: "mobile-app",
          orderGroupId,
        };
        const singleResp = await simpleAuthService.makeRequestWithRetry(
          "/customer/orders",
          { method: "POST", body: JSON.stringify(singleOrderData) },
          3
        );
        createdIds.push(singleResp?._id || singleResp?.insertedId || singleResp?.id || null);
      }

      await notificationService.notifyAdminNewOrder({
        id: orderGroupId,
        orderGroupId,
        createdIds,
        items: cart,
        customer: user,
        customerName: user.name,
        totalAmount: totalCartAmount,
      });
      await notificationService.notifyAdminPaymentProof({
        id: orderGroupId,
        orderGroupId,
        customer: user,
        customerName: user.name,
        totalAmount: totalCartAmount,
      });

      Toast.show({
        type: "success",
        text1: "Order Placed",
        text2: `Created ${createdIds.length} orders.`,
      });
      setCart([]);
      setPaymentProof(null);
      setShowPaymentModal(false);
      navigation.getParent()?.navigate("Orders");
    } catch (err) {
      console.error("Final order placement error:", err);
      Toast.show({
        type: "error",
        text1: "Order Failed",
        text2: err?.message || "Could not place order",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Place Order</Text>
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => setShowCartModal(true)}
        >
          <Ionicons name="cart" size={24} color="#54a9f7" />
          {cart.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cart.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Product list */}
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {loadingProducts ? (
          <ActivityIndicator size="large" color="#54a9f7" style={{ marginTop: 40 }} />
        ) : products.length === 0 ? (
          <Text style={styles.emptyText}>No products available.</Text>
        ) : (
          products.map((product) => (
            <View
              key={product._id}
              style={[styles.productCard, !product.available && styles.productCardUnavailable]}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.productName, !product.available && styles.productNameUnavailable]}
                >
                  {product.name}
                </Text>
                <Text style={styles.productPrice}>
                  ₹{product.price} / liter | ₹{product.cratePrice} / crate
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.addButton, !product.available && styles.addButtonDisabled]}
                disabled={!product.available}
                onPress={() => {
                  setSelectedProduct(product);
                  setQuantity("1");
                  setUnitType("liter");
                  setShowAddToCartModal(true);
                }}
              >
                <Ionicons
                  name={product.available ? "add" : "close"}
                  size={20}
                  color={product.available ? "#fff" : "#999"}
                />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add-to-Cart Modal */}
      <Modal
        visible={showAddToCartModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddToCartModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <ScrollView contentContainerStyle={styles.addToCartModalScroll}>
            <View style={styles.addToCartModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add to Cart</Text>
                <TouchableOpacity onPress={() => setShowAddToCartModal(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              {selectedProduct ? (
                <View style={styles.modalContent}>
                  <Text style={styles.selectedProductName}>{selectedProduct.name}</Text>
                  <View style={styles.unitToggle}>
                    <TouchableOpacity
                      style={[
                        styles.unitOption,
                        unitType === "liter" && styles.unitOptionActive,
                      ]}
                      onPress={() => setUnitType("liter")}
                    >
                      <Text style={styles.unitText}>Liter: ₹{selectedProduct.price}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.unitOption,
                        unitType === "crate" && styles.unitOptionActive,
                      ]}
                      onPress={() => setUnitType("crate")}
                    >
                      <Text style={styles.unitText}>Crate: ₹{selectedProduct.cratePrice}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.quantityContainer}>
                    <Text style={styles.quantityLabel}>Quantity:</Text>
                    <TextInput
                      style={styles.quantityInput}
                      value={quantity}
                      onChangeText={setQuantity}
                      keyboardType="numeric"
                      placeholder="1"
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.addToCartButton}
                    onPress={addSelectedProductToCart}
                  >
                    <Text style={styles.addToCartButtonText}>Add to Cart</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text>No product selected.</Text>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* 🆕 Cart Modal */}
      <Modal
        visible={showCartModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCartModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
            <View style={styles.paymentModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Your Cart</Text>
                <TouchableOpacity onPress={() => setShowCartModal(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              {cart.length === 0 ? (
                <Text style={{ textAlign: "center", color: "#999" }}>Cart is empty.</Text>
              ) : (
                <>
                  {cart.map((item) => (
                    <View key={item.id} style={{ marginBottom: 12 }}>
                      <Text style={{ fontWeight: "600", color: "#333" }}>
                        {item.productName} – {item.quantity} {item.unitType}
                      </Text>
                      <Text style={{ color: "#4CAF50" }}>₹{item.totalAmount}</Text>
                      <TouchableOpacity
                        onPress={() => removeCartItem(item.id)}
                        style={{ marginTop: 4 }}
                      >
                        <Text style={{ color: "#F44336" }}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  <Text style={{ fontWeight: "bold", marginTop: 10 }}>
                    Total: ₹{totalCartAmount.toFixed(2)}
                  </Text>

                  <TouchableOpacity
                    style={[styles.button, { marginTop: 20 }]}
                    onPress={() => {
                      setShowCartModal(false);
                      setShowPaymentModal(true);
                    }}
                  >
                    <Text style={styles.buttonText}>Proceed to Payment</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Payment Modal */}
      <Modal visible={showPaymentModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <ScrollView contentContainerStyle={styles.paymentModalScroll}>
            <View style={styles.paymentModal}>
              <Text style={styles.modalTitle}>Complete Payment</Text>
              <GooglePayQR amount={Number(totalCartAmount.toFixed(2))} />
              <Text style={{ fontWeight: "600", marginVertical: 8 }}>
                Pay ₹{totalCartAmount.toFixed(2)}
              </Text>
              <TouchableOpacity style={styles.button} onPress={pickImage}>
                <Text style={styles.buttonText}>
                  {paymentProof ? "Change Proof" : "Upload Payment Proof"}
                </Text>
              </TouchableOpacity>
              {paymentProof && (
                <Image
                  source={{ uri: paymentProof }}
                  style={{
                    width: 220,
                    height: 160,
                    marginTop: 10,
                    alignSelf: "center",
                    borderRadius: 8,
                  }}
                />
              )}
              <TouchableOpacity
                style={[
                  styles.completeOrderButton,
                  (!paymentProof || loading) && styles.completeOrderButtonDisabled,
                ]}
                onPress={handleCompleteOrder}
                disabled={!paymentProof || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.completeOrderButtonText}>Submit Order</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  cartButton: { padding: 8, position: "relative" },
  cartBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#ff4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadgeText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  content: { padding: 16 },
  productCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  productCardUnavailable: { backgroundColor: "#f5f5f5", opacity: 0.7 },
  productName: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 4 },
  productNameUnavailable: { color: "#999", textDecorationLine: "line-through" },
  productPrice: { fontSize: 14, fontWeight: "bold", color: "#4CAF50" },
  emptyText: { textAlign: "center", marginTop: 40, color: "#999" },
  addButton: {
    backgroundColor: "#54a9f7",
    borderRadius: 22,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  addButtonDisabled: { backgroundColor: "#e0e0e0" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  addToCartModal: {
    padding: 20,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  addToCartModalScroll: { flexGrow: 1, justifyContent: "center", paddingBottom: 20 },
  paymentModalScroll: { flexGrow: 1, justifyContent: "center", paddingBottom: 20 },
  paymentModal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  modalContent: { gap: 16 },
  selectedProductName: { fontSize: 16, fontWeight: "600", color: "#333" },
  unitToggle: { flexDirection: "row", justifyContent: "space-around", marginBottom: 12 },
  unitOption: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    alignItems: "center",
  },
  unitOptionActive: { backgroundColor: "#54a9f7", borderColor: "#54a9f7" },
  unitText: { color: "#333", fontWeight: "bold" },
  quantityContainer: { flexDirection: "row", alignItems: "center", gap: 12 },
  quantityLabel: { fontSize: 14, fontWeight: "600", color: "#333" },
  quantityInput: {
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    width: 80,
    textAlign: "center",
  },
  addToCartButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  addToCartButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  button: {
    backgroundColor: "#54a9f7",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  completeOrderButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  completeOrderButtonDisabled: { backgroundColor: "#ccc" },
  completeOrderButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default PlaceOrderScreen;
