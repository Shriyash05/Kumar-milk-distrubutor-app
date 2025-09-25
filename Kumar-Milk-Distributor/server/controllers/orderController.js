const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Grouping for multi-item orders
    orderGroupId: {
      type: String,
      index: true,
    },

    // Shop/Delivery Info
    shopName: { type: String, required: true },
    address: { type: String, required: true },
    deliveryTime: { type: String, required: true },
    deliveryDate: { type: Date, required: true },

    // Crates (legacy stock system)
    amulTaazaCrates: { type: Number, default: 0 },
    amulGoldCrates: { type: Number, default: 0 },
    amulBuffaloCrates: { type: Number, default: 0 },
    gokulCowCrates: { type: Number, default: 0 },
    gokulBuffaloCrates: { type: Number, default: 0 },
    gokulFullCreamCrates: { type: Number, default: 0 },
    mahanandaCrates: { type: Number, default: 0 },

    // ✅ Updated status enums
    status: {
      type: String,
      enum: [
        "pending",
        "pending_verification", 
        "confirmed",
        "processing",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },

    // ✅ Updated payment status enums
    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "paid",
        "paid_pending_verification", 
        "failed",
        "refunded",
        "unpaid",
      ],
      default: "pending",
    },

    // ✅ Updated payment method enums
    paymentMethod: {
      type: String,
      enum: ["cash", "upi", "upi_google_pay", "card", "wallet", "online"],
      default: "upi",
    },

    // ✅ Payment screenshot / proof is now mandatory
    paymentScreenshot: {
      type: String,
      required: [true, "Payment screenshot is required"],
    },

    // Amount
    totalAmount: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
