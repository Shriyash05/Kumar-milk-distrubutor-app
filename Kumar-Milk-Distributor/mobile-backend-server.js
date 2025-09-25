const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection - URL encode the password (# becomes %23)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://shrimhatre00_db_user:Shriyash%233005@cluster0.ojkezkj.mongodb.net/milk-distributor?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI)
.then(() => console.log('Connected to MongoDB'))
.catch((error) => console.error('MongoDB connection error:', error));

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Enhanced Product Schema with Inventory Management
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  unit: { type: String, required: true, default: 'Liter' },
  fat: { type: String, required: true },
  protein: { type: String, required: true },
  // Inventory management
  quantity: { type: Number, default: 0 }, // Current stock quantity
  minimumStock: { type: Number, default: 10 }, // Minimum stock alert level
  maximumStock: { type: Number, default: 1000 }, // Maximum stock capacity
  // Product management
  category: { type: String, default: 'Milk Products' },
  brand: { type: String, default: 'Kumar Milk' },
  barcode: { type: String, unique: true, sparse: true }, // Optional barcode
  sku: { type: String, unique: true, sparse: true }, // Stock Keeping Unit
  // Pricing
  costPrice: { type: Number, default: 0 }, // Purchase/cost price
  discountPrice: { type: Number, default: 0 }, // Discounted price (0 = no discount)
  pricePerCrate: { type: Number, default: 0 }, // Price for buying in crates
  packSize: { type: Number, default: 12 }, // Number of pieces per crate
  // Product status
  isActive: { type: Boolean, default: true },
  isInStock: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  available: { type: Boolean, default: true }, // Availability flag for mobile app
  // Additional details
  expiryDays: { type: Number, default: 7 }, // Days before expiry
  supplier: { type: String, default: 'Local Farm' },
  notes: { type: String },
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastStockUpdate: { type: Date, default: Date.now }
});

// Order Item Schema - for individual products within an order
const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true }, // quantity * unitPrice
  // Product details at time of order (for historical accuracy)
  productDetails: {
    brand: String,
    category: String,
    unit: String,
    fat: String,
    protein: String,
    sku: String
  }
});

