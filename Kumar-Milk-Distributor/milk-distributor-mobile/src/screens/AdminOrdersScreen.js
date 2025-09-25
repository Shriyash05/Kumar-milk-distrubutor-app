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
export default function AdminOrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [showDetails, setShowDetails] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [proofLoading, setProofLoading] = useState(false);

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
      if (await checkAdmin()) loadOrders();
    })();
  }, []);

  /* ---------- Fetch Orders ---------- */
  const loadOrders = async () => {
    try {
      const res = await simpleAuthService.makeRequest("/admin/orders");
      const allOrders = Array.isArray(res) ? res : res.orders || [];
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

  /* ---------- Group Orders ---------- */
  const groupedOrders = React.useMemo(() => {
    const groups = {};
    orders.forEach((o) => {
      const key = o.orderGroupId || o.userId || o._id;
      if (!groups[key]) groups[key] = [];
      groups[key].push(o);
    });

    return Object.entries(groups).map(([groupId, items]) => {
      const customerName = items[0]?.customerName || "Unknown";
      const customerPhone = items[0]?.customerPhone || "";
      const deliveryAddress = items[0]?.deliveryAddress || "";
      const proof = items.find((i) => i.paymentProof)?.paymentProof || null;
      const allItems = items.flatMap((i) => i.items || []);
      const totalAmount = items.reduce((s, i) => s + (i.totalAmount || 0), 0);

      // ✅ match backend allowed statuses
      let status = "pending";
      if (items.every((i) => i.status === "confirmed")) status = "confirmed";
      if (items.every((i) => i.status === "processing")) status = "processing";
      if (items.every((i) => i.status === "out_for_delivery"))
        status = "out_for_delivery";
      if (items.every((i) => i.status === "delivered")) status = "delivered";
      if (items.every((i) => i.status === "cancelled")) status = "cancelled";

      return {
        groupId,
        customerName,
        customerPhone,
        deliveryAddress,
        proof,
        orders: items,
        items: allItems,
        totalAmount,
        status,
      };
    });
  }, [orders]);

  /* ---------- Update Status ---------- */
  const handleStatusUpdate = async (group, status) => {
    try {
      await Promise.all(
        group.orders.map((o) =>
          simpleAuthService.makeRequest(`/admin/orders/${o._id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          })
        )
      );
      Toast.show({ type: "success", text1: `Marked as ${status}` });
      loadOrders();
      setShowDetails(false);
    } catch (e) {
      console.error("Status update error:", e);
      Toast.show({ type: "error", text1: "Update failed" });
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

  /* ---------- Render Card ---------- */
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
        <Text style={styles.customerName}>{group.customerName}</Text>
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
            <Text>Phone: {selectedGroup?.customerPhone}</Text>
            <Text>Address: {selectedGroup?.deliveryAddress}</Text>
            <Text>Status: {selectedGroup?.status}</Text>

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
                  <Text style={{ fontWeight: "bold" }}>Payment Proof:</Text>
                  {proofLoading && (
                    <ActivityIndicator size="small" color="#333" />
                  )}
                  <Image
                    source={{ uri: selectedGroup.proof }}
                    style={styles.proofImage}
                    resizeMode="contain"
                    onLoadEnd={() => setProofLoading(false)}
                  />
                </View>
              )}
            </ScrollView>

            {/* Footer with totals & actions */}
            <View style={styles.modalFooter}>
              <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                Total: {formatCurrency(selectedGroup?.totalAmount || 0)}
              </Text>
              <View style={styles.actionsRow}>
                {selectedGroup?.status === "pending" && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: "#28a745" }]}
                      onPress={() =>
                        handleStatusUpdate(selectedGroup, "confirmed")
                      }
                    >
                      <Text style={styles.actionText}>Confirm</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: "#dc3545" }]}
                      onPress={() =>
                        handleStatusUpdate(selectedGroup, "cancelled")
                      }
                    >
                      <Text style={styles.actionText}>Reject</Text>
                    </TouchableOpacity>
                  </>
                )}
                {selectedGroup?.status === "confirmed" && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "#007bff" }]}
                    onPress={() =>
                      handleStatusUpdate(selectedGroup, "delivered")
                    }
                  >
                    <Text style={styles.actionText}>Mark Delivered</Text>
                  </TouchableOpacity>
                )}
              </View>
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
});
