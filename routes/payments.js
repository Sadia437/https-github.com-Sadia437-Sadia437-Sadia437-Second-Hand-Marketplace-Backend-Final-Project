const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/Booking');
const { auth } = require('../middleware/auth');

const router = express.Router();

console.log('💳 Payments routes loaded');

// @route    POST /api/payments/create-payment-intent
router.post('/create-payment-intent', auth, async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.price * 100), 
      currency: 'usd',
      metadata: {
        bookingId: booking._id.toString(),
        userId: req.user._id.toString()
      },
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('❌ Stripe Error:', error.message);
    res.status(400).json({ message: error.message });
  }
});

// @route    POST /api/payments/confirm

router.post('/confirm', auth, async (req, res) => {
  try {
    const { transactionId, bookingId, email } = req.body;

    
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { 
        paid: true, 
        transactionId: transactionId,
        status: 'sold' 
      },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: 'Booking update failed' });
    }

  

    res.json({ success: true, booking });
  } catch (error) {
    console.error('❌ Payment Confirm Error:', error.message);
    res.status(500).json({ message: 'Internal server error during confirmation' });
  }
});

module.exports = router;