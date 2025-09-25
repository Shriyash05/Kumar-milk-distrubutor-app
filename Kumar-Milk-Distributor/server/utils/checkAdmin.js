const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const checkAndCreateAdmin = async () => {
  try {
    console.log('🔍 Checking admin user...');
    console.log('Environment ADMIN_EMAIL:', process.env.ADMIN_EMAIL);
    
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database');
    
    const adminEmail = process.env.ADMIN_EMAIL;
    
    if (!adminEmail) {
      console.log('❌ ADMIN_EMAIL not set in environment variables');
      return;
    }
    
    // Check if admin user exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('✅ Admin user found:');
      console.log('  - ID:', existingAdmin._id);
      console.log('  - Name:', existingAdmin.name);
      console.log('  - Email:', existingAdmin.email);
      console.log('  - Role:', existingAdmin.role);
      console.log('  - Created:', existingAdmin.createdAt);
    } else {
      console.log('❌ Admin user not found, creating one...');
      
      const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      const adminUser = new User({
        name: 'Admin User',
        email: adminEmail,
        password: hashedPassword,
        phone: '9999999999',
        address: 'Kumar Milk Distributors Office',
        role: 'admin',
        registrationDate: new Date(),
        registeredFrom: 'server-setup'
      });
      
      await adminUser.save();
      
      console.log('✅ Admin user created successfully:');
      console.log('  - Email:', adminEmail);
      console.log('  - Password:', adminPassword);
      console.log('  - Role: admin');
    }
    
    // List all users with admin role
    const allAdmins = await User.find({ role: 'admin' });
    console.log('\n📋 All admin users in database:');
    allAdmins.forEach((admin, index) => {
      console.log(`  ${index + 1}. ${admin.name} (${admin.email}) - ${admin.role}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔐 Database connection closed');
  }
};

checkAndCreateAdmin();