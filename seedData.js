const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/secondhand-market';

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🔗 Connected to MongoDB for seeding...');

    await User.deleteMany({});
    await Product.deleteMany({});
    console.log('🗑️ Existing data cleared.');

    const sampleUsers = [
      { name: 'Admin', email: 'admin@gmail.com', password: 'password123', role: 'admin', isVerified: true, authMethod: 'local' },
      { name: 'John Seller', email: 'john@gmail.com', password: 'password123', role: 'seller', isVerified: true, authMethod: 'local' },
      { name: 'Karim Wood', email: 'karim@gmail.com', password: 'password123', role: 'seller', isVerified: true, authMethod: 'local' },
      { name: 'Sadia Mim', email: 'sadiamim@gmail.com', password: 'password123', role: 'seller', isVerified: true, authMethod: 'local' },
      { name: 'Rahat Khan', email: 'rahat@gmail.com', password: 'password123', role: 'seller', isVerified: true, authMethod: 'local' }
    ];

    
    const createdUsers = await User.create(sampleUsers);
    console.log('👥 Users created with hashed passwords.');

    const sellers = createdUsers.filter(u => u.role === 'seller' || u.role === 'admin');

    const categories = [
      { id: 'electronics', keywords: ['phone', 'laptop', 'camera', 'tablet', 'watch'] },
      { id: 'furniture', keywords: ['sofa', 'table', 'chair', 'bed', 'closet'] },
      { id: 'vehicles', keywords: ['car', 'bike', 'motorcycle', 'scooter'] },
      { id: 'property', keywords: ['apartment', 'flat', 'land', 'office'] }
    ];

    const products = [];

    for (let i = 1; i <= 50; i++) {
      const cat = categories[Math.floor(Math.random() * categories.length)];
      const keyword = cat.keywords[Math.floor(Math.random() * cat.keywords.length)];
      const randomSeller = sellers[Math.floor(Math.random() * sellers.length)];
      
      products.push({
        name: `Used ${keyword.charAt(0).toUpperCase() + keyword.slice(1)} - Item ${i}`,
        description: `This is a high quality second-hand ${keyword} in excellent condition. Looking for an urgent buyer.`,
        image: `https://loremflickr.com/800/600/${keyword}?lock=${i}`, 
        category: cat.id,
        originalPrice: Math.floor(Math.random() * 60000) + 20000,
        resalePrice: Math.floor(Math.random() * 15000) + 3000,
        yearsOfUse: Math.floor(Math.random() * 3) + 1,
        condition: i % 2 === 0 ? 'excellent' : 'good',
        location: i % 2 === 0 ? 'Dhaka' : 'Chittagong',
        seller: randomSeller._id,
        isSold: false,
        postedTime: new Date()
      });
    }

    await Product.insertMany(products);
    console.log('🎉 Seeding Successful!');

  } catch (error) {
    console.error('❌ এরর:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedDatabase();