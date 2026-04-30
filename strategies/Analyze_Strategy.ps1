# Analyze_Strategy.ps1 - Optimized for large log files
param (
    [string]$LogPath
)

if (-not $LogPath) {
    $LogPath = Get-ChildItem "$env:APPDATA\MetaQuotes\Terminal\*\Tester\logs\*.log" | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -First 1 -ExpandProperty FullName
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  MT5 STRATEGY ANALYZER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Log: $LogPath`n" -ForegroundColor Gray

# Initialize counters
$initialBalance = 10000
$balance = $initialBalance
$peakBalance = $balance
$relativeDD = 0

$wins = 0
$losses = 0
$totalProfit = 0.0
$totalLoss = 0.0
$dailyPnL = @{}

# Use Select-String for efficient large file processing
$pattern = "(\d{4}\.\d{2}\.\d{2}\s+\d{2}:\d{2}:\d{2}).*profit\s+([-]?\d+\.\d{2})"
$matches = Select-String -Path $LogPath -Pattern $pattern -AllMatches

$totalTrades = $matches.Count
Write-Host "Processing $totalTrades trades..." -ForegroundColor Yellow

foreach ($match in $matches) {
    if ($match.Line -match $pattern) {
        $timeStr = $Matches[1]
        $profit = [double]$Matches[2]
        
        $datePart = $timeStr.Split(" ")[0]
        
        # Update balance
        $balance += $profit
        
        # Track peak
        if ($balance -gt $peakBalance) { $peakBalance = $balance }
        
        # Calculate DD
        if ($peakBalance -gt 0) {
            $dd = ($peakBalance - $balance) / $peakBalance * 100.0
            if ($dd -gt $relativeDD) { $relativeDD = $dd }
        }
        
        # Daily PnL
        if (-not $dailyPnL.ContainsKey($datePart)) { $dailyPnL[$datePart] = 0 }
        $dailyPnL[$datePart] += $profit
        
        # Win/Loss stats
        if ($profit -gt 0) {
            $wins++
            $totalProfit += $profit
        }
        elseif ($profit -lt 0) {
            $losses++
            $totalLoss += $profit
        }
    }
}

# Calculate metrics
$winRate = if ($totalTrades -gt 0) { ($wins / $totalTrades) * 100.0 } else { 0 }
$profitFactor = if ([math]::Abs($totalLoss) -gt 0) { $totalProfit / [math]::Abs($totalLoss) } else { 0 }
$netProfit = $balance - $initialBalance
$avgWin = if ($wins -gt 0) { $totalProfit / $wins } else { 0 }
$avgLoss = if ($losses -gt 0) { $totalLoss / $losses } else { 0 }

# Max Daily DD
$minDailyPnL = 0
foreach ($d in $dailyPnL.Keys) {
    if ($dailyPnL[$d] -lt $minDailyPnL) { $minDailyPnL = $dailyPnL[$d] }
}
$maxDailyDD = [math]::Abs($minDailyPnL)

# Recovery Factor
$recoveryFactor = if ($relativeDD -gt 0) { ($netProfit / $initialBalance * 100) / $relativeDD } else { 0 }

# Sharpe Ratio (simplified - using daily returns)
$dailyReturns = @()
foreach ($d in $dailyPnL.Keys | Sort-Object) {
    $dailyReturns += $dailyPnL[$d]
}
$avgDailyReturn = if ($dailyReturns.Count -gt 0) { ($dailyReturns | Measure-Object -Average).Average } else { 0 }
$stdDailyReturn = if ($dailyReturns.Count -gt 1) { 
    $mean = $avgDailyReturn
    $variance = ($dailyReturns | ForEach-Object { [math]::Pow($_ - $mean, 2) } | Measure-Object -Average).Average
    [math]::Sqrt($variance)
}
else { 1 }
$sharpeRatio = if ($stdDailyReturn -gt 0) { ($avgDailyReturn / $stdDailyReturn) * [math]::Sqrt(252) } else { 0 }

# Display results
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  📊 PERFORMANCE METRICS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`nTotal Trades       : $totalTrades"
Write-Host "Wins               : $wins" -ForegroundColor Green
Write-Host "Losses             : $losses" -ForegroundColor Red
Write-Host "Win Rate           : $("{0:N2}" -f $winRate)%" -ForegroundColor $(if ($winRate -ge 50) { "Green" } else { "Red" })
Write-Host "Net Profit         : `$$("{0:N2}" -f $netProfit)" -ForegroundColor $(if ($netProfit -ge 0) { "Green" } else { "Red" })
Write-Host "Profit Factor      : $("{0:N2}" -f $profitFactor)" -ForegroundColor $(if ($profitFactor -ge 1.5) { "Green" } elseif ($profitFactor -ge 1) { "Yellow" } else { "Red" })
Write-Host "Avg Win            : `$$("{0:N2}" -f $avgWin)" -ForegroundColor Green
Write-Host "Avg Loss           : `$$("{0:N2}" -f $avgLoss)" -ForegroundColor Red

Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "  📉 RISK METRICS" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

Write-Host "`nMax Drawdown       : $("{0:N2}" -f $relativeDD)%" -ForegroundColor $(if ($relativeDD -lt 10) { "Green" } elseif ($relativeDD -lt 20) { "Yellow" } else { "Red" })
Write-Host "Max Daily Loss     : `$$("{0:N2}" -f $maxDailyDD)" -ForegroundColor Red
Write-Host "Recovery Factor    : $("{0:N2}" -f $recoveryFactor)"
Write-Host "Sharpe Ratio       : $("{0:N2}" -f $sharpeRatio)" -ForegroundColor $(if ($sharpeRatio -ge 1) { "Green" } elseif ($sharpeRatio -ge 0.5) { "Yellow" } else { "Red" })

Write-Host "`n========================================`n" -ForegroundColor Cyan
