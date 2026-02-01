# SmartKidCare - Run all services in separate terminals (so Expo QR code shows)
# Run from project root: powershell -ExecutionPolicy Bypass -File ./start-all.ps1

$projectRoot = if ($PSScriptRoot) { $PSScriptRoot } else { Get-Location | Select-Object -ExpandProperty Path }

Write-Host "Starting SmartKidCare services..." -ForegroundColor Green
Write-Host "Backend will run on http://localhost:5000" -ForegroundColor Cyan
Write-Host "Web will run on http://localhost:5173" -ForegroundColor Cyan
Write-Host "Mobile will run on http://localhost:8081 (QR code in mobile window)" -ForegroundColor Cyan
Write-Host ""

# Start backend
Write-Host "Starting backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$projectRoot\backend'; npm run dev" -WindowStyle Hidden

# Wait a moment for backend to start
Start-Sleep -Seconds 2

# Start web
Write-Host "Starting web..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$projectRoot\web'; npm run dev" -WindowStyle Hidden

# Wait a moment for web to start
Start-Sleep -Seconds 2

# Start mobile (own window so QR code displays)
Write-Host "Starting mobile..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$projectRoot\mobile'; npm start" -WindowStyle Hidden

Write-Host "All services started! Check the terminal windows for each service." -ForegroundColor Green
Write-Host "Press Ctrl+C in each terminal to stop the services." -ForegroundColor Gray
