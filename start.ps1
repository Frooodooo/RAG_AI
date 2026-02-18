# ============================================================
#  RAG Demo - One-Click Startup
#  Run: right-click -> "Run with PowerShell"  (or:  .\start.ps1)
# ============================================================

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host "     RAG Demo - Starting all services     " -ForegroundColor Cyan
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Ollama
Write-Host "[1/5] Checking Ollama..." -ForegroundColor Yellow
try {
    $ollamaCheck = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 3 -ErrorAction Stop
    $count = $ollamaCheck.models.Count
    Write-Host "  [OK] Ollama is running ($count models loaded)" -ForegroundColor Green
}
catch {
    Write-Host "  [WARN] Ollama not responding. Please start Ollama manually." -ForegroundColor Red
    Write-Host "         (It usually runs as a Windows service after installation)" -ForegroundColor Gray
}

# 2. Qdrant
Write-Host "[2/5] Starting Qdrant..." -ForegroundColor Yellow
$qdrantRunning = docker ps --filter "name=qdrant" --format "{{.Names}}" 2>$null
if ($qdrantRunning -eq "qdrant") {
    Write-Host "  [OK] Qdrant already running" -ForegroundColor Green
}
else {
    docker start qdrant 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Creating new Qdrant container..." -ForegroundColor Gray
        docker run -d --name qdrant -p 6333:6333 -v qdrant_data:/qdrant/storage qdrant/qdrant
    }
    Start-Sleep 2
    Write-Host "  [OK] Qdrant started on port 6333" -ForegroundColor Green
}

# 3. n8n
Write-Host "[3/5] Starting n8n..." -ForegroundColor Yellow
$n8nRunning = docker ps --filter "name=n8n" --format "{{.Names}}" 2>$null
if ($n8nRunning -eq "n8n") {
    Write-Host "  [OK] n8n already running" -ForegroundColor Green
}
else {
    docker start n8n 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [WARN] n8n container not found or failed to start." -ForegroundColor Red
    }
    else {
        Start-Sleep 3
        Write-Host "  [OK] n8n started on port 5678" -ForegroundColor Green
    }
}

# 4. Vite Dev Server
Write-Host "[4/5] Starting Vite dev server..." -ForegroundColor Yellow
$viteJob = Start-Job -ScriptBlock {
    Set-Location "c:\Users\Frooodooo\Documents\RAG_AI\rag-demo"
    Write-Host "  [...] Clearing Vite cache..."
    Remove-Item -Path "node_modules\.vite" -Recurse -Force -ErrorAction SilentlyContinue
    npm run dev 2>&1
}
Start-Sleep 4
Write-Host "  [OK] Vite dev server starting on http://localhost:3000" -ForegroundColor Green

# 5. Cloudflare Tunnel
Write-Host "[5/5] Starting Cloudflare Tunnel..." -ForegroundColor Yellow
$tunnelLogFile = "c:\Users\Frooodooo\Documents\RAG_AI\tunnel-log.txt"
$tunnelJob = Start-Job -ScriptBlock {
    & "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:3000 2>&1 |
    Tee-Object -FilePath "c:\Users\Frooodooo\Documents\RAG_AI\tunnel-log.txt"
}

# Wait for tunnel
$tunnelUrl = $null
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep 2
    if (Test-Path $tunnelLogFile) {
        $content = Get-Content $tunnelLogFile -Raw
        if ($content -match "https://[a-zA-Z0-9-]+\.trycloudflare\.com") {
            $tunnelUrl = $matches[0]
            break
        }
    }
}

# Summary
Write-Host ""
Write-Host "  ========================================" -ForegroundColor Green
Write-Host "        All services started! [OK]        " -ForegroundColor Green
Write-Host "  ========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Local:    http://localhost:3000" -ForegroundColor White
if ($tunnelUrl) {
    Write-Host "  Public:   $tunnelUrl" -ForegroundColor Cyan
}
else {
    Write-Host "  Public:   (waiting for tunnel... check tunnel-log.txt)" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "  Press Ctrl+C to stop all services." -ForegroundColor Gray
Write-Host ""

# Monitor
try {
    while ($true) {
        Start-Sleep 5
        if ($viteJob.State -eq "Failed") {
            Write-Host "  [WARN] Vite crashed! Restarting..." -ForegroundColor Red
            $viteJob = Start-Job -ScriptBlock {
                Set-Location "c:\Users\Frooodooo\Documents\RAG_AI\rag-demo"
                Write-Host "  [...] Clearing Vite cache..."
                Remove-Item -Path "node_modules\.vite" -Recurse -Force -ErrorAction SilentlyContinue
                npm run dev 2>&1
            }
        }
    }
}
finally {
    Write-Host ""
    Write-Host "  Shutting down..." -ForegroundColor Yellow
    Stop-Job $viteJob -ErrorAction SilentlyContinue
    Stop-Job $tunnelJob -ErrorAction SilentlyContinue
    Remove-Job $viteJob -ErrorAction SilentlyContinue
    Remove-Job $tunnelJob -ErrorAction SilentlyContinue
    Write-Host "  [OK] All services stopped." -ForegroundColor Green
}
