# Start Both Backend and Frontend
Write-Host "Starting Kumar Milk Distributor App..." -ForegroundColor Green

# Function to start backend in new PowerShell window
Write-Host "1. Starting MongoDB Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\Freelance-repo\Kumar-milk-distrubutor-app\Kumar-Milk-Distributor'; Write-Host 'Starting Backend Server...' -ForegroundColor Green; node mobile-backend-server.js"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Function to start frontend in new PowerShell window  
Write-Host "2. Starting Expo Mobile App..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\Freelance-repo\Kumar-milk-distrubutor-app\Kumar-Milk-Distributor\milk-distributor-mobile'; Write-Host 'Starting Expo Server...' -ForegroundColor Green; npx expo start"

Write-Host ""
Write-Host "Both servers are starting in separate windows!" -ForegroundColor Green
Write-Host "Backend: MongoDB Server on http://localhost:5000" -ForegroundColor Cyan  
Write-Host "Frontend: Expo Dev Server (check new window)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Scan QR code with Expo Go app to test on your phone" -ForegroundColor Magenta
Write-Host "Or press 'w' in Expo terminal to open in web browser" -ForegroundColor Magenta

Read-Host 'Press Enter to close this window'
