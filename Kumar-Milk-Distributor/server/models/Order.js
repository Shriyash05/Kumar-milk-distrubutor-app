const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  shopName: { type: String, required: true },
  address: { type: String, required: true },
  deliveryTime: { type: String, required: true },
  amulTaazaCrates: { type: Number, default: 0 },
  amulGoldCrates: { type: Number, default: 0 },
  amulBuffaloCrates: { type: Number, default: 0 },
  gokulCowCrates: { type: Number, default: 0 },
  gokulBuffaloCrates: { type: Number, default: 0 },
  gokulFullCreamCrates: { type: Number, default: 0 },
  mahanandaCrates: { type: Number, default: 0 },
  paymentScreenshot: { type: String, default: null },
  paymentMethod: {
    type: String,
    enum: ["ONLINE", "COD"],
    default: "COD",
  },
  status: { type: String, default: "Pending" },
  paymentStatus: { type: String, default: "Unpaid" },
  totalAmount: {
    type: Number,
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  deliveryDate: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model("Order", orderSchema);
