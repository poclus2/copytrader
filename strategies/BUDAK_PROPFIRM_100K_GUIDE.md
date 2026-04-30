# 📊 BUDAK PROPFIRM SAFE MT5 - GUIDE $100K

## 🎯 Vue d'ensemble

**Fichier**: `Budak_PropFirm_Safe.mq5`
**Type**: Grid/Averaging with PropFirm Protection
**Capital optimisé**: $100,000
**Platform**: MetaTrader 5
**PropFirm**: FTMO/MFF/E8 Compliant

---

## 💼 OPTIMISATION $100K

### 📊 Paramètres Adaptés

```
Capital: $100,000
Starting Lots: 0.10 (vs 0.01 pour $10k)
Max Trades: 6
Multiplier: 1.1
PipStep: 80 pips
TakeProfit: 80 pips
StopLoss: 300 pips
```

### 💰 Exposition Maximale (6 Trades)

| Trade | Lot | Prix | Lot Total | Valeur |
|-------|-----|------|-----------|--------|
| 1 | 0.10 | 2650 | 0.10 | $265 |
| 2 | 0.11 | 2570 | 0.21 | $540 |
| 3 | 0.121 | 2490 | 0.331 | $824 |
| 4 | 0.133 | 2410 | 0.464 | $1,118 |
| 5 | 0.146 | 2330 | 0.610 | $1,421 |
| 6 | 0.161 | 2250 | 0.771 | $1,735 |

**Max Exposition**: 0.771 lots = $1,735
**Max DD Floating**: ~$3,000-4,000 (400 pips × 0.771 lots)
**% Account**: ~3-4% max DD floating

---

## 🏦 PROTECTIONS PROPFIRM

### ✅ Limites Strictes
- **Daily Loss**: 4% ($4,000 max)
- **Total DD**: 8% ($8,000 max)
- **Daily Target**: 2.5% ($2,500)
- **Max Trades**: 6 positions
- **Multiplier**: x1.1 (safe)

### 🛡️ Protections Actives
- ✅ Auto-close si daily loss > 4%
- ✅ Auto-close si total DD > 8%
- ✅ Stop trading si profit > 2.5%/jour
- ✅ News filter (NFP/FOMC/CPI ± 20min)
- ✅ Weekend close vendredi 20h
- ✅ Stop loss effectif 300 pips

---

## 📈 PERFORMANCE ATTENDUE ($100K)

### Scénario Conservative (Range Market)
```
Jour 1: 4 trades → +$1,800 (1.8%)
Jour 2: 5 trades → +$2,200 (2.2%)
Jour 3: 3 trades → +$1,500 (1.5%)
Jour 4: 6 trades → +$2,500 (2.5% - target hit, stop)
Jour 5: 5 trades → +$2,000 (2.0%)

Semaine 1: +$10,000 (+10% ✅)
```

### Scénario Réaliste
```
Semaine 1: +$2,500 (2.5%)
Semaine 2: -$1,000 (-1%) [trending week]
Semaine 3: +$3,000 (3%)
Semaine 4: +$2,500 (2.5%)
Semaine 5: +$3,000 (3%)

Total: +$10,000 (+10%) en 5 semaines
Phase 1 FTMO: PASSED ✅
```

---

## ⚙️ CONFIGURATION RECOMMANDÉE

### Pour Phase 1 FTMO (10%)
```
UsePropFirmMode = true
AccountSize = 100000
MaxDailyLossPct = 4.0
MaxTotalDDPct = 8.0
DailyProfitTarget = 2.5

StartingLots = 0.10
MaxTrades = 6
Multiplier = 1.1
PipStep = 80
TakeProfit = 80
StopLoss = 300

AvoidNewsEvents = true
NewsBufferMinutes = 20
CloseBeforeWeekend = true
```

### Pour Phase 2 FTMO (5%)
```
// RÉDUIRE RISK
StartingLots = 0.08
MaxTrades = 5
DailyProfitTarget = 1.5

// GARDER LE RESTE IDENTIQUE
```

---

## 📊 CALCUL LOTS ADAPTÉ AU CAPITAL

| Capital | Starting Lots | Max Trades | Max Exposure | Max DD |
|---------|---------------|------------|--------------|--------|
| $10k | 0.01 | 6 | 0.077 lots | $300 |
| $25k | 0.025 | 6 | 0.19 lots | $750 |
| $50k | 0.05 | 6 | 0.39 lots | $1,500 |
| **$100k** | **0.10** | **6** | **0.77 lots** | **$3,000** |
| $200k | 0.20 | 6 | 1.54 lots | $6,000 |

**Formule**: `StartingLots = AccountSize / 1,000,000`

---

## 🎯 STRATÉGIE D'UTILISATION

### Semaine 1-2: AGGRESSIVE
```
Objectif: +2-2.5%/jour
Laisser tourner en full M5
Monitoring: 2x/jour
```

### Si +7-8% Atteint:
```
BASCULER CONSERVATIVE:
- Réduire StartingLots à 0.08
- Réduire MaxTrades à 5
- DailyProfitTarget à 1.5%
→ Sécuriser les derniers 2-3%
```

### Si DD > 5%:
```
PAUSE 24H
Analyser les trades
Vérifier si marché = trending
Redémarrer avec StartingLots 0.08
```

---

## 📰 NEWS À ÉVITER

