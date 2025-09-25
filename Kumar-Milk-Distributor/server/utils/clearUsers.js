const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected for cleanup');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Clear all users
const clearAllUsers = async () => {
  try {
    await connectDB();
    
    // Count existing users
    const userCount = await User.countDocuments();
    console.log(`📊 Found ${userCount} users in database`);
    
    if (userCount === 0) {
      console.log('✅ Database is already clean - no users to remove');
      return;
    }
    
    // Delete all users
    const result = await User.deleteMany({});
    console.log(`🗑️ Deleted ${result.deletedCount} users from database`);
    console.log('✅ Database cleanup completed successfully');
    
  } catch (error) {
    console.error('❌ Error clearing users:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('📝 Database connection closed');
    process.exit(0);
  }
};

// Run the cleanup
clearAllUsers();