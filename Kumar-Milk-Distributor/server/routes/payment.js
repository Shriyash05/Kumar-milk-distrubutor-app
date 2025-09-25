const express = require("express");
const router = express.Router();
// Simple payment routes for demo purposes

// Route to create a mock payment order
router.post("/create-order", async (req, res) => {
  try {
    const { amount, currency = "INR" } = req.body;

    // Mock payment order creation
    const mockOrder = {
      id: `order_${Date.now()}`,
      amount: amount || 0,
      currency: currency,
      receipt: `receipt_${Date.now()}`,
      status: "created",
      created_at: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      order: mockOrder
    });
  } catch (err) {
    console.error("Payment order creation error:", err);
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

// Route to verify mock payment
router.post("/verify", async (req, res) => {
  try {
    const { orderId, paymentId, amount } = req.body;

    // Mock payment verification (always successful for demo)
    const verificationResult = {
      orderId: orderId,
      paymentId: paymentId || `pay_${Date.now()}`,
      amount: amount,
      status: "success",
      verified: true,
      verifiedAt: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      verification: verificationResult
    });
  } catch (err) {
    console.error("Payment verification error:", err);
    res.status(500).json({ error: "Failed to verify payment" });
  }
});

module.exports = router;
