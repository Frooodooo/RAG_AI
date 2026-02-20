$docId = "ede7247d-72cb-4e5f-bc11-c02a400f8822"
$url = "http://localhost:3001/docs/search"

# Test 1: Search in specific doc
$body1 = @{
    query = "2022"
    docId = $docId
    limit = 5
} | ConvertTo-Json

Write-Host "--- Test 1: Search '2022' in doc $docId ---"
try {
    $response = Invoke-RestMethod -Method Post -Uri $url -Body $body1 -ContentType "application/json" -ErrorAction Stop
    $count = ($response | Measure-Object).Count
    Write-Host "Count: $count"
    $response | ConvertTo-Json -Depth 5
}
catch {
    Write-Error "Test 1 failed: $_"
}

# Test 2: Search globally for 'riga'
$body2 = @{
    query = "riga"
    limit = 5
} | ConvertTo-Json

Write-Host "`n--- Test 2: Global Search 'riga' ---"
try {
    $response = Invoke-RestMethod -Method Post -Uri $url -Body $body2 -ContentType "application/json" -ErrorAction Stop
    $count = ($response | Measure-Object).Count
    Write-Host "Count: $count"
    $response | ConvertTo-Json -Depth 5
}
catch {
    Write-Error "Test 2 failed: $_"
}
