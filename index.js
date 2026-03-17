const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// --- CORS Configuration (Simplest & Most Reliable Version) ---
app.use(cors({
  // origin: true দেওয়ার মানে হলো রিকোয়েস্ট যে ডোমেইন থেকেই আসুক, সার্ভার তাকে গ্রহণ করবে
  origin: true, 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// MongoDB connection
const uri = process.env.MONGODB_URI;
if (!uri) {
    console.error('❌ MONGODB_URI is missing in .env file!');
    process.exit(1);
}

mongoose.connect(uri)
  .then(() => console.log('✅ MongoDB database connection established successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
const usersRouter = require('./routes/users');
const productsRouter = require('./routes/products');
const bookingsRouter = require('./routes/bookings');
const paymentsRouter = require('./routes/payments');

app.use('/api/users', usersRouter);
app.use('/api/products', productsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/payments', paymentsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Root
app.get('/', (req, res) => {
  res.json({
    message: 'Secondhand-Marketplace Server is running! 🚀',
    version: '1.0.0'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found', path: req.originalUrl });
});

// Global Error middleware
app.use((error, req, res, next) => {
  console.error('💥 Unhandled Error:', error);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

app.listen(port, () => {
  console.log(`🎉 Server running on port: ${port}`);
});