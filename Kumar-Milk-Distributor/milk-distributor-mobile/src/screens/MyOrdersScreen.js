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

      // Filter only logged-in user orders
      const userOrders = allOrders.filter(
        (o) => o.customer === userData._id || o.customer === userData.id
      );

      setOrders(userOrders);
    } catch (e) {
      console.error("Error loading orders:", e);
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
    if (!orders || orders.length === 0) return [];

    const groups = {};
    orders.forEach((o) => {
      const key = o.orderGroupId || `${o.customer}_${new Date(o.orderDate || o.createdAt).toDateString()}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(o);
    });

    return Object.entries(groups).map(([groupId, items]) => {
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
