const mongoose = require('mongoose');
require('dotenv').config();

// Test MongoDB connection
const testConnection = async () => {
  try {
    console.log('🔗 Testing MongoDB connection...');
    console.log('🔧 MONGO_URI:', process.env.MONGO_URI);
    
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    console.log('✅ MongoDB Connected Successfully!');
    console.log('🌐 Host:', conn.connection.host);
    console.log('📂 Database Name:', conn.connection.name);
    console.log('🔌 Connection State:', conn.connection.readyState === 1 ? 'Connected' : 'Disconnected');
    
    // List collections in the database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📋 Collections in database:');
    if (collections.length === 0) {
      console.log('   (No collections found - database is clean)');
    } else {
      collections.forEach(collection => {
        console.log(`   - ${collection.name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('📝 Database connection closed');
    process.exit(0);
  }
};

// Run the test
testConnection();