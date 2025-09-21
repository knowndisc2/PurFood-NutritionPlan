# 🔥 Firebase Production Setup for GitHub Pages

## Required Firebase Configuration Updates

### 1. Add GitHub Pages Domain to Firebase Auth

Go to **Firebase Console** → **Authentication** → **Settings** → **Authorized domains**

Add these domains:
- `knowndisc2.github.io` (your GitHub Pages domain)
- `localhost` (for local development)

### 2. Update Firestore Security Rules

Your current rules should work, but here's the complete setup:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own meal history
    match /users/{userId}/mealHistory/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read/write their own logged meals
    match /users/{userId}/loggedMeals/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow users to read/write their own user profile and settings
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 3. Firebase Hosting (Alternative to GitHub Pages)

If you want to use Firebase Hosting instead of GitHub Pages:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase Hosting
firebase init hosting

# Build and deploy
npm run build
firebase deploy
```

### 4. Environment Variables for GitHub Secrets

Set these in your GitHub repository (Settings → Secrets and variables → Actions):

| Secret Name | Value from Firebase Console |
|-------------|----------------------------|
| `REACT_APP_FIREBASE_API_KEY` | Your API Key |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | `general-nutrition-manager.firebaseapp.com` |
| `REACT_APP_FIREBASE_PROJECT_ID` | `general-nutrition-manager` |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | `general-nutrition-manager.appspot.com` |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | Your Sender ID |
| `REACT_APP_FIREBASE_APP_ID` | Your App ID |
| `REACT_APP_FIREBASE_MEASUREMENT_ID` | Your Measurement ID |

### 5. Backend Migration Options

Since GitHub Pages only serves static files, you'll need to migrate your backend:

#### Option A: Firebase Cloud Functions (Recommended)
```bash
# Install Firebase Functions
npm install -g firebase-tools
firebase init functions

# Move your server logic to functions/index.js
# Deploy functions
firebase deploy --only functions
```

#### Option B: Vercel (Easy deployment)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy backend to Vercel
cd server
vercel

# Update REACT_APP_API_BASE_URL to your Vercel URL
```

#### Option C: Railway (Full-stack deployment)
```bash
# Connect your GitHub repo to Railway
# Deploy both frontend and backend together
```

### 6. Testing Production Build Locally

```bash
# Build the production version
npm run build

# Serve it locally to test
npx serve -s build -l 3000

# Test at http://localhost:3000
```

### 7. Deployment Checklist

- [ ] Firebase Auth domains updated
- [ ] Firestore rules published
- [ ] GitHub Secrets configured
- [ ] Package.json homepage set
- [ ] Build completes without errors
- [ ] Authentication works in production
- [ ] Firestore operations work
- [ ] All features tested

### 8. Post-Deployment Verification

1. **Visit your app**: https://knowndisc2.github.io/PurFood-NutritionPlan
2. **Test authentication**: Sign in with Google
3. **Test Firestore**: Generate meal plans, check settings
4. **Check console**: No errors in browser dev tools
5. **Mobile test**: Verify responsive design works

### 🚨 Common Issues & Solutions

#### "Auth domain not authorized"
- Add your GitHub Pages domain to Firebase Auth authorized domains

#### "Firestore permission denied"
- Check that your rules are published
- Verify user is signed in before Firestore operations

#### "Build fails in GitHub Actions"
- Check all environment variables are set as GitHub Secrets
- Verify secret names match exactly (case-sensitive)

#### "App loads but features don't work"
- Check browser console for errors
- Verify Firebase configuration is correct
- Test authentication flow

---

Your production app will be available at:
**https://knowndisc2.github.io/PurFood-NutritionPlan**
