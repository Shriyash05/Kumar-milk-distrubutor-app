const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const nodemailer = require("nodemailer");
const User = require("../models/User");
ADMIN_EMAIL = "j.bhoomi16@gmail.com";
ADMIN_PASSWORD = "Admin@123";

// Util function to send email
const sendEmail = async (email, username) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASS, // Your app password
    },
  });

  await transporter.sendMail({
    from: `"Milk Distributor" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Welcome to Milk Distributor App",
    html: `<h3>Welcome ${username}!</h3><p>Your account has been created successfully.</p>`,
  });
};

// Register user
const registerUser = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, phone, address } = req.body;

    // Check for required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    // If confirmPassword is provided (from web), validate it matches
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Default role is customer
    const role = "customer";

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Password before hashing:", password);
    console.log("Hashed password being saved:", hashedPassword);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone: phone || '',
      address: address || '',
    });

    // Send confirmation email (optional - don't block registration if email fails)
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: "Registration Successful",
          html: `<h3>Hi ${name},</h3><p>You've successfully registered on Milk Distributor Platform.</p>`,
        };

        await transporter.sendMail(mailOptions);
        console.log('Welcome email sent successfully to:', email);
      } else {
        console.log('EMAIL_USER/EMAIL_PASS not configured; skipping welcome email.');
      }
    } catch (emailError) {
      console.log('Failed to send welcome email (continuing with registration):', emailError.message);
      // Don't throw error - registration should succeed even if email fails
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        address: user.address || '',
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// Login user
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    console.log("Email received:", email);
    console.log("User found:", user);
    if (user) {
      console.log("Plain password:", password);
      console.log("Hashed password in DB:", user.password);
    }

    if (!user) {
      console.log("User not found for email:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log(
      "Login attempt for:",
      email,
      "Password valid:",
      isPasswordValid
    );

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const role = user.role;

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        address: user.address || '',
        role: user.role,
      },
      role,
      redirectTo:
        role === "admin" ? "/admin-dashboard/home" : "/customer-dashboard",
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

module.exports = { registerUser, loginUser };
