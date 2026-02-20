$qdrantUrl = "http://localhost:6333/collections/rag_docs/points/search"
$ollamaUrl = "http://localhost:11434/api/embeddings"
$query = "finansējums 2022"

Write-Host "1. Generating Embedding for query: '$query'"
$embedPayload = @{
    model  = "nomic-embed-text-v2-moe"
    prompt = $query
}
try {
    $embedResponse = Invoke-RestMethod -Uri $ollamaUrl -Method Post -Body ($embedPayload | ConvertTo-Json) -ContentType "application/json"
    $vector = $embedResponse.embedding
}
catch {
    Write-Error "Ollama failed: $_"
    exit
}

if (-not $vector) {
    Write-Error "Failed to generate embedding"
    exit
}
Write-Host "   Embedding generated (length: $($vector.Length))"

Write-Host "`n2. Searching Qdrant (top 20, Threshold 0.05)"
$qdrantPayload = @{
    vector          = $vector
    top             = 20
    with_payload    = $true
    score_threshold = 0.05
}

try {
    $qdrantResponse = Invoke-RestMethod -Uri $qdrantUrl -Method Post -Body ($qdrantPayload | ConvertTo-Json -Depth 5) -ContentType "application/json"
    $hits = $qdrantResponse.result
    Write-Host "   Found $($hits.Count) vector hits:"
    
    $found = $false
    foreach ($hit in $hits) {
        $fname = $hit.payload.filename
        $score = $hit.score
        $text = $hit.payload.text
        if ($text.Length -gt 50) { $text = $text.Substring(0, 50) + "..." }
        
        $marker = " "
        if ($fname -like "*RGKI_2022*") { 
            $marker = "*"
            $found = $true 
        }
        
        Write-Host " $marker Score: $score | File: $fname | Text: $text"
    }
    
    if (-not $found) {
        Write-Warning "RGKI_2022.xlsx NOT found in top 20 results!"
    }
    else {
        Write-Host "`nSUCCESS: RGKI_2022.xlsx found in results!" -ForegroundColor Green
    }

}
catch {
    Write-Error "Qdrant search failed: $_"
}
