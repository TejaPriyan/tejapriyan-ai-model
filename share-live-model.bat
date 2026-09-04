@echo off
title Tejapriyan Live World Model Node
color 0b

echo ===================================================================
echo     TEJAPRIYAN AI MODEL - LIVE WORLD NODE BROADCASTER
echo ===================================================================
echo.
echo [1/3] Enabling unrestricted CORS origins for browser connections...
set OLLAMA_ORIGINS=*

echo [2/3] Checking Ollama model status...
echo Make sure you have started your model: ollama run tejapriyan
echo.
echo [3/3] Starting free secure Cloudflare Tunnel to port 11434...
echo No sign-up or accounts required!
echo.
echo -------------------------------------------------------------------
echo INSTRUCTIONS:
echo 1. Look for the URL ending with '.trycloudflare.com' below.
echo 2. Copy that URL (e.g. https://xyz.trycloudflare.com).
echo 3. Open your website -> Click 'Node Settings' in the chat header.
echo 4. Paste the URL and click 'Test'!
echo    (Or add it to Vercel Environment Variables: VITE_TEJAPRIYAN_API_URL)
echo.
echo Now anyone in the world visiting your website can chat with your PC!
echo -------------------------------------------------------------------
echo.

npx --yes cloudflared tunnel --url http://localhost:11434

pause
