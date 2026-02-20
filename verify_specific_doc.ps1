$targetFile = "Kopeja_pieskiruma_tabula.xlsx"
$qdrantUrl = "http://localhost:6333/collections/rag_docs/points/search"
$ollamaUrl = "http://localhost:11434/api/embeddings"
$query = "finansējums" # Broad query to see if file appears

Write-Host "Checking status for: $targetFile"

# 1. Get Doc ID and status from doc-server
$docs = Invoke-RestMethod -Uri "http://localhost:3001/docs" -Method Get
$doc = $docs | Where-Object { $_.filename -eq $targetFile }

if (-not $doc) {
    Write-Warning "Document NOT found in doc-server registry!"
    exit
}
Write-Host "   ID: $($doc.id)"
Write-Host "   Status: $($doc.status)"
Write-Host "   Chunks: $($doc.chunks)"

if ($doc.status -ne "ready") {
    Write-Warning "Document is not in 'ready' status. It might not be embedded."
}

# 2. Check if text extraction worked
$textUrl = "http://localhost:3001/docs/$($doc.id)/text"
try {
    $textResponse = Invoke-RestMethod -Uri $textUrl -Method Get
    $text = $textResponse.text
    if ($text.Length -lt 100) {
        Write-Warning "Extracted text is suspiciously short ($($text.Length) chars)."
    }
    else {
        Write-Host "   Text Length: $($text.Length) chars (Extraction OK)"
        if ($text -match "finansējums") {
            Write-Host "   'finansējums' found in text." -ForegroundColor Green
        }
        else {
            Write-Warning "   'finansējums' NOT found in text."
        }
    }
}
catch {
    Write-Error "Failed to fetch text: $_"
}

# 3. Check Vector Search
Write-Host "`nChecking Vector Search..."
$embedPayload = @{ model = "nomic-embed-text-v2-moe"; prompt = $query }
try {
    $embedResponse = Invoke-RestMethod -Uri $ollamaUrl -Method Post -Body ($embedPayload | ConvertTo-Json) -ContentType "application/json"
    $vector = $embedResponse.embedding
}
catch {
    Write-Error "Embedding generation failed: $_"
    exit
}

$qdrantPayload = @{
    vector          = $vector
    top             = 50 # Broad search
    with_payload    = $true
    score_threshold = 0.01
    filter          = @{
        must = @(
            @{ key = "filename"; match = @{ value = $targetFile } }
        )
    }
}

try {
    $qdrantResponse = Invoke-RestMethod -Uri $qdrantUrl -Method Post -Body ($qdrantPayload | ConvertTo-Json -Depth 5) -ContentType "application/json"
    $hits = $qdrantResponse.result
    if ($hits.Count -gt 0) {
        Write-Host "   SUCCESS: Found $($hits.Count) vector hits for this file." -ForegroundColor Green
        Write-Host "   Top score: $($hits[0].score)"
        Write-Host "   Snippet: $($hits[0].payload.text.Substring(0, 50))..."
    }
    else {
        Write-Error "   FAILURE: No vector hits found for this file! It might need re-indexing."
    }
}
catch {
    Write-Error "Qdrant search failed: $_"
}
