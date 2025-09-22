# PowerShell script to start PurFood development environment
Write-Host "🚀 Starting PurFood Development Environment..." -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Node.js is not installed or not in PATH" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Install dependencies if node_modules doesn't exist
if (!(Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Start backend server in background
Write-Host "🔧 Starting backend server on port 4000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal

# Wait for backend to start
Start-Sleep -Seconds 3

# Start React development server
Write-Host "⚛️  Starting React development server on port 3000..." -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Backend:  http://localhost:4000" -ForegroundColor Yellow
Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 Press Ctrl+C in any window to stop the servers" -ForegroundColor Magenta
Write-Host ""

# Start React app
npm run client
