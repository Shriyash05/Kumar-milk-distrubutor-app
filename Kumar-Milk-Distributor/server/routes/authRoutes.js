const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/authController");

// Route for user registration
router.post("/register", registerUser);

// Route for user login
router.post("/login", loginUser);

// Route for user logout
router.post("/logout", (req, res) => {
  // For JWT, logout is handled client-side by removing the token
  res.json({ message: "Logged out successfully" });
});

module.exports = router;
