const mongoose = require('mongoose');

// MongoDB connection
const mongoURI = 'mongodb+srv://shrimhatre00_db_user:Shriyash%233005@cluster0.ojkezkj.mongodb.net/milk-distributor?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Product Schema (same as in server)
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, default: 'Dairy' },
  image: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  costPrice: { type: Number, default: 0 },
  discountPrice: { type: Number, default: 0 },
  pricePerCrate: { type: Number, default: 0 },
  packSize: { type: Number, default: 12 },
  isActive: { type: Boolean, default: true },
  isInStock: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  available: { type: Boolean, default: true },
  stock: { type: Number, default: 100 },
  unit: { type: String, default: 'piece' },
  tags: { type: [String], default: [] },
}, {
  timestamps: true
});

const Product = mongoose.model('Product', ProductSchema);

// Real products from your price list
const products = [
  // Amul Products
  {
    name: "Amul Taaza 500ml",
    brand: "Amul",
    description: "Fresh toned milk in 500ml pack",
    price: 26.39, // Price per piece (633.24/24)
    pricePerCrate: 633.24,
    packSize: 24,
    category: "Dairy",
    available: true,
    stock: 100
  },
  {
    name: "Amul Taaza 1L",
    brand: "Amul", 
    description: "Fresh toned milk in 1L pack",
    price: 51.72, // Price per piece (620.64/12)
    pricePerCrate: 620.64,
    packSize: 12,
    category: "Dairy",
    available: true,
    stock: 100
  },
  {
    name: "Amul Buffalo Milk 500ml",
    brand: "Amul",
    description: "Buffalo milk in 500ml pack",
    price: 33.85, // Price per piece (812.40/24)
    pricePerCrate: 812.40,
    packSize: 24,
    category: "Dairy",
    available: true,
    stock: 100
  },
  {
    name: "Amul Cow Milk 500ml",
    brand: "Amul",
    description: "Pure cow milk in 500ml pack",
    price: 26.13, // Price per piece (627.00/24)
    pricePerCrate: 627.00,
    packSize: 24,
    category: "Dairy",
    available: true,
    stock: 100
  },
  {
    name: "Amul T-Special 500ml",
    brand: "Amul",
    description: "T-Special milk in 500ml pack",
    price: 26.39, // Price per piece (633.24/24)
    pricePerCrate: 633.24,
    packSize: 24,
    category: "Dairy",
    available: true,
    stock: 100
  },
  
  // Gokul Products
  {
    name: "Full Cream Milk 1L Pouch",
    brand: "Gokul",
    description: "Full cream milk in 1L pouch",
    price: 72.00, // Assuming single piece price
    pricePerCrate: 864.00, // Estimated for 12 pack
    packSize: 12,
    category: "Dairy",
    available: true,
    stock: 100
  },
  {
    name: "Buffalo Milk 500ml Pouch",
    brand: "Gokul",
    description: "Buffalo milk in 500ml pouch",
    price: 36.00, // Assuming single piece price
    pricePerCrate: 432.00, // Estimated for 12 pack
    packSize: 12,
    category: "Dairy",
    available: true,
    stock: 100
  },
  {
    name: "Cow Milk Satvik 500ml",
    brand: "Gokul",
    description: "Satvik cow milk in 500ml pack",
    price: 36.00, // Assuming single piece price
    pricePerCrate: 432.00, // Estimated for 12 pack
    packSize: 12,
    category: "Dairy",
    available: true,
    stock: 100
  },
  
  // Mahanand Products
  {
    name: "Annapurna Toned Milk 1L",
    brand: "Mahanand",
    description: "Annapurna toned milk in 1L pack",
    price: 56.00, // Assuming single piece price
    pricePerCrate: 672.00, // Estimated for 12 pack
    packSize: 12,
    category: "Dairy",
    available: true,
    stock: 100
  },
  {
    name: "Toned Milk 1L",
    brand: "Mahanand",
    description: "Toned milk in 1L pack",
    price: 55.00, // Assuming single piece price
    pricePerCrate: 660.00, // Estimated for 12 pack
    packSize: 12,
    category: "Dairy",
    available: true,
    stock: 100
  },
  {
    name: "Cow Milk 1L",
    brand: "Mahanand",
    description: "Pure cow milk in 1L pack",
    price: 57.00, // Assuming single piece price
    pricePerCrate: 684.00, // Estimated for 12 pack
    packSize: 12,
    category: "Dairy",
    available: true,
    stock: 100
  }
];

async function addProducts() {
  try {
    console.log('Connected to MongoDB');
    
    // Clear existing products (optional - remove this if you want to keep existing products)
    // await Product.deleteMany({});
    // console.log('Cleared existing products');
    
    // Add new products
    const result = await Product.insertMany(products);
    console.log(`Successfully added ${result.length} products:`);
    
    result.forEach(product => {
      console.log(`- ${product.name} (${product.brand}) - ₹${product.price}/piece, ₹${product.pricePerCrate}/${product.packSize}pack`);
    });
    
    mongoose.connection.close();
    console.log('\nDatabase connection closed');
    
  } catch (error) {
    console.error('Error adding products:', error);
    mongoose.connection.close();
  }
}

// Run the function
addProducts();