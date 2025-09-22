# 🚀 Backend Deployment Guide

Since GitHub Pages only serves static files, you need to deploy your Node.js backend separately. Here are the best free options:

## 🥇 **Option 1: Vercel (Recommended)**

### Why Vercel?
- ✅ **Free tier**: 100GB bandwidth, 100 serverless functions
- ✅ **Automatic deployments** from GitHub
- ✅ **Fast global CDN**
- ✅ **Easy environment variables**
- ✅ **Perfect for serverless APIs**

### Setup Steps:

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from your project root**
   ```bash
   vercel
   ```
   - Choose your GitHub account
   - Select the repository
   - Keep default settings

4. **Set Environment Variables**
   ```bash
   vercel env add GEMINI_API_KEY
   vercel env add FIREBASE_SERVICE_ACCOUNT_PATH
   # Add all your .env variables
   ```

5. **Deploy**
   ```bash
   vercel --prod
   ```

### Your Backend URL:
`https://your-project-name.vercel.app`

---

## 🥈 **Option 2: Railway**

### Why Railway?
- ✅ **Free tier**: $5/month credit (usually enough)
- ✅ **Full Node.js support**
- ✅ **Built-in database hosting**
- ✅ **Simple GitHub integration**

### Setup Steps:

1. **Go to [railway.app](https://railway.app)**
2. **Sign up with GitHub**
3. **Create New Project** → **Deploy from GitHub repo**
4. **Select your repository**
5. **Add Environment Variables** in Railway dashboard
6. **Deploy automatically**

### Your Backend URL:
`https://your-project-name.railway.app`

---

## 🥉 **Option 3: Render**

### Why Render?
- ✅ **Free tier available**
- ✅ **Automatic SSL**
- ✅ **GitHub integration**
- ⚠️ **Slower cold starts on free tier**

### Setup Steps:

1. **Go to [render.com](https://render.com)**
2. **Sign up with GitHub**
3. **New Web Service** → **Connect Repository**
4. **Configure**:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: `Node`
5. **Add Environment Variables**
6. **Deploy**

### Your Backend URL:
`https://your-project-name.onrender.com`

---

## 🔧 **Update Frontend Configuration**

After deploying your backend, update your frontend:

### 1. Update `.env.production`
```env
REACT_APP_API_BASE_URL=https://your-backend-url.vercel.app
```

### 2. Update `src/App.js`
The code is already configured to use `REACT_APP_API_BASE_URL` in production.

### 3. Redeploy Frontend
```bash
npm run deploy
```

---

## 🌐 **Complete Deployment Architecture**

```
Frontend (GitHub Pages)
https://knowndisc2.github.io/PurFood-NutritionPlan
           ↓ API calls
Backend (Vercel/Railway/Render)
https://your-backend.vercel.app
           ↓ Database
Firebase Firestore
```

---

## 📋 **Environment Variables Needed**

Make sure to set these in your chosen platform:

```env
NODE_ENV=production
PORT=3000
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-1.5-flash
FIREBASE_SERVICE_ACCOUNT_PATH=./server/firebase-admin-key.json
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

---

## 🚀 **Quick Start (Vercel)**

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy
vercel

# 3. Set environment variables
vercel env add GEMINI_API_KEY
vercel env add NODE_ENV production

# 4. Deploy to production
vercel --prod

# 5. Update frontend with your new backend URL
# Edit .env.production with your Vercel URL

# 6. Deploy frontend
npm run deploy
```

---

## ✅ **Testing Your Deployment**

1. **Backend Health Check**:
   Visit: `https://your-backend-url.com`
   Should show: "PurFood API is running"

2. **API Endpoints**:
   - `GET /api/menu` - Menu scraping
   - `POST /api/generate-plan` - AI meal generation
   - `POST /api/nutrition` - Nutrition data

3. **Frontend Integration**:
   - Sign in works
   - Meal generation works
   - No CORS errors in console

---

## 🆘 **Troubleshooting**

### CORS Errors
- Add your frontend URL to the CORS whitelist in `server/index.js`
- Redeploy backend

### Environment Variables
- Double-check all variables are set in your platform
- Restart the service after adding variables

### Cold Starts
- First request might be slow (especially on free tiers)
- This is normal for serverless functions

---

## 💰 **Cost Comparison**

| Platform | Free Tier | Paid Plans |
|----------|-----------|------------|
| **Vercel** | 100GB bandwidth | $20/month |
| **Railway** | $5 credit/month | $5+/month |
| **Render** | 750 hours/month | $7+/month |

**Recommendation**: Start with Vercel for the best free tier and performance.

---

Your complete app will be:
- **Frontend**: https://knowndisc2.github.io/PurFood-NutritionPlan
- **Backend**: https://your-backend.vercel.app
