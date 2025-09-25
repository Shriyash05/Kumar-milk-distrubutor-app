const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');

const defaultProducts = [
  {
    name: 'Full Cream Milk 1L',
    brand: 'Amul',
    description: 'Rich and creamy whole milk with high fat content',
    price: 60,
    pricePerCrate: 720,
    packSize: 12,
    unit: 'piece',
    category: 'milk',
    available: true,
    isActive: true,
    stockQuantity: 100,
    minStockLevel: 20,
    nutritionalInfo: {
      fat: 6.0,
      protein: 3.2,
      carbohydrates: 4.7,
      calories: 67
    }
  },
  {
    name: 'Toned Milk 1L',
    brand: 'Amul',
    description: 'Reduced fat milk with great taste and nutrition',
    price: 50,
    pricePerCrate: 600,
    packSize: 12,
    unit: 'piece',
    category: 'milk',
    available: true,
    isActive: true,
    stockQuantity: 150,
    minStockLevel: 30,
    nutritionalInfo: {
      fat: 3.0,
      protein: 3.2,
      carbohydrates: 4.7,
      calories: 48
    }
  },
  {
    name: 'Buffalo Milk 1L',
    brand: 'Gokul',
    description: 'Pure buffalo milk with high fat content and rich taste',
    price: 70,
    pricePerCrate: 840,
    packSize: 12,
    unit: 'piece',
    category: 'milk',
    available: true,
    isActive: true,
    stockQuantity: 80,
    minStockLevel: 15,
    nutritionalInfo: {
      fat: 7.5,
      protein: 4.3,
      carbohydrates: 5.2,
      calories: 100
    }
  },
  {
    name: 'Cow Milk 1L',
    brand: 'Gokul',
    description: 'Fresh and pure cow milk for daily consumption',
    price: 55,
    pricePerCrate: 660,
    packSize: 12,
    unit: 'piece',
    category: 'milk',
    available: true,
    isActive: true,
    stockQuantity: 120,
    minStockLevel: 25,
    nutritionalInfo: {
      fat: 4.5,
      protein: 3.4,
      carbohydrates: 4.8,
      calories: 62
    }
  },
  {
    name: 'Organic Milk 1L',
    brand: 'Mahananda',
    description: 'Certified organic milk from grass-fed cows',
    price: 80,
    pricePerCrate: 960,
    packSize: 12,
    unit: 'piece',
    category: 'milk',
    available: true,
    isActive: true,
    stockQuantity: 60,
    minStockLevel: 12,
    nutritionalInfo: {
      fat: 5.0,
      protein: 3.5,
      carbohydrates: 4.5,
      calories: 65
    }
  },
  {
    name: 'Gold Milk 1L',
    brand: 'Amul',
    description: 'Premium quality standardised milk',
    price: 65,
    pricePerCrate: 780,
    packSize: 12,
    unit: 'piece',
    category: 'milk',
    available: true,
    isActive: true,
    stockQuantity: 90,
    minStockLevel: 18,
    nutritionalInfo: {
      fat: 4.5,
      protein: 3.5,
      carbohydrates: 4.7,
      calories: 66
    }
  }
];

const initializeProducts = async () => {
  try {
    console.log('🥛 Initializing products in database...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database');
    
    // Find admin user for createdBy field
    const adminUser = await User.findOne({ email: process.env.ADMIN_EMAIL });
    const createdById = adminUser ? adminUser._id : null;
    
    // Check if products already exist
    const existingProductsCount = await Product.countDocuments();
    
    if (existingProductsCount > 0) {
      console.log(`ℹ️  Found ${existingProductsCount} existing products in database`);
      
      // List existing products
      const existingProducts = await Product.find({});
      console.log('\n📋 Current products in database:');
      existingProducts.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name} (${product.brand}) - ₹${product.price} - Stock: ${product.stockQuantity}`);
      });
      
      console.log('\n🔄 Do you want to update products? (This will replace existing ones)');
      return;
    }
    
    // Add createdBy to each product if admin user found
    const productsToInsert = defaultProducts.map(product => ({
      ...product,
      ...(createdById && { createdBy: createdById })
    }));
    
    // Insert products
    const insertedProducts = await Product.insertMany(productsToInsert);
    
    console.log(`✅ Successfully inserted ${insertedProducts.length} products into database:`);
    
    insertedProducts.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.name} (${product.brand}) - ₹${product.price}`);
      console.log(`     Stock: ${product.stockQuantity}, Crate Price: ₹${product.pricePerCrate}`);
    });
    
    console.log('\n📊 Product Summary:');
    const brands = [...new Set(insertedProducts.map(p => p.brand))];
    brands.forEach(brand => {
      const brandProducts = insertedProducts.filter(p => p.brand === brand);
      console.log(`  ${brand}: ${brandProducts.length} products`);
    });
    
    console.log('\n💰 Price Range:');
    const prices = insertedProducts.map(p => p.price);
    console.log(`  Min: ₹${Math.min(...prices)} | Max: ₹${Math.max(...prices)}`);
    
  } catch (error) {
    console.error('❌ Error initializing products:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔐 Database connection closed');
  }
};

initializeProducts();