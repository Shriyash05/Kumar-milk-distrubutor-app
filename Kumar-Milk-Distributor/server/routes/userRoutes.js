const express = require("express");
const router = express.Router();
const { getUserProfile, updateUserProfile } = require("../controllers/userController");

// GET /api/user/profile - Get user profile
router.get("/profile", getUserProfile);

// PUT /api/user/profile - Update user profile
router.put("/profile", updateUserProfile);

module.exports = router;