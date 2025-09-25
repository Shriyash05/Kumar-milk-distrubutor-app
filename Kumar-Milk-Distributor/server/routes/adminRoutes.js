const express = require("express");
const {
  getAllOrders,
  updateOrderStatus,
  updateMobileOrderStatus,
  getDailyDeliveryCSV,
  getMonthlySummary,
  getAdminDashboard,
  getAllMobileOrders,
  getAllUsers,
  getAllProducts,
} = require("../controllers/adminController");
const {
  setInventoryForDate,
  getInventoryForDate,
} = require("../controllers/adminController.js");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// Dashboard and statistics
router.get("/dashboard", protect, adminOnly, getAdminDashboard);

// Order management
router.get("/orders", protect, adminOnly, getAllOrders);
router.get("/mobile-orders", protect, adminOnly, getAllMobileOrders);
router.patch("/orders/:id/status", protect, adminOnly, updateOrderStatus);
router.patch("/mobile-orders/:id/status", protect, adminOnly, updateMobileOrderStatus);

// User management
router.get("/users", protect, adminOnly, getAllUsers);

// Product management
router.get("/products", protect, adminOnly, getAllProducts);
router.post("/products", protect, adminOnly, require('../controllers/adminController').createProduct);
router.put("/products/:id", protect, adminOnly, require('../controllers/adminController').updateProduct);
router.delete("/products/:id", protect, adminOnly, require('../controllers/adminController').deleteProduct);

// Reports
router.get("/deliveries/csv", protect, adminOnly, getDailyDeliveryCSV);
router.get("/monthly-summary", protect, getMonthlySummary);

// AI Analytics endpoints (check if controller exists first)
try {
  const aiController = require('../controllers/aiAnalyticsController');
  router.get("/analytics/sales-report", protect, adminOnly, aiController.generateSalesReport);
  router.post("/analytics/ai-query", protect, adminOnly, aiController.processNaturalLanguageQuery);
  router.get("/analytics/dashboard-insights", protect, adminOnly, aiController.getDashboardInsights);
  router.post("/analytics/generate-report", protect, adminOnly, aiController.generateCustomReport);
  router.post("/admin/analytics/generate-report", protect, adminOnly, generateCustomReport);
  console.log('✅ AI Analytics routes loaded successfully');
} catch (error) {
  console.log('⚠️ AI Analytics controller not found, skipping AI routes:', error.message);
}

// Inventory management
router.post("/inventory", protect, adminOnly, setInventoryForDate);
router.get("/inventory/:date", protect, adminOnly, getInventoryForDate);

module.exports = router;