### 🔴 Critiques (Auto-paused ±20min)
- NFP (1er vendredi)
- FOMC Rate Decision
- CPI US
- Fed Chair Speech

### ⚠️ Recommandé Éviter (Manuel)
- ECB Rate Decision
- BOE Rate Decision
- Retail Sales US
- GDP Releases

---

## 📊 DASHBOARD TEMPS RÉEL

### Exemple Affichage
```
========== 🏦 BUDAK PROPFIRM DASHBOARD ==========
Type: FTMO | Account: $100000
Trades Today: 4 | Max: 6
-------------------------------------------
📊 DAILY: $1,850.00 (1.85%)
  Limit: 4.0% | Target: 2.5%
-------------------------------------------
📉 DD: 1.20% | Max: 8.0%
  Peak: $101,850.00
-------------------------------------------
⚡ STATUS: ✅ ACTIVE
==========================================
```

### Status Possibles
- ✅ **ACTIVE**: Trading autorisé
- 🔒 **PAUSED**: Limite daily atteinte
- ❌ **DISABLED**: DD total dépassé
- 📰 **NEWS PAUSE**: News time

---

## ⚠️ ALERTES IMPORTANTES

### ❌ Daily Loss Atteint
```
❌ DAILY LOSS LIMIT: -4.02%
→ Toutes positions fermées
→ Trading disabled jusqu'à demain
→ NORMAL, c'est la protection
```

### ❌ Total DD Dépassé
```
❌ TOTAL DD EXCEEDED: 8.15%
→ Trading DÉFINITIVEMENT arrêté
→ ANALYSER pourquoi
→ NE PAS redémarrer sans comprendre
```

### ✅ Profit Target Atteint
```
✅ PROFIT TARGET REACHED: 2.53%
→ Trading paused pour la journée
→ EXCELLENT, gains préservés
→ Reprendra demain
```

---

## 🔧 TROUBLESHOOTING

### EA ne prend pas de trades
1. Vérifier `UsePropFirmMode = true`
2. Check Dashboard status (ACTIVE ?)
3. Vérifier heure (news time ?)
4. Vérifier RSI conditions (36/56)

### Trop de trades ouverts (>6)
```
→ IMPOSSIBLE avec PropFirm Safe
→ Si ça arrive = bug, contacter dev
→ Fermer manuellement excédent
```

### DD augmente vite
```
1. Vérifier marché (trending ?)
2. Réduire StartingLots à 0.08
3. Réduire MaxTrades à 5
4. Augmenter PipStep à 100
```

---

## 🆚 COMPARAISON CAPITAL

| Setup | Capital | Lots | Profit/Trade | Daily Target |
|-------|---------|------|--------------|--------------|
| Mini | $10k | 0.01 | $50-100 | $250/jour |
| Moyen | $50k | 0.05 | $250-500 | $1,250/jour |
| **PropFirm** | **$100k** | **0.10** | **$500-1k** | **$2,500/jour** |
| Large | $200k | 0.20 | $1k-2k | $5,000/jour |

---

## ✅ CHECKLIST AVANT UTILISATION

- [ ] Account Size = 100000
- [ ] UsePropFirmMode = true
- [ ] StartingLots = 0.10
- [ ] MaxTrades = 6
- [ ] Multiplier = 1.1
- [ ] AvoidNewsEvents = true
- [ ] CloseBeforeWeekend = true
- [ ] Dashboard s'affiche
- [ ] Backtest 3 mois → DD < 6%
- [ ] News calendar vérifié

---

## 🎯 OBJECTIFS PROPFIRM

### Phase 1 (10% = $10,000)
- **Durée visée**: 2-4 semaines
- **Daily target**: $2,500/jour
- **Trades/semaine**: 15-25
- **DD max**: < 5%

### Phase 2 (5% = $5,000)
- **Durée visée**: 2-3 semaines
- **Daily target**: $1,500/jour
- **Risk**: Réduit (0.08 lots)
- **DD max**: < 3%

### Funded ($100k)
- **Objectif**: Croissance stable
- **Daily**: $1,000-2,000
- **Consistency**: Priorité

---

## 💡 CONSEILS PRO $100K

### ✅ FAIRE
- Backtester 3 mois minimum
- Demo 2 semaines avant live
- Surveiller dashboard 2x/jour
- Noter chaque trade
- Analyser les losses
- Préserver capital

### ❌ NE PAS FAIRE
- Ne pas augmenter Multiplier > 1.2
- Ne pas désactiver PropFirm mode
- Ne pas trader pendant news
- Ne pas overtrade manuellement
- Ne pas ignorer alertes DD

---

## 🚀 RÉSUMÉ

**Budak PropFirm Safe MT5** pour $100k:
- ✅ Grid/Averaging sécurisé
- ✅ PropFirm compliant (FTMO/MFF/E8)
- ✅ DD contrôlé: 4% daily, 8% total
- ✅ Lots optimisés: 0.10 starting
- ✅ News filter + Weekend close
- ✅ Dashboard temps réel

**Performance attendue**:
- 📈 +10-15%/mois (range market)
- 📉 DD max: 5-6% (protected 8%)
- 💰 $2,500/jour target Phase 1
- ⏱️ 2-4 semaines Phase 1

**Ready to trade! 🚀**

---

## 📞 SUPPORT

Questions? Check:
1. Dashboard status
2. Logs MT5
3. News calendar
4. PropFirm plan doc

**Bon trading ! 💪**
