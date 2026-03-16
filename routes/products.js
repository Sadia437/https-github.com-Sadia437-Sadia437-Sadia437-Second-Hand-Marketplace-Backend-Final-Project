const express = require('express');
const Product = require('../models/Product');
const router = express.Router();

// Get products with search, category, pagination
router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 50 } = req.query;

    let query = { isSold: false };
    if (category && category !== 'all') query.category = category;
    if (search) query.name = { $regex: search, $options: 'i' };

    const products = await Product.find(query)
      .populate('seller', 'name isVerified')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('❌ GET /api/products error:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

module.exports = router;