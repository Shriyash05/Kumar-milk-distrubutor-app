import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Dimensions,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message";
import simpleAuthService from "../services/simpleAuthService";

const { width } = Dimensions.get("window");

const CustomerDashboardNew = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    orders: [],
    recentOrders: [],
    stats: {
      totalOrders: 0,
      pendingOrders: 0,
      deliveredOrders: 0,
      thisMonthOrders: 0,
    },
  });

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    setLoading(true);
    try {
      await loadUserData();
      await loadOrdersData();
    } catch (error) {
      console.error("Dashboard init error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      const storedUserData = await SecureStore.getItemAsync("userData");
      if (storedUserData) setUserData(JSON.parse(storedUserData));
    } catch (error) {
      console.error("Load user data error:", error);
    }
  };

  const loadOrdersData = async () => {
    try {
      const rawResp = await simpleAuthService.makeRequest("/customer/orders", { method: "GET" });
      let allOrders = Array.isArray(rawResp) ? rawResp : rawResp?.orders || rawResp?.data?.orders || [];

      const uid = userData?._id;
      const userOrdersRaw = allOrders.filter(
        (o) => o.userId === uid || o.customerId === uid || (o.user && (o.user._id === uid))
      );

      const normalized = userOrdersRaw.map((order) => {
        const items = order.items && order.items.length
          ? order.items.map((it) => ({
              productName: it.productName || it.name || "Item",
              quantity: Number(it.quantity || 1),
              unitType: it.unitType || "unit",
              unitPrice: Number(it.unitPrice || 0),
              totalAmount: Number(it.totalAmount || 0),
            }))
          : [{ productName: order.productName || "Item", quantity: 1, unitType: "unit", unitPrice: order.unitPrice || 0, totalAmount: order.totalAmount || 0 }];

        const rawDate = new Date(order.orderDate || order.createdAt || Date.now());
        return {
          id: order._id,
          rawDate,
          dateDisplay: rawDate.toLocaleDateString(),
          items,
          totalAmount: items.reduce((sum, it) => sum + it.totalAmount, 0),
          status: order.status || "Pending",
        };
      });

      const stats = {
        totalOrders: normalized.length,
        pendingOrders: normalized.filter((o) => o.status === "Pending").length,
        deliveredOrders: normalized.filter((o) => o.status === "Delivered").length,
        thisMonthOrders: normalized.filter(
          (o) => o.rawDate.getMonth() === new Date().getMonth()
        ).length,
      };

      setDashboardData({ orders: normalized, recentOrders: normalized.slice(0, 5), stats });
    } catch (error) {
      console.error("Load orders error:", error);
      Toast.show({ type: "error", text1: "Failed to load orders" });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await initializeDashboard();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    return hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
  };

  // --- RENDER ---
  const renderHeader = () => (
    <View style={styles.header}>
      <Image source={require("../assets/dashboard_bg.png")} style={styles.headerBg} resizeMode="cover" />
      <View style={styles.headerOverlay}>
        <View style={styles.logoRow}>
          <Image source={require("../assets/kumar_milk_logo.png")} style={styles.headerLogo} />
          <Text style={styles.brandText}>Kumar Milk</Text>
        </View>
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>Good {getGreeting()}, {userData?.name || "Customer"}!</Text>
          <Text style={styles.subtitle}>How can we serve you today?</Text>
        </View>
      </View>
    </View>
  );

  const renderStatsCards = () => (
    <View style={styles.statsSection}>
      <View style={styles.statsGrid}>
        {[
          { label: "Total Orders", value: dashboardData.stats.totalOrders, color: "#2196F3", icon: "receipt-outline", bg: "#E3F2FD" },
          { label: "Delivered", value: dashboardData.stats.deliveredOrders, color: "#4CAF50", icon: "checkmark-circle-outline", bg: "#E8F5E8" },
          { label: "Pending", value: dashboardData.stats.pendingOrders, color: "#FF9800", icon: "time-outline", bg: "#FFF3E0" },
          { label: "This Month", value: dashboardData.stats.thisMonthOrders, color: "#9C27B0", icon: "calendar-outline", bg: "#F3E5F5" },
        ].map((card, i) => (
          <View key={i} style={[styles.statCard, { backgroundColor: card.bg }]}>
            <Ionicons name={card.icon} size={24} color={card.color} />
            <Text style={styles.statNumber}>{card.value}</Text>
            <Text style={[styles.statLabel, { color: card.color }]}>{card.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🚀 Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {[
          { label: "Place Order", icon: "add-circle", color: "#667eea", onPress: () => navigation.navigate("PlaceOrder") },
          { label: "My Orders", icon: "list", color: "#4CAF50", onPress: () => navigation.navigate("Orders") },
          { label: "Products", icon: "storefront", color: "#FF9800", onPress: () => navigation.navigate("Products") },
          { label: "Profile", icon: "person", color: "#2196F3", onPress: () => navigation.navigate("Profile") },
          { label: "Milk Prices", icon: "cash-outline", color: "#FF5722", onPress: () => navigation.navigate("MilkPrices") },
          { label: "How to Order", icon: "help-circle-outline", color: "#795548", onPress: () => navigation.navigate("HowToOrder") },
        ].map((action, i) => (
          <TouchableOpacity key={i} style={styles.actionButton} onPress={action.onPress}>
            <View style={[styles.actionGradient, { backgroundColor: action.color }]}>
              <Ionicons name={action.icon} size={32} color="#fff" />
              <Text style={styles.actionText}>{action.label}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (loading) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderStatsCards()}
        {renderQuickActions()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 16, fontSize: 16, color: "#666" },
  header: { height: 220, position: "relative", marginBottom: 16 },
  headerBg: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  headerOverlay: { flex: 1, padding: 16, justifyContent: "space-between" },
  logoRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  headerLogo: { width: 40, height: 40 },
  brandText: { color: "#000", fontSize: 18, fontWeight: "bold", marginLeft: 8 },
  greetingContainer: { alignItems: "flex-start", marginTop: 16 },
  greeting: { color: "#000", fontSize: 22, fontWeight: "bold" },
  subtitle: { color: "#333", fontSize: 16 },
  statsSection: { paddingHorizontal: 16, marginBottom: 24 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  statCard: { width: (width - 48) / 2, padding: 16, borderRadius: 16, alignItems: "center", marginBottom: 12 },
  statNumber: { fontSize: 24, fontWeight: "bold", marginVertical: 4 },
  statLabel: { fontSize: 12, fontWeight: "500" },
  section: { paddingHorizontal: 16, paddingVertical: 16 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: "#2c3e50", marginBottom: 12 },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  actionButton: { width: (width - 48) / 2, borderRadius: 16, overflow: "hidden", marginBottom: 12 },
  actionGradient: { padding: 16, alignItems: "center", justifyContent: "center", minHeight: 100, borderRadius: 16 },
  actionText: { color: "#fff", fontSize: 14, fontWeight: "bold", marginTop: 8, textAlign: "center" },
});

export default CustomerDashboardNew;
