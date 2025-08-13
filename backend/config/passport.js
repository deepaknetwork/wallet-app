const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

module.exports = function(passport) {
  passport.use(new GoogleStrategy({
    clientID: process.env.OAUTH_GOOGLE_CLIENT_ID,
    clientSecret: process.env.OAUTH_GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.SERVER_URL+"/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      
      // Check if user already exists by Google ID
      let existingUser = await User.findOne({ googleId: profile.id });
      
      if (existingUser) {
        // Update last login
        existingUser.lastLogin = new Date();
        await existingUser.save();
        return done(null, existingUser);
      }
      
      // Check if user exists with same email (email/password account)
      let emailUser = await User.findOne({ email });
      
      if (emailUser) {
        // Link Google account to existing email account
        emailUser.googleId = profile.id;
        emailUser.picture = emailUser.picture || profile.photos[0].value;
        emailUser.authMethod = 'both'; // Can use both methods
        emailUser.lastLogin = new Date();
        
        await emailUser.save();
        return done(null, emailUser);
      }
      
      // Create new user with Google OAuth
      const newUser = new User({
        googleId: profile.id,
        email: email,
        name: profile.displayName,
        picture: profile.photos[0].value,
        authMethod: 'google',
        isVerified: true // Google accounts are automatically verified
      });
      
      const savedUser = await newUser.save();
      return done(null, savedUser);
    } catch (error) {
      return done(error, null);
    }
  }));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
}; 