// Enhanced Order Schema - supports multiple items per order
const orderSchema = new mongoose.Schema({
  // Order identification
  orderNumber: { type: String, unique: true, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Order items - array of products
  items: [orderItemSchema],
  
  // Order totals
  itemsCount: { type: Number, required: true }, // Total number of different items
  totalQuantity: { type: Number, required: true }, // Sum of all quantities
  subtotalAmount: { type: Number, required: true }, // Sum of all item totals
  discountAmount: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  deliveryCharges: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true }, // Final total
  
  // Order details
  orderType: { type: String, enum: ['one-time', 'subscription', 'regular'], default: 'one-time' },
  status: { type: String, enum: ['pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered', 'cancelled'], default: 'pending' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  paymentMethod: { type: String, enum: ['cash', 'upi', 'card', 'wallet'], default: 'cash' },
  
  // Delivery details
  deliveryAddress: { type: String, required: true },
  deliveryInstructions: { type: String },
  startDate: { type: Date, required: true },
  deliveryDate: { type: Date },
  deliveredAt: { type: Date },
  
  // Additional info
  notes: { type: String },
  customerNotes: { type: String },
  adminNotes: { type: String },
  
  // Source tracking
  orderSource: { type: String, enum: ['mobile_app', 'web_app', 'phone', 'admin'], default: 'mobile_app' },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  confirmedAt: { type: Date },
  cancelledAt: { type: Date }
});

// Add pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${Date.now().toString().slice(-8)}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

// Models
const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'kumar-milk-secret-key-2025';
console.log('JWT Secret loaded:', JWT_SECRET ? 'Yes' : 'No');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  console.log('=== JWT VERIFICATION ===');
  console.log('Authorization header:', req.header('Authorization'));
  console.log('Using JWT Secret:', JWT_SECRET.substring(0, 10) + '...');
  
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  console.log('Token received:', token.substring(0, 20) + '...');
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token verified for user:', decoded.userId, 'Email:', decoded.email);
    req.user = decoded;
    next();
  } catch (error) {
    console.log('❌ Token verification failed:', error.message);
    console.log('❌ Token details for debugging:');
    try {
      // Decode without verification for debugging
      const unverified = jwt.decode(token);
      console.log('Token payload (unverified):', unverified);
    } catch (decodeError) {
      console.log('Could not decode token:', decodeError.message);
    }
    res.status(400).json({ message: 'Invalid token.' });
  }
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      address
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// User Routes
app.get('/api/user/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Product Routes
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });
    res.json(products);
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin Product Management Routes
app.get('/api/admin/products', verifyToken, async (req, res) => {
  try {
    console.log('=== ADMIN PRODUCTS REQUEST ===');
    console.log('User:', req.user.email, 'Role:', req.user.role);
    
    if (req.user.role !== 'admin') {
      console.log('❌ Access denied - user is not admin');
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    console.log('✅ Admin access confirmed, fetching all products...');
    const products = await Product.find({}); // Get all products for admin
    
    console.log(`📦 Found ${products.length} products for admin dashboard`);
    res.json(products);
  } catch (error) {
    console.error('Admin products fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/admin/products', verifyToken, async (req, res) => {
  try {
    console.log('=== ADMIN CREATE PRODUCT ===');
    console.log('User:', req.user.email, 'Role:', req.user.role);
    console.log('Product data:', req.body);
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const {
      name,
      brand,
      price,
      pricePerCrate,
      packSize,
      available,
      description,
      unit,
      fat,
      protein
    } = req.body;

    // Validate required fields
    if (!name || !brand || !price || !pricePerCrate || !packSize) {
      return res.status(400).json({ 
        message: 'Missing required fields: name, brand, price, pricePerCrate, packSize' 
      });
    }

    console.log('Creating product with data:', {
      name: name.trim(),
      brand: brand.trim(),
      price: Number(price),
      pricePerCrate: Number(pricePerCrate),
      packSize: Number(packSize),
      available
    });

    const product = new Product({
      name: name.trim(),
      description: description || `${brand} ${name}`,
      price: Number(price),
      pricePerCrate: Number(pricePerCrate),
      packSize: Number(packSize),
      unit: unit || 'Liter',
      fat: fat || '3.5%',
      protein: protein || '3.2%',
      brand: brand.trim(),
      available: available !== false, // Default to true unless explicitly false
      isActive: available !== false,
      isInStock: available !== false,
      quantity: available !== false ? 100 : 0, // Default stock
      category: 'Milk Products',
      supplier: 'Local Farm'
    });

    await product.save();
    console.log('✅ Product created successfully:', product._id);
    console.log('Full product data:', product);

    res.status(201).json({
      message: 'Product created successfully',
      product: product.toObject()
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/products/:id', verifyToken, async (req, res) => {
  try {
    console.log('=== ADMIN UPDATE PRODUCT ===');
    console.log('User:', req.user.email, 'Role:', req.user.role);
    console.log('Product ID:', req.params.id);
    console.log('Update data:', req.body);
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const {
      name,
      brand,
      price,
      pricePerCrate,
      packSize,
      available,
      description,
      unit,
      fat,
      protein
    } = req.body;

    const updateData = {
      name: name?.trim(),
      brand: brand?.trim(),
      price: price ? Number(price) : undefined,
      pricePerCrate: pricePerCrate ? Number(pricePerCrate) : undefined,
      packSize: packSize ? Number(packSize) : undefined,
      description: description,
      unit: unit,
      fat: fat,
      protein: protein,
      available: available,
      isActive: available,
      isInStock: available,
      updatedAt: new Date()
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      console.log('❌ Product not found:', req.params.id);
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log('✅ Product updated successfully:', product._id);
    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/products/:id', verifyToken, async (req, res) => {
  try {
    console.log('=== ADMIN DELETE PRODUCT ===');
    console.log('User:', req.user.email, 'Role:', req.user.role);
    console.log('Product ID:', req.params.id);
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    // Soft delete - just mark as inactive instead of actually deleting
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { 
        isActive: false,
        isInStock: false,
        available: false,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!product) {
      console.log('❌ Product not found:', req.params.id);
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log('✅ Product deleted (soft delete):', product._id);
    res.json({
      message: 'Product deleted successfully',
      product
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Customer Routes
app.get('/api/customer/dashboard', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get user orders with populated item details
    const orders = await Order.find({ userId })
      .populate('items.productId', 'name price unit')
      .sort({ createdAt: -1 });
    
    // Calculate stats
    const totalOrders = orders.length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalItems = orders.reduce((sum, order) => sum + (order.itemsCount || 1), 0);
    const totalQuantity = orders.reduce((sum, order) => sum + (order.totalQuantity || order.quantity || 1), 0);

    res.json({
      orders,
      stats: {
        totalOrders,
        deliveredOrders,
        pendingOrders,
        totalSpent,
        totalItems,
        totalQuantity
      }
    });
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/customer/orders', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    console.log('=== MOBILE APP ORDER REQUEST ===');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('User ID:', userId);
    console.log('User role:', req.user.role);

    // Check if this is a multi-item order (new format) or single-item order (legacy format)
    const isMultiItemOrder = req.body.items && Array.isArray(req.body.items) && req.body.items.length > 0;
    
    if (isMultiItemOrder) {
      console.log('Processing MULTI-ITEM order with', req.body.items.length, 'items');
      return handleMultiItemOrder(req, res, userId);
    } else {
      console.log('Processing SINGLE-ITEM order (legacy format)');
      return handleSingleItemOrder(req, res, userId);
    }
  } catch (error) {
    console.error('Customer order creation error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// Handle multi-item orders (new format)
async function handleMultiItemOrder(req, res, userId) {
  const { 
    items, 
    totalAmount, 
    itemsCount, 
    totalQuantity, 
    orderType, 
    deliveryAddress, 
    startDate, 
    customerName, 
    customerPhone, 
    customerEmail,
    paymentMethod,
    paymentStatus,
    paymentProof,
    status,
    orderSource,
    notes
  } = req.body;

  console.log('Multi-item order details:', { 
    itemsCount, 
    totalQuantity, 
    totalAmount, 
    itemsReceived: items.length 
  });

  // Validate required fields for multi-item orders
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ 
      message: 'Missing required field: items array' 
    });
  }

  if (!totalAmount) {
    return res.status(400).json({ 
      message: 'Missing required field: totalAmount' 
    });
  }

  // Validate each item
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.productName || !item.quantity || !item.unitPrice) {
      return res.status(400).json({ 
        message: `Invalid item at index ${i}: missing productName, quantity, or unitPrice` 
      });
    }
  }

  // Get user for delivery address if not provided
  let address = deliveryAddress;
  if (!address) {
    const user = await User.findById(userId);
    if (user) {
      address = user.address;
    } else {
      return res.status(404).json({ message: 'User not found' });
    }
  }

  // Map orderType variations
  let validOrderType = 'regular'; // default for multi-item orders
  if (orderType) {
    const orderTypeLower = orderType.toLowerCase();
    if (orderTypeLower === 'subscription' || orderTypeLower === 'recurring') {
      validOrderType = 'subscription';
    } else if (orderTypeLower === 'one-time' || orderTypeLower === 'onetime') {
      validOrderType = 'one-time';
    }
  }

  // Generate orderNumber
  const orderCount = await Order.countDocuments();
  const orderNumber = `ORD-${Date.now().toString().slice(-8)}-${(orderCount + 1).toString().padStart(4, '0')}`;
  console.log('Generated order number:', orderNumber);

  // Process items and generate ObjectIds for non-DB products
  const mongoose = require('mongoose');
  const processedItems = items.map(item => {
    let dbProductId = item.productId;
    if (!dbProductId || !mongoose.Types.ObjectId.isValid(dbProductId)) {
      dbProductId = new mongoose.Types.ObjectId();
    }
    
    return {
      productId: dbProductId,
      productName: item.productName,
      quantity: Number(item.quantity),
      unitType: item.unitType || 'liter',
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice || (item.quantity * item.unitPrice))
    };
  });

  // Create multi-item order
  const order = new Order({
    orderNumber,
    userId,
    items: processedItems,
    itemsCount: itemsCount || items.length,
    totalQuantity: totalQuantity || items.reduce((sum, item) => sum + Number(item.quantity), 0),
    subtotalAmount: Number(totalAmount),
    discountAmount: 0,
    taxAmount: 0,
    deliveryCharges: 0,
    totalAmount: Number(totalAmount),
    orderType: validOrderType,
    deliveryAddress: address,
    orderSource: orderSource || 'mobile_app',
    startDate: startDate ? new Date(startDate) : new Date(),
    paymentMethod: paymentMethod || 'cash',
    paymentStatus: (paymentStatus === 'pending_verification') ? 'pending' : (paymentStatus || 'pending'),
    status: status || 'pending',
    notes: notes || ''
  });

  await order.save();
  console.log('Multi-item order created successfully:', order._id);
  console.log('Order items:', processedItems.map(item => `${item.quantity} ${item.unitType} ${item.productName}`).join(', '));

  res.status(201).json({
    message: 'Multi-item order placed successfully',
    order: order.toObject(),
    summary: {
      orderNumber: order.orderNumber,
      itemsCount: processedItems.length,
      totalQuantity: order.totalQuantity,
      totalAmount: order.totalAmount,
      items: processedItems.map(item => `${item.quantity} ${item.unitType} ${item.productName}`)
    }
  });
}

// Handle single-item orders (legacy format)
async function handleSingleItemOrder(req, res, userId) {
  const { productId, productName, quantity, unitPrice, totalAmount, orderType, deliveryAddress, startDate, unitType } = req.body;

  console.log('Single-item order details:', { productId, productName, quantity, unitPrice, totalAmount });

  // Validate required fields for single-item orders
  if (!productId || !productName || !quantity || !unitPrice || !totalAmount) {
    console.log('Missing required fields for single-item order');
    return res.status(400).json({ 
      message: 'Missing required fields: productId, productName, quantity, unitPrice, totalAmount' 
    });
  }

  // Validate MongoDB ObjectId format (if productId looks like one)
  const mongoose = require('mongoose');
  if (productId.length === 24 && !mongoose.Types.ObjectId.isValid(productId)) {
    console.log('Invalid productId format:', productId);
    return res.status(400).json({ 
      message: 'Invalid product ID format' 
    });
  }

  // Get user for delivery address if not provided
  let address = deliveryAddress;
  if (!address) {
    const user = await User.findById(userId);
    if (user) {
      address = user.address;
    } else {
      return res.status(404).json({ message: 'User not found' });
    }
  }

  // For non-MongoDB product IDs (like mobile app generated ones), use a placeholder
  let dbProductId = productId;
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    // Create a new ObjectId for non-database products
    dbProductId = new mongoose.Types.ObjectId();
    console.log('Generated new ObjectId for non-DB product:', dbProductId);
  }

  // Map orderType variations from mobile app to valid enum values
  let validOrderType = 'one-time'; // default
  if (orderType) {
    const orderTypeLower = orderType.toLowerCase();
    if (orderTypeLower === 'subscription' || orderTypeLower === 'recurring' || orderTypeLower === 'monthly' || orderTypeLower === 'daily') {
      validOrderType = 'subscription';
    } else if (orderTypeLower === 'regular' || orderTypeLower === 'one-time' || orderTypeLower === 'onetime' || orderTypeLower === 'single') {
      validOrderType = orderTypeLower === 'regular' ? 'regular' : 'one-time';
    } else {
      // For any unknown type, map to regular
      validOrderType = 'regular';
    }
  }
  console.log('Order type mapping:', { original: orderType, mapped: validOrderType });

  // Generate orderNumber manually to ensure it exists
  const orderCount = await Order.countDocuments();
  const orderNumber = `ORD-${Date.now().toString().slice(-8)}-${(orderCount + 1).toString().padStart(4, '0')}`;
  console.log('Generated order number:', orderNumber);

  // Create order using new multi-item schema (single item for legacy compatibility)
  const orderItemTotalPrice = Number(quantity) * Number(unitPrice);
  const order = new Order({
    orderNumber,
    userId,
    items: [{
      productId: dbProductId,
      productName: productName,
      quantity: Number(quantity),
      unitType: unitType || 'liter', // Include unitType for proper admin display
      unitPrice: Number(unitPrice),
      totalPrice: orderItemTotalPrice
    }],
    itemsCount: 1,
    totalQuantity: Number(quantity),
    subtotalAmount: Number(totalAmount),
    discountAmount: 0,
    taxAmount: 0,
    deliveryCharges: 0,
    totalAmount: Number(totalAmount),
    orderType: validOrderType,
    deliveryAddress: address,
    orderSource: 'mobile_app',
    startDate: startDate ? new Date(startDate) : new Date()
  });

  await order.save();
  console.log('Single-item order created successfully:', order._id);

  res.status(201).json({
    message: 'Order placed successfully',
    order: {
      ...order.toObject(),
      // Legacy fields for backward compatibility
      productId: dbProductId,
      productName: productName,
      quantity: Number(quantity),
      unitPrice: Number(unitPrice)
    }
  });
}

app.get('/api/customer/orders', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const orders = await Order.find({ userId })
      .populate('items.productId', 'name price unit')
      .sort({ createdAt: -1 });
    
    // Format orders for client compatibility (both new and legacy format support)
    const formattedOrders = orders.map(order => {
      const orderObj = order.toObject();
      
      // Add legacy fields for backward compatibility
      if (order.items && order.items.length > 0) {
        orderObj.productId = order.items[0].productId;
        orderObj.productName = order.items[0].productName;
        orderObj.quantity = order.totalQuantity;
        orderObj.unitPrice = order.items[0].unitPrice;
      }
      
      return orderObj;
    });
    
    res.json(formattedOrders);
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin Routes
app.get('/api/admin/dashboard', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
    
    // Calculate total revenue
    const revenueResult = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    res.json({
      totalCustomers,
      totalOrders,
      pendingOrders,
      deliveredOrders,
      totalRevenue
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/orders', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const orders = await Order.find()
      .populate('userId', 'name email phone')
      .populate('items.productId', 'name price unit')
      .sort({ createdAt: -1 });

    // Format orders for compatibility (both new multi-item and legacy single-item support)
    const formattedOrders = orders.map(order => {
      const orderObj = order.toObject();
      
      // Add legacy fields for backward compatibility with existing admin panels
      if (order.items && order.items.length > 0) {
        orderObj.productId = order.items[0].productId;
        orderObj.productName = order.items[0].productName;
        orderObj.quantity = order.totalQuantity;
        orderObj.unitPrice = order.items[0].unitPrice;
      }
      
      return orderObj;
    });

    res.json(formattedOrders);
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin orders endpoint - alias for /api/orders for mobile app compatibility
app.get('/api/admin/orders', verifyToken, async (req, res) => {
  try {
    console.log('=== ADMIN ORDERS REQUEST ===');
    console.log('User:', req.user.email, 'Role:', req.user.role);
    
    if (req.user.role !== 'admin') {
      console.log('❌ Access denied - user is not admin');
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    console.log('✅ Admin access confirmed, fetching all orders...');

    const orders = await Order.find()
      .populate('userId', 'name email phone address')
      .populate('items.productId', 'name price unit')
      .sort({ createdAt: -1 });

    console.log(`📦 Found ${orders.length} orders for admin dashboard`);

    // Format orders for mobile admin app - enhanced with proper multi-item support
    const formattedOrders = orders.map(order => {
      const orderObj = order.toObject();
      
      // Add customer details
      if (order.userId) {
        orderObj.customerName = order.userId.name;
        orderObj.customerEmail = order.userId.email;
        orderObj.customerPhone = order.userId.phone;
        orderObj.customerAddress = order.userId.address;
      }
      
      // Add order summary details
      orderObj.orderNumber = order.orderNumber;
      orderObj.orderSource = order.orderSource || 'mobile_app';
      orderObj.itemsCount = order.itemsCount || (order.items ? order.items.length : 1);
      orderObj.totalQuantity = order.totalQuantity || 1;
      
      // CRITICAL: Ensure items array is properly included for multi-item display
      if (order.items && order.items.length > 0) {
        // Format items with all necessary details for admin display
        orderObj.items = order.items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitType: item.unitType || 'liter', // Add unitType for proper display
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          productDetails: item.productDetails
        }));
        
        orderObj.itemsSummary = order.items.map(item => 
          `${item.productName} (${item.quantity} ${item.unitType || 'qty'})`
        ).join(', ');
        
        // Add legacy fields for backward compatibility
        orderObj.productId = order.items[0].productId;
        orderObj.productName = order.items[0].productName;
        orderObj.quantity = order.totalQuantity;
        orderObj.unitPrice = order.items[0].unitPrice;
        orderObj.unitType = order.items[0].unitType || 'liter';
      } else {
        // Handle single-item legacy orders
        orderObj.items = [{
          productId: orderObj.productId,
          productName: orderObj.productName,
          quantity: orderObj.quantity || 1,
          unitType: orderObj.unitType || 'liter',
          unitPrice: orderObj.unitPrice || 0,
          totalPrice: orderObj.totalAmount || 0
        }];
      }
      
      return orderObj;
    });

    res.json(formattedOrders);
  } catch (error) {
    console.error('Admin orders fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Mobile app specific admin orders endpoint - returns ALL orders (mobile + web)
app.get('/api/admin/mobile-orders', verifyToken, async (req, res) => {
  try {
    console.log('=== ADMIN ALL ORDERS REQUEST (Mobile + Web) ===');
    console.log('User:', req.user.email, 'Role:', req.user.role);
    
    if (req.user.role !== 'admin') {
      console.log('❌ Access denied - user is not admin');
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    console.log('✅ Admin access confirmed, fetching ALL orders (mobile + web)...');
    
    // Get ALL orders from all sources with user and product details
    const allOrders = await Order.find()
      .populate('userId', 'name email phone address role')
      .populate('items.productId', 'name price unit description')
      .sort({ createdAt: -1 })
      .limit(200); // Increased limit for better admin view

    console.log(`📦 Found ${allOrders.length} total orders for admin (mobile + web + all sources)`);
    
    // Format ALL orders for mobile admin app - handling both old single-item and new multi-item orders
    const formattedOrders = allOrders.map(order => {
      // Handle both new multi-item orders and legacy single-item orders
      let orderItems = [];
      let totalQuantity = 0;
      let itemsCount = 0;
      
      if (order.items && order.items.length > 0) {
        // New multi-item order structure
        orderItems = order.items.map(item => ({
          productId: item.productId?._id || item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitType: item.unitType || 'liter', // Include unitType for proper display
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          productDetails: item.productDetails
        }));
        totalQuantity = order.totalQuantity || order.items.reduce((sum, item) => sum + item.quantity, 0);
        itemsCount = order.itemsCount || order.items.length;
      } else {
        // Legacy single-item order structure (fallback)
        if (order.productName) {
          orderItems = [{
            productId: order.productId,
            productName: order.productName,
            quantity: order.quantity || 1,
            unitType: order.unitType || 'liter', // Include unitType for proper display
            unitPrice: order.unitPrice || 0,
            totalPrice: order.totalAmount || 0
          }];
          totalQuantity = order.quantity || 1;
          itemsCount = 1;
        }
      }
      
      // Determine order source based on orderSource field or fallback logic
      let orderSource = 'Unknown';
      let sourceIcon = '❓';
      
      if (order.orderSource) {
        switch(order.orderSource) {
          case 'mobile_app':
            orderSource = 'Mobile App';
            sourceIcon = '📱';
            break;
          case 'web_app':
            orderSource = 'Web App';
            sourceIcon = '🌐';
            break;
          case 'phone':
            orderSource = 'Phone Order';
            sourceIcon = '📞';
            break;
          case 'admin':
            orderSource = 'Admin Panel';
            sourceIcon = '👥';
            break;
          default:
            orderSource = order.orderSource;
            sourceIcon = '❓';
        }
      } else {
        // Fallback logic for legacy orders
        const hasProductId = order.productId && order.productId.toString().length === 24;
        orderSource = hasProductId ? 'Web App' : 'Mobile App';
        sourceIcon = hasProductId ? '🌐' : '📱';
      }
      
      return {
        _id: order._id,
        orderNumber: order.orderNumber || order._id.toString().substring(0, 8),
        orderId: order.orderNumber || order._id.toString().substring(0, 8), // For backward compatibility
        
        // Multi-item order details
        items: orderItems,
        itemsCount: itemsCount,
        totalQuantity: totalQuantity,
        
        // Order totals
        subtotalAmount: order.subtotalAmount || order.totalAmount,
        discountAmount: order.discountAmount || 0,
        taxAmount: order.taxAmount || 0,
        deliveryCharges: order.deliveryCharges || 0,
        totalAmount: order.totalAmount,
        
        // Order details
        orderType: order.orderType,
        status: order.status,
        paymentStatus: order.paymentStatus || 'pending',
        paymentMethod: order.paymentMethod || 'cash',
        
        // Delivery details
        deliveryAddress: order.deliveryAddress,
        deliveryInstructions: order.deliveryInstructions || '',
        
        // Customer details
        customerName: order.userId?.name || 'Unknown Customer',
        customerEmail: order.userId?.email || 'No email',
        customerPhone: order.userId?.phone || 'No phone',
        customerRole: order.userId?.role || 'customer',
        
        // Dates
        orderDate: order.createdAt,
        startDate: order.startDate,
        deliveryDate: order.deliveryDate,
        deliveredAt: order.deliveredAt,
        
        // Notes
        notes: order.notes || '',
        customerNotes: order.customerNotes || '',
        adminNotes: order.adminNotes || '',
        
        // Source identification
        orderSource: orderSource,
        sourceIcon: sourceIcon,
        
        // Mobile-friendly fields
        formattedDate: order.createdAt.toLocaleDateString('en-IN'),
        formattedTime: order.createdAt.toLocaleTimeString('en-IN'),
        formattedDateTime: order.createdAt.toLocaleString('en-IN'),
        statusColor: getStatusColor(order.status),
        canCancel: order.status === 'pending' || order.status === 'confirmed',
        
        // Additional admin fields
        daysSinceOrder: Math.floor((new Date() - order.createdAt) / (1000 * 60 * 60 * 24)),
        isRecent: (new Date() - order.createdAt) < (24 * 60 * 60 * 1000), // Less than 24 hours
        priority: order.orderType === 'subscription' ? 'High' : 'Normal',
        
        // Summary for display (first item + count if multiple)
        displaySummary: orderItems.length > 0 ? 
          `${orderItems[0].productName}${orderItems.length > 1 ? ` +${orderItems.length - 1} more` : ''}` : 
          'No items'
      };
    });

    // Calculate statistics by source and status
    const mobileOrders = formattedOrders.filter(o => o.orderSource === 'Mobile App');
    const webOrders = formattedOrders.filter(o => o.orderSource === 'Web App');
    const phoneOrders = formattedOrders.filter(o => o.orderSource === 'Phone Order');
    const adminOrders = formattedOrders.filter(o => o.orderSource === 'Admin Panel');
    
    const pendingOrders = formattedOrders.filter(o => o.status === 'pending');
    const confirmedOrders = formattedOrders.filter(o => o.status === 'confirmed');
    const processingOrders = formattedOrders.filter(o => o.status === 'processing');
    const outForDeliveryOrders = formattedOrders.filter(o => o.status === 'out_for_delivery');
    const deliveredOrders = formattedOrders.filter(o => o.status === 'delivered');
    const cancelledOrders = formattedOrders.filter(o => o.status === 'cancelled');
    const recentOrders = formattedOrders.filter(o => o.isRecent);
    const multiItemOrders = formattedOrders.filter(o => o.itemsCount > 1);
    const subscriptionOrders = formattedOrders.filter(o => o.orderType === 'subscription');
    
    // Calculate totals and revenue
    const totalRevenue = formattedOrders.reduce((sum, order) => {
      return order.status === 'delivered' ? sum + order.totalAmount : sum;
    }, 0);
    
    const pendingRevenue = pendingOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalItems = formattedOrders.reduce((sum, order) => sum + order.itemsCount, 0);
    const totalQuantity = formattedOrders.reduce((sum, order) => sum + order.totalQuantity, 0);

    res.json({
      success: true,
      orders: formattedOrders,
      // Summary statistics
      summary: {
        totalOrders: formattedOrders.length,
        totalItems: totalItems,
        totalQuantity: totalQuantity,
        multiItemOrders: multiItemOrders.length,
        averageItemsPerOrder: formattedOrders.length > 0 ? (totalItems / formattedOrders.length).toFixed(2) : 0,
        // Order status breakdown
        pendingOrders: pendingOrders.length,
        confirmedOrders: confirmedOrders.length,
        processingOrders: processingOrders.length,
        outForDeliveryOrders: outForDeliveryOrders.length,
        deliveredOrders: deliveredOrders.length,
        cancelledOrders: cancelledOrders.length,
        // Order types
        subscriptionOrders: subscriptionOrders.length,
        recentOrders: recentOrders.length,
        // Revenue
        totalRevenue: totalRevenue,
        pendingRevenue: pendingRevenue,
        averageOrderValue: deliveredOrders.length > 0 ? (totalRevenue / deliveredOrders.length).toFixed(2) : 0
      },
      // Source breakdown
      sources: {
        mobile: {
          count: mobileOrders.length,
          percentage: formattedOrders.length > 0 ? Math.round((mobileOrders.length / formattedOrders.length) * 100) : 0,
          icon: '📱'
        },
        web: {
          count: webOrders.length,
          percentage: formattedOrders.length > 0 ? Math.round((webOrders.length / formattedOrders.length) * 100) : 0,
          icon: '🌐'
        },
        phone: {
          count: phoneOrders.length,
          percentage: formattedOrders.length > 0 ? Math.round((phoneOrders.length / formattedOrders.length) * 100) : 0,
          icon: '📞'
        },
        admin: {
          count: adminOrders.length,
          percentage: formattedOrders.length > 0 ? Math.round((adminOrders.length / formattedOrders.length) * 100) : 0,
          icon: '👥'
        }
      },
      // Order insights
      insights: {
        multiItemOrderPercentage: formattedOrders.length > 0 ? Math.round((multiItemOrders.length / formattedOrders.length) * 100) : 0,
        subscriptionOrderPercentage: formattedOrders.length > 0 ? Math.round((subscriptionOrders.length / formattedOrders.length) * 100) : 0,
        completionRate: formattedOrders.length > 0 ? Math.round((deliveredOrders.length / formattedOrders.length) * 100) : 0,
        cancellationRate: formattedOrders.length > 0 ? Math.round((cancelledOrders.length / formattedOrders.length) * 100) : 0
      },
      message: `Retrieved ${formattedOrders.length} orders (${totalItems} items total) - Sources: Mobile: ${mobileOrders.length}, Web: ${webOrders.length}, Phone: ${phoneOrders.length}, Admin: ${adminOrders.length}`
    });
    
  } catch (error) {
    console.error('❌ Admin mobile orders fetch error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch orders', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Helper function to get status color for mobile UI
function getStatusColor(status) {
  switch (status) {
    case 'pending': return '#FFA500'; // Orange
    case 'confirmed': return '#4CAF50'; // Green
    case 'delivered': return '#2196F3'; // Blue
    case 'cancelled': return '#F44336'; // Red
    default: return '#757575'; // Gray
  }
}

// General order creation endpoint (for mobile app compatibility)
// Supports both single-item legacy format and new multi-item format
app.post('/api/orders', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      productId, productName, quantity, unitPrice, totalAmount, 
      orderType, deliveryAddress, startDate,
      items, // New multi-item format
      deliveryInstructions, customerNotes, paymentMethod 
    } = req.body;

    console.log('Order creation request:', { 
      userId, 
      singleItem: { productId, productName, quantity, unitPrice, totalAmount },
      multiItems: items,
      orderType 
    });

    // Determine if this is a multi-item order or single-item (legacy)
    let orderItems = [];
    let orderTotalAmount = 0;
    let totalQuantity = 0;

    if (items && Array.isArray(items) && items.length > 0) {
      // New multi-item format
      console.log('Processing multi-item order with', items.length, 'items');
      
      // Validate each item
      for (const item of items) {
        if (!item.productId || !item.productName || !item.quantity || !item.unitPrice) {
          return res.status(400).json({ 
            message: 'Each item must have productId, productName, quantity, and unitPrice' 
          });
        }
        
        const itemTotalPrice = item.quantity * item.unitPrice;
        orderItems.push({
          productId: item.productId,
          productName: item.productName,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          totalPrice: itemTotalPrice,
          productDetails: item.productDetails || {}
        });
        
        orderTotalAmount += itemTotalPrice;
        totalQuantity += Number(item.quantity);
      }
    } else if (productId && productName && quantity && unitPrice) {
      // Legacy single-item format
      console.log('Processing single-item legacy order');
      
      const itemTotalPrice = Number(quantity) * Number(unitPrice);
      orderItems.push({
        productId: productId,
        productName: productName,
        quantity: Number(quantity),
        unitPrice: Number(unitPrice),
        totalPrice: itemTotalPrice
      });
      
      orderTotalAmount = totalAmount ? Number(totalAmount) : itemTotalPrice;
      totalQuantity = Number(quantity);
    } else {
      return res.status(400).json({ 
        message: 'Either provide items array for multi-item order, or productId/productName/quantity/unitPrice for single item' 
      });
    }

    // Get user for delivery address if not provided
    let address = deliveryAddress;
    if (!address) {
      const user = await User.findById(userId);
      if (user) {
        address = user.address;
      } else {
        return res.status(404).json({ message: 'User not found' });
      }
    }

    // Create order with new multi-item schema
    const order = new Order({
      userId,
      items: orderItems,
      itemsCount: orderItems.length,
      totalQuantity: totalQuantity,
      subtotalAmount: orderTotalAmount,
      discountAmount: 0,
      taxAmount: 0,
      deliveryCharges: 0,
      totalAmount: orderTotalAmount,
      orderType: orderType || 'one-time',
      deliveryAddress: address,
      deliveryInstructions: deliveryInstructions || '',
      customerNotes: customerNotes || '',
      paymentMethod: paymentMethod || 'cash',
      orderSource: 'mobile_app',
      startDate: startDate ? new Date(startDate) : new Date()
    });

    await order.save();
    console.log('Order created successfully:', order._id, 'with', orderItems.length, 'items');

    // Return response in format expected by mobile app
    res.status(201).json({
      message: 'Order placed successfully',
      order: {
        ...order.toObject(),
        // Legacy fields for backward compatibility
        productId: orderItems[0]?.productId,
        productName: orderItems[0]?.productName,
        quantity: totalQuantity,
        unitPrice: orderItems[0]?.unitPrice
      }
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Multi-item order creation endpoint (for mobile app cart functionality)
app.post('/api/orders/multi-item', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      items, 
      orderType, 
      deliveryAddress, 
      deliveryInstructions, 
      customerNotes, 
      paymentMethod,
      startDate 
    } = req.body;

    console.log('=== MULTI-ITEM ORDER REQUEST ===');
    console.log('User ID:', userId);
    console.log('Items count:', items?.length);
    console.log('Order type:', orderType);

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        message: 'Items array is required and must not be empty' 
      });
    }

    // Validate each item
    let orderItems = [];
    let orderTotalAmount = 0;
    let totalQuantity = 0;

    for (const [index, item] of items.entries()) {
      if (!item.productId || !item.productName || !item.quantity || !item.unitPrice) {
        return res.status(400).json({ 
          message: `Item ${index + 1} is missing required fields: productId, productName, quantity, unitPrice` 
        });
      }

      const itemTotalPrice = Number(item.quantity) * Number(item.unitPrice);
      orderItems.push({
        productId: item.productId,
        productName: item.productName,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: itemTotalPrice,
        productDetails: {
          brand: item.brand || '',
          category: item.category || '',
          unit: item.unit || '',
          fat: item.fat || '',
          protein: item.protein || '',
          sku: item.sku || ''
        }
      });
      
      orderTotalAmount += itemTotalPrice;
      totalQuantity += Number(item.quantity);
    }

    // Get user for delivery address if not provided
    let address = deliveryAddress;
    if (!address) {
      const user = await User.findById(userId);
      if (user) {
        address = user.address;
      } else {
        return res.status(404).json({ message: 'User not found' });
      }
    }

    // Generate orderNumber manually to ensure it exists
    const orderCount = await Order.countDocuments();
    const orderNumber = `ORD-${Date.now().toString().slice(-8)}-${(orderCount + 1).toString().padStart(4, '0')}`;
    console.log('Generated multi-item order number:', orderNumber);

    // Create multi-item order
    const order = new Order({
      orderNumber,
      userId,
      items: orderItems,
      itemsCount: orderItems.length,
      totalQuantity: totalQuantity,
      subtotalAmount: orderTotalAmount,
      discountAmount: 0, // Can be calculated based on promotions
      taxAmount: 0, // Can be calculated based on tax rules
      deliveryCharges: 0, // Can be calculated based on distance/order value
      totalAmount: orderTotalAmount,
      orderType: orderType || 'one-time',
      deliveryAddress: address,
      deliveryInstructions: deliveryInstructions || '',
      customerNotes: customerNotes || '',
      paymentMethod: paymentMethod || 'cash',
      orderSource: 'mobile_app',
      startDate: startDate ? new Date(startDate) : new Date()
    });

    await order.save();
    console.log('Multi-item order created successfully:', order._id, 'with', orderItems.length, 'items');

    res.status(201).json({
      success: true,
      message: `Order placed successfully with ${orderItems.length} items`,
      order: {
        ...order.toObject(),
        summary: {
          orderNumber: order.orderNumber,
          itemsCount: orderItems.length,
          totalQuantity: totalQuantity,
          totalAmount: orderTotalAmount,
          firstItem: orderItems[0]?.productName,
          additionalItems: orderItems.length > 1 ? orderItems.length - 1 : 0
        }
      }
    });
  } catch (error) {
    console.error('Multi-item order creation error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Order creation failed'
    });
  }
});

// Order cancellation endpoint
app.put('/api/orders/:id/cancel', verifyToken, async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.userId;

    // Find order and verify ownership (unless admin)
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user owns the order or is admin
    if (order.userId.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if order can be cancelled
    if (order.status === 'delivered') {
      return res.status(400).json({ message: 'Cannot cancel delivered order' });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({ message: 'Order is already cancelled' });
    }

    // Update order status to cancelled
    order.status = 'cancelled';
    order.updatedAt = new Date();
    await order.save();

    res.json({
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// =============================================================================
// COMPREHENSIVE ADMIN PRODUCT MANAGEMENT WITH INVENTORY CONTROL
// =============================================================================

// 1. GET ALL PRODUCTS (Admin) - with full inventory details
app.get('/api/admin/products', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    console.log('=== ADMIN PRODUCTS REQUEST ===');
    console.log('Admin user:', req.user.email);

    const products = await Product.find()
      .sort({ createdAt: -1 });

    // Enhanced product data for admin
    const enhancedProducts = products.map(product => ({
      ...product.toObject(),
      // Stock status indicators
      stockStatus: getStockStatus(product.quantity, product.minimumStock),
      stockPercentage: Math.round((product.quantity / product.maximumStock) * 100),
      needsRestock: product.quantity <= product.minimumStock,
      isOverstock: product.quantity >= product.maximumStock,
      // Financial indicators
      profitMargin: product.price - product.costPrice,
      profitPercentage: product.costPrice > 0 ? Math.round(((product.price - product.costPrice) / product.costPrice) * 100) : 0,
      // UI helpers
      statusColor: getProductStatusColor(product),
      formattedPrice: `₹${product.price}`,
      formattedCostPrice: `₹${product.costPrice}`,
      formattedCreatedDate: product.createdAt.toLocaleDateString('en-IN'),
      daysSinceCreated: Math.floor((new Date() - product.createdAt) / (1000 * 60 * 60 * 24))
    }));

    // Calculate summary statistics
    const summary = {
      totalProducts: products.length,
      activeProducts: products.filter(p => p.isActive).length,
      inactiveProducts: products.filter(p => !p.isActive).length,
      inStockProducts: products.filter(p => p.isInStock && p.quantity > 0).length,
      outOfStockProducts: products.filter(p => !p.isInStock || p.quantity === 0).length,
      lowStockProducts: products.filter(p => p.quantity <= p.minimumStock && p.quantity > 0).length,
      totalStockValue: products.reduce((sum, p) => sum + (p.quantity * p.costPrice), 0),
      totalRetailValue: products.reduce((sum, p) => sum + (p.quantity * p.price), 0),
      featuredProducts: products.filter(p => p.isFeatured).length
    };

    console.log(`📦 Retrieved ${products.length} products for admin`);

    res.json({
      success: true,
      products: enhancedProducts,
      summary,
      message: `Retrieved ${products.length} products successfully`
    });

  } catch (error) {
    console.error('❌ Admin products fetch error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch products', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// 2. CREATE NEW PRODUCT (Admin) - with full inventory setup
app.post('/api/admin/products', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    console.log('=== ADMIN CREATE PRODUCT ===');
    console.log('Request body:', req.body);

    const {
      name, description, price, unit, fat, protein,
      quantity, minimumStock, maximumStock,
      category, brand, barcode, sku,
      costPrice, discountPrice,
      isActive, isInStock, isFeatured,
      expiryDays, supplier, notes
    } = req.body;

    // Validate required fields
    if (!name || !description || !price || !fat || !protein) {
      return res.status(400).json({ 
        message: 'Missing required fields: name, description, price, fat, protein' 
      });
    }

    // Generate SKU if not provided
    const generatedSKU = sku || `KM-${name.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;

    const product = new Product({
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      unit: unit || 'Liter',
      fat,
      protein,
      // Inventory
      quantity: Number(quantity) || 0,
      minimumStock: Number(minimumStock) || 10,
      maximumStock: Number(maximumStock) || 1000,
      // Product details
      category: category || 'Milk Products',
      brand: brand || 'Kumar Milk',
      barcode,
      sku: generatedSKU,
      // Pricing
      costPrice: Number(costPrice) || 0,
      discountPrice: Number(discountPrice) || 0,
      // Status
      isActive: isActive !== false, // Default to true
      isInStock: isInStock !== false,
      isFeatured: isFeatured === true,
      // Additional
      expiryDays: Number(expiryDays) || 7,
      supplier: supplier || 'Local Farm',
      notes: notes || '',
      // Timestamps
      lastStockUpdate: new Date()
    });

    await product.save();
    console.log('✅ Product created:', product._id, product.name);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: {
        ...product.toObject(),
        stockStatus: getStockStatus(product.quantity, product.minimumStock),
        statusColor: getProductStatusColor(product)
      }
    });

  } catch (error) {
    console.error('❌ Create product error:', error);
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        success: false,
        message: `${duplicateField} already exists. Please use a unique ${duplicateField}.`
      });
    }
    res.status(500).json({ 
      success: false,
      message: 'Failed to create product',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// 3. UPDATE PRODUCT (Admin) - with inventory management
app.put('/api/admin/products/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    console.log('=== ADMIN UPDATE PRODUCT ===');
    console.log('Product ID:', req.params.id);
    console.log('Update data:', req.body);

    const updateData = { ...req.body };
    
    // Convert numeric fields
    const numericFields = ['price', 'quantity', 'minimumStock', 'maximumStock', 'costPrice', 'discountPrice', 'expiryDays'];
    numericFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updateData[field] = Number(updateData[field]);
      }
    });

    // Update timestamps
    updateData.updatedAt = new Date();
    if (updateData.quantity !== undefined) {
      updateData.lastStockUpdate = new Date();
      updateData.isInStock = updateData.quantity > 0;
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }

    console.log('✅ Product updated:', product._id, product.name);

    res.json({
      success: true,
      message: 'Product updated successfully',
      product: {
        ...product.toObject(),
        stockStatus: getStockStatus(product.quantity, product.minimumStock),
        statusColor: getProductStatusColor(product)
      }
    });

  } catch (error) {
    console.error('❌ Update product error:', error);
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        success: false,
        message: `${duplicateField} already exists. Please use a unique ${duplicateField}.`
      });
    }
    res.status(500).json({ 
      success: false,
      message: 'Failed to update product',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// 4. DELETE PRODUCT (Admin) - soft delete by deactivation
app.delete('/api/admin/products/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    console.log('=== ADMIN DELETE PRODUCT ===');
    console.log('Product ID:', req.params.id);

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { 
        isActive: false,
        isInStock: false,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }

    console.log('✅ Product deactivated:', product._id, product.name);

    res.json({
      success: true,
      message: 'Product deactivated successfully',
      product
    });

  } catch (error) {
    console.error('❌ Delete product error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete product',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// 5. BULK STOCK UPDATE (Admin) - for inventory management
app.put('/api/admin/products/bulk-stock', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    console.log('=== ADMIN BULK STOCK UPDATE ===');
    const { updates } = req.body; // Array of {productId, quantity, operation: 'set'|'add'|'subtract'}

    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ 
        success: false,
        message: 'Updates array is required' 
      });
    }

    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        const { productId, quantity, operation = 'set' } = update;
        const product = await Product.findById(productId);
        
        if (!product) {
          errors.push({ productId, error: 'Product not found' });
          continue;
        }

        let newQuantity = product.quantity;
        switch (operation) {
          case 'set':
            newQuantity = Number(quantity);
            break;
          case 'add':
            newQuantity = product.quantity + Number(quantity);
            break;
          case 'subtract':
            newQuantity = Math.max(0, product.quantity - Number(quantity));
            break;
        }

        const updatedProduct = await Product.findByIdAndUpdate(
          productId,
          { 
            quantity: newQuantity,
            isInStock: newQuantity > 0,
            lastStockUpdate: new Date(),
            updatedAt: new Date()
          },
          { new: true }
        );

        results.push({
          productId,
          name: updatedProduct.name,
          oldQuantity: product.quantity,
          newQuantity: updatedProduct.quantity,
          operation,
          stockStatus: getStockStatus(updatedProduct.quantity, updatedProduct.minimumStock)
        });

      } catch (error) {
        errors.push({ productId: update.productId, error: error.message });
      }
    }

    console.log(`✅ Bulk stock update completed: ${results.length} success, ${errors.length} errors`);

    res.json({
      success: true,
      message: `Stock updated for ${results.length} products`,
      results,
      errors
    });

  } catch (error) {
    console.error('❌ Bulk stock update error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update stock',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Helper functions for product management
function getStockStatus(quantity, minimumStock) {
  if (quantity === 0) return { status: 'OUT_OF_STOCK', label: 'Out of Stock', color: '#F44336' };
  if (quantity <= minimumStock) return { status: 'LOW_STOCK', label: 'Low Stock', color: '#FF9800' };
  return { status: 'IN_STOCK', label: 'In Stock', color: '#4CAF50' };
}

function getProductStatusColor(product) {
  if (!product.isActive) return '#9E9E9E'; // Gray for inactive
  if (!product.isInStock || product.quantity === 0) return '#F44336'; // Red for out of stock
  if (product.quantity <= product.minimumStock) return '#FF9800'; // Orange for low stock
  return '#4CAF50'; // Green for good stock
}

// Admin: Update order status (supports both PUT and PATCH)
app.put('/api/admin/orders/:id/status', verifyToken, async (req, res) => {
  await updateOrderStatus(req, res);
});

app.patch('/api/admin/orders/:id/status', verifyToken, async (req, res) => {
  await updateOrderStatus(req, res);
});

// Also add mobile-orders endpoint for compatibility
app.patch('/api/admin/mobile-orders/:id/status', verifyToken, async (req, res) => {
  await updateOrderStatus(req, res);
});

async function updateOrderStatus(req, res) {
  try {
    console.log('=== ADMIN ORDER STATUS UPDATE ===');
    console.log('User:', req.user.email, 'Role:', req.user.role);
    console.log('Order ID:', req.params.id);
    console.log('New Status:', req.body.status);
    
    if (req.user.role !== 'admin') {
      console.log('❌ Access denied - user is not admin');
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }
    
    // Update order with proper timestamps
    const updateData = { 
      status, 
      updatedAt: new Date() 
    };
    
    // Add status-specific timestamps
    if (status === 'confirmed') updateData.confirmedAt = new Date();
    if (status === 'cancelled') updateData.cancelledAt = new Date();
    if (status === 'delivered') updateData.deliveredAt = new Date();
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
    .populate('userId', 'name email phone')
    .populate('items.productId', 'name price unit'); // Fixed: populate items array

    if (!order) {
      console.log('❌ Order not found:', req.params.id);
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log('✅ Order status updated successfully');
    console.log('Order:', order.orderNumber, 'New Status:', status);
    console.log('Items:', order.items.length, 'Total Amount:', order.totalAmount);

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: {
        ...order.toObject(),
        // Add legacy fields for backward compatibility
        productId: order.items[0]?.productId,
        productName: order.items[0]?.productName,
        quantity: order.totalQuantity,
        unitPrice: order.items[0]?.unitPrice
      }
    });
  } catch (error) {
    console.error('❌ Update order status error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Initialize default products with enhanced inventory data
const initializeProducts = async () => {
  try {
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      console.log('🏪 Initializing default products with inventory...');
      
      const defaultProducts = [
        {
          name: 'Full Cream Milk',
          description: 'Rich and creamy whole milk with full fat content',
          price: 60,
          costPrice: 45,
          unit: 'Liter',
          fat: '6%',
          protein: '3.2%',
          quantity: 150,
          minimumStock: 20,
          maximumStock: 500,
          category: 'Premium Milk',
          brand: 'Kumar Premium',
          sku: 'KM-FCM-001',
          isActive: true,
          isInStock: true,
          isFeatured: true,
          expiryDays: 5,
          supplier: 'Premium Dairy Farm',
          notes: 'Premium quality full cream milk'
        },
        {
          name: 'Toned Milk',
          description: 'Reduced fat milk with great taste and nutrition',
          price: 50,
          costPrice: 38,
          unit: 'Liter',
          fat: '3%',
          protein: '3.0%',
          quantity: 200,
          minimumStock: 30,
          maximumStock: 600,
          category: 'Standard Milk',
          brand: 'Kumar Fresh',
          sku: 'KM-TM-002',
          isActive: true,
          isInStock: true,
          isFeatured: true,
          expiryDays: 6,
          supplier: 'Local Dairy Cooperative',
          notes: 'Popular choice for daily consumption'
        },
        {
          name: 'Double Toned Milk',
          description: 'Low fat milk for health conscious customers',
          price: 45,
          costPrice: 35,
          unit: 'Liter',
          fat: '1.5%',
          protein: '2.8%',
          quantity: 120,
          minimumStock: 15,
          maximumStock: 400,
          category: 'Health Milk',
          brand: 'Kumar Lite',
          sku: 'KM-DTM-003',
          isActive: true,
          isInStock: true,
          isFeatured: false,
          expiryDays: 7,
          supplier: 'Healthy Farms Ltd',
          notes: 'Low fat option for diet-conscious customers'
        },
        {
          name: 'Organic Milk',
          description: 'Certified organic milk from grass-fed cows',
          price: 80,
          costPrice: 65,
          unit: 'Liter',
          fat: '4%',
          protein: '3.5%',
          quantity: 50,
          minimumStock: 10,
          maximumStock: 200,
          category: 'Organic Products',
          brand: 'Kumar Organic',
          sku: 'KM-ORG-004',
          isActive: true,
          isInStock: true,
          isFeatured: true,
          expiryDays: 4,
          supplier: 'Certified Organic Farm',
          notes: 'Premium organic milk with certification'
        },
        {
          name: 'Flavored Milk - Chocolate',
          description: 'Delicious chocolate flavored milk for kids',
          price: 35,
          costPrice: 25,
          unit: '500ml',
          fat: '3%',
          protein: '2.5%',
          quantity: 80,
          minimumStock: 20,
          maximumStock: 300,
          category: 'Flavored Milk',
          brand: 'Kumar Kids',
          sku: 'KM-CHO-005',
          isActive: true,
          isInStock: true,
          isFeatured: false,
          expiryDays: 8,
          supplier: 'Flavor Milk Industries',
          notes: 'Popular among children'
        }
      ];

      await Product.insertMany(defaultProducts);
      console.log(`✅ ${defaultProducts.length} default products initialized with inventory data`);
      console.log('📊 Stock Summary:');
      console.log('- Full Cream Milk: 150L in stock');
      console.log('- Toned Milk: 200L in stock');
      console.log('- Double Toned Milk: 120L in stock');
      console.log('- Organic Milk: 50L in stock');
      console.log('- Chocolate Milk: 80 bottles in stock');
    }
  } catch (error) {
    console.error('❌ Error initializing products:', error);
  }
};

// Create admin user if doesn't exist
const createAdminUser = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = new User({
        name: 'Administrator',
        email: 'admin@kumarmilk.com',
        password: hashedPassword,
        phone: '9999999999',
        address: 'Kumar Milk Distributors HQ',
        role: 'admin'
      });
      await admin.save();
      console.log('Admin user created: admin@kumarmilk.com / admin123');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

// Admin Analytics: Dashboard Insights - Advanced analytics for mobile admin app
app.get('/api/admin/analytics/dashboard-insights', verifyToken, async (req, res) => {
  try {
    console.log('=== ADMIN ANALYTICS DASHBOARD INSIGHTS ===');
    console.log('User:', req.user.email, 'Role:', req.user.role);
    
    if (req.user.role !== 'admin') {
      console.log('❌ Access denied - user is not admin');
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    // Date calculations
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Parallel data fetching for better performance
    const [orders, products, users] = await Promise.all([
      Order.find({}).populate('userId', 'name email'),
      Product.find({}),
      User.find({})
    ]);

    // Orders Analytics
    const todayOrders = orders.filter(order => new Date(order.createdAt) >= today);
    const yesterdayOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= yesterday && orderDate < today;
    });
    const thisWeekOrders = orders.filter(order => new Date(order.createdAt) >= thisWeekStart);
    const thisMonthOrders = orders.filter(order => new Date(order.createdAt) >= thisMonthStart);
    const lastMonthOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= lastMonthStart && orderDate < thisMonthStart;
    });

    // Revenue Analytics
    const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const yesterdayRevenue = yesterdayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const thisWeekRevenue = thisWeekOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const thisMonthRevenue = thisMonthOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    // Growth calculations
    const orderGrowth = yesterdayOrders.length > 0 ? 
      ((todayOrders.length - yesterdayOrders.length) / yesterdayOrders.length * 100) : 
      (todayOrders.length > 0 ? 100 : 0);
    
    const revenueGrowth = yesterdayRevenue > 0 ? 
      ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100) : 
      (todayRevenue > 0 ? 100 : 0);

    const monthlyRevenueGrowth = lastMonthRevenue > 0 ? 
      ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100) : 
      (thisMonthRevenue > 0 ? 100 : 0);

    // Customer Analytics
    const totalCustomers = users.filter(user => user.role === 'customer').length;
    const newCustomersThisWeek = users.filter(user => 
      user.role === 'customer' && new Date(user.createdAt) >= thisWeekStart
    ).length;
    const newCustomersThisMonth = users.filter(user => 
      user.role === 'customer' && new Date(user.createdAt) >= thisMonthStart
    ).length;

    // Product Analytics
    const totalProducts = products.length;
    const activeProducts = products.filter(product => product.isActive && product.isInStock).length;
    const lowStockProducts = products.filter(product => 
      product.quantity <= product.minimumStock && product.isActive
    ).length;
    const outOfStockProducts = products.filter(product => 
      product.quantity === 0 || !product.isInStock
    ).length;

    // Order Status Analytics
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const confirmedOrders = orders.filter(order => order.status === 'confirmed').length;
    const deliveredOrders = orders.filter(order => order.status === 'delivered').length;
    const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;

    // Top Products (by order frequency)
    const productStats = {};
    orders.forEach(order => {
      if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
          const productName = item.productName || 'Unknown Product';
          if (!productStats[productName]) {
            productStats[productName] = { count: 0, revenue: 0, quantity: 0 };
          }
          productStats[productName].count++;
          productStats[productName].revenue += item.totalPrice || 0;
          productStats[productName].quantity += item.quantity || 0;
        });
      }
    });

    const topProducts = Object.entries(productStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Recent Activity (last 5 orders)
    const recentOrders = orders
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(order => ({
        id: order._id,
        orderNumber: order.orderNumber,
        customer: order.userId?.name || 'Unknown',
        status: order.status,
        amount: order.totalAmount || 0,
        itemsCount: order.itemsCount || order.items?.length || 1,
        date: order.createdAt
      }));

    // Build comprehensive insights response
    const insights = {
      // Summary Cards
      summary: {
        totalOrders: orders.length,
        todayOrders: todayOrders.length,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        todayRevenue: parseFloat(todayRevenue.toFixed(2)),
        totalCustomers,
        activeProducts,
        pendingOrders
      },

      // Growth Metrics
      growth: {
        orderGrowth: parseFloat(orderGrowth.toFixed(1)),
        revenueGrowth: parseFloat(revenueGrowth.toFixed(1)),
        monthlyRevenueGrowth: parseFloat(monthlyRevenueGrowth.toFixed(1)),
        customerGrowth: newCustomersThisMonth
      },

      // Time-based Analytics
      analytics: {
        thisWeek: {
          orders: thisWeekOrders.length,
          revenue: parseFloat(thisWeekRevenue.toFixed(2)),
          newCustomers: newCustomersThisWeek
        },
        thisMonth: {
          orders: thisMonthOrders.length,
          revenue: parseFloat(thisMonthRevenue.toFixed(2)),
          newCustomers: newCustomersThisMonth
        },
        lastMonth: {
          orders: lastMonthOrders.length,
          revenue: parseFloat(lastMonthRevenue.toFixed(2))
        }
      },

      // Product Insights
      inventory: {
        totalProducts,
        activeProducts,
        lowStockProducts,
        outOfStockProducts,
        stockHealthPercentage: totalProducts > 0 ? 
          parseFloat(((activeProducts / totalProducts) * 100).toFixed(1)) : 0
      },

      // Order Status Distribution
      orderDistribution: {
        pending: pendingOrders,
        confirmed: confirmedOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
        completionRate: orders.length > 0 ? 
          parseFloat(((deliveredOrders / orders.length) * 100).toFixed(1)) : 0
      },

      // Top Performing Products
      topProducts,

      // Recent Activity
      recentActivity: recentOrders,

      // System Health
      systemHealth: {
        databaseStatus: 'connected',
        totalEntities: orders.length + products.length + users.length,
        lastUpdated: now.toISOString()
      }
    };

    console.log('✅ Dashboard insights generated successfully');
    console.log(`📊 Summary: ${orders.length} orders, ${totalCustomers} customers, ₹${totalRevenue.toFixed(2)} revenue`);
    
    res.json({
      success: true,
      message: 'Dashboard insights retrieved successfully',
      data: insights,
      timestamp: now.toISOString()
    });

  } catch (error) {
    console.error('❌ Dashboard insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard insights',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Admin: Get All Users - Required for admin panel
app.get('/api/admin/users', verifyToken, async (req, res) => {
  try {
    console.log('=== ADMIN USERS REQUEST ===');
    console.log('User:', req.user.email, 'Role:', req.user.role);
    
    if (req.user.role !== 'admin') {
      console.log('❌ Access denied - user is not admin');
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    // Fetch all users from database
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    
    // Format users for admin panel display
    const formattedUsers = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));

    console.log(`✅ Retrieved ${formattedUsers.length} users for admin`);
    
    res.json({
      success: true,
      message: 'Users retrieved successfully',
      users: formattedUsers,
      count: formattedUsers.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Admin users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Initialize data
initializeProducts();
createAdminUser();

// Catch-all route for debugging
app.use('*', (req, res) => {
  console.log('=== UNMATCHED REQUEST ===');
  console.log('Method:', req.method);
  console.log('URL:', req.originalUrl);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  res.status(404).json({ 
    message: 'Endpoint not found', 
    method: req.method, 
    url: req.originalUrl 
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`MongoDB URI: ${MONGODB_URI}`);
});

module.exports = app;