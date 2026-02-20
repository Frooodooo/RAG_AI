$filePath = "C:\Users\Frooodooo\Documents\RAG_AI\test_documents\Kopeja_pieskiruma_tabula.xlsx"
$uploadUrl = "http://localhost:3001/upload"

Write-Host "Reading file: $filePath"
$bytes = [System.IO.File]::ReadAllBytes($filePath)
$base64 = [Convert]::ToBase64String($bytes)

$payload = @{
    filename   = "Kopeja_pieskiruma_tabula.xlsx"
    fileBase64 = $base64
    mimeType   = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
}

Write-Host "Uploading to $uploadUrl..."
try {
    $response = Invoke-RestMethod -Uri $uploadUrl -Method Post -Body ($payload | ConvertTo-Json -Depth 2) -ContentType "application/json"
    Write-Host "Upload successful!"
    Write-Host "ID: $($response.id)"
    Write-Host "Status: $($response.status)"
    
    # Store ID to check text later
    $response.id | Out-File -FilePath "last_uploaded_id.txt" -Encoding ascii
}
catch {
    Write-Error "Upload failed: $_"
    # Print error details if available
    try {
        $errorResponse = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorResponse)
        Write-Error $reader.ReadToEnd()
    }
    catch {}
}
