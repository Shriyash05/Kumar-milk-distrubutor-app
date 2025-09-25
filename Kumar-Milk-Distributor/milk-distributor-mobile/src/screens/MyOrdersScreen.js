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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import * as SecureStore from "expo-secure-store";
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
export default function MyOrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [showDetails, setShowDetails] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [proofLoading, setProofLoading] = useState(false);

  /* ---------- Fetch User ---------- */
  const fetchUser = async () => {
    try {
      const userDataString = await SecureStore.getItemAsync("userData");
      if (!userDataString) return null;
      return JSON.parse(userDataString);
    } catch (e) {
      console.error("Error reading user data:", e);
      return null;
    }
  };

  /* ---------- Fetch Orders ---------- */
  const loadOrders = async () => {
    setLoading(true);
    try {
      const userData = await fetchUser();
      if (!userData) {
        Toast.show({ type: "error", text1: "User data missing. Please login." });
        navigation.replace("Landing");
        setLoading(false);
        return;
      }
      setUser(userData);

      const res = await simpleAuthService.makeRequest("/customer/orders");
      const allOrders = Array.isArray(res) ? res : res.orders || [];

      console.log('📱 Mobile app received orders:', allOrders.length);
      if (allOrders.length > 0) {
        console.log('📱 Sample order from server:');
        console.log('- Full order object keys:', Object.keys(allOrders[0]));
        console.log('- Customer ID:', allOrders[0].customer);
        console.log('- User ID from storage:', userData._id);
        console.log('- Product Name:', allOrders[0].productName);
        console.log('- Order Group ID:', allOrders[0].orderGroupId);
        console.log('- Created At:', allOrders[0].createdAt);
        console.log('- Order Source:', allOrders[0].orderSource);
        console.log('- Status:', allOrders[0].status);
      }

      // Server already filters by user, no need for client-side filtering
      setOrders(allOrders);
    } catch (e) {
      console.error("Error loading orders:", e);
      if (e.message && e.message.includes('Invalid token')) {
        Toast.show({ 
          type: "error", 
          text1: "Session expired", 
          text2: "Please log in again" 
        });
        // Clear stored auth data and redirect to login
        await SecureStore.deleteItemAsync('authToken');
        await SecureStore.deleteItemAsync('userData');
        navigation.replace('Landing');
        return;
      }
      Toast.show({ type: "error", text1: "Failed to load orders" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  /* ---------- Group Orders ---------- */
  const groupedOrders = React.useMemo(() => {
    console.log('📝 Processing orders for grouping:', orders.length);
    if (!orders || orders.length === 0) {
      console.log('❌ No orders to group');
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
        const customerKey = o.customer || 'user';
        const dateKey = new Date(o.orderDate || o.createdAt || Date.now()).toDateString();
        const proofKey = (o.paymentProof && typeof o.paymentProof === 'object' && o.paymentProof.imageUri) 
          ? `_proof_${o.paymentProof.imageUri.substring(o.paymentProof.imageUri.lastIndexOf('/') + 1, o.paymentProof.imageUri.lastIndexOf('.')) || 'img'}` 
          : '_no_proof';
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
      const allItems = items.flatMap((i) =>
        i.items && Array.isArray(i.items)
          ? i.items
          : [{ productName: i.productName, quantity: i.quantity, unitType: i.unitType, unitPrice: i.unitPrice, totalAmount: i.totalAmount }]
      );
      const totalAmount = allItems.reduce(
        (s, i) => s + (i.totalAmount || i.quantity * i.unitPrice || 0),
        0
      );
      const proof = items.find((i) => i.paymentProof)?.paymentProof || null;
      return {
        groupId,
        orders: items,
        items: allItems,
        totalAmount,
        status: items[0]?.status || "pending",
        proof,
        deliveryAddress: items[0]?.deliveryAddress || "",
      };
    }).sort(
      (a, b) =>
        new Date(b.orders[0]?.orderDate || b.orders[0]?.createdAt) -
        new Date(a.orders[0]?.orderDate || a.orders[0]?.createdAt)
    );
    
    console.log('📦 Created', groupedResult.length, 'order groups');
    if (groupedResult.length > 0) {
      console.log('🔍 Sample group:', {
        groupId: groupedResult[0].groupId,
        itemsCount: groupedResult[0].items.length,
        totalAmount: groupedResult[0].totalAmount,
        status: groupedResult[0].status
      });
    }
    
    return groupedResult;
  }, [orders]);

  const getStatusColor = (s) =>
    ({
      pending: "#FF9800",
      approved: "#2196F3",
      delivered: "#4CAF50",
      cancelled: "#F44336",
    }[s] || "#666");

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
        <Text style={styles.customerName}>Order Group</Text>
        <View
          style={[styles.statusBadge, { backgroundColor: getStatusColor(group.status) }]}
        >
          <Text style={styles.statusText}>{group.status}</Text>
        </View>
      </View>
      <Text style={styles.subText}>
        {group.orders.length} order(s) • {group.items.length} items
      </Text>
      <Text style={styles.total}>Total: {formatCurrency(group.totalAmount)}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#54a9f7" />
        <Text style={{ marginTop: 12 }}>Loading orders…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={groupedOrders}
        keyExtractor={(item) => item.groupId}
        renderItem={renderGroup}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 50 }}>
            <Text style={{ color: "#666", fontSize: 16 }}>No orders yet</Text>
          </View>
        }
      />

      <Modal
        visible={showDetails}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Details</Text>
              <TouchableOpacity onPress={() => setShowDetails(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>
            <Text>Address: {selectedGroup?.deliveryAddress}</Text>
            <Text>Status: {selectedGroup?.status}</Text>

            <ScrollView style={styles.modalItems}>
              {selectedGroup?.items.map((it, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text>{it.productName} - {it.quantity} {it.unitType}</Text>
                  <Text>{formatCurrency(it.unitPrice * it.quantity)}</Text>
                </View>
              ))}

              {selectedGroup?.proof && (
                <View style={{ marginTop: 10 }}>
                  <Text style={{ fontWeight: "bold" }}>Payment Proof:</Text>
                  {proofLoading && <ActivityIndicator size="small" color="#333" />}
                  <Image
                    source={{ uri: selectedGroup.proof }}
                    style={styles.proofImage}
                    resizeMode="contain"
                    onLoadEnd={() => setProofLoading(false)}
                  />
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                Total: {formatCurrency(selectedGroup?.totalAmount || 0)}
              </Text>
            </View>
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
  modalContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center" },
  modalContent: { flex: 0.8, backgroundColor: "#fff", margin: 20, borderRadius: 12, overflow: "hidden" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, borderBottomWidth: 1, borderBottomColor: "#ccc" },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  modalItems: { paddingHorizontal: 12, paddingVertical: 8 },
  modalFooter: { padding: 12, borderTopWidth: 1, borderTopColor: "#ccc" },
  proofImage: { width: "100%", height: 200, marginTop: 6 },
});
