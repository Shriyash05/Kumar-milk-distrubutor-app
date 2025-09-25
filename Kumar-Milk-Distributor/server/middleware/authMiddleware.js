const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.userId).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "User not found" });
      }

      return next();
    } catch (error) {
      console.error("JWT Error:", error);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  return res.status(401).json({ message: "Not authorized, no token" });
};

const adminOnly = (req, res, next) => {
  const fixedAdminEmail = process.env.ADMIN_EMAIL;
  
  console.log('🔐 Admin middleware check:');
  console.log('  - Environment ADMIN_EMAIL:', fixedAdminEmail);
  console.log('  - Current user:', req.user ? req.user.email : 'No user');
  console.log('  - User role:', req.user ? req.user.role : 'No role');

  if (!req.user) {
    console.log('❌ Admin access denied: No user found in request');
    return res.status(401).json({ message: "Authentication required" });
  }

  if (!fixedAdminEmail) {
    console.log('❌ Admin access denied: ADMIN_EMAIL not set in environment');
    return res.status(500).json({ message: "Server configuration error" });
  }

  // Check if user email matches admin email
  if (req.user.email === fixedAdminEmail) {
    console.log('✅ Admin access granted for:', req.user.email);
    return next();
  }

  // Also check role-based admin access (fallback)
  if (req.user.role === 'admin') {
    console.log('✅ Admin access granted via role for:', req.user.email);
    return next();
  }

  console.log('❌ Admin access denied: User is not admin');
  console.log('  - Expected email:', fixedAdminEmail);
  console.log('  - Actual email:', req.user.email);
  
  return res.status(403).json({ 
    message: "Access denied. Admins only.",
    debug: {
      userEmail: req.user.email,
      requiredEmail: fixedAdminEmail,
      userRole: req.user.role
    }
  });
};

module.exports = { protect, adminOnly };
