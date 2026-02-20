# ============================================================
#  RAG Demo - One-Click Startup
#  Run: right-click -> "Run with PowerShell"  (or:  .\start.ps1)
# ============================================================

$ErrorActionPreference = "Continue"
$ROOT = $PSScriptRoot   # auto-resolves to the folder containing this script

Write-Host ""
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host "     RAG Demo - Starting all services     " -ForegroundColor Cyan
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Ollama
Write-Host "[1/6] Checking Ollama..." -ForegroundColor Yellow
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
Write-Host "[2/6] Starting Qdrant..." -ForegroundColor Yellow
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
Write-Host "[3/6] Starting n8n..." -ForegroundColor Yellow
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

# 4. Doc Server — always rebuild Docker image so server.js changes take effect immediately
Write-Host "[4/6] Building & starting rag-doc-server (Docker)..." -ForegroundColor Yellow

# Stop and remove any existing container (stale image = no /upload endpoint)
docker stop rag-doc-server 2>$null | Out-Null
docker rm   rag-doc-server 2>$null | Out-Null

# Build fresh image from ./doc-server (Docker caches layers; only server.js layer re-runs)
Write-Host "  Building image from .\doc-server..." -ForegroundColor Gray
docker build -t rag-doc-server "$ROOT\doc-server" > "$ROOT\doc-server-build.log" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERROR] Docker build failed — see doc-server-build.log" -ForegroundColor Red
}
else {
    # host.docker.internal resolves to the Windows host from inside Docker containers
    docker run -d `
        --name rag-doc-server `
        -p 3001:3001 `
        -v rag_doc_data:/app/data `
        -e QDRANT_URL=http://host.docker.internal:6333 `
        -e OLLAMA_URL=http://host.docker.internal:11434 `
        -e N8N_URL=http://host.docker.internal:5678 `
        rag-doc-server | Out-Null

    Start-Sleep 3
    $docCheck = docker ps --filter "name=rag-doc-server" --format "{{.Names}}" 2>$null
    if ($docCheck -eq "rag-doc-server") {
        Write-Host "  [OK] rag-doc-server running on port 3001" -ForegroundColor Green
    }
    else {
        Write-Host "  [ERROR] rag-doc-server failed — run: docker logs rag-doc-server" -ForegroundColor Red
    }
}
$docServerJob = $null  # Docker manages its own lifecycle; no PS job to track

# 5. Vite Dev Server
Write-Host "[5/6] Starting Vite dev server..." -ForegroundColor Yellow
$viteJob = Start-Job -ScriptBlock {
    param($root)
    Set-Location "$root\rag-demo"
    # Clear Vite cache so any proxy-config changes take effect immediately
    Remove-Item -Path "node_modules\.vite" -Recurse -Force -ErrorAction SilentlyContinue
    npm run dev 2>&1
} -ArgumentList $ROOT
Start-Sleep 4
Write-Host "  [OK] Vite dev server starting on http://localhost:3000" -ForegroundColor Green

# 6. Cloudflare Tunnel
Write-Host "[6/6] Starting Cloudflare Tunnel..." -ForegroundColor Yellow
$tunnelLogFile = "$ROOT\tunnel-log.txt"
$tunnelJob = Start-Job -ScriptBlock {
    param($root)
    & "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:3000 2>&1 |
    Tee-Object -FilePath "$root\tunnel-log.txt"
} -ArgumentList $ROOT

# Wait for tunnel URL to appear in the log
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
Write-Host "  ============================================" -ForegroundColor Green
Write-Host "       All services started!  [OK]           " -ForegroundColor Green
Write-Host "  ============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  SERVICE PORTS" -ForegroundColor Cyan
Write-Host "  ─────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  Frontend  (Vite)     http://localhost:3000" -ForegroundColor White
Write-Host "  Doc API   (Express)  http://localhost:3001/health" -ForegroundColor White
Write-Host "  n8n       (Docker)   http://localhost:5678" -ForegroundColor White
Write-Host "  Qdrant    (Docker)   http://localhost:6333/dashboard" -ForegroundColor White
Write-Host "  Ollama               http://localhost:11434" -ForegroundColor White
Write-Host "  ─────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""
if ($tunnelUrl) {
    Write-Host "  Public:   $tunnelUrl" -ForegroundColor Cyan
}
else {
    Write-Host "  Public:   (waiting for tunnel... check tunnel-log.txt)" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "  Press Ctrl+C to stop all services." -ForegroundColor Gray
Write-Host ""

# Monitor — restart Vite automatically if it crashes
try {
    while ($true) {
        Start-Sleep 5
        if ($viteJob.State -eq "Failed") {
            Write-Host "  [WARN] Vite crashed! Restarting..." -ForegroundColor Red
            $viteJob = Start-Job -ScriptBlock {
                param($root)
                Set-Location "$root\rag-demo"
                Remove-Item -Path "node_modules\.vite" -Recurse -Force -ErrorAction SilentlyContinue
                npm run dev 2>&1
            } -ArgumentList $ROOT
        }
    }
}
finally {
    Write-Host ""
    Write-Host "  Shutting down..." -ForegroundColor Yellow
    Stop-Job  $viteJob   -ErrorAction SilentlyContinue
    Stop-Job  $tunnelJob -ErrorAction SilentlyContinue
    Remove-Job $viteJob   -ErrorAction SilentlyContinue
    Remove-Job $tunnelJob -ErrorAction SilentlyContinue
    docker stop rag-doc-server 2>$null | Out-Null
    Write-Host "  [OK] All services stopped." -ForegroundColor Green
}
