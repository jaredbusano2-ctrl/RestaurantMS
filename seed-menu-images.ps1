# seed-menu-images.ps1
$API_BASE = "http://localhost:5000"

# Map menu items to image URLs
$menuImageMap = @{
    'Classic Burger' = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop'
    'Cheeseburger' = 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=300&fit=crop'
    'Double Cheeseburger' = 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop'
    'Bacon Cheeseburger' = 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop'
    'Chicken Burger' = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop'
    'Spicy Chicken Burger' = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop'
    'Hotdog Classic' = 'https://images.unsplash.com/photo-1571091718768-e1a6eb0ce0c8?w=400&h=300&fit=crop'
    '2pc Fried Chicken' = 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&h=300&fit=crop'
    '3pc Fried Chicken' = 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&h=300&fit=crop'
    'Chicken Wings (6pc)' = 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400&h=300&fit=crop'
    'Chicken Wings (12pc)' = 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400&h=300&fit=crop'
    'Grilled Chicken Fillet' = 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop'
    'Regular Fries' = 'https://images.unsplash.com/photo-1585101280961-ab7d9d1ebc12?w=400&h=300&fit=crop'
    'Large Fries' = 'https://images.unsplash.com/photo-1585101280961-ab7d9d1ebc12?w=400&h=300&fit=crop'
    'Cheese Fries' = 'https://images.unsplash.com/photo-1523592121529-f6dde35f079e?w=400&h=300&fit=crop'
    'Onion Rings' = 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400&h=300&fit=crop'
    'Mozzarella Sticks' = 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=400&h=300&fit=crop'
    'Garden Salad' = 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop'
    'Cola (Regular)' = 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=300&fit=crop'
    'Cola (Large)' = 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=300&fit=crop'
    'Iced Tea' = 'https://images.unsplash.com/photo-1558857563-c0c3a0b3b0c0?w=400&h=300&fit=crop'
    'Lemonade' = 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&h=300&fit=crop'
    'Bottled Water' = 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=400&h=300&fit=crop'
    'Iced Coffee' = 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop'
    'Hot Coffee' = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop'
    'Vanilla Sundae' = 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=400&h=300&fit=crop'
    'Chocolate Sundae' = 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop'
    'Apple Pie' = 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop'
    'Classic Combo' = 'https://images.unsplash.com/photo-1551326844-4df70f78d0e9?w=400&h=300&fit=crop'
    'Cheeseburger Combo' = 'https://images.unsplash.com/photo-1551326844-4df70f78d0e9?w=400&h=300&fit=crop'
    'Chicken Combo' = 'https://images.unsplash.com/photo-1551326844-4df70f78d0e9?w=400&h=300&fit=crop'
    'Family Bucket' = 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&h=300&fit=crop'
}

function Download-Image {
    param($url, $outputPath)
    $webClient = New-Object System.Net.WebClient
    $webClient.DownloadFile($url, $outputPath)
}

function Upload-Image {
    param($imagePath)
    $boundary = [System.Guid]::NewGuid().ToString()
    $fileBytes = [System.IO.File]::ReadAllBytes($imagePath)
    
    $header = "--$boundary`r`nContent-Disposition: form-data; name=`"file`"; filename=`"image.jpg`"`r`nContent-Type: image/jpeg`r`n`r`n"
    $footer = "`r`n--$boundary--`r`n"
    
    $bytes = [System.Text.Encoding]::ASCII.GetBytes($header)
    $bytes += $fileBytes
    $bytes += [System.Text.Encoding]::ASCII.GetBytes($footer)
    
    $headers = @{
        "Content-Type" = "multipart/form-data; boundary=$boundary"
        "Content-Length" = $bytes.Length
    }
    
    $response = Invoke-RestMethod -Uri "$API_BASE/api/menu/upload-image" -Method Post -Headers $headers -Body $bytes
    return $response.data
}

function Seed-MenuImages {
    Write-Host "Fetching menu items..." -ForegroundColor Cyan
    
    try {
        $response = Invoke-RestMethod -Uri "$API_BASE/api/menu" -Method Get
        $items = $response.data
        
        Write-Host "Found $($items.Count) menu items" -ForegroundColor Green
        
        $tempDir = Join-Path $env:TEMP "menu-images"
        if (!(Test-Path $tempDir)) {
            New-Item -ItemType Directory -Path $tempDir | Out-Null
        }
        
        $successCount = 0
        $failCount = 0
        
        foreach ($item in $items) {
            $imageUrl = $menuImageMap[$item.name]
            
            if (-not $imageUrl) {
                Write-Host "No image found for: $($item.name)" -ForegroundColor Yellow
                continue
            }
            
            try {
                Write-Host "Processing: $($item.name)..." -ForegroundColor Cyan
                
                $tempPath = Join-Path $tempDir "temp_$([System.Guid]::NewGuid().ToString()).jpg"
                Download-Image -url $imageUrl -outputPath $tempPath
                
                $uploadResult = Upload-Image -imagePath $tempPath
                
                $updateBody = @{
                    name = $item.name
                    description = $item.description
                    price = $item.price
                    categoryId = $item.categoryId
                    isAvailable = $item.isAvailable
                    inventoryItemId = $item.inventoryItemId
                    imageUrl = $uploadResult
                } | ConvertTo-Json
                
                $headers = @{
                    "Content-Type" = "application/json"
                }
                
                $updateResponse = Invoke-RestMethod -Uri "$API_BASE/api/menu/$($item.id)" -Method Put -Headers $headers -Body $updateBody
                
                Write-Host "✅ Updated: $($item.name)" -ForegroundColor Green
                $successCount++
                
                if (Test-Path $tempPath) {
                    Remove-Item $tempPath -Force
                }
                
                Start-Sleep -Milliseconds 500
                
            } catch {
                Write-Host "❌ Failed for $($item.name): $_" -ForegroundColor Red
                $failCount++
            }
        }
        
        Write-Host "`n=== Summary ===" -ForegroundColor Cyan
        Write-Host "✅ Successfully updated: $successCount" -ForegroundColor Green
        Write-Host "❌ Failed: $failCount" -ForegroundColor Red
        
        if (Test-Path $tempDir) {
            Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
        }
        
    } catch {
        Write-Host "❌ Error: $_" -ForegroundColor Red
    }
}

Write-Host "Starting menu image seeder..." -ForegroundColor Cyan
Write-Host "Make sure your server is running at $API_BASE" -ForegroundColor Yellow
$confirmation = Read-Host "Continue? (y/n)"

if ($confirmation -eq 'y') {
    Seed-MenuImages
} else {
    Write-Host "Operation cancelled." -ForegroundColor Yellow
}