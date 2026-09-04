# Tejapriyan Live World Model Node Broadcaster
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "    TEJAPRIYAN AI MODEL - LIVE WORLD NODE BROADCASTER" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Enabling unrestricted CORS origins for browser connections..." -ForegroundColor Yellow
$env:OLLAMA_ORIGINS = "*"

Write-Host "[2/3] Ensure Ollama is running on your machine: ollama run tejapriyan" -ForegroundColor Yellow
Write-Host ""

if (-not (Test-Path "cloudflared.exe")) {
    Write-Host "[3/3] Downloading official Cloudflare Tunnel tool (one-time setup)..." -ForegroundColor Cyan
    curl.exe -L -o cloudflared.exe https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe
}

Write-Host "[3/3] Starting free secure Cloudflare Tunnel to port 11434..." -ForegroundColor Green
Write-Host "No sign-up or accounts required!" -ForegroundColor Green
Write-Host ""
Write-Host "-------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "IMPORTANT INSTRUCTIONS:" -ForegroundColor White
Write-Host "1. Below, Cloudflare will print a REAL LIVE URL ending in .trycloudflare.com" -ForegroundColor Yellow
Write-Host "2. COPY that generated URL from this window." -ForegroundColor Yellow
Write-Host "3. Open your website -> Click 'Node Settings' in the chat header." -ForegroundColor Yellow
Write-Host "4. Paste your real URL and click 'Test'!" -ForegroundColor Yellow
Write-Host "   (Or add it to Vercel Environment Variables: VITE_TEJAPRIYAN_API_URL)" -ForegroundColor DarkCyan
Write-Host ""
Write-Host "Now anyone in the world visiting your website will chat with your PC!" -ForegroundColor Green
Write-Host "-------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host ""

.\cloudflared.exe tunnel --url http://localhost:11434
