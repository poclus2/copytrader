$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:3000/api/v1"

Write-Host "1. Creating Master..."
$masterBody = @{
    name = "Integration Master"
    broker = "binance"
    credentials = @{ apiKey = "test"; secret = "test" }
} | ConvertTo-Json

$masterResponse = Invoke-RestMethod -Uri "$baseUrl/masters" -Method Post -Body $masterBody -ContentType "application/json"
$masterId = $masterResponse.id
Write-Host "Master Created: $masterId"

Write-Host "2. Creating Slave..."
$slaveBody = @{
    name = "Integration Slave"
    broker = "metatrader"
    credentials = @{ login = "123"; password = "456"; server = "demo" }
    masterId = $masterId
    config = @{ mode = "FIXED_RATIO"; ratio = 0.5 }
} | ConvertTo-Json

$slaveResponse = Invoke-RestMethod -Uri "$baseUrl/slaves" -Method Post -Body $slaveBody -ContentType "application/json"
$slaveId = $slaveResponse.id
Write-Host "Slave Created: $slaveId"

Write-Host "3. Triggering Test Trade..."
$tradeBody = @{
    masterId = $masterId
    symbol = "BTCUSDT"
    side = "BUY"
    quantity = 1.0
} | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/copy/test" -Method Post -Body $tradeBody -ContentType "application/json"
Write-Host "Trade Triggered Successfully"

Write-Host "Integration Test Completed!"
