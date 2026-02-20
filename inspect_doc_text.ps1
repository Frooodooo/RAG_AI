$id = "RGKI_2022.xlsx" # We need the internal ID, but let's list all first to find it
$docsUrl = "http://localhost:3001/docs"

Write-Host "1. Finding Doc ID for $id..."
$docs = Invoke-RestMethod -Uri $docsUrl -Method Get
$targetDoc = $docs | Where-Object { $_.filename -eq $id }

if (-not $targetDoc) {
    Write-Error "Document $id not found in registry"
    exit
}
Write-Host "   Found ID: $($targetDoc.id)"

Write-Host "`n2. Fetching Extracted Text..."
$textUrl = "http://localhost:3001/docs/$($targetDoc.id)/text"
try {
    $textResponse = Invoke-RestMethod -Uri $textUrl -Method Get
    $text = $textResponse.text
    
    if (-not $text) {
        Write-Warning "No extracted text found!"
    }
    else {
        Write-Host "   Text Length: $($text.Length) characters"
        Write-Host "   First 500 chars:"
        Write-Host $text.Substring(0, [math]::Min(500, $text.Length))
    }
}
catch {
    Write-Error "Failed to fetch text: $_"
}
