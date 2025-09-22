@echo off
echo 🚀 PurFood Full-Stack Deployment Script
echo.

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing Vercel CLI...
    npm install -g vercel
)

echo ✅ Vercel CLI ready
echo.

REM Deploy backend to Vercel
echo 🔧 Deploying backend to Vercel...
vercel --prod

if %errorlevel% neq 0 (
    echo ❌ Backend deployment failed
    pause
    exit /b 1
)

echo ✅ Backend deployed successfully!
echo.

REM Build and deploy frontend to GitHub Pages
echo ⚛️  Building and deploying frontend to GitHub Pages...
npm run build

if %errorlevel% neq 0 (
    echo ❌ Frontend build failed
    pause
    exit /b 1
)

npm run deploy

if %errorlevel% neq 0 (
    echo ❌ Frontend deployment failed
    pause
    exit /b 1
)

echo.
echo 🎉 Full-stack deployment complete!
echo.
echo 🌐 Frontend: https://knowndisc2.github.io/PurFood-NutritionPlan
echo 🔧 Backend: Check Vercel dashboard for URL
echo.
echo 💡 Don't forget to:
echo    1. Update REACT_APP_API_BASE_URL with your Vercel URL
echo    2. Set environment variables in Vercel dashboard
echo    3. Test the live application
echo.
pause
