@echo off
echo 🔧 Setting up Vercel Environment Variables...
echo.

echo Adding NODE_ENV...
vercel env add NODE_ENV production --scope production

echo Adding GEMINI_MODEL...
vercel env add GEMINI_MODEL gemini-1.5-flash --scope production

echo Adding Firebase Service Account...
echo Please copy and paste the entire content of server/firebase-admin-key.json when prompted
vercel env add FIREBASE_SERVICE_ACCOUNT_JSON --scope production

echo.
echo ✅ Environment variables setup complete!
echo Now redeploying with new environment variables...
echo.

vercel --prod

echo.
echo 🎉 Deployment complete!
echo Your backend should now work at: https://purfood-backend-ebyxtmvpf-ipaulsuns-projects.vercel.app
pause
