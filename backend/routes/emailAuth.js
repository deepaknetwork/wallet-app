const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const { sendOTPEmail } = require('../config/nodemailer');
const router = express.Router();

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Register with email/password
// @route   POST /auth/email/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // If user exists via Google OAuth, allow them to set password
      if (existingUser.authMethod === 'google' && !existingUser.password) {
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate OTP
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Update existing user with password and OTP
        existingUser.password = hashedPassword;
        existingUser.verificationOTP = otp;
        existingUser.otpExpires = otpExpires;
        existingUser.authMethod = 'both'; // Can use both methods
        existingUser.isVerified = false; // Need to verify email for password access

        await existingUser.save();

        // Send OTP email
        const emailResult = await sendOTPEmail(email, otp, existingUser.name);
        
        if (!emailResult.success) {
          return res.status(500).json({
            success: false,
            message: 'Failed to send verification email. Please try again.'
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Password added to your existing account. Please check your email for verification code.',
          userId: existingUser._id
        });
      } else {
        // User already has email/password account
        return res.status(400).json({
          success: false,
          message: 'Account with this email already exists. Please try logging in instead.'
        });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      verificationOTP: otp,
      otpExpires,
      authMethod: 'email',
      isVerified: false
    });

    await user.save();

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, name);
    
    if (!emailResult.success) {
      // If email fails, delete the user and return error
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again.'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for verification code.',
      userId: user._id
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @desc    Verify OTP
// @route   POST /auth/email/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and OTP'
      });
    }

    // Find user
    const user = await User.findOne({ 
      email,
      verificationOTP: otp,
      otpExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Verify user
    user.isVerified = true;
    user.verificationOTP = undefined;
    user.otpExpires = undefined;
    user.lastLogin = new Date();
    
    // If this was a Google user adding password, update auth method
    if (user.authMethod === 'google' && user.password) {
      user.authMethod = 'both';
    }
    
    await user.save();

    // Create session
    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Session creation failed'
        });
      }

      res.json({
        success: true,
        message: 'Email verified successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          picture: user.picture,
          isVerified: user.isVerified,
          authMethod: user.authMethod
        }
      });
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during verification'
    });
  }
});

// @desc    Login with email/password
// @route   POST /auth/email/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user (email or both auth methods)
    const user = await User.findOne({ 
      email, 
      authMethod: { $in: ['email', 'both'] },
      password: { $exists: true } // Must have password set
    });
    if (!user) {
      // Check if user exists with Google OAuth only
      const googleUser = await User.findOne({ email, authMethod: 'google' });
      if (googleUser) {
        return res.status(400).json({
          success: false,
          message: 'This email is registered with Google. Please sign in with Google or set up a password first.',
          suggestPasswordSetup: true
        });
      }
      
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your email first',
        needsVerification: true,
        userId: user._id
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Create session
    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Session creation failed'
        });
      }

      res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          picture: user.picture,
          isVerified: user.isVerified,
          authMethod: user.authMethod
        }
      });
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @desc    Resend OTP
// @route   POST /auth/email/resend-otp
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email'
      });
    }

    // Find unverified user (any auth method)
    const user = await User.findOne({ 
      email, 
      isVerified: false,
      verificationOTP: { $exists: true }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found or already verified'
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.verificationOTP = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, user.name);
    
    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again.'
      });
    }

    res.json({
      success: true,
      message: 'New verification code sent to your email'
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resending OTP'
    });
  }
});

module.exports = router; 