const { google } = require('googleapis');
require('dotenv').config();

// This script helps you get the Gmail refresh token
async function getGmailRefreshToken() {
  const OAuth2 = google.auth.OAuth2;
  
  const oauth2Client = new OAuth2(
    process.env.OAUTH_GOOGLE_CLIENT_ID,
    process.env.OAUTH_GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );

  // Step 1: Get authorization URL
  const scopes = ['https://mail.google.com/'];
  
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });

  console.log('\n=== GMAIL REFRESH TOKEN SETUP ===\n');
  console.log('1. Open this URL in your browser:');
  console.log(authUrl);
  console.log('\n2. Complete the authorization');
  console.log('3. Copy the authorization code from the URL');
  console.log('4. Run: node getRefreshToken.js [AUTHORIZATION_CODE]');
  console.log('\nExample: node getRefreshToken.js 4/0AfJohXl...');
}

// Step 2: Exchange authorization code for refresh token
async function exchangeCodeForToken(authorizationCode) {
  const OAuth2 = google.auth.OAuth2;
  
  const oauth2Client = new OAuth2(
    process.env.OAUTH_GOOGLE_CLIENT_ID,
    process.env.OAUTH_GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );

  try {
    const { tokens } = await oauth2Client.getToken(authorizationCode);
    
    console.log('\n=== SUCCESS! ===\n');
    console.log('Add this to your .env file:');
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('\nYour complete .env configuration:');
    console.log(`GMAIL_USER=${process.env.GMAIL_USER}`);
    console.log(`OAUTH_GOOGLE_CLIENT_ID=${process.env.OAUTH_GOOGLE_CLIENT_ID}`);
    console.log(`OAUTH_GOOGLE_CLIENT_SECRET=${process.env.OAUTH_GOOGLE_CLIENT_SECRET}`);
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
    
  } catch (error) {
    console.error('Error exchanging code for tokens:', error.message);
    console.log('\nMake sure:');
    console.log('1. The authorization code is correct');
    console.log('2. You completed the OAuth flow in the browser');
    console.log('3. Your OAuth credentials are valid');
  }
}

// Run the appropriate function based on arguments
const authCode = process.argv[2];

if (authCode) {
  exchangeCodeForToken(authCode);
} else {
  getGmailRefreshToken();
}

module.exports = { getGmailRefreshToken, exchangeCodeForToken }; 