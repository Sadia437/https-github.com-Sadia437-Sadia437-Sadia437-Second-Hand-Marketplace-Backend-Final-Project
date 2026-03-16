const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: ['electronics', 'furniture', 'vehicles', 'property', 'fashion', 'sports']
  },
  originalPrice: { type: Number, required: true },
  resalePrice: { type: Number, required: true },
  yearsOfUse: { type: Number, required: true },
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'good'
  },
  location: { type: String, required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isSold: { type: Boolean, default: false },
  postedTime: { type: Date, default: Date.now }
}, { timestamps: true });

// Log on creation
productSchema.post('save', function(doc) {
  console.log('🛍️ Product created:', {
    id: doc._id,
    name: doc.name,
    category: doc.category,
    price: doc.resalePrice,
    seller: doc.seller
  });
});

module.exports = mongoose.model('Product', productSchema);