const express = require('express');
const Booking = require('../models/Booking');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');

const router = express.Router();

console.log('📦 Bookings routes loaded');

// Create booking
router.post('/', auth, async (req, res) => {
  console.log('📝 Create booking request:', { 
    buyer: req.user._id, 
    product: req.body.productId 
  });
  
  try {
    const { productId, phone, meetingLocation } = req.body;

    console.log('🔍 Finding product:', productId);
    const product = await Product.findById(productId).populate('seller');
    
    if (!product) {
      console.log('❌ Product not found for booking');
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.isSold) {
      console.log('❌ Product already sold');
      return res.status(400).json({ message: 'Product already sold' });
    }

    console.log('📦 Creating new booking...');
    const booking = new Booking({
      product: productId,
      buyer: req.user._id,
      seller: product.seller._id,
      phone,
      meetingLocation,
      price: product.resalePrice
    });

    await booking.save();
    await booking.populate('product buyer seller');

    console.log('✅ Booking created successfully:', { 
      id: booking._id, 
      product: booking.product.name,
      price: booking.price 
    });
    
    res.status(201).json(booking);
  } catch (error) {
    console.error('❌ Create booking error:', error.message);
    res.status(400).json({ message: error.message });
  }
});

// Get user's bookings
router.get('/my-bookings', auth, async (req, res) => {
  console.log('📋 Get user bookings request:', req.user._id);
  
  try {
    const bookings = await Booking.find({ buyer: req.user._id })
      .populate('product')
      .populate('seller', 'name email phone')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${bookings.length} bookings for user: ${req.user._id}`);
    
    res.json(bookings);
  } catch (error) {
    console.error('❌ Get bookings error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// Update booking status (for payment)
router.patch('/:id/status', auth, async (req, res) => {
  console.log('🔄 Update booking status request:', { 
    bookingId: req.params.id, 
    status: req.body.status 
  });
  
  try {
    const { status, transactionId } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status, transactionId },
      { new: true }
    ).populate('product buyer seller');

    if (status === 'paid') {
      console.log('💰 Marking product as sold:', booking.product._id);
      await Product.findByIdAndUpdate(booking.product._id, { isSold: true });
    }

    console.log('✅ Booking status updated:', { 
      id: booking._id, 
      status: booking.status 
    });
    
    res.json(booking);
  } catch (error) {
    console.error('❌ Update booking status error:', error.message);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;