require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const paymentRoutes = require("./routes/payment");
const inventoryRoutes = require("./routes/inventoryRoutes");

const app = express();
const updateOrderStatuses = require("./cron/updateOrderStatus");
if (process.env.ENABLE_CRON !== 'false') {
  updateOrderStatuses();
}

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(helmet());
app.use(compression());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
  })
);
app.use(
  cors({
    origin: (
      process.env.CORS_ORIGINS?.split(",").map((o) => o.trim()).filter(Boolean) || [
        "http://localhost:5173", // Vite default
        "http://127.0.0.1:5173",
        "http://localhost:8082",
        "http://192.168.1.124:8082",
        "https://kumar-milk-distributors-frontend.onrender.com",
      ]
    ),
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

// Import Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const orderRoutes = require("./routes/orderRoutes");
const mobileOrderRoutes = require("./routes/mobileOrderRoutes");
const adminRoutes = require("./routes/adminRoutes");
const productRoutes = require("./routes/productRoutes");

app.use("/api/auth", authRoutes); // Authentication routes
app.use("/api/user", userRoutes); // User profile routes
app.use("/api/orders", orderRoutes); // Web app order management (crates-based)
app.use("/api/customer/orders", mobileOrderRoutes); // Mobile app order routes
app.use("/api/admin", adminRoutes); // Admin controls
app.use("/api/inventory", inventoryRoutes);
app.use("/api/products", productRoutes); // Customer products API
app.use("/uploads", express.static("uploads"));

app.use("/api/payment", paymentRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: 'OK', message: 'Server is healthy', timestamp: new Date().toISOString() });
});

// Default route
app.get("/", (req, res) => {
  res.send("Milk Distributor API is running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
