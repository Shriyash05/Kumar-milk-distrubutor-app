const express = require("express");
const {
  placeOrder,
  getOngoingOrders,
  getOrderHistory,
  deleteOrder,
  updateOrder,
  getCustomerSummary,
  downloadInvoice,
} = require("../controllers/orderController.js");
const upload = require("../middleware/upload.js");

const { protect } = require("../middleware/authMiddleware.js");

const router = express.Router();
router.post("/place", upload.single("paymentScreenshot"), protect, placeOrder);
router.get("/ongoing", protect, getOngoingOrders);
router.get("/history", protect, getOrderHistory);
router.get("/invoice/:id", protect, downloadInvoice);
router.delete("/:id", protect, deleteOrder);
router.put("/:id", protect, updateOrder);
router.get("/summary", protect, getCustomerSummary);

module.exports = router;
