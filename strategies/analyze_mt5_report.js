// analyze_mt5_report.js - Analyseur de rapport MT5 Excel
const XLSX = require('xlsx');
const path = require('path');

// Couleurs console
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m'
};

function colorize(text, color) {
    return `${colors[color]}${text}${colors.reset}`;
}

// Charger le fichier Excel
const reportPath = process.argv[2] || path.join(__dirname, 'ReportTester-1520960185.xlsx');

console.log('\n========================================');
console.log(colorize('  📊 ANALYSEUR MT5 - RAPPORT EXCEL', 'cyan'));
console.log('========================================');
console.log(colorize(`Fichier: ${path.basename(reportPath)}\n`, 'gray'));

try {
    const workbook = XLSX.readFile(reportPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convertir en JSON pour accès facile
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    console.log(colorize(`Onglet: ${sheetName}`, 'gray'));
    console.log(colorize(`Lignes totales: ${data.length}\n`, 'gray'));

    // Extraire les métriques du résumé (lignes 1-120)
    const metrics = {};

    for (let i = 0; i < 120; i++) {
        const row = data[i];
        if (!row || !row[0]) continue;

        const label = String(row[0]).trim();
        const value = row[1];

        // Mapping des métriques françaises
        if (label.match(/Nb.*trades/i)) metrics.totalTrades = value;
        if (label.match(/Transactions.*gagnantes/i)) metrics.wins = value;
        if (label.match(/Transactions.*perdantes/i)) metrics.losses = value;
        if (label.match(/Profit.*Total.*Net/i)) metrics.netProfit = value;
        if (label.match(/Profit.*brut/i)) metrics.grossProfit = value;
        if (label.match(/Perte.*brute/i)) metrics.grossLoss = value;
        if (label.match(/Facteur.*profit/i)) metrics.profitFactor = value;
        if (label.match(/Drawdown.*maximal/i)) metrics.maximalDD = value;
        if (label.match(/Drawdown.*relatif/i)) metrics.relativeDD = value;
        if (label.match(/Drawdown.*absolu/i)) metrics.absoluteDD = value;
        if (label.match(/Ratio.*Sharpe/i)) metrics.sharpeRatio = value;
        if (label.match(/Facteur.*récupération/i)) metrics.recoveryFactor = value;
        if (label.match(/Espérance.*mathématique/i)) metrics.expectedPayoff = value;
    }

    // Analyser le carnet d'ordres (à partir de la ligne 122)
    console.log(colorize('\n🔍 Analyse du carnet d\'ordres...', 'yellow'));

    const orders = [];
    let headerRow = -1;

    // Trouver l'en-tête du carnet d'ordres
    for (let i = 120; i < 130; i++) {
        const row = data[i];
        if (row && row[0] && String(row[0]).match(/Temps|Time|#/i)) {
            headerRow = i;
            break;
        }
    }

    if (headerRow > 0) {
        console.log(colorize(`En-tête trouvé à la ligne ${headerRow + 1}`, 'gray'));

        // Parser les ordres
        for (let i = headerRow + 1; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length < 5) continue;

            // Structure typique: [Temps, Ticket, Type, Volume, Symbole, Prix, S/L, T/P, Profit, ...]
            const order = {
                time: row[0],
                ticket: row[1],
                type: row[2],
                volume: parseFloat(row[3]) || 0,
                symbol: row[4],
                price: parseFloat(row[5]) || 0,
                sl: parseFloat(row[6]) || 0,
                tp: parseFloat(row[7]) || 0,
                profit: parseFloat(row[8]) || 0
            };

            if (order.ticket && !isNaN(order.profit)) {
                orders.push(order);
            }
        }

        console.log(colorize(`Ordres parsés: ${orders.length}\n`, 'green'));
    }

    // Calculs avancés à partir du carnet d'ordres
    let wins = 0;
    let losses = 0;
    let totalProfit = 0;
    let totalLoss = 0;
    let maxDD = 0;
    let balance = 10000; // Dépôt initial par défaut
    let peak = balance;
    const dailyPnL = {};

    orders.forEach(order => {
        if (order.profit > 0) {
            wins++;
            totalProfit += order.profit;
        } else if (order.profit < 0) {
            losses++;
            totalLoss += Math.abs(order.profit);
        }

        balance += order.profit;
        if (balance > peak) peak = balance;

        const dd = ((peak - balance) / peak) * 100;
        if (dd > maxDD) maxDD = dd;

        // Daily PnL
        if (order.time) {
            const date = String(order.time).split(' ')[0];
            if (!dailyPnL[date]) dailyPnL[date] = 0;
            dailyPnL[date] += order.profit;
        }
    });

    const winRate = orders.length > 0 ? (wins / orders.length) * 100 : 0;
    const avgWin = wins > 0 ? totalProfit / wins : 0;
    const avgLoss = losses > 0 ? totalLoss / losses : 0;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : 0;

    // Affichage des résultats
    console.log('========================================');
    console.log(colorize('  📈 PERFORMANCE', 'green'));
    console.log('========================================\n');

    console.log(colorize('Trades:', 'cyan'));
    console.log(`  Total              : ${metrics.totalTrades || orders.length}`);
    console.log(colorize(`  Gagnants           : ${metrics.wins || wins}`, 'green'));
    console.log(colorize(`  Perdants           : ${metrics.losses || losses}`, 'red'));

    const wrColor = winRate >= 50 ? 'green' : winRate >= 30 ? 'yellow' : 'red';
    console.log(colorize(`  Win Rate           : ${winRate.toFixed(2)}%`, wrColor));

    console.log(colorize('\nProfitabilité:', 'cyan'));
    const netProfit = metrics.netProfit || (totalProfit - totalLoss);
    const npColor = netProfit >= 0 ? 'green' : 'red';
    console.log(colorize(`  Profit Net         : ${netProfit.toFixed(2)}`, npColor));
    console.log(colorize(`  Profit Brut        : ${(metrics.grossProfit || totalProfit).toFixed(2)}`, 'green'));
    console.log(colorize(`  Perte Brute        : ${(metrics.grossLoss || -totalLoss).toFixed(2)}`, 'red'));

    const pf = metrics.profitFactor || profitFactor;
    const pfColor = pf >= 1.5 ? 'green' : pf >= 1 ? 'yellow' : 'red';
    console.log(colorize(`  Profit Factor      : ${pf.toFixed(2)}`, pfColor));

    console.log(colorize(`  Gain Moyen         : ${avgWin.toFixed(2)}`, 'green'));
    console.log(colorize(`  Perte Moyenne      : ${avgLoss.toFixed(2)}`, 'red'));

    console.log('\n========================================');
    console.log(colorize('  📉 RISQUE', 'yellow'));
    console.log('========================================\n');

    console.log(colorize('Drawdown:', 'cyan'));
    if (metrics.maximalDD) {
        console.log(colorize(`  Maximal            : ${metrics.maximalDD}`, 'red'));
    } else {
        console.log(colorize(`  Maximal (calculé)  : ${maxDD.toFixed(2)}%`, 'red'));
    }
    if (metrics.relativeDD) {
        console.log(colorize(`  Relatif            : ${metrics.relativeDD}`, 'red'));
    }
    if (metrics.absoluteDD) {
        console.log(`  Absolu             : ${metrics.absoluteDD}`);
    }

    console.log(colorize('\nRatios:', 'cyan'));
    if (metrics.sharpeRatio) {
        const sr = parseFloat(metrics.sharpeRatio);
        const srColor = sr >= 1 ? 'green' : sr >= 0.5 ? 'yellow' : 'red';
        console.log(colorize(`  Sharpe Ratio       : ${sr.toFixed(2)}`, srColor));
    }
    if (metrics.recoveryFactor) {
        console.log(`  Recovery Factor    : ${parseFloat(metrics.recoveryFactor).toFixed(2)}`);
    }
    if (metrics.expectedPayoff) {
        console.log(`  Espérance Math     : ${parseFloat(metrics.expectedPayoff).toFixed(2)}`);
    }

    // Max Daily Loss
    const dailyPnLValues = Object.values(dailyPnL);
    if (dailyPnLValues.length > 0) {
        const maxDailyLoss = Math.min(...dailyPnLValues);
        console.log(colorize(`  Max Daily Loss     : ${maxDailyLoss.toFixed(2)}`, 'red'));
    }

    console.log('\n========================================\n');
    console.log(colorize('✅ Analyse terminée', 'green'));

} catch (error) {
    console.error(colorize(`\n❌ Erreur: ${error.message}`, 'red'));
    console.log(colorize('\nInstallation requise:', 'yellow'));
    console.log('  npm install xlsx');
    process.exit(1);
}
