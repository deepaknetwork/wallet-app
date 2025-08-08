const express = require('express');
const passport = require('passport');
const router = express.Router();

// @desc    Auth with Google
// @route   GET /auth/google
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'] 
}));

// @desc    Google auth callback
// @route   GET /auth/google/callback
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:3000'}/#/` }),
  (req, res) => {
    // Successful authentication, redirect to frontend with success flag
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/#/login?auth=success`);
  }
);

// @desc    Logout user
// @route   POST /auth/logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// @desc    Get current user
// @route   GET /auth/user
router.get('/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        googleId: req.user.googleId,
        name: req.user.name,
        email: req.user.email,
        picture: req.user.picture,
        createdAt: req.user.createdAt,
        lastLogin: req.user.lastLogin
      }
    });
  } else {
    res.status(401).json({ success: false, message: 'Not authenticated' });
  }
});

// @desc    Check authentication status
// @route   GET /auth/status
router.get('/status', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ 
      isAuthenticated: true,
      user: {
        id: req.user._id,
        googleId: req.user.googleId,
        name: req.user.name,
        email: req.user.email,
        picture: req.user.picture,
        createdAt: req.user.createdAt,
        lastLogin: req.user.lastLogin
      }
    });
  } else {
    res.json({ 
      isAuthenticated: false,
      user: null
    });
  }
});

module.exports = router; 