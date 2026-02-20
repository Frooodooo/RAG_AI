$qdrantUrl = "http://localhost:6333/collections/rag_docs/points/search"
$ftsUrl = "http://localhost:3001/docs/search"
$ollamaUrl = "http://localhost:11434/api/embeddings"
$query = "finansējums 2022"

Write-Host "1. Generating Embedding for query: '$query'"
$embedPayload = @{
    model  = "nomic-embed-text-v2-moe"
    prompt = $query
}
$embedResponse = Invoke-RestMethod -Uri $ollamaUrl -Method Post -Body ($embedPayload | ConvertTo-Json) -ContentType "application/json"
$vector = $embedResponse.embedding

if (-not $vector) {
    Write-Error "Failed to generate embedding"
    exit
}
Write-Host "   Embedding generated (length: $($vector.Length))"

Write-Host "`n2. Searching Qdrant (Threshold 0.05)"
$qdrantPayload = @{
    vector          = $vector
    top             = 3
    with_payload    = $true
    score_threshold = 0.05
}
try {
    $qdrantResponse = Invoke-RestMethod -Uri $qdrantUrl -Method Post -Body ($qdrantPayload | ConvertTo-Json -Depth 5) -ContentType "application/json"
    $hits = $qdrantResponse.result
    Write-Host "   Found $($hits.Count) vector hits:"
    foreach ($hit in $hits) {
        Write-Host "   - Score: $($hit.score) | File: $($hit.payload.filename) | Text: $($hit.payload.text.Substring(0, [math]::Min(50, $hit.payload.text.Length)))..."
    }
}
catch {
    Write-Error "Qdrant search failed: $_"
}

Write-Host "`n3. Searching FTS (doc-server)"
$ftsPayload = @{
    query = $query
    limit = 3
}
try {
    $ftsResponse = Invoke-RestMethod -Uri $ftsUrl -Method Post -Body ($ftsPayload | ConvertTo-Json) -ContentType "application/json"
    Write-Host "   Found $($ftsResponse.Count) FTS hits:"
    foreach ($hit in $ftsResponse) {
        Write-Host "   - Score: $($hit.score) | File: $($hit.filename) | Text: $($hit.excerpt.Substring(0, [math]::Min(50, $hit.excerpt.Length)))..."
    }
}
catch {
    Write-Error "FTS search failed: $_"
}
