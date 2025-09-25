const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const generateAdminToken = async () => {
  try {
    console.log('🔑 Generating admin token...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database');
    
    const adminEmail = process.env.ADMIN_EMAIL;
    
    // Find admin user
    const adminUser = await User.findOne({ email: adminEmail });
    
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('✅ Admin user found:', adminUser.name, adminUser.email);
    
    // Generate JWT token
    const payload = {
      userId: adminUser._id,
      email: adminUser.email,
      role: adminUser.role
    };
    
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '30d' // Long expiry for testing
    });
    
    console.log('\n🎟️  Admin JWT Token:');
    console.log('Bearer', token);
    
    console.log('\n📋 Token payload:', payload);
    
    console.log('\n🛠️  Usage:');
    console.log('Add this header to your requests:');
    console.log(`Authorization: Bearer ${token}`);
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('\n✅ Token verification successful:', decoded);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔐 Database connection closed');
  }
};

generateAdminToken();