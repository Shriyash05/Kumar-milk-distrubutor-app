const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  pricePerCrate: {
    type: Number,
    required: true,
    min: 0
  },
  packSize: {
    type: Number,
    required: true,
    default: 12,
    min: 1
  },
  unit: {
    type: String,
    required: true,
    enum: ['piece', 'liter', 'kg', 'ml'],
    default: 'piece'
  },
  category: {
    type: String,
    required: true,
    default: 'milk'
  },
  available: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  stockQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  minStockLevel: {
    type: Number,
    default: 10,
    min: 0
  },
  image: {
    type: String,
    trim: true
  },
  nutritionalInfo: {
    fat: { type: Number, min: 0 },
    protein: { type: Number, min: 0 },
    carbohydrates: { type: Number, min: 0 },
    calories: { type: Number, min: 0 }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
productSchema.index({ brand: 1, category: 1 });
productSchema.index({ available: 1, isActive: 1 });
productSchema.index({ name: 'text', description: 'text' });

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.stockQuantity <= 0) return 'out_of_stock';
  if (this.stockQuantity <= this.minStockLevel) return 'low_stock';
  return 'in_stock';
});

// Method to check if product is orderable
productSchema.methods.isOrderable = function() {
  return this.available && this.isActive && this.stockQuantity > 0;
};

// Static method to get active products
productSchema.statics.getActiveProducts = function() {
  return this.find({ isActive: true, available: true });
};

// Static method to get products by brand
productSchema.statics.getByBrand = function(brand) {
  return this.find({ brand, isActive: true, available: true });
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;