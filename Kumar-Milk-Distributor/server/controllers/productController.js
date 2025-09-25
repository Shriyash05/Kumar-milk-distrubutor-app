const Product = require('../models/Product');

// Get all available products for customers
const getAvailableProducts = async (req, res) => {
  try {
    console.log('🛒 Customer fetching available products...');

    // Fetch all products (hard-deleted products are gone)
    const products = await Product.find({})
      .sort({ brand: 1, name: 1 })
      .select('-createdBy -__v'); // Don't expose internal fields

    console.log(`✅ Found ${products.length} products for customers`);

    if (products.length === 0) {
      console.log('⚠️ No products found for customers');
      return res.json({
        success: true,
        products: [],
        count: 0,
        message: 'No products available at the moment. Please check back later.'
      });
    }

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
      available: product.stockQuantity > 0, // Only show as available if stock > 0
      stockQuantity: product.stockQuantity,
      nutritionalInfo: product.nutritionalInfo,
      Unit: product.unit,
      isOrderable: product.stockQuantity > 0
    }));

    // Group by brand
    const productsByBrand = transformedProducts.reduce((acc, product) => {
      if (!acc[product.brand]) acc[product.brand] = [];
      acc[product.brand].push(product);
      return acc;
    }, {});

    res.json({
      success: true,
      products: transformedProducts,
      productsByBrand,
      count: transformedProducts.length,
      brands: Object.keys(productsByBrand)
    });

  } catch (error) {
    console.error('Get available products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
};

// Get product by ID for customers
const getProductById = async (req, res) => {
  try {
    const productId = req.params.id;
    console.log('🔍 Customer fetching product:', productId);

    const product = await Product.findById(productId).select('-createdBy -__v');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const transformedProduct = {
      _id: product._id,
      name: product.name,
      brand: product.brand,
      description: product.description,
      price: product.price,
      pricePerCrate: product.pricePerCrate,
      packSize: product.packSize,
      unit: product.unit,
      category: product.category,
      available: product.stockQuantity > 0,
      stockQuantity: product.stockQuantity,
      nutritionalInfo: product.nutritionalInfo,
      Unit: product.unit,
      isOrderable: product.stockQuantity > 0
    };

    res.json({
      success: true,
      product: transformedProduct
    });

  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
};

// Get products by brand for customers
const getProductsByBrand = async (req, res) => {
  try {
    const brand = req.params.brand;
    console.log('🏷️ Customer fetching products for brand:', brand);

    const products = await Product.find({
      brand: { $regex: brand, $options: 'i' }
    })
      .sort({ name: 1 })
      .select('-createdBy -__v');

    if (products.length === 0) {
      return res.json({
        success: true,
        products: [],
        count: 0,
        message: `No products found for brand: ${brand}`
      });
    }

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
      available: product.stockQuantity > 0,
      stockQuantity: product.stockQuantity,
      nutritionalInfo: product.nutritionalInfo,
      Unit: product.unit,
      isOrderable: product.stockQuantity > 0
    }));

    res.json({
      success: true,
      products: transformedProducts,
      count: transformedProducts.length,
      brand: brand
    });

  } catch (error) {
    console.error('Get products by brand error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products by brand',
      error: error.message
    });
  }
};

module.exports = {
  getAvailableProducts,
  getProductById,
  getProductsByBrand
};
