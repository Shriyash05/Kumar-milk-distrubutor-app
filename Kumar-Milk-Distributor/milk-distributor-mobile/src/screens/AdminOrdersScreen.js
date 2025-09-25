import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Image,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import * as SecureStore from "expo-secure-store";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import { Asset } from "expo-asset";
import simpleAuthService from "../services/simpleAuthService";

/* ---------------- Helpers ---------------- */
const formatNumber = (v, d = 2) => {
  if (v === null || v === undefined || isNaN(v))
    return "0" + (d ? "." + "0".repeat(d) : "");
  const n = typeof v === "string" ? parseFloat(v) : v;
  return d ? n.toFixed(d) : Math.round(n).toString();
};
const formatCurrency = (v) => "₹" + formatNumber(v, 2);

/* ---------------- Main Component ---------------- */
export default function AdminOrdersScreen({ navigation, route }) {
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [showDetails, setShowDetails] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [proofLoading, setProofLoading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  
  // Extract navigation parameters
  const { selectedOrderId, selectedOrderGroupId, highlightOrder } = route?.params || {};

  /* ---------- Auth ---------- */
  const checkAdmin = async () => {
    try {
      const token = await SecureStore.getItemAsync("authToken");
      const role = await SecureStore.getItemAsync("userRole");
      if (!token || role !== "admin") {
        Toast.show({ type: "error", text1: "Admin login required" });
        navigation.replace("Landing");
        return false;
      }
      setIsAdmin(true);
      return true;
    } finally {
      setCheckingAuth(false);
    }
  };

  useEffect(() => {
    (async () => {
      if (await checkAdmin()) {
        await loadOrders();
        
        // Log navigation parameters for debugging
        if (selectedOrderId || selectedOrderGroupId) {
          console.log('📱 AdminOrders: Received navigation params:', {
            selectedOrderId,
            selectedOrderGroupId,
            highlightOrder
          });
        }
      }
    })();
  }, []);

  /* ---------- Fetch Orders ---------- */
  const loadOrders = async () => {
    try {
        console.log('📎 Admin: Loading all orders with grouping...');
      
      // Load all orders (unified mobile and web orders)
      const allOrdersRes = await simpleAuthService.makeRequest("/admin/all-orders?limit=100");
      const allOrders = allOrdersRes?.orders || [];
      
      console.log(`📎 Admin: Loaded ${allOrders.length} orders from unified endpoint`);
      if (allOrders.length > 0) {
        console.log('📎 Sample order:');
        console.log('- Customer Name:', allOrders[0].customerName);
        console.log('- Customer Phone:', allOrders[0].customerPhone);
        console.log('- Product:', allOrders[0].productName);
        console.log('- Order Group ID:', allOrders[0].orderGroupId);
        console.log('- Payment Proof:', allOrders[0].hasPaymentProof ? 'Yes' : 'No');
        console.log('- Proof URI:', allOrders[0].proof || 'null');
        console.log('- Payment Proof Object:', allOrders[0].paymentProof || 'null');
        console.log('- Status:', allOrders[0].status);
        console.log('- Source:', allOrders[0].orderSource || 'mobile_app');
      }
      
      setOrders(allOrders);
    } catch (e) {
      console.error("Error loading orders:", e);
      Toast.show({ type: "error", text1: "Failed to load orders" });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  /* ---------- Group Orders (Same as MyOrdersScreen) ---------- */
  const groupedOrders = React.useMemo(() => {
    console.log('📝 Admin: Processing orders for grouping:', orders.length);
    if (!orders || orders.length === 0) {
      console.log('❌ Admin: No orders to group');
      return [];
    }

    const groups = {};
    orders.forEach((o, index) => {
      // Create a unique key that ensures orders with different payment proofs are grouped separately
      let key;
      
      if (o.orderGroupId) {
        // If order has a specific group ID, use it
        key = o.orderGroupId;
      } else {
        // Create unique key based on customer, date, and payment proof
        const customerKey = o.customerName || o.customer || 'user';
        const dateKey = new Date(o.orderDate || o.createdAt || Date.now()).toDateString();
        const proofKey = o.proof ? `_proof_${o.proof.substring(o.proof.lastIndexOf('/') + 1, o.proof.lastIndexOf('.')) || 'img'}` : '_no_proof';
        const statusKey = o.status || 'pending';
        
        // Include order creation time to ensure each separate order session creates a new group
        const timeKey = new Date(o.createdAt || Date.now()).getTime();
        const roundedTimeKey = Math.floor(timeKey / (5 * 60 * 1000)) * (5 * 60 * 1000); // Round to 5-minute intervals
        
        key = `${customerKey}_${dateKey}_${statusKey}_${roundedTimeKey}${proofKey}`;
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(o);
    });

    const groupedResult = Object.entries(groups).map(([groupId, items]) => {
      // Each item in mobile orders is already a single product order
      const allItems = items.map(item => ({
        productName: item.productName,
        quantity: item.quantity,
        unitType: item.unitType,
        unitPrice: item.unitPrice,
        totalAmount: item.totalAmount,
        packSize: item.packSize,
        totalPieces: item.totalPieces
      }));
      
      const totalAmount = items.reduce(
        (s, i) => s + (i.totalAmount || 0),
        0
      );
      
      const proof = items.find((i) => i.proof)?.proof || null;
      const firstOrder = items[0];
      
      return {
        groupId,
        orders: items,
        items: allItems,
        totalAmount,
        status: firstOrder?.status || "pending",
        proof,
        deliveryAddress: firstOrder?.deliveryAddress || "",
        customerName: firstOrder?.customerName || firstOrder?.customer?.name || "Unknown Customer",
        customerPhone: firstOrder?.customerPhone || firstOrder?.customer?.phone || "N/A",
        customerEmail: firstOrder?.customer?.email || "N/A",
        paymentMethod: firstOrder?.paymentMethod || "N/A",
        paymentStatus: firstOrder?.paymentStatus || "pending",
        orderDate: firstOrder?.orderDate || firstOrder?.createdAt,
        createdAt: firstOrder?.createdAt
      };
    }).sort(
      (a, b) =>
        new Date(b.orders[0]?.orderDate || b.orders[0]?.createdAt) -
        new Date(a.orders[0]?.orderDate || a.orders[0]?.createdAt)
    );
    
    console.log('📦 Admin: Created', groupedResult.length, 'order groups');
    if (groupedResult.length > 0) {
      console.log('🔍 Admin: Sample group:', {
        groupId: groupedResult[0].groupId,
        customerName: groupedResult[0].customerName,
        customerPhone: groupedResult[0].customerPhone,
        itemsCount: groupedResult[0].items.length,
        totalAmount: groupedResult[0].totalAmount,
        status: groupedResult[0].status,
        hasPaymentProof: !!groupedResult[0].proof
      });
    }
    
    return groupedResult;
  }, [orders]);
  
  // Auto-open specific order when navigated from dashboard
  useEffect(() => {
    if ((selectedOrderId || selectedOrderGroupId) && groupedOrders.length > 0 && !showDetails) {
      console.log('🔍 AdminOrders: Looking for specific order to auto-open...');
      
      // Find the order group that contains the selected order
      const targetGroup = groupedOrders.find(group => {
        // Check by orderGroupId first
        if (selectedOrderGroupId && group.groupId === selectedOrderGroupId) {
          console.log('✅ AdminOrders: Found group by orderGroupId:', group.groupId);
          return true;
        }
        
        // Check by individual order ID
        if (selectedOrderId) {
          const hasOrder = group.orders.some(order => 
            order._id === selectedOrderId || order.id === selectedOrderId
          );
          if (hasOrder) {
            console.log('✅ AdminOrders: Found group by orderId:', selectedOrderId);
            return true;
          }
        }
        
        return false;
      });
      
      if (targetGroup) {
        console.log('🎯 AdminOrders: Auto-opening order group:', targetGroup.customerName);
        setSelectedGroup(targetGroup);
        setShowDetails(true);
        
        // Show success toast
        Toast.show({
          type: 'success',
          text1: 'Order Found',
          text2: `Opened order for ${targetGroup.customerName}`,
          position: 'top',
          visibilityTime: 3000,
        });
        
        // Clear the navigation params to prevent re-opening
        navigation.setParams({
          selectedOrderId: undefined,
          selectedOrderGroupId: undefined,
          highlightOrder: undefined
        });
      } else {
        console.log('⚠️ AdminOrders: Could not find target order in loaded orders');
        Toast.show({
          type: 'error',
          text1: 'Order Not Found',
          text2: 'The selected order may have been updated or removed',
          position: 'top',
          visibilityTime: 4000,
        });
        
        // Clear the navigation params even if order not found
        navigation.setParams({
          selectedOrderId: undefined,
          selectedOrderGroupId: undefined,
          highlightOrder: undefined
        });
      }
    }
  }, [groupedOrders, selectedOrderId, selectedOrderGroupId, showDetails, navigation]);

  /* ---------- Download Image ---------- */
  const downloadImage = async (imageUri) => {
    try {
      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant media library permissions to download images.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Show loading toast
      Toast.show({
        type: 'info',
        text1: 'Downloading...',
        text2: 'Saving payment proof image',
        autoHide: false
      });

      // Generate a unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `payment_proof_${timestamp}.jpg`;
      const fileUri = FileSystem.documentDirectory + filename;

      // Download the image
      const { uri } = await FileSystem.downloadAsync(imageUri, fileUri);
      
      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('Payment Proofs', asset, false);
      
      // Hide loading and show success
      Toast.hide();
      Toast.show({
        type: 'success',
        text1: 'Downloaded!',
        text2: 'Image saved to gallery'
      });
    } catch (error) {
      console.error('Download error:', error);
      Toast.hide();
      
      // Try sharing as fallback
      try {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(imageUri, {
            mimeType: 'image/jpeg',
            dialogTitle: 'Save Payment Proof Image'
          });
        } else {
          Alert.alert('Error', 'Unable to download image. Sharing not available.');
        }
      } catch (shareError) {
        Alert.alert('Error', 'Failed to download or share image.');
      }
    }
  };

  /* ---------- Print Invoice ---------- */
  const printInvoice = async (group) => {
    try {
      Toast.show({
        type: 'info',
        text1: 'Generating Invoice...',
        text2: 'Please wait',
        autoHide: false
      });

      // Generate invoice number
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}-${group.groupId.substring(-8)}`;
      const invoiceDate = new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const orderDate = new Date(group.orderDate || group.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Calculate totals
      const subtotal = group.items.reduce((sum, item) => sum + (item.totalAmount || item.quantity * item.unitPrice), 0);
      const taxRate = 0; // Adjust if needed
      const taxAmount = subtotal * taxRate;
      const total = subtotal + taxAmount;

      // Create HTML invoice
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice - ${invoiceNumber}</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
              line-height: 1.6;
            }
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border: 1px solid #ddd;
              border-radius: 8px;
              overflow: hidden;
            }
            .invoice-header {
              background: linear-gradient(135deg, #4CAF50, #45a049);
              color: white;
              padding: 30px;
              text-align: center;
              position: relative;
            }
            .company-logo {
              font-size: 48px;
              font-weight: bold;
              margin-bottom: 10px;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            .company-name {
              font-size: 32px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .company-tagline {
              font-size: 16px;
              opacity: 0.9;
              font-style: italic;
            }
            .invoice-title {
              font-size: 28px;
              font-weight: bold;
              margin: 20px 0 10px 0;
            }
            .invoice-number {
              font-size: 18px;
              opacity: 0.9;
            }
            .invoice-body {
              padding: 30px;
            }
            .invoice-details {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
              flex-wrap: wrap;
            }
            .detail-section {
              flex: 1;
              min-width: 250px;
              margin-bottom: 20px;
            }
            .detail-section h3 {
              color: #4CAF50;
              border-bottom: 2px solid #4CAF50;
              padding-bottom: 8px;
              margin-bottom: 15px;
              font-size: 18px;
            }
            .detail-item {
              margin-bottom: 8px;
              display: flex;
              align-items: center;
            }
            .detail-label {
              font-weight: bold;
              margin-right: 10px;
              min-width: 80px;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 30px 0;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .items-table th {
              background: #4CAF50;
              color: white;
              padding: 15px 10px;
              text-align: left;
              font-weight: bold;
            }
            .items-table td {
              padding: 12px 10px;
              border-bottom: 1px solid #eee;
            }
            .items-table tr:nth-child(even) {
              background: #f9f9f9;
            }
            .items-table tr:hover {
              background: #f5f5f5;
            }
            .total-section {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin-top: 30px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              padding: 5px 0;
            }
            .total-row.final {
              border-top: 2px solid #4CAF50;
              padding-top: 15px;
              font-size: 20px;
              font-weight: bold;
              color: #4CAF50;
            }
            .status-badge {
              display: inline-block;
              padding: 6px 12px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .status-pending {
              background: #FFF3CD;
              color: #856404;
            }
            .status-confirmed {
              background: #D4EDDA;
              color: #155724;
            }
            .status-delivered {
              background: #CCE5FF;
              color: #004085;
            }
            .footer {
              margin-top: 40px;
              padding: 20px;
              background: #f8f9fa;
              border-top: 3px solid #4CAF50;
              text-align: center;
              color: #666;
            }
            .payment-proof-note {
              margin-top: 20px;
              padding: 15px;
              background: #E8F5E8;
              border-left: 4px solid #4CAF50;
              border-radius: 4px;
            }
            @media print {
              body { margin: 0; }
              .invoice-container { border: none; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <!-- Header -->
            <div class="invoice-header">
              <div class="company-logo">🥛</div>
              <div class="company-name">Kumar Milk Distributors</div>
              <div class="company-tagline">Fresh • Pure • Delivered Daily</div>
              <div class="invoice-title">INVOICE</div>
              <div class="invoice-number">${invoiceNumber}</div>
            </div>

            <!-- Body -->
            <div class="invoice-body">
              <!-- Invoice Details -->
              <div class="invoice-details">
                <div class="detail-section">
                  <h3>📄 Invoice Information</h3>
                  <div class="detail-item">
                    <span class="detail-label">Invoice #:</span>
                    <span>${invoiceNumber}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Date:</span>
                    <span>${invoiceDate}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Order Date:</span>
                    <span>${orderDate}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Status:</span>
                    <span class="status-badge status-${group.status}">${group.status}</span>
                  </div>
                </div>

                <div class="detail-section">
                  <h3>👤 Customer Details</h3>
                  <div class="detail-item">
                    <span class="detail-label">Name:</span>
                    <span>${group.customerName}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Phone:</span>
                    <span>${group.customerPhone}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Email:</span>
                    <span>${group.customerEmail}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Address:</span>
                    <span>${group.deliveryAddress || 'N/A'}</span>
                  </div>
                </div>

                <div class="detail-section">
                  <h3>🏪 Company Details</h3>
                  <div class="detail-item">
                    <span class="detail-label">Company:</span>
                    <span>Kumar Milk Distributors</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Phone:</span>
                    <span>+91 98765 43210</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Email:</span>
                    <span>info@kumarmilk.com</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Website:</span>
                    <span>www.kumarmilk.com</span>
                  </div>
                </div>
              </div>

              <!-- Items Table -->
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit</th>
                    <th>Rate (₹)</th>
                    <th>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  ${group.items.map(item => `
                    <tr>
                      <td><strong>${item.productName}</strong></td>
                      <td>${item.quantity}</td>
                      <td>${item.unitType || 'Unit'}</td>
                      <td>₹${(item.unitPrice || 0).toFixed(2)}</td>
                      <td>₹${(item.totalAmount || item.quantity * item.unitPrice || 0).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <!-- Totals -->
              <div class="total-section">
                <div class="total-row">
                  <span>Subtotal:</span>
                  <span>₹${subtotal.toFixed(2)}</span>
                </div>
                ${taxRate > 0 ? `
                <div class="total-row">
                  <span>Tax (${(taxRate * 100)}%):</span>
                  <span>₹${taxAmount.toFixed(2)}</span>
                </div>
                ` : ''}
                <div class="total-row final">
                  <span>Total Amount:</span>
                  <span>₹${total.toFixed(2)}</span>
                </div>
              </div>

              <!-- Payment Information -->
              <div class="payment-proof-note">
                <strong>💳 Payment Information:</strong><br>
                Method: ${group.paymentMethod || 'UPI/Online'}<br>
                Status: ${group.paymentStatus || 'Paid'}<br>
                ${group.proof ? '✅ Payment proof verified and attached' : 'ℹ️ No payment proof available'}
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p><strong>Thank you for choosing Kumar Milk Distributors!</strong></p>
              <p>Fresh milk delivered to your doorstep • Contact us for any queries</p>
              <p><small>This is a computer-generated invoice. No signature required.</small></p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Generate PDF and print/share
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
        width: 595, // A4 width in points
        height: 842, // A4 height in points
      });

      Toast.hide();

      // Show options for print or share
      Alert.alert(
        'Invoice Generated',
        'Your invoice has been generated successfully. What would you like to do?',
        [
          {
            text: 'Print',
            onPress: async () => {
              await Print.printAsync({ uri });
            }
          },
          {
            text: 'Share',
            onPress: async () => {
              await Sharing.shareAsync(uri, {
                mimeType: 'application/pdf',
                dialogTitle: `Invoice ${invoiceNumber}`,
                UTI: 'com.adobe.pdf'
              });
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );

    } catch (error) {
      console.error('Print invoice error:', error);
      Toast.hide();
      Alert.alert('Error', 'Failed to generate invoice. Please try again.');
    }
  };

  /* ---------- Update Status ---------- */
  const handleStatusUpdate = async (group, status) => {
    try {
      console.log(`🔄 Admin: Updating ${group.orders.length} orders to status: ${status}`);
      
      await Promise.all(
        group.orders.map((o) => {
          console.log(`🔄 Updating order ${o._id} to ${status}`);
          return simpleAuthService.makeRequest(`/admin/orders/${o._id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          });
        })
      );
      
      Toast.show({ 
        type: "success", 
        text1: `Orders Updated`, 
        text2: `${group.orders.length} order(s) marked as ${status}` 
      });
      
      loadOrders();
      setShowDetails(false);
    } catch (e) {
      console.error("Status update error:", e);
      Toast.show({ 
        type: "error", 
        text1: "Update failed", 
        text2: e.message || 'Please try again' 
      });
    }
  };

  /* ---------- Colors ---------- */
  const getStatusColor = (s) =>
    ({
      pending: "#FF9800",
      confirmed: "#2196F3",
      processing: "#9C27B0",
      out_for_delivery: "#00BCD4",
      delivered: "#4CAF50",
      cancelled: "#F44336",
    }[s] || "#666");


  /* ---------- Render Card (Enhanced with Customer Info) ---------- */
  const renderGroup = ({ item: group }) => (
    <TouchableOpacity
      style={styles.groupCard}
      onPress={() => {
        setSelectedGroup(group);
        setShowDetails(true);
        setProofLoading(true);
      }}
    >
      <View style={styles.headerRow}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{group.customerName}</Text>
          <Text style={styles.customerPhone}>📱 {group.customerPhone}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(group.status) },
          ]}
        >
          <Text style={styles.statusText}>{group.status}</Text>
        </View>
      </View>
      
      <Text style={styles.subText}>
        {group.orders.length} order(s) • {group.items.length} items
      </Text>
      
      <View style={styles.orderMeta}>
        <Text style={styles.metaText}>
          💳 {group.paymentMethod} • {group.paymentStatus}
          {group.proof && ' • 📸 Proof Available'}
        </Text>
      </View>
      
      <Text style={styles.total}>Total: {formatCurrency(group.totalAmount)}</Text>
    </TouchableOpacity>
  );

  /* ---------- UI ---------- */
  if (checkingAuth) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#54a9f7" />
        <Text style={{ marginTop: 12 }}>Checking admin access…</Text>
      </SafeAreaView>
    );
  }
  if (!isAdmin) return null;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={groupedOrders}
        keyExtractor={(item) => item.groupId}
        renderItem={renderGroup}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 50 }}>
            <Text style={{ color: "#666", fontSize: 16 }}>No orders yet</Text>
          </View>
        }
      />

      {/* ---------- Details Modal ---------- */}
      <Modal
        visible={showDetails}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedGroup?.customerName}</Text>
              <TouchableOpacity onPress={() => setShowDetails(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>
            
            {/* Customer Details */}
            <View style={styles.customerDetails}>
              <Text style={styles.detailText}>📱 Phone: {selectedGroup?.customerPhone}</Text>
              <Text style={styles.detailText}>📧 Email: {selectedGroup?.customerEmail}</Text>
              <Text style={styles.detailText}>📍 Address: {selectedGroup?.deliveryAddress}</Text>
              <Text style={styles.detailText}>📅 Order Date: {new Date(selectedGroup?.orderDate).toLocaleDateString()}</Text>
            </View>
            
            {/* Order Status & Payment Info */}
            <View style={styles.statusSection}>
              <View style={styles.statusRow}>
                <Text style={styles.detailText}>Status: </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedGroup?.status) }]}>
                  <Text style={styles.statusText}>{selectedGroup?.status}</Text>
                </View>
              </View>
              <Text style={styles.detailText}>💳 Payment: {selectedGroup?.paymentMethod} - {selectedGroup?.paymentStatus}</Text>
            </View>

            {/* Scrollable Items */}
            <ScrollView style={styles.modalItems}>
              {selectedGroup?.items.map((it, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text>
                    {it.productName} - {it.quantity} {it.unitType}
                  </Text>
                  <Text>{formatCurrency(it.unitPrice * it.quantity)}</Text>
                </View>
              ))}

              {/* Payment Proof */}
              {selectedGroup?.proof && (
                <View style={{ marginTop: 10 }}>
                  <View style={styles.proofHeader}>
                    <Text style={{ fontWeight: "bold" }}>Payment Proof:</Text>
                    <TouchableOpacity
                      style={styles.downloadBtn}
                      onPress={() => downloadImage(selectedGroup.proof)}
                    >
                      <Ionicons name="download" size={20} color="#007AFF" />
                      <Text style={styles.downloadText}>Download</Text>
                    </TouchableOpacity>
                  </View>
                  {proofLoading && (
                    <ActivityIndicator size="small" color="#333" />
                  )}
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedImageUri(selectedGroup.proof);
                      setShowImageModal(true);
                    }}
                  >
                    <Image
                      source={{ uri: selectedGroup.proof }}
                      style={styles.proofImage}
                      resizeMode="contain"
                      onLoadEnd={() => setProofLoading(false)}
                    />
                    <Text style={styles.tapToZoomText}>Tap to zoom</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>

            {/* Footer with totals & actions */}
            <View style={styles.modalFooter}>
              <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                Total: {formatCurrency(selectedGroup?.totalAmount || 0)}
              </Text>
              <View style={styles.actionsRow}>
                {/* Pending Verification - Main action buttons */}
                {(selectedGroup?.status === "pending_verification" || selectedGroup?.status === "pending") && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: "#28a745" }]}
                      onPress={() =>
                        handleStatusUpdate(selectedGroup, "confirmed")
                      }
                    >
                      <Text style={styles.actionText}>✓ Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: "#dc3545" }]}
                      onPress={() =>
                        handleStatusUpdate(selectedGroup, "cancelled")
                      }
                    >
                      <Text style={styles.actionText}>✗ Reject</Text>
                    </TouchableOpacity>
                  </>
                )}
                
                {/* Confirmed - Can start processing */}
                {selectedGroup?.status === "confirmed" && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: "#9C27B0" }]}
                      onPress={() =>
                        handleStatusUpdate(selectedGroup, "processing")
                      }
                    >
                      <Text style={styles.actionText}>🏭 Start Processing</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: "#FF6B35" }]}
                      onPress={() =>
                        handleStatusUpdate(selectedGroup, "cancelled")
                      }
                    >
                      <Text style={styles.actionText}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                )}
                
                {/* Processing - Can send for delivery */}
                {selectedGroup?.status === "processing" && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "#00BCD4" }]}
                    onPress={() =>
                      handleStatusUpdate(selectedGroup, "out_for_delivery")
                    }
                  >
                    <Text style={styles.actionText}>🚚 Send for Delivery</Text>
                  </TouchableOpacity>
                )}
                
                {/* Out for Delivery - Can mark as delivered */}
                {selectedGroup?.status === "out_for_delivery" && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "#4CAF50" }]}
                    onPress={() =>
                      handleStatusUpdate(selectedGroup, "delivered")
                    }
                  >
                    <Text style={styles.actionText}>✓ Mark Delivered</Text>
                  </TouchableOpacity>
                )}
                
                {/* Show status if completed */}
                {(selectedGroup?.status === "delivered" || selectedGroup?.status === "cancelled") && (
                  <Text style={[styles.statusCompleted, { color: getStatusColor(selectedGroup?.status) }]}>
                    {selectedGroup?.status === "delivered" ? "✓ Order Completed" : "✗ Order Cancelled"}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ---------- Zoomable Image Modal ---------- */}
      <Modal
        visible={showImageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.imageModalContainer}>
          {/* Header with controls */}
          <View style={styles.imageModalHeader}>
            <TouchableOpacity
              style={styles.imageModalBtn}
              onPress={() => downloadImage(selectedImageUri)}
            >
              <Ionicons name="download" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.imageModalTitle}>Payment Proof</Text>
            <TouchableOpacity
              style={styles.imageModalBtn}
              onPress={() => setShowImageModal(false)}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Zoomable Image */}
          <ScrollView
            style={styles.imageScrollView}
            contentContainerStyle={styles.imageScrollContainer}
            maximumZoomScale={5}
            minimumZoomScale={1}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
          >
            {selectedImageUri && (
              <Image
                source={{ uri: selectedImageUri }}
                style={styles.zoomableImage}
                resizeMode="contain"
              />
            )}
          </ScrollView>

          {/* Instructions */}
          <View style={styles.imageModalFooter}>
            <Text style={styles.instructionText}>Pinch to zoom • Tap download to save</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  groupCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between" },
  customerName: { fontSize: 16, fontWeight: "bold", color: "#333" },
  subText: { color: "#666", marginTop: 4 },
  total: { marginTop: 6, fontWeight: "bold", color: "#4CAF50" },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { color: "#fff", fontWeight: "600" },
  actionsRow: { flexDirection: "row", marginTop: 10 },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 10,
  },
  actionText: { color: "#fff", fontWeight: "600" },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
  },
  modalContent: {
    flex: 0.8,
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 12,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  modalItems: { paddingHorizontal: 12, paddingVertical: 8 },
  modalFooter: { padding: 12, borderTopWidth: 1, borderTopColor: "#ccc" },
  proofImage: { width: "100%", height: 200, marginTop: 6 },
  
  // New styles for enhanced admin display
  customerInfo: { flex: 1 },
  customerPhone: { fontSize: 12, color: "#666", marginTop: 2 },
  orderMeta: { marginTop: 6 },
  metaText: { fontSize: 12, color: "#666" },
  customerDetails: { padding: 12, backgroundColor: "#f8f9fa" },
  detailText: { fontSize: 14, marginBottom: 4, color: "#333" },
  statusSection: { padding: 12 },
  statusRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  statusCompleted: { fontSize: 16, fontWeight: "bold", textAlign: "center" },
  
  // Payment proof styles
  proofHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  downloadText: {
    marginLeft: 4,
    color: "#007AFF",
    fontSize: 12,
    fontWeight: "600",
  },
  tapToZoomText: {
    textAlign: "center",
    color: "#666",
    fontSize: 12,
    marginTop: 4,
    fontStyle: "italic",
  },
  
  // Zoomable image modal styles
  imageModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
  },
  imageModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  imageModalBtn: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  imageModalTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  imageScrollView: {
    flex: 1,
  },
  imageScrollContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  zoomableImage: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height * 0.7,
  },
  imageModalFooter: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: "center",
  },
  instructionText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
  },
});
