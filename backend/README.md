# Wallet Backend

This is the backend Express.js application for the Dark Wallet project with Google OAuth authentication.

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Variables
Create a `.env` file in the backend directory and add the following variables:

```
MONGO_URL=your_mongodb_connection_string_here
OAUTH_GOOGLE_CLIENT_ID=your_google_client_id_here
OAUTH_GOOGLE_CLIENT_SECRET=your_google_client_secret_here
SESSION_SECRET=your_session_secret_here
PORT=5000
```

### 3. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5000/auth/google/callback`
6. Copy the Client ID and Client Secret to your `.env` file

### 4. MongoDB Setup
1. Create a MongoDB database (you can use [MongoDB Atlas](https://cloud.mongodb.com/) for a free cloud database)
2. Copy the connection string to your `.env` file as `MONGO_URL`

### 5. Run the Application
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication Routes
- `GET /auth/google` - Initiate Google OAuth login
- `GET /auth/google/callback` - Google OAuth callback
- `POST /auth/logout` - Logout user
- `GET /auth/user` - Get current user information
- `GET /auth/status` - Check authentication status

### Features
- Google OAuth 2.0 authentication
- User data stored in MongoDB
- Session management
- CORS enabled for frontend integration
- Automatic user creation and login tracking

## Database Schema

### User Collection
```javascript
{
  googleId: String (required, unique),
  email: String (required, unique),
  name: String (required),
  picture: String,
  createdAt: Date (default: now),
  lastLogin: Date (default: now)
}
``` 