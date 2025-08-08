const nodemailer = require('nodemailer');
const { google } = require('googleapis');

// Gmail OAuth2 configuration using existing Google OAuth credentials
const createTransporter = async () => {
  try {
    // Check if we have the required environment variables
    if (!process.env.GMAIL_USER) {
      throw new Error('GMAIL_USER environment variable is required');
    }

    // Try OAuth if credentials are available
    if (process.env.OAUTH_GOOGLE_CLIENT_ID && process.env.OAUTH_GOOGLE_CLIENT_SECRET) {
      
      // First, try with refresh token if available
      if (process.env.GMAIL_REFRESH_TOKEN) {
        try {
          const OAuth2 = google.auth.OAuth2;
          
          const oauth2Client = new OAuth2(
            process.env.OAUTH_GOOGLE_CLIENT_ID,
            process.env.OAUTH_GOOGLE_CLIENT_SECRET,
            "https://developers.google.com/oauthplayground"
          );

          oauth2Client.setCredentials({
            refresh_token: process.env.GMAIL_REFRESH_TOKEN
          });

          const accessToken = await oauth2Client.getAccessToken();

          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              type: 'OAuth2',
              user: process.env.GMAIL_USER,
              clientId: process.env.OAUTH_GOOGLE_CLIENT_ID,
              clientSecret: process.env.OAUTH_GOOGLE_CLIENT_SECRET,
              refreshToken: process.env.GMAIL_REFRESH_TOKEN,
              accessToken: accessToken.token
            }
          });

          return transporter;
        } catch (error) {
          console.error('OAuth with refresh token failed:', error.message);
        }
      }
      
      // If no refresh token or it failed, try direct OAuth
      console.log('Attempting direct OAuth setup for Gmail...');
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: process.env.GMAIL_USER,
          clientId: process.env.OAUTH_GOOGLE_CLIENT_ID,
          clientSecret: process.env.OAUTH_GOOGLE_CLIENT_SECRET
        }
      });

      return transporter;
    } else {
      throw new Error('OAuth credentials not available, falling back to app password');
    }
  } catch (error) {
    console.error('OAuth email setup failed:', error.message);
    
    // Fallback to app password method
    if (!process.env.GMAIL_APP_PASSWORD) {
      throw new Error('Neither OAuth nor App Password is configured for Gmail');
    }

    console.log('Using Gmail App Password as fallback');
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
  }
};

const sendOTPEmail = async (email, otp, name = 'User') => {
  try {
    const transporter = await createTransporter();
    
    const mailOptions = {
      from: `"Dark Wallet" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Dark Wallet - Email Verification Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4285f4; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #4285f4; text-align: center; margin: 20px 0; letter-spacing: 3px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Dark Wallet</h1>
              <p>Email Verification</p>
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              <p>Thank you for signing up with Dark Wallet. Please use the verification code below to complete your registration:</p>
              
              <div class="otp-code">${otp}</div>
              
              <p><strong>This code will expire in 10 minutes.</strong></p>
              
              <p>If you didn't request this verification, please ignore this email.</p>
              
              <p>Best regards,<br>Dark Wallet Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  createTransporter,
  sendOTPEmail
}; 