# Development Guide

## Running the Application

### Development Mode (Recommended)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual API keys and Firebase configuration
   ```

3. **Run both server and client together:**
   ```bash
   npm run dev:full
   ```
   This will start:
   - Express server on `http://localhost:4000`
   - React development server on `http://localhost:3000`

4. **Access the application:**
   - Open `http://localhost:3000` in your browser
   - API requests will be automatically proxied to the Express server

### Alternative: Run Separately

If you prefer to run them separately:

```bash
# Terminal 1: Start the Express server
npm run dev

# Terminal 2: Start the React client
npm run client
```

### Production Mode

1. **Build and start:**
   ```bash
   npm run start:prod
   ```
   This will:
   - Build the React app
   - Start the Express server serving the built React app
   - Everything runs on `http://localhost:4000`

## API Endpoints

All API endpoints are prefixed with `/api/`:

- `GET /api/health` - Health check
- `GET /api/fb/profile` - Get user profile (requires auth)
- `PUT /api/fb/profile` - Update user profile (requires auth)
- `GET /api/fb/meals` - Get user meals (requires auth)
- `POST /api/fb/meals` - Create new meal (requires auth)

## Troubleshooting

### "Unexpected content-type: text/html" Error

This error occurs when:
1. API requests are not being proxied correctly
2. The server is not running
3. Wrong URL is being used for API calls

**Solutions:**
1. Make sure both server and client are running
2. Verify the proxy configuration in `package.json`
3. Check that API calls use relative URLs (e.g., `/api/health` not `http://localhost:4000/api/health`)
4. Restart both server and client

### Port Conflicts

- Express server: `http://localhost:4000`
- React dev server: `http://localhost:3000`

If ports are in use, you can change them:
- Server port: Set `PORT=5000` in your `.env` file
- Client port: Set `PORT=3001` and run `npm run client`

### CORS Issues

The server is configured to allow all origins in development. If you still get CORS errors:
1. Make sure you're accessing the app via `http://localhost:3000`
2. Check that the proxy configuration is correct
3. Restart both servers

## Environment Variables

Required for development:
```env
PORT=4000
NODE_ENV=development
REACT_APP_FIREBASE_API_KEY=your_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain_here
# ... other Firebase config
```

See `.env.example` for the complete list.
