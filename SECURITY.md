# Security Guidelines

## Environment Variables Setup

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in your actual values:**
   - Replace `your_gemini_api_key_here` with your actual Gemini API key
   - Update JWT and cookie secrets with strong, unique values
   - Configure Firebase credentials (see below)

## Firebase Setup

### Client Configuration (Web App)
1. Go to Firebase Console → Project Settings → General → Your apps
2. Copy the Firebase configuration object
3. Add each configuration value to your `.env` file with `REACT_APP_` prefix:
   ```env
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

### Admin SDK Configuration (Server)

#### Option 1: Service Account File (Recommended)
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save the JSON file as `firebase-service-account.json` in your project root
4. Set `FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json` in your `.env`

#### Option 2: Environment Variable (Less Secure)
1. Copy the entire JSON content
2. Set `FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}` in your `.env`

## Security Best Practices

- **Never commit `.env` files to Git**
- **Rotate API keys regularly**
- **Use strong, unique secrets for JWT and cookies**
- **Revoke compromised credentials immediately**
- **Use environment-specific configurations**

## If Credentials Are Compromised

1. **Immediately revoke the compromised credentials:**
   - Firebase: Go to IAM & Admin → Service Accounts → Delete the compromised account
   - Gemini API: Go to Google AI Studio → API Keys → Revoke the key

2. **Generate new credentials**
3. **Update your `.env` file**
4. **Restart your application**

## Git Security

- Always check `git status` before committing
- Use `git diff --cached` to review staged changes
- Never force push to shared branches
- Use branch protection rules on important branches
