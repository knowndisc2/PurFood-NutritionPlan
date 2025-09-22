# 🚀 Vercel Deployment Guide - Web Interface Method

Since we're having Git access issues with the CLI, let's use the Vercel web interface:

## 📋 **Method 1: Vercel Web Dashboard (Recommended)**

### Step 1: Go to Vercel Dashboard
1. Visit [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New"** → **"Project"**

### Step 2: Import Repository
1. Click **"Import Git Repository"**
2. Select **GitHub** as the provider
3. Find and select **"knowndisc2/PurFood-NutritionPlan"**
4. Click **"Import"**

### Step 3: Configure Project Settings
**Project Name**: `purfood-backend`

**Framework Preset**: `Other`

**Root Directory**: `.` (leave as default)

**Build and Output Settings**:
- **Build Command**: `npm install`
- **Output Directory**: Leave empty
- **Install Command**: `npm install`

### Step 4: Environment Variables
Add these environment variables in the Vercel dashboard:

| Variable Name | Value |
|---------------|-------|
| `NODE_ENV` | `production` |
| `GEMINI_API_KEY` | `AIzaSyDQU7VaUPdUFGCduCzA92-593FphBT_BV8` |
| `GEMINI_MODEL` | `gemini-1.5-flash` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Copy entire content from `server/firebase-admin-key.json` |

### Step 5: Deploy
1. Click **"Deploy"**
2. Wait for deployment to complete
3. Get your backend URL (e.g., `https://purfood-backend.vercel.app`)

---

## 📋 **Method 2: CLI Alternative (If Web Fails)**

### Option A: Fresh CLI Deployment
```bash
# Remove existing config
rmdir /s /q .vercel

# Deploy with new name
vercel --name purfood-api-new
```

### Option B: Manual File Upload
1. Create a ZIP file of your project
2. Use Vercel's drag-and-drop deployment
3. Visit [vercel.com/new](https://vercel.com/new)
4. Drag your ZIP file

---

## 🎯 **Current Backend Status**

Your simplified backend (`server/index-simple.js`) includes:
- ✅ Health check endpoint: `GET /`
- ✅ Mock meal generation: `POST /api/generate-plan`
- ✅ Status endpoint: `GET /api/status`
- ✅ CORS configured for GitHub Pages
- ✅ No Firebase dependencies (for now)

---

## 🔧 **After Backend Deployment**

### Step 1: Update Frontend Configuration
Once you get your Vercel backend URL, update:

**File**: `.env.production`
```env
REACT_APP_API_BASE_URL=https://your-backend-url.vercel.app
```

### Step 2: Deploy Frontend to GitHub Pages
```bash
npm run build
npm run deploy
```

### Step 3: Test Full Stack
- **Frontend**: https://knowndisc2.github.io/PurFood-NutritionPlan
- **Backend**: https://your-backend-url.vercel.app

---

## 🚨 **Troubleshooting**

### If Vercel Build Fails:
1. Check the build logs in Vercel dashboard
2. Ensure all environment variables are set
3. Verify `vercel.json` configuration

### If Backend Returns 500:
1. Check Vercel function logs
2. Verify environment variables are properly set
3. Test endpoints individually

### If Frontend Can't Connect:
1. Check CORS configuration in backend
2. Verify `REACT_APP_API_BASE_URL` is set correctly
3. Check browser network tab for errors

---

## ✅ **Success Checklist**

- [ ] Backend deployed to Vercel
- [ ] Environment variables configured
- [ ] Backend health check responds
- [ ] Frontend updated with backend URL
- [ ] Frontend deployed to GitHub Pages
- [ ] Authentication works
- [ ] Meal generation works
- [ ] No CORS errors

---

**Next Steps**: Try the web dashboard method first, then update me with your backend URL!
