# Analyze_MT5_Report.ps1 - Version finale pour rapports français
param ([string]$ReportPath)

if (-not $ReportPath) {
    $ReportPath = Get-ChildItem "C:\Users\LENOVO\Documents\Harestech\Script copy trading\strategies" -Filter "*.xlsx" | 
    Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName
}

if (-not (Test-Path $ReportPath)) {
    Write-Host "Fichier non trouvé: $ReportPath" -ForegroundColor Red
    exit
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  📊 ANALYSEUR MT5 - RAPPORT EXCEL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fichier: $([System.IO.Path]::GetFileName($ReportPath))`n" -ForegroundColor Gray

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

$workbook = $excel.Workbooks.Open($ReportPath)
$worksheet = $workbook.Sheets.Item(1)

$metrics = @{}

# Lire les 200 premières lignes pour capturer toutes les métriques
for ($row = 1; $row -le 200; $row++) {
    $label = $worksheet.Cells.Item($row, 1).Value2
    $value = $worksheet.Cells.Item($row, 2).Value2
    
    if ($label) {
        $label = $label.ToString().Trim()
        
        # Mapping français/anglais des métriques MT5
        if ($label -match "Nb.*trades|Total.*trades") { $metrics["TotalTrades"] = $value }
        if ($label -match "Nb.*positions|Short.*positions|Positions.*courtes") { $metrics["ShortTrades"] = $value }
        if ($label -match "Positions.*longues|Long.*positions") { $metrics["LongTrades"] = $value }
        if ($label -match "Transactions.*gagnantes|Profit.*trades") { $metrics["Wins"] = $value }
        if ($label -match "Transactions.*perdantes|Loss.*trades") { $metrics["Losses"] = $value }
        if ($label -match "Profit.*Total.*Net|Total.*net.*profit") { $metrics["NetProfit"] = $value }
        if ($label -match "Profit.*brut|Gross.*profit") { $metrics["GrossProfit"] = $value }
        if ($label -match "Perte.*brute|Gross.*loss") { $metrics["GrossLoss"] = $value }
        if ($label -match "Facteur.*profit|Profit.*factor") { $metrics["ProfitFactor"] = $value }
        if ($label -match "Espérance.*mathématique|Mathematical.*expectation") { $metrics["ExpectedPayoff"] = $value }
        if ($label -match "Drawdown.*absolu|Absolute.*drawdown") { $metrics["AbsoluteDD"] = $value }
        if ($label -match "Drawdown.*maximal|Maximal.*drawdown") { $metrics["MaximalDD"] = $value }
        if ($label -match "Drawdown.*relatif|Relative.*drawdown") { $metrics["RelativeDD"] = $value }
        if ($label -match "Dépôt.*initial|Initial.*deposit") { $metrics["InitialDeposit"] = $value }
        if ($label -match "Retrait.*totale|Total.*withdrawal") { $metrics["Withdrawals"] = $value }
        if ($label -match "Ratio.*Sharpe|Sharpe.*ratio") { $metrics["SharpeRatio"] = $value }
        if ($label -match "Facteur.*récupération|Recovery.*factor") { $metrics["RecoveryFactor"] = $value }
    }
}

# Calculer les métriques dérivées
$winRate = 0
$avgWin = 0
$avgLoss = 0

if ($metrics["TotalTrades"] -and $metrics["Wins"]) {
    $winRate = ($metrics["Wins"] / $metrics["TotalTrades"]) * 100
}

if ($metrics["Wins"] -and $metrics["GrossProfit"]) {
    $avgWin = $metrics["GrossProfit"] / $metrics["Wins"]
}

if ($metrics["Losses"] -and $metrics["GrossLoss"]) {
    $avgLoss = [Math]::Abs($metrics["GrossLoss"]) / $metrics["Losses"]
}

# Affichage des résultats
Write-Host "========================================" -ForegroundColor Green
Write-Host "  📈 PERFORMANCE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`nTrades:" -ForegroundColor Cyan
Write-Host "  Total              : $($metrics['TotalTrades'])"
Write-Host "  Gagnants           : $($metrics['Wins'])" -ForegroundColor Green
Write-Host "  Perdants           : $($metrics['Losses'])" -ForegroundColor Red
Write-Host "  Win Rate           : $("{0:N2}" -f $winRate)%" -ForegroundColor $(if ($winRate -ge 50) { "Green" } elseif ($winRate -ge 30) { "Yellow" } else { "Red" })

Write-Host "`nProfitabilité:" -ForegroundColor Cyan
$netProfitVal = if ($metrics["NetProfit"]) { [double]$metrics["NetProfit"] } else { 0 }
Write-Host "  Profit Net         : $("{0:N2}" -f $netProfitVal)" -ForegroundColor $(if ($netProfitVal -ge 0) { "Green" } else { "Red" })
Write-Host "  Profit Brut        : $("{0:N2}" -f $metrics['GrossProfit'])" -ForegroundColor Green
Write-Host "  Perte Brute        : $("{0:N2}" -f $metrics['GrossLoss'])" -ForegroundColor Red

$pfVal = if ($metrics["ProfitFactor"]) { [double]$metrics["ProfitFactor"] } else { 0 }
Write-Host "  Profit Factor      : $("{0:N2}" -f $pfVal)" -ForegroundColor $(if ($pfVal -ge 1.5) { "Green" } elseif ($pfVal -ge 1) { "Yellow" } else { "Red" })

Write-Host "  Gain Moyen         : $("{0:N2}" -f $avgWin)" -ForegroundColor Green
Write-Host "  Perte Moyenne      : $("{0:N2}" -f $avgLoss)" -ForegroundColor Red

Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "  📉 RISQUE" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

Write-Host "`nDrawdown:" -ForegroundColor Cyan
if ($metrics["MaximalDD"]) {
    Write-Host "  Maximal            : $($metrics['MaximalDD'])" -ForegroundColor Red
}
if ($metrics["RelativeDD"]) {
    Write-Host "  Relatif            : $($metrics['RelativeDD'])" -ForegroundColor Red
}
if ($metrics["AbsoluteDD"]) {
    Write-Host "  Absolu             : $($metrics['AbsoluteDD'])"
}

Write-Host "`nRatios:" -ForegroundColor Cyan
if ($metrics["SharpeRatio"]) {
    $sharpeVal = [double]$metrics["SharpeRatio"]
    Write-Host "  Sharpe Ratio       : $("{0:N2}" -f $sharpeVal)" -ForegroundColor $(if ($sharpeVal -ge 1) { "Green" } elseif ($sharpeVal -ge 0.5) { "Yellow" } else { "Red" })
}
if ($metrics["RecoveryFactor"]) {
    Write-Host "  Recovery Factor    : $("{0:N2}" -f $metrics['RecoveryFactor'])"
}
if ($metrics["ExpectedPayoff"]) {
    Write-Host "  Espérance Math     : $("{0:N2}" -f $metrics['ExpectedPayoff'])"
}

Write-Host "`n========================================" -ForegroundColor Cyan

$workbook.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
