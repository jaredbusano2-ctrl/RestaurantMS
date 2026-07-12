# seed-menu-images.ps1 - Completely Fixed Version
$API_BASE = "http://localhost:5000"
$TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjEiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9lbWFpbGFkZHJlc3MiOiJzdXBlcmFkbWluQHJlc3RhdXJhbnRtcy5jb20iLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiU3VwZXIgQWRtaW4iLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJTdXBlckFkbWluIiwiYnJhbmNoIjoiTWFpbiBCcmFuY2giLCJleHAiOjE3ODM4Njk5MjcsImlzcyI6IlJlc3RhdXJhbnRNUyIsImF1ZCI6IlJlc3RhdXJhbnRNUyJ9.dgut_82QYW-JU2AJV-s-Vz6jmcrNc3FCe97OKXdJsj0"

$AUTH_HEADERS = @{
    Authorization = "Bearer $TOKEN"
}

$menuImageMap = @{
    'Classic Burger' = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop&crop=center'
    'Cheeseburger' = 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=300&fit=crop&crop=center'
    'Double Cheeseburger' = 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop&crop=center'
    'Bacon Cheeseburger' = 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop&crop=center'
    'Chicken Burger' = 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=300&fit=crop&crop=center'
    'Spicy Chicken Burger' = 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=300&fit=crop&crop=center'
    'Hotdog Classic' = 'https://images.unsplash.com/photo-1571091718768-e1a6eb0ce0c8?w=400&h=300&fit=crop&crop=center'
    '2pc Fried Chicken' = 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&h=300&fit=crop&crop=center'
    '3pc Fried Chicken' = 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&h=300&fit=crop&crop=center'
    'Chicken Wings (6pc)' = 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400&h=300&fit=crop&crop=center'
    'Chicken Wings (12pc)' = 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400&h=300&fit=crop&crop=center'
    'Grilled Chicken Fillet' = 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop&crop=center'
    'Regular Fries' = 'https://images.unsplash.com/photo-1585101280961-ab7d9d1ebc12?w=400&h=300&fit=crop&crop=center'
    'Large Fries' = 'https://images.unsplash.com/photo-1585101280961-ab7d9d1ebc12?w=400&h=300&fit=crop&crop=center'
    'Cheese Fries' = 'https://images.unsplash.com/photo-1523592121529-f6dde35f079e?w=400&h=300&fit=crop&crop=center'
    'Onion Rings' = 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400&h=300&fit=crop&crop=center'
    'Mozzarella Sticks' = 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=400&h=300&fit=crop&crop=center'
    'Garden Salad' = 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop&crop=center'
    'Cola (Regular)' = 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=300&fit=crop&crop=center'
    'Cola (Large)' = 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=300&fit=crop&crop=center'
    'Iced Tea' = 'https://images.unsplash.com/photo-1558857563-c0c3a0b3b0c0?w=400&h=300&fit=crop&crop=center'
    'Lemonade' = 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&h=300&fit=crop&crop=center'
    'Bottled Water' = 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=400&h=300&fit=crop&crop=center'
    'Iced Coffee' = 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop&crop=center'
    'Hot Coffee' = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop&crop=center'
    'Vanilla Sundae' = 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=400&h=300&fit=crop&crop=center'
    'Chocolate Sundae' = 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop&crop=center'
    'Apple Pie' = 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop&crop=center'
    'Classic Combo' = 'https://images.unsplash.com/photo-1551326844-4df70f78d0e9?w=400&h=300&fit=crop&crop=center'
    'Cheeseburger Combo' = 'https://images.unsplash.com/photo-1551326844-4df70f78d0e9?w=400&h=300&fit=crop&crop=center'
    'Chicken Combo' = 'https://images.unsplash.com/photo-1551326844-4df70f78d0e9?w=400&h=300&fit=crop&crop=center'
    'Family Bucket' = 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&h=300&fit=crop&crop=center'
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   MENU IMAGE SEEDER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "API URL: $API_BASE" -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Continue? (y/n)"

if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "Testing API connection..." -ForegroundColor Cyan

try {
    $testResponse = Invoke-RestMethod `
    -Uri "$API_BASE/api/menu" `
    -Method Get `
    -Headers $AUTH_HEADERS `
    -TimeoutSec 5
    Write-Host "API connection successful!" -ForegroundColor Green
} catch {
    Write-Host "Cannot connect to API. Make sure your backend is running at $API_BASE" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit
}

Write-Host ""
Write-Host "Fetching menu items..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod `
    -Uri "$API_BASE/api/menu" `
    -Method Get `
    -Headers $AUTH_HEADERS
    $items = $response.data
    Write-Host "Found $($items.Count) menu items" -ForegroundColor Green
    Write-Host ""
    
    $successCount = 0
    $failCount = 0
    $skippedCount = 0
    $currentItem = 0
    
    $tempDir = Join-Path $env:TEMP "menu-images"
    if (!(Test-Path $tempDir)) {
        New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    }
    
    foreach ($item in $items) {
        $currentItem++
        $imageUrl = $menuImageMap[$item.name]
        
        Write-Host "[$currentItem/$($items.Count)] Processing: $($item.name)" -ForegroundColor Cyan
        
        if (-not $imageUrl) {
            Write-Host "  No image mapping found" -ForegroundColor Yellow
            $skippedCount++
            continue
        }
        
        $tempPath = Join-Path $tempDir "$([System.Guid]::NewGuid().ToString()).jpg"
        
        # Download image
        try {
            Write-Host "  Downloading image..." -ForegroundColor Gray
            $webClient = New-Object System.Net.WebClient
            $webClient.Headers.Add("User-Agent", "Mozilla/5.0")
            $webClient.DownloadFile($imageUrl, $tempPath)
            Write-Host "  Download complete" -ForegroundColor Gray
        } catch {
            Write-Host "  Download failed" -ForegroundColor Red
            Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
            $failCount++
            if (Test-Path $tempPath) {
                Remove-Item $tempPath -Force
            }
            continue
        }
        
        # Upload image using a simpler approach
        try {
            Write-Host "  Uploading image..." -ForegroundColor Gray
            
            $fileBytes = [System.IO.File]::ReadAllBytes($tempPath)
            $boundary = [System.Guid]::NewGuid().ToString()
            
            # Build the multipart form data manually
            $newLine = "`r`n"
            $bodyLines = @(
                "--$boundary",
                "Content-Disposition: form-data; name=`"file`"; filename=`"image.jpg`"",
                "Content-Type: image/jpeg",
                "",
                [System.Convert]::ToBase64String($fileBytes),
                "--$boundary--"
            )
            
            # Join with newlines
            $body = [string]::Join($newLine, $bodyLines)
            
            # Convert to bytes
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
            
            $headers = @{
                "Authorization" = "Bearer $TOKEN"
                "Content-Type" = "multipart/form-data; boundary=$boundary"
            }
            
            $uploadResult = Invoke-RestMethod `
                -Uri "$API_BASE/api/menu/upload-image" `
                -Method Post `
                -Headers $headers `
                -Body $bytes
            
            Write-Host "  Upload successful" -ForegroundColor Gray
            
        } catch {
            Write-Host "  Upload failed" -ForegroundColor Red
            Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
            
            if ($_.ErrorDetails.Message) {
                Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
            }
            
            $failCount++
            if (Test-Path $tempPath) {
                Remove-Item $tempPath -Force
            }
            continue
        }
        
        # Update menu item with image URL
        try {
            Write-Host "  Updating menu item..." -ForegroundColor Gray
            
            $updateBody = @{
                name = $item.name
                description = $item.description
                price = $item.price
                categoryId = $item.categoryId
                isAvailable = $item.isAvailable
                inventoryItemId = $item.inventoryItemId
                imageUrl = $uploadResult.data
            } | ConvertTo-Json
            
            $updateHeaders = @{
                "Authorization" = "Bearer $TOKEN"
                "Content-Type" = "application/json"
            }
            
            $updateResponse = Invoke-RestMethod `
                -Uri "$API_BASE/api/menu/$($item.id)" `
                -Method Put `
                -Headers $updateHeaders `
                -Body $updateBody
            
            Write-Host "  Updated successfully!" -ForegroundColor Green
            $successCount++
            
        } catch {
            Write-Host "  Update failed" -ForegroundColor Red
            Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
            
            if ($_.ErrorDetails.Message) {
                Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
            }
            
            $failCount++
        }
        
        # Clean up temp file
        if (Test-Path $tempPath) { 
            Remove-Item $tempPath -Force 
        }
        
        # Small delay to avoid overwhelming the API
        Start-Sleep -Milliseconds 300
    }
    
    # Clean up temp directory
    if (Test-Path $tempDir) { 
        Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue 
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "SEEDING COMPLETE!" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Successfully updated: $successCount" -ForegroundColor Green
    Write-Host "Failed: $failCount" -ForegroundColor Red
    Write-Host "Skipped (no image): $skippedCount" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Yellow
}

Read-Host "`nPress Enter to exit"