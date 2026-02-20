$id = "24f7731d-34b7-4b55-914d-e27439c114bf" # The active ID
$textUrl = "http://localhost:3001/docs/$id/text"

Write-Host "Fetching Extracted Text for $id..."
try {
    $textResponse = Invoke-RestMethod -Uri $textUrl -Method Get
    $text = $textResponse.text
    
    if (-not $text) {
        Write-Warning "No extracted text found!"
        exit
    }
    
    Write-Host "Text Length: $($text.Length) characters"
    
    if ($text -match "finansējums|finanšu|nauda|budžets") {
        Write-Host "FOUND relevant keywords!" -ForegroundColor Green
        $match = [regex]::Match($text, ".{0,50}(finansējums|finanšu|nauda|budžets).{0,50}", "IgnoreCase")
        Write-Host "Context: ...$($match.Value)..."
    }
    else {
        Write-Warning "Keywords (finansējums, finanšu, etc.) NOT found in the document text."
        Write-Host "First 500 chars snippet:"
        Write-Host $text.Substring(0, [math]::Min(500, $text.Length))
    }
}
catch {
    Write-Error "Failed to fetch text: $_"
}
