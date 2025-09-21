# 🚀 Deployment Guide for PurFood Nutrition App

## GitHub Pages Deployment

### Prerequisites
1. **GitHub Repository**: Your code is already in `https://github.com/knowndisc2/PurFood-NutritionPlan`
2. **Firebase Project**: You have the "general-nutrition-manager" project set up
3. **Node.js**: Version 18+ installed locally

### 🔧 Setup Steps

#### 1. Install Dependencies
```bash
npm install
```

#### 2. Set Up GitHub Secrets
Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets with your Firebase values:
- `REACT_APP_FIREBASE_API_KEY`
- `REACT_APP_FIREBASE_AUTH_DOMAIN`
- `REACT_APP_FIREBASE_PROJECT_ID`
- `REACT_APP_FIREBASE_STORAGE_BUCKET`
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
- `REACT_APP_FIREBASE_APP_ID`
- `REACT_APP_FIREBASE_MEASUREMENT_ID`

#### 3. Enable GitHub Pages
1. Go to your repository → Settings → Pages
2. Source: "Deploy from a branch"
3. Branch: `gh-pages` (will be created automatically)
4. Folder: `/ (root)`

#### 4. Deploy Options

**Option A: Automatic Deployment (Recommended)**
- Push to `main` or `master` branch
- GitHub Actions will automatically build and deploy
- Check the Actions tab for deployment status

**Option B: Manual Deployment**
```bash
# Build the project
npm run build

# Deploy to GitHub Pages
npm run deploy
```

### 🌐 Your App URLs

- **Production**: https://knowndisc2.github.io/PurFood-NutritionPlan
- **Development**: http://localhost:3000 (React) + http://localhost:4000 (API)

### 📝 Important Notes

#### Backend Considerations
GitHub Pages only serves static files, so your Node.js backend won't run there. You have several options:

1. **Firebase Functions** (Recommended)
   - Move your API endpoints to Firebase Cloud Functions
   - Seamless integration with your existing Firebase setup

2. **Vercel/Netlify Functions**
   - Deploy serverless functions for your API endpoints

3. **Separate Backend Deployment**
   - Deploy backend to Railway, Render, or Heroku
   - Update `REACT_APP_API_BASE_URL` in production

#### Current Features That Work on GitHub Pages
✅ Firebase Authentication  
✅ Firestore database operations  
✅ Meal plan generation (using mock data)  
✅ Settings and user profiles  
✅ Meal history tracking  
✅ Calorie logging  

#### Features That Need Backend Migration
⚠️ Server-side meal plan generation (currently uses mock data)  
⚠️ Web scraping functionality  
⚠️ Gemini AI integration  

### 🔄 Development Workflow

1. **Local Development**
   ```bash
   npm run dev:full  # Runs both frontend and backend
   ```

2. **Test Production Build**
   ```bash
   npm run build
   npx serve -s build  # Test the production build locally
   ```

3. **Deploy**
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main  # Triggers automatic deployment
   ```

### 🐛 Troubleshooting

#### Build Fails
- Check that all environment variables are set in GitHub Secrets
- Ensure all dependencies are in `package.json`
- Check the Actions tab for detailed error logs

#### App Doesn't Load
- Verify the `homepage` URL in `package.json` matches your GitHub Pages URL
- Check browser console for errors
- Ensure Firebase configuration is correct

#### Authentication Issues
- Verify Firebase Auth domain includes your GitHub Pages URL
- Check Firestore security rules allow your domain

### 🚀 Next Steps

1. **Deploy the backend** to a serverless platform
2. **Enable real AI meal generation** by connecting to your deployed backend
3. **Add custom domain** (optional) by updating the CNAME in the workflow
4. **Set up monitoring** with Firebase Analytics

### 📞 Support

If you encounter issues:
1. Check the GitHub Actions logs
2. Verify all secrets are set correctly
3. Test the build locally first
4. Check Firebase console for any errors

---

**Your app will be live at**: https://knowndisc2.github.io/PurFood-NutritionPlan

Happy deploying! 🎉
