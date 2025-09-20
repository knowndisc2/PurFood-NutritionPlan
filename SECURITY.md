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

### Option 1: Service Account File (Recommended)
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save the JSON file as `firebase-service-account.json` in your project root
4. Set `FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json` in your `.env`

### Option 2: Environment Variable (Less Secure)
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
