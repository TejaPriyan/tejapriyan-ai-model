# Tejapriyan Live World Model Node Broadcaster
$ErrorActionPreference = "Stop"

$CloudflaredVersion = "2026.11.0"
$CloudflaredUrl = "https://github.com/cloudflare/cloudflared/releases/download/$CloudflaredVersion/cloudflared-windows-amd64.exe"
$CloudflaredSha256 = "D5C1D82031DA6253DCDCFF64C944CD0FE063016EDEB2E4FD088075FC9BD52D0A"
$ProxyPort = if ($env:TEJAPRIYAN_PROXY_PORT) { $env:TEJAPRIYAN_PROXY_PORT } else { "11435" }
$ProxyScript = Join-Path $PSScriptRoot "scripts\ollama-proxy.js"

Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "    TEJAPRIYAN AI MODEL - LIVE WORLD NODE BROADCASTER" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js is required to run the authenticating Ollama proxy (scripts/ollama-proxy.js)."
}
if (-not (Test-Path $ProxyScript)) {
    throw "Proxy script not found at $ProxyScript"
}

Write-Host "[1/3] Ensure Ollama is running locally with 'tejapriyan' loaded: ollama run tejapriyan" -ForegroundColor Yellow
Write-Host "      (If not built yet, download tejapriyan-q4_k_m.gguf and run 'ollama create tejapriyan -f Modelfile')" -ForegroundColor DarkYellow
Write-Host ""

# Generate an ephemeral high-entropy Bearer token unless explicitly configured
if (-not $env:TEJAPRIYAN_TUNNEL_TOKEN) {
    $bytes = New-Object byte[] 24
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
    $env:TEJAPRIYAN_TUNNEL_TOKEN = [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}
$env:TEJAPRIYAN_PROXY_PORT = $ProxyPort

$cloudflaredCmd = $null
$systemCloudflared = Get-Command cloudflared -ErrorAction SilentlyContinue
if ($systemCloudflared) {
    $cloudflaredCmd = $systemCloudflared.Source
} else {
    $localCloudflared = Join-Path $PSScriptRoot "cloudflared.exe"
    $needsDownload = $true
    if (Test-Path $localCloudflared) {
        $existingHash = (Get-FileHash -Path $localCloudflared -Algorithm SHA256).Hash.ToUpperInvariant()
        if ($existingHash -eq $CloudflaredSha256) {
            $needsDownload = $false
        } else {
            Write-Host "Local cloudflared.exe hash mismatch ($existingHash); re-downloading pinned release $CloudflaredVersion..." -ForegroundColor Yellow
            Remove-Item -Path $localCloudflared -Force
        }
    }
    if ($needsDownload) {
        $partFile = "$localCloudflared.part"
        if (Test-Path $partFile) { Remove-Item -Path $partFile -Force }
        Write-Host "[2/3] Downloading pinned Cloudflare Tunnel $CloudflaredVersion..." -ForegroundColor Cyan
        curl.exe -f -L -o $partFile $CloudflaredUrl
        if ($LASTEXITCODE -ne 0 -or -not (Test-Path $partFile)) {
            if (Test-Path $partFile) { Remove-Item -Path $partFile -Force }
            throw "Failed to download cloudflared from $CloudflaredUrl"
        }
        $actualHash = (Get-FileHash -Path $partFile -Algorithm SHA256).Hash.ToUpperInvariant()
        if ($actualHash -ne $CloudflaredSha256) {
            Remove-Item -Path $partFile -Force
            throw "SHA256 verification failed for cloudflared! Expected $CloudflaredSha256, got $actualHash"
        }
        Move-Item -Path $partFile -Destination $localCloudflared -Force
        Write-Host "Verified cloudflared SHA256: $actualHash" -ForegroundColor Green
    }
    $cloudflaredCmd = $localCloudflared
}

Write-Host "[3/3] Starting authenticating, path-filtered proxy on 127.0.0.1:$ProxyPort..." -ForegroundColor Green
Write-Host "Only GET /api/tags and POST /api/chat (tejapriyan) are exposed with Bearer auth." -ForegroundColor DarkGray
Write-Host ""

$proxyProcess = Start-Process -FilePath "node" -ArgumentList @($ProxyScript) -NoNewWindow -PassThru
try {
    Start-Sleep -Milliseconds 400
    if ($proxyProcess.HasExited) {
        throw "Authenticating proxy exited prematurely with code $($proxyProcess.ExitCode)."
    }

    Write-Host "-------------------------------------------------------------------" -ForegroundColor DarkGray
    Write-Host "IMPORTANT INSTRUCTIONS:" -ForegroundColor White
    Write-Host "1. Below, Cloudflare will print a REAL LIVE URL ending in .trycloudflare.com" -ForegroundColor Yellow
    Write-Host "2. COPY that generated URL from this window." -ForegroundColor Yellow
    Write-Host "3. Open your website -> Click 'Node Settings' in the chat header." -ForegroundColor Yellow
    Write-Host "4. Paste the URL AND this Tunnel Access Token, then click 'Test':" -ForegroundColor Yellow
    Write-Host "   Token: $($env:TEJAPRIYAN_TUNNEL_TOKEN)" -ForegroundColor Cyan
    Write-Host "-------------------------------------------------------------------" -ForegroundColor DarkGray
    Write-Host ""

    & $cloudflaredCmd tunnel --url "http://127.0.0.1:$ProxyPort" --http-host-header localhost
} finally {
    if ($proxyProcess -and -not $proxyProcess.HasExited) {
        Stop-Process -Id $proxyProcess.Id -Force -ErrorAction SilentlyContinue
    }
}
