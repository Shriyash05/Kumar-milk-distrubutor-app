const mongoose = require('mongoose');

const mobileOrderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Multi-item grouping (optional)
    orderGroupId: {
      type: String,
      index: true, // helps querying all items of a group
    },

    // Product details
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitType: { type: String, enum: ['liter', 'crate'], required: true },
    unitPrice: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    packSize: { type: Number, default: 1 },
    totalPieces: { type: Number, required: true },

    // Order metadata
    startDate: { type: String, required: true },
    orderType: { type: String, default: 'daily' },
    status: {
      type: String,
      enum: [
        'pending',
        'pending_verification',
        'confirmed',
        'processing',
        'out_for_delivery',
        'delivered',
        'cancelled',
      ],
      default: 'pending',
    },

    // Customer info
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    deliveryAddress: { type: String, required: true },

    // Payment info
    paymentStatus: {
      type: String,
      enum: [
        'pending',
        'paid',
        'paid_pending_verification',
        'failed',
        'refunded',
      ],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'card', 'wallet', 'UPI/Google Pay'],
      default: 'cash',
    },
    paymentProof: {
      type: String, // store uploaded image URL or path
      required: [true, 'Payment proof is required'], // mandatory
    },

    // Flags
    needsAdminVerification: { type: Boolean, default: true },
    registeredFrom: { type: String, default: 'mobile-app' },

    // Timestamps
    orderDate: { type: Date, default: Date.now },
  },
  { timestamps: true } // automatically adds createdAt and updatedAt
);

// Optional: keep updatedAt updated
mobileOrderSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('MobileOrder', mobileOrderSchema);
