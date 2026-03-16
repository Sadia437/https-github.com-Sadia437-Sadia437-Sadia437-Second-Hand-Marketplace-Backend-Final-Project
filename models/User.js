const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: {
      validator: function(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Please provide a valid email'
    }
  },
  password: {
    type: String,
    required: function() {
      return this.authMethod === 'local';
    },
    minlength: [6, 'Password must be at least 6 characters'],
    select: false 
  },
  role: {
    type: String,
    enum: ['buyer', 'seller', 'admin'],
    default: 'buyer'
  },
  isVerified: {
    type: Boolean,
    default: function() {
      // Auto-verify Google users
      return this.authMethod === 'google';
    }
  },
  phone: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  // Google OAuth fields
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  authMethod: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  photoURL: {
    type: String,
    validate: {
      validator: function(url) {
        if (!url) return true; // Optional field
        return /^https?:\/\/.+\..+/.test(url);
      },
      message: 'Please provide a valid URL for photo'
    }
  },
  // Additional fields for better user management
  lastLogin: {
    type: Date,
    default: Date.now
  },
  loginCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'inactive'],
    default: 'active'
  },
  preferences: {
    notifications: {
      type: Boolean,
      default: true
    },
    emailUpdates: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for user's full profile URL
userSchema.virtual('profileImage').get(function() {
  return this.photoURL || `/api/users/${this._id}/avatar`;
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ role: 1, isVerified: 1 });
userSchema.index({ createdAt: 1 });

// Hash password before saving (only for local auth)
userSchema.pre('save', async function(next) {
  console.log('🔐 Pre-save hook for user:', this.email);
  
  // Only hash password if it's modified and user is using local auth
  if (!this.isModified('password') || this.authMethod !== 'local') {
    console.log('⏭️ Password not modified or not local auth, skipping hash');
    return next();
  }
  
  try {
    this.password = await bcrypt.hash(this.password, 12);
    console.log('✅ Password hashed successfully');
    next();
  } catch (error) {
    console.error('❌ Error hashing password:', error);
    next(error);
  }
});

// Update lastLogin and loginCount on login
userSchema.methods.updateLoginStats = function() {
  this.lastLogin = Date.now();
  this.loginCount += 1;
  return this.save();
};

// Compare password method (only for local auth)
userSchema.methods.correctPassword = async function(candidatePassword) {
  console.log('🔍 Comparing passwords for user:', this.email);
  
  if (this.authMethod !== 'local') {
    console.log('❌ Password login not allowed for Google auth users');
    return false;
  }
  
  if (!this.password) {
    console.log('❌ No password set for user');
    return false;
  }
  
  try {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log('🔐 Password match:', isMatch);
    
    if (isMatch) {
      await this.updateLoginStats();
    }
    
    return isMatch;
  } catch (error) {
    console.error('❌ Error comparing passwords:', error);
    return false;
  }
};

// Check if user can access dashboard
userSchema.methods.canAccessDashboard = function() {
  const canAccess = this.status === 'active' && 
                   (this.role === 'admin' || this.isVerified || this.role === 'buyer');
  
  console.log('🚪 Dashboard access check:', {
    user: this.email,
    role: this.role,
    isVerified: this.isVerified,
    status: this.status,
    canAccess: canAccess
  });
  
  return canAccess;
};

// Static method to find or create Google user
userSchema.statics.findOrCreateGoogleUser = async function(googleData) {
  const { googleId, email, name, photoURL } = googleData;
  
  console.log('🔍 Finding or creating Google user:', { email, googleId });
  
  try {
    // Try to find user by googleId first
    let user = await this.findOne({ googleId });
    
    if (user) {
      console.log('✅ Found existing Google user:', user.email);
      await user.updateLoginStats();
      return user;
    }
    
    // Try to find user by email and link Google account
    user = await this.findOne({ email });
    
    if (user) {
      console.log('🔄 Linking Google account to existing user:', user.email);
      user.googleId = googleId;
      user.authMethod = 'google';
      user.photoURL = photoURL || user.photoURL;
      user.isVerified = true; // Auto-verify when linking Google
      await user.save();
      await user.updateLoginStats();
      return user;
    }
    
    // Create new Google user
    console.log('👤 Creating new Google user:', email);
    user = await this.create({
      googleId,
      email,
      name,
      authMethod: 'google',
      photoURL,
      isVerified: true,
      // Generate a random password that meets validation
      password: Math.random().toString(36).slice(-8) + 'A1!'
    });
    
    await user.updateLoginStats();
    return user;
  } catch (error) {
    console.error('❌ Error in findOrCreateGoogleUser:', error);
    throw error;
  }
};

// Instance method to get public profile
userSchema.methods.toProfileJSON = function() {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    isVerified: this.isVerified,
    authMethod: this.authMethod,
    photoURL: this.photoURL,
    phone: this.phone,
    location: this.location,
    lastLogin: this.lastLogin,
    status: this.status,
    preferences: this.preferences,
    createdAt: this.createdAt
  };
};

// Log on user creation
userSchema.post('save', function(doc) {
  console.log('👤 User saved:', {
    id: doc._id,
    email: doc.email,
    role: doc.role,
    authMethod: doc.authMethod,
    isVerified: doc.isVerified,
    status: doc.status
  });
});

// Log on user update
userSchema.post('findOneAndUpdate', function(doc) {
  if (doc) {
    console.log('✏️ User updated:', {
      id: doc._id,
      email: doc.email,
      role: doc.role,
      isVerified: doc.isVerified
    });
  }
});

module.exports = mongoose.model('User', userSchema);