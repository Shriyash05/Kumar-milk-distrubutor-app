const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  placeMobileOrder,
  getMobileOrders,
  getMobileOrderById
} = require('../controllers/mobileOrderController');

// POST /api/customer/orders - Place a new mobile order (requires authentication)
router.post('/', protect, placeMobileOrder);

// GET /api/customer/orders - Get all orders for the authenticated user
router.get('/', protect, getMobileOrders);

// GET /api/customer/orders/:id - Get specific order by ID
router.get('/:id', protect, getMobileOrderById);

module.exports = router;
