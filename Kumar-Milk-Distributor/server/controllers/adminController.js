const Order = require("../models/Order");
const MobileOrder = require("../models/MobileOrder");
const User = require("../models/User");
const Product = require("../models/Product");
const { Parser } = require("json2csv");
const { Inventory } = require("../models/Inventory");

const getAllOrders = async (req, res) => {
  try {
    const { shopName, deliveryDate, paymentStatus, status } = req.query;

    const query = {};

    // 🔍 Shop name search (partial match)
    if (shopName) {
      query.shopName = { $regex: shopName, $options: "i" };
    }

    // 📅 Exact delivery date match
    if (deliveryDate) {
      const date = new Date(deliveryDate);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      query.deliveryDate = { $gte: date, $lt: nextDate };
    }

    // 💰 Payment status filter
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    // 📦 Delivery status filter
    if (status) {
      query.status = status;
    }

    const allOrders = await Order.find(query)
      .populate("customer", "name email address")
      .sort({ deliveryDate: 1 });

    res.status(200).json(allOrders);
  } catch (error) {
    console.error("Error fetching filtered orders:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { paymentStatus, status } = req.body;

    // Validate order ID
    if (!orderId || orderId === 'undefined') {
      return res.status(400).json({ 
        message: "Invalid order ID", 
        error: "Order ID is required and cannot be undefined" 
      });
    }

    // Validate that at least one field is provided
    if (!paymentStatus && !status) {
      return res.status(400).json({ 
        message: "Missing required fields", 
        error: "Either paymentStatus or status must be provided" 
      });
    }

    console.log(`Updating order ${orderId} with:`, { paymentStatus, status });

    // Check if order exists first
    const existingOrder = await Order.findById(orderId);
    if (!existingOrder) {
      return res.status(404).json({ 
        message: "Order not found", 
        error: `No order found with ID: ${orderId}` 
      });
    }

    const updated = await Order.findByIdAndUpdate(
      orderId,
      { ...(paymentStatus && { paymentStatus }), ...(status && { status }) },
      { new: true }
    );

    console.log(`Order ${orderId} updated successfully:`, updated);
    res.status(200).json(updated);
  } catch (err) {
    console.error("Error updating order status:", err);
    
    // Handle mongoose validation errors
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        message: "Invalid order ID format", 
        error: err.message 
      });
    }
    
    res.status(500).json({ 
      message: "Server error", 
      error: err.message 
    });
  }
};
const getDailyDeliveryCSV = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const orders = await Order.find({
      deliveryDate: { $gte: today, $lt: tomorrow },
    }).populate("customer", "name email address");

    // Flatten the data for CSV
    const flatOrders = orders.map((order) => ({
      customerName: order.shopName || "N/A",
      customerAddress: order.address || "N/A",
      deliveryDate: order.deliveryDate,
      status: order.status,
      paymentStatus: order.paymentStatus,
      amulBuffaloCrates: order.amulBuffaloCrates,
      amulGoldCrates: order.amulGoldCrates,
      amulTaazaCrates: order.amulTaazaCrates,
      gokulCowCrates: order.gokulCowCrates,
      gokulBuffaloCrates: order.gokulBuffaloCrates,
      gokulFullCreamCrates: order.gokulFullCreamCrates,
      mahanandaCrates: order.mahanandaCrates,
      TotalAmount: order.totalAmount,
    }));

    const fields = [
      "customerName",
      "customerAddress",
      "deliveryDate",
      "status",
      "paymentStatus",
      "amulBuffaloCrates",
      "amulGoldCrates",
      "amulTaazaCrates",
      "gokulCowCrates",
      "gokulBuffaloCrates",
      "gokulFullCreamCrates",
      "mahanandaCrates",
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(flatOrders);

    res.header("Content-Type", "text/csv");
    res.attachment("daily-deliveries.csv");
    return res.send(csv);
  } catch (err) {
    console.error("CSV export error:", err);
    res.status(500).json({ message: "Failed to generate CSV" });
  }
};
const setInventoryForDate = async (req, res) => {
  try {
    const { date, ...inventoryData } = req.body;
    const cleanDate = new Date(date);
    cleanDate.setHours(0, 0, 0, 0);

    const existing = await Inventory.findOne({ date: cleanDate });

    if (existing) {
      // Update existing
      await Inventory.updateOne({ date: cleanDate }, inventoryData);
      return res.status(200).json({ message: "Inventory updated" });
    }

    // Create new
    const inventory = new Inventory({ date: cleanDate, ...inventoryData });
    await inventory.save();
    res.status(201).json({ message: "Inventory created" });
  } catch (err) {
    console.error("Error setting inventory:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get Inventory for a Specific Date
const getInventoryForDate = async (req, res) => {
  try {
    const cleanDate = new Date(req.params.date);
    cleanDate.setHours(0, 0, 0, 0);

    const inventory = await Inventory.findOne({ date: cleanDate });

    if (!inventory)
      return res.status(404).json({ message: "Inventory not found" });

    res.status(200).json(inventory);
  } catch (err) {
    console.error("Error getting inventory:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getMonthlySummary = async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const orders = await Order.find({ deliveryDate: { $gte: startOfMonth } });

    let totalCrates = 0;
    let totalAmount = 0;
    let crateCounts = {
      amulTaazaCrates: 0,
      amulGoldCrates: 0,
      amulBuffaloCrates: 0,
      gokulCowCrates: 0,
      gokulBuffaloCrates: 0,
      gokulFullCreamCrates: 0,
      mahanandaCrates: 0,
    };

    const customerMap = {};

    for (const order of orders) {
      totalAmount += order.totalAmount || 0;

      for (const key in crateCounts) {
        crateCounts[key] += order[key] || 0;
        totalCrates += order[key] || 0;
      }

      const shop = order.shopName;
      if (!customerMap[shop]) {
        customerMap[shop] = { shopName: shop, totalAmount: 0, totalCrates: 0 };
      }

      customerMap[shop].totalAmount += order.totalAmount || 0;
      customerMap[shop].totalCrates += Object.keys(crateCounts).reduce(
        (sum, k) => sum + (order[k] || 0),
        0
      );
    }

    const mostOrdered = Object.entries(crateCounts).sort(
      (a, b) => b[1] - a[1]
    )[0][0];
    const topCustomers = Object.values(customerMap)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 3);

    res.json({
      totalOrders: orders.length,
      totalAmount,
      totalCrates,
      mostOrderedProduct: mostOrdered,
      crateBreakdown: crateCounts,
      topCustomers,
    });
  } catch (err) {
    console.error("Monthly summary error:", err);
    res.status(500).json({ message: "Failed to fetch summary" });
  }
};

// Get Admin Dashboard Statistics
const getAdminDashboard = async (req, res) => {
  try {
    console.log('Admin dashboard request received');
    
    // Get current date ranges
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Get total customers
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    
    // Get mobile orders (from mobile app)
    const totalMobileOrders = await MobileOrder.countDocuments();
    const todayMobileOrders = await MobileOrder.countDocuments({
      createdAt: { $gte: todayStart, $lt: todayEnd }
    });
    const pendingMobileOrders = await MobileOrder.countDocuments({
      status: 'pending_verification'
    });
    
    // Get web orders (old system)
    const totalWebOrders = await Order.countDocuments();
    const todayWebOrders = await Order.countDocuments({
      createdAt: { $gte: todayStart, $lt: todayEnd }
    });
    const pendingWebOrders = await Order.countDocuments({
      status: 'Pending'
    });
    
    // Calculate totals
    const totalOrders = totalMobileOrders + totalWebOrders;
    const todayOrders = todayMobileOrders + todayWebOrders;
    const pendingOrders = pendingMobileOrders + pendingWebOrders;
    
    // Calculate revenue from mobile orders
    const mobileRevenue = await MobileOrder.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);
    
    // Calculate revenue from web orders  
    const webRevenue = await Order.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);
    
    const totalRevenue = (mobileRevenue[0]?.total || 0) + (webRevenue[0]?.total || 0);
    
    // Get today's revenue
    const todayMobileRevenue = await MobileOrder.aggregate([
      {
        $match: {
          createdAt: { $gte: todayStart, $lt: todayEnd }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);
    
    const todayWebRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: todayStart, $lt: todayEnd }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);
    
    const todayRevenue = (todayMobileRevenue[0]?.total || 0) + (todayWebRevenue[0]?.total || 0);
    
    // Get recent mobile orders for dashboard
    const recentMobileOrders = await MobileOrder.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customer', 'name email');
    
    const dashboardData = {
      totalCustomers,
      totalOrders,
      todayOrders,
      pendingOrders,
      totalRevenue,
      todayRevenue,
      mobileOrders: {
        total: totalMobileOrders,
        today: todayMobileOrders,
        pending: pendingMobileOrders,
        revenue: mobileRevenue[0]?.total || 0
      },
      webOrders: {
        total: totalWebOrders,
        today: todayWebOrders,
        pending: pendingWebOrders,
        revenue: webRevenue[0]?.total || 0
      },
      recentOrders: recentMobileOrders
    };
    
    console.log('Dashboard data calculated:', dashboardData);
    
    res.json({
      success: true,
      data: dashboardData
    });
    
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
};

// Get all mobile orders for admin
const getAllMobileOrders = async (req, res) => {
  try {
    const { status, paymentStatus, limit = 50 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    
    const mobileOrders = await MobileOrder.find(query)
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      orders: mobileOrders,
      count: mobileOrders.length
    });
    
  } catch (error) {
    console.error('Get mobile orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mobile orders',
      error: error.message
    });
  }
};

// Get all users for admin
const getAllUsers = async (req, res) => {
  try {
    const { role, limit = 100 } = req.query;
    
    const query = {};
    if (role) query.role = role;
    
    const users = await User.find(query, '-password')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      users: users,
      count: users.length
    });
    
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

// Update mobile order status
const updateMobileOrderStatus = async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const orderId = req.params.id;
    
    const updateData = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    
    const updatedOrder = await MobileOrder.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    ).populate('customer', 'name email phone');
    
    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Mobile order not found'
      });
    }
    
    console.log('Mobile order status updated:', orderId, updateData);
    
    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: updatedOrder
    });
    
  } catch (error) {
    console.error('Update mobile order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
};

// Get all products for admin
const getAllProducts = async (req, res) => {
  try {
    console.log('📝 Fetching products from database...');
    
    // Fetch products from database
    const products = await Product.find({ isActive: true })
      .sort({ brand: 1, name: 1 })
      .populate('createdBy', 'name email');
    
    console.log(`✅ Found ${products.length} products in database`);
    
    // If no products in database, return empty array with message
    if (products.length === 0) {
      console.log('⚠️ No products found in database');
      return res.json({
        success: true,
        products: [],
        count: 0,
        message: 'No products found. Please add products to the database.'
      });
    }
    
    // Transform products to include stock status
    const transformedProducts = products.map(product => ({
      _id: product._id,
      name: product.name,
      brand: product.brand,
      description: product.description,
      price: product.price,
      pricePerCrate: product.pricePerCrate,
      packSize: product.packSize,
      unit: product.unit,
      category: product.category,
      available: product.available,
      isActive: product.isActive,
      stockQuantity: product.stockQuantity,
      minStockLevel: product.minStockLevel,
      stockStatus: product.stockQuantity <= 0 ? 'out_of_stock' : 
                   product.stockQuantity <= product.minStockLevel ? 'low_stock' : 'in_stock',
      nutritionalInfo: product.nutritionalInfo,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      createdBy: product.createdBy
    }));
    
    res.json({
      success: true,
      products: transformedProducts,
      count: transformedProducts.length
    });
    
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
};

// Create product (saves to database)
const createProduct = async (req, res) => {
  try {
    const productData = req.body;
    console.log('🎆 Creating new product:', productData);
    
    // Add created by admin user
    const newProductData = {
      ...productData,
      createdBy: req.user._id,
      isActive: true,
      available: true
    };
    
    // Create and save product to database
    const newProduct = new Product(newProductData);
    await newProduct.save();
    
    console.log('✅ Product created successfully with ID:', newProduct._id);
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: {
        _id: newProduct._id,
        name: newProduct.name,
        brand: newProduct.brand,
        description: newProduct.description,
        price: newProduct.price,
        pricePerCrate: newProduct.pricePerCrate,
        packSize: newProduct.packSize,
        unit: newProduct.unit,
        category: newProduct.category,
        available: newProduct.available,
        isActive: newProduct.isActive,
        stockQuantity: newProduct.stockQuantity,
        createdAt: newProduct.createdAt
      }
    });
    
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
};

// Update product (updates in database)
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log('📝 Updating product:', id, updateData);
    
    // Find and update the product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        ...updateData,
        updatedAt: new Date()
      },
      { 
        new: true, // Return updated document
        runValidators: true // Run mongoose validators
      }
    );
    
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    console.log('✅ Product updated successfully:', updatedProduct._id);
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      product: {
        _id: updatedProduct._id,
        name: updatedProduct.name,
        brand: updatedProduct.brand,
        description: updatedProduct.description,
        price: updatedProduct.price,
        pricePerCrate: updatedProduct.pricePerCrate,
        packSize: updatedProduct.packSize,
        unit: updatedProduct.unit,
        category: updatedProduct.category,
        available: updatedProduct.available,
        isActive: updatedProduct.isActive,
        stockQuantity: updatedProduct.stockQuantity,
        updatedAt: updatedProduct.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
};

// Delete product (soft delete - marks as inactive)
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ Deleting product:', id);
    
    // Soft delete by marking as inactive instead of actually deleting
    const deletedProduct = await Product.findByIdAndUpdate(
      id,
      {
        isActive: false,
        available: false,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    console.log('✅ Product soft deleted successfully:', deletedProduct._id);
    
    res.json({
      success: true,
      message: 'Product deleted successfully',
      product: {
        _id: deletedProduct._id,
        name: deletedProduct.name,
        isActive: deletedProduct.isActive
      }
    });
    
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
};

module.exports = {
  getAllOrders,
  updateOrderStatus,
  updateMobileOrderStatus,
  getDailyDeliveryCSV,
  getMonthlySummary,
  setInventoryForDate,
  getInventoryForDate,
  getAdminDashboard,
  getAllMobileOrders,
  getAllUsers,
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};
