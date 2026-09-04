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

if not exist cloudflared.exe curl.exe -L -o cloudflared.exe https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe

echo [3/3] Starting free secure Cloudflare Tunnel to port 11434...
echo No sign-up or accounts required!
echo.
echo -------------------------------------------------------------------
echo IMPORTANT INSTRUCTIONS:
echo 1. Below, Cloudflare will print a REAL LIVE URL ending in .trycloudflare.com
echo 2. COPY that generated URL from the console.
echo 3. Open your website -^> Click Node Settings in the chat header.
echo 4. Paste your real URL and click Test!
echo    Optional: Add to Vercel Environment Variables: VITE_TEJAPRIYAN_API_URL
echo.
echo Now anyone in the world visiting your website will chat with your PC!
echo -------------------------------------------------------------------
echo.

.\cloudflared.exe tunnel --url http://localhost:11434

pause
