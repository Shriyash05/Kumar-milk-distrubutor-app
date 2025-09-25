const express = require('express');
const router = express.Router();
const {
  getAvailableProducts,
  getProductById,
  getProductsByBrand
} = require('../controllers/productController');

// GET /api/products - Get all available products for customers
router.get('/', getAvailableProducts);

// GET /api/products/:id - Get specific product by ID
router.get('/:id', getProductById);

// GET /api/products/brand/:brand - Get products by brand
router.get('/brand/:brand', getProductsByBrand);

module.exports = router;