const mongoose = require('mongoose');

const mobileOrderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Grouping: multiple items can belong to one order group
    orderGroupId: {
      type: String,
      index: true, // helps querying by group
    },

    // Order Details
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitType: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    packSize: { type: Number, default: 1 },
    totalPieces: { type: Number },

    startDate: { type: String },
    orderType: { type: String, default: 'daily' },

    // ✅ Expanded status enums
    status: {
      type: String,
      enum: [
        'pending',
        'pending_verification',  
        'confirmed',
        'processing',
        'out_for_delivery',
        'delivered',
        'cancelled'
      ],
      default: 'pending',
    },

    // ✅ Expanded payment status enums
    paymentStatus: {
      type: String,
      enum: [
        'pending',
        'paid',
        'paid_pending_verification',
        'failed',
        'refunded'
      ],
      default: 'pending',
    },

    // ✅ Expanded payment method enums
    paymentMethod: {
      type: String,
      enum: [
        'cash',
        'upi',
        'card',
        'wallet',
        'UPI/Google Pay'
      ],
      default: 'upi',
    },

    // ✅ Payment proof is now mandatory
    paymentProof: { 
      type: String, 
      required: [true, "Payment proof is required"], // ensures DB rejects orders without proof
    },

    // Customer Info
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    deliveryAddress: { type: String, required: true },

    orderDate: { type: Date, default: Date.now },

    // Flags
    needsAdminVerification: { type: Boolean, default: true },
    registeredFrom: { type: String, default: 'mobile-app' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MobileOrder', mobileOrderSchema);
