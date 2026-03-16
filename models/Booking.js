const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  meetingLocation: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'completed', 'cancelled'],
    default: 'pending'
  },
  transactionId: String
}, {
  timestamps: true
});

// Log on booking creation
bookingSchema.post('save', function(doc) {
  console.log('📦 Booking created:', {
    id: doc._id,
    product: doc.product,
    buyer: doc.buyer,
    status: doc.status,
    price: doc.price
  });
});

module.exports = mongoose.model('Booking', bookingSchema);