@echo off
echo Starting PurFood Development Environment...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    echo.
)

REM Start backend server in background
echo Starting backend server on port 4000...
start "PurFood Backend" cmd /c "npm run dev"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start React development server
echo Starting React development server on port 3000...
echo.
echo Backend: http://localhost:4000
echo Frontend: http://localhost:3000
echo.
echo Press Ctrl+C in any window to stop the servers
echo.

npm run client

pause
