# Tejapriyan Live World Model Node Broadcaster
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "    TEJAPRIYAN AI MODEL - LIVE WORLD NODE BROADCASTER" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Enabling unrestricted CORS origins for browser connections..." -ForegroundColor Yellow
$env:OLLAMA_ORIGINS = "*"

Write-Host "[2/3] Ensure Ollama is running on your machine: ollama run tejapriyan" -ForegroundColor Yellow
Write-Host ""
Write-Host "[3/3] Starting free secure Cloudflare Tunnel to port 11434..." -ForegroundColor Green
Write-Host "No sign-up or accounts required!" -ForegroundColor Green
Write-Host ""
Write-Host "-------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "INSTRUCTIONS:" -ForegroundColor White
Write-Host "1. Look for the URL ending with '.trycloudflare.com' below." -ForegroundColor Yellow
Write-Host "2. Copy that URL (e.g. https://xyz.trycloudflare.com)." -ForegroundColor Yellow
Write-Host "3. Open your website -> Click 'Node Settings' in the chat header." -ForegroundColor Yellow
Write-Host "4. Paste the URL and click 'Test'!" -ForegroundColor Yellow
Write-Host "   (Or add it to Vercel Environment Variables: VITE_TEJAPRIYAN_API_URL)" -ForegroundColor DarkCyan
Write-Host ""
Write-Host "Now anyone in the world visiting your website can chat with your PC!" -ForegroundColor Green
Write-Host "-------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host ""

npx --yes cloudflared tunnel --url http://localhost:11434
