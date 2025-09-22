# 🔧 Troubleshooting Guide

## Yellow/Blank Screen Issues

### Common Causes & Solutions

#### 1. **Router Issues (Most Common)**
**Problem**: BrowserRouter doesn't work well with GitHub Pages
**Solution**: ✅ Fixed - Changed to HashRouter in `src/index.js`

#### 2. **Environment Variables Missing**
**Problem**: Firebase config not loaded
**Solution**: 
```bash
# Check if .env file exists and has all Firebase variables
# Copy from .env.example if needed
```

#### 3. **Build/Development Issues**
**Problem**: React app not starting properly
**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Or on Windows
rmdir /s node_modules
del package-lock.json
npm install
```

## 🚀 How to Start Development Servers

### Option 1: Automatic (Recommended)
```bash
# Windows Command Prompt
npm run dev:windows

# Windows PowerShell
npm run dev:powershell

# Cross-platform
npm run dev:full
```

### Option 2: Manual (Two Terminals)
**Terminal 1 - Backend:**
```bash
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run client
```

### Option 3: Individual Commands
```bash
# Backend only (port 4000)
npm run dev

# Frontend only (port 3000)
npm run client

# Build for production
npm run build
```

## 🌐 Expected URLs

- **Frontend (React)**: http://localhost:3000
- **Backend (API)**: http://localhost:4000
- **Production**: https://knowndisc2.github.io/PurFood-NutritionPlan

## 🐛 Common Error Messages

### "Cannot GET /"
**Cause**: React router issue or wrong URL
**Fix**: 
- Use http://localhost:3000 (not 4000)
- Clear browser cache
- Check if React dev server is running

### "Network Error" / API calls failing
**Cause**: Backend server not running
**Fix**:
- Start backend with `npm run dev`
- Check http://localhost:4000 responds
- Verify CORS settings

### "Firebase Error" / Auth issues
**Cause**: Firebase config missing or incorrect
**Fix**:
- Check `.env` file has all REACT_APP_FIREBASE_* variables
- Verify Firebase project settings
- Check browser console for specific errors

### Yellow Screen / Blank Page
**Cause**: JavaScript error or routing issue
**Fix**:
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests
4. Try hard refresh (Ctrl+F5)

## 🔍 Debugging Steps

### 1. Check Browser Console
```
F12 → Console tab
Look for red error messages
```

### 2. Verify Servers Running
```bash
# Check if processes are running
netstat -an | findstr :3000  # React
netstat -an | findstr :4000  # Backend
```

### 3. Test API Directly
```
Visit: http://localhost:4000
Should show: "PurFood API is running"
```

### 4. Check Environment
```bash
# Verify Node.js version
node --version  # Should be 16+

# Check npm version
npm --version

# List running processes
tasklist | findstr node
```

## 🚨 Emergency Reset

If nothing works, try this complete reset:

```bash
# 1. Stop all Node processes
taskkill /f /im node.exe

# 2. Clean everything
rmdir /s /q node_modules
del package-lock.json
npm cache clean --force

# 3. Reinstall
npm install

# 4. Start fresh
npm run dev:full
```

## 📞 Still Having Issues?

1. **Check the exact error message** in browser console
2. **Verify all files exist**: 
   - `src/index.js`
   - `src/Auth.js` 
   - `src/App.js`
   - `.env`
3. **Test with a simple page** - temporarily replace Auth.js content with:
   ```jsx
   export default function Auth() {
     return <div>Hello World!</div>;
   }
   ```

## ✅ Success Indicators

When everything works correctly:
- ✅ Backend shows "Server running on port 4000"
- ✅ Frontend opens browser to http://localhost:3000
- ✅ You see the PurFood login page (not yellow screen)
- ✅ No errors in browser console
- ✅ Firebase authentication works
