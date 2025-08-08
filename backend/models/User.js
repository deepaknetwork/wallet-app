const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  picture: {
    type: String
  },
  password: {
    type: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationOTP: {
    type: String
  },
  otpExpires: {
    type: Date
  },
  authMethod: {
    type: String,
    enum: ['google', 'email', 'both'],
    default: 'email'
  },
  // Wallet data
  walletData: {
    onlineBalance: {
      type: Number,
      default: 0
    },
    offlineBalance: {
      type: Number,
      default: 0
    },
    onlineSpent: {
      type: Number,
      default: 0
    },
    offlineSpent: {
      type: Number,
      default: 0
    },
    saving: {
      type: Number,
      default: 0
    },
    transactions: {
      type: Array,
      default: []
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema); 