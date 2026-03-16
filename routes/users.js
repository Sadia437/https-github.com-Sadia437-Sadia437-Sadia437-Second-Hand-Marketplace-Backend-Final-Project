const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// JWT Generator Function
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', { 
    expiresIn: '30d' 
  });
};



// @route    POST /api/users/register
router.post('/register', async (req, res) => {
  try {
    const { email } = req.body;
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
        ...req.body,
        authMethod: 'local'
    });
    
    const token = generateToken(user._id);
    res.status(201).json({ user: user.toProfileJSON(), token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route    POST /api/users/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !(await user.correctPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);
    res.json({ user: user.toProfileJSON(), token });
  } catch (error) {
    res.status(500).json({ message: 'Login error' });
  }
});

// @route    POST /api/users/google-login
router.post('/google-login', async (req, res) => {
  try {
    const { name, email, photoURL, googleId } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOrCreateGoogleUser({
      googleId,
      email: email.toLowerCase(),
      name,
      photoURL
    });

    const token = generateToken(user._id);
    res.json({ user: user.toProfileJSON(), token });
  } catch (error) {
    res.status(500).json({ message: 'Google login server error', error: error.message });
  }
});


// @route    GET /api/users/sellers 
router.get('/sellers', async (req, res) => {
  try {
    const { search } = req.query;
    let query = { role: 'seller' };

    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const sellers = await User.find(query).select('-password');
    res.json(sellers);
  } catch (error) {
    console.error('❌ Error fetching sellers:', error);
    res.status(500).json({ message: 'Error fetching sellers data' });
  }
});

// @route    GET /api/users/me 
router.get('/me', auth, async (req, res) => {
  try {
    res.json(req.user.toProfileJSON());
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

module.exports = router;