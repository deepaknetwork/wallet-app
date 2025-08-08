const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ success: false, message: 'Not authenticated' });
};

// @desc    Get user's wallet data
// @route   GET /wallet
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      walletData: user.walletData
    });
  } catch (error) {
    console.error('Error fetching wallet data:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Update user's wallet data
// @route   PUT /wallet
router.put('/', isAuthenticated, async (req, res) => {
  try {
    const { onlineBalance, offlineBalance, onlineSpent, offlineSpent, saving, transactions } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update wallet data
    user.walletData = {
      onlineBalance: onlineBalance || user.walletData.onlineBalance,
      offlineBalance: offlineBalance || user.walletData.offlineBalance,
      onlineSpent: onlineSpent || user.walletData.onlineSpent,
      offlineSpent: offlineSpent || user.walletData.offlineSpent,
      saving: saving || user.walletData.saving,
      transactions: transactions || user.walletData.transactions
    };

    await user.save();

    res.json({
      success: true,
      message: 'Wallet data updated successfully',
      walletData: user.walletData
    });
  } catch (error) {
    console.error('Error updating wallet data:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Add a transaction
// @route   POST /wallet/transaction
router.post('/transaction', isAuthenticated, async (req, res) => {
  try {
    const { item, price, medium, date, spent } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Add transaction to array
    const transaction = { item, price, medium, date, spent };
    user.walletData.transactions.push(transaction);

    // Update balances based on transaction
    if (spent === "true") {
      if (medium === "Online") {
        user.walletData.onlineBalance -= parseInt(price);
        user.walletData.onlineSpent += parseInt(price);
      } else if (medium === "Offline") {
        user.walletData.offlineBalance -= parseInt(price);
        user.walletData.offlineSpent += parseInt(price);
      }
    } else {
      if (medium === "Online") {
        user.walletData.onlineBalance += parseInt(price);
      } else if (medium === "Offline") {
        user.walletData.offlineBalance += parseInt(price);
      }
    }

    await user.save();

    res.json({
      success: true,
      message: 'Transaction added successfully',
      walletData: user.walletData
    });
  } catch (error) {
    console.error('Error adding transaction:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Sync wallet data from localStorage
// @route   POST /wallet/sync
router.post('/sync', isAuthenticated, async (req, res) => {
  try {
    const { walletData } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update all wallet data from localStorage
    user.walletData = {
      onlineBalance: walletData.onlineBalance || 0,
      offlineBalance: walletData.offlineBalance || 0,
      onlineSpent: walletData.onlineSpent || 0,
      offlineSpent: walletData.offlineSpent || 0,
      saving: walletData.saving || 0,
      transactions: walletData.transactions || []
    };

    await user.save();

    res.json({
      success: true,
      message: 'Wallet data synced successfully',
      walletData: user.walletData
    });
  } catch (error) {
    console.error('Error syncing wallet data:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router; 