# 🔥 GOLDSNIPEREA M5 ULTRA-AGGRESSIVE - GUIDE D'UTILISATION

## 🎯 Présentation

**GoldSniperEA_PropFirm_M5_Aggressive.mq5** est la version HAUTE FRÉQUENCE optimisée pour les traders agressifs voulant atteindre rapidement les objectifs PropFirm.

### ⚡ Mode HIGH FREQUENCY (M5)

```
Timeframe           : M5 (Bougies de 5 minutes)
Trades attendus/jour: 10-25 trades
Objectif daily      : 2-3% par jour
Durée Phase 1 (10%) : 3-5 jours
```

---

## 📊 PARAMÈTRES M5 AGGRESSIVE (Par défaut)

### 🎯 Trading Setup
```mql5
Timeframe = PERIOD_M5                   // ⚡ M5 - Haute fréquence
Min_Confirmations = 2                    // ⚡ Seulement 2 confirmations
Max_Positions = 3                        // ⚡ 3 positions simultanées
Max_Simultaneous_Trades = 3              // ⚡ 3 trades en parallèle
max_trades_per_candle = 3                // ⚡ 3 trades par bougie M5
Require_MainTrend_Alignment = false      // ⚡ Désactivé (plus de signaux)
```

### 💰 Risk Management
```mql5
PropFirm_Risk_Per_Trade = 1.0%           // ⚡ 1% par trade (MAX)
PropFirm_Max_Positions = 3               // ⚡ 3 positions max
Max_Lot_Size = 0.5                       // ⚡ Lot max augmenté
Max_Position_Volume = 2.0                // ⚡ Volume total max: 2 lots

// Exposition maximale théorique: 1% × 3 = 3%
```

### ⏰ Sessions Étendues
```mql5
London Session    : 07:00 - 17:00        // ⚡ 10 heures
New York Session  : 13:00 - 21:00        // ⚡ ACTIVÉ (8 heures)
Tokyo/Sydney      : DÉSACTIVÉ            // ⚠️ Trop volatile
```
**Total heures de trading : 14 heures/jour** (overlap London/NY)

### 🎯 Objectifs
```mql5
Daily_Profit_Target = 3.0%               // ⚡ Stop à +3%/jour
Max_Daily_Loss = 4.0%                    // ✅ Limite stricte -4%
Max_Total_DD = 8.0%                      // ✅ Limite stricte -8%
```

### 📰 News Filter (Ajusté)
```mql5
News_Buffer_Minutes = 10                 // ⚡ Seulement 10min (vs 30min)
```
**Rationale** : En M5, on veut maximiser les trades. 10min suffisent pour éviter le spike initial.

---

## 📈 PERFORMANCE ATTENDUE

### 🔥 Scénario Optimal
```
Jour 1: 15 trades → +3.0% (Target atteint, stop)
Jour 2: 18 trades → +3.0% (Target atteint)
Jour 3: 12 trades → +2.5% 
Jour 4: 14 trades → +2.0%
Total : 59 trades → +10.5% ✅ Phase 1 passée en 4 jours
```

### ⚠️ Scénario Réaliste (avec losses)
```
Jour 1: 20 trades (12W/8L) → +2.2%
Jour 2: 18 trades (11W/7L) → +2.5%
Jour 3: 15 trades (9W/6L) → +1.8%
Jour 4: 17 trades (10W/7L) → +2.1%
Jour 5: 14 trades (8W/6L) → +1.6%
Total : 84 trades → +10.2% ✅ Phase 1 en 5 jours
```

### 🔴 Scénario Risqué
```
Jour 1: 22 trades → +3.5% (drawdown -2%)
Jour 2: 18 trades → -2.8% (mauvaise journée)
Jour 3: 20 trades → +3.0%
Jour 4: 25 trades → +4.2% (drawdown -3.5%)
Jour 5: 15 trades → +2.5%
Total : 100 trades → +10.4% mais DD max: -3.5%
```
**Risque** : Volatilité élevée. Possible de toucher -4% daily limit.

---

## ⚠️ RISQUES & MITIGATION

### 🔴 Risques Augmentés (M5)

1. **Faux Signaux** : M5 génère beaucoup de bruit
2. **Slippage** : Execution plus sensible au spread
3. **Overtrading** : 3 positions × 1% = 3% d'exposition simultanée
4. **Stress Mental** : 15-25 trades/jour demande surveillance
5. **Commissions** : Plus de trades = plus de frais

### ✅ Protections Actives

1. **Daily Loss -4%** : Arrêt automatique si pertes dépassent 4%
2. **Total DD -8%** : Arrêt permanent si drawdown dépasse 8%
3. **Daily Target +3%** : Arrêt automatique si profit atteint (préserve gains)
4. **News Filter** : Évite NFP/FOMC/CPI (même avec 10min buffer)
5. **Weekend Close** : Fermeture auto vendredi 20h
6. **Max 3 positions** : Empêche surexposition

---

## 🎓 STRATÉGIE OPTIMALE M5

### ✅ PHASE 1 : Jours 1-3 (AGGRESSIVE)
```
Objectif  : +3%/jour
Strategy  : Laisser tourner en M5 full
Risk      : 1% par trade
Sessions  : London + NY (7h-21h)
Monitoring: Check dashboard toutes les 2h
```

### ⚖️ PHASE 2 : Jours 4-5 (CONSOLIDATION)
Si vous avez déjà +7-8% :
```
Objectif  : +0.5-1%/jour (sécuriser)
Strategy  : PASSER EN H1 ou réduire confirmations à 3
Risk      : Réduire à 0.5% si proche de 10%
```

---

## 🔧 AJUSTEMENTS EN TEMPS RÉEL

### Si DD > 3% (Warning)
```mql5
PropFirm_Risk_Per_Trade = 0.75%          // Réduire risk
Min_Confirmations = 3                     // Plus strict
PropFirm_Max_Positions = 2                // Moins de positions
```

### Si 3 Pertes Consécutives
```
1. PAUSE 1 heure
2. Vérifier dashboard : DD actuel ?
3. Réduire Risk à 0.5% temporairement
4. Augmenter Min_Confirmations à 3
```

### Si +8% atteint en 3 jours
```
BASCULER EN MODE CONSERVATIVE:
- Timeframe = PERIOD_H1
- Risk = 0.5%
- Min_Confirmations = 5
→ Objectif: Sécuriser les 2% restants
```

---

## 🕐 HEURES OPTIMALES (M5)

### 🔥 BEST (London + NY Overlap)
```
13:00 - 17:00 GMT
→ Plus de volatilité + volume
→ 60-70% des signaux attendus ici
```

### ✅ GOOD (London Morning / NY Afternoon)
```
07:00 - 13:00 GMT (London)
17:00 - 21:00 GMT (NY)
→ 30-40% des signaux
```

### ⚠️ ÉVITER
```
06:00 - 07:00 (Roll-over / faible volume)
21:00 - 23:00 (Clôture NY / erratique)
```

---

## 📊 MONITORING DASHBOARD

### KPIs à Surveiller (M5)

```
========== 🔥 M5 AGGRESSIVE DASHBOARD ==========
Type: FTMO | Timeframe: M5
Trading Days: 2 | Trades Today: 18 ⚡
-------------------------------------------
📊 DAILY PERFORMANCE:
  Today PnL: $2,850.00 (2.85%)
  Daily Loss Limit: 4.0% | Buffer: 6.85%
  Daily Profit Target: 3.0% | Progress: 95% 🎯
-------------------------------------------
📉 DRAWDOWN:
  Current DD: 1.20% ✅
  Max Allowed: 8.0% | Buffer: 6.80%
  Peak Balance: $102,850.00
-------------------------------------------
💰 TOTAL PROFIT: $2,850.00
⚡ STATUS: ✅ ACTIVE (18 trades today)
⏰ Next Target: +$150 → Daily limit reached
==========================================
```

### Alertes Critiques

```
⚠️ WARNING: DD approaching 3% → Consider reducing risk
❌ ALERT: 3 consecutive losses detected → Manual review required
✅ PROFIT TARGET 90%: Only $300 to go, EOD approaching
🔒 TRADING PAUSED: Daily target +3% reached at 14:32
```

---

## ✅ CHECKLIST M5 AGGRESSIVE

### Avant de Démarrer
- [ ] Backtest M5 sur 1 mois → DD < 5%
- [ ] Test démo 3 jours → Min 30 trades
- [ ] Dashboard affiche correctement
- [ ] VPS/PC stable (uptime 24/7)
- [ ] Spread < 20 points sur XAUUSD
- [ ] News calendar vérifié (semaine)

### Daily Monitoring
- [ ] Check dashboard matin (08:00)
- [ ] Check dashboard midi (13:00)
- [ ] Check dashboard soir (19:00)
- [ ] Vérifier DD < 3%
- [ ] Compter trades effectués
- [ ] Noter Win Rate du jour

### Si Problème
- [ ] DD > 4% → STOP immédiat et analyse
- [ ] Win Rate < 40% → Réduire risk ou pause
- [ ] 5 losses consécutives → Pause 2h
- [ ] Slippage excessif → Changer broker

---

## 🆚 COMPARAISON VERSIONS

| Critère | H1 Conservative | M15 Aggressive | **M5 Ultra-Aggressive** |
|---------|-----------------|----------------|-------------------------|
| **Timeframe** | H1 | M15 | **M5 ⚡** |
| **Trades/Jour** | 1-3 | 5-10 | **15-25 🔥** |
| **Risk/Trade** | 0.5% | 0.75% | **1.0% MAX** |
| **Max Positions** | 1 | 2 | **3** |
| **Sessions** | London | London + NY | **London + NY Full** |
| **Daily Target** | 1.5% | 2.5% | **3.0%** |
| **Durée Phase 1** | 7-10j | 5-7j | **3-5j ⚡** |
| **DD Moyen** | 2-3% | 3-5% | **4-6% ⚠️** |
| **Monitoring** | 1x/jour | 2x/jour | **3-4x/jour** |
| **Difficulté** | ⭐⭐ | ⭐⭐⭐ | **⭐⭐⭐⭐⭐** |

---

## 💡 CONSEILS PRO

### ✅ FAIRE
- **Backtester 1 mois minimum** avant challenge
- **Tester en démo 1 semaine** pour valider
- **Surveiller le dashboard** toutes les 2-3h
- **Prendre des notes** (journal de trades)
- **Avoir un plan B** (switch vers H1 si besoin)

### ❌ NE PAS FAIRE
- **Ne pas overtrade** manuellement en parallèle
- **Ne pas modifier** les limites DD en live
- **Ne pas paniquer** sur 2-3 pertes
- **Ne pas désactiver** PropFirm mode
- **Ne pas ignorer** les alertes dashboard

---

## 🎯 POUR QUI EST CE MODE ?

### ✅ Idéal Si
- Vous voulez passer Phase 1 en **3-5 jours**
- Vous pouvez **surveiller** l'EA plusieurs fois/jour
- Vous avez un **VPS stable** 24/7
- Vous êtes **à l'aise avec la volatilité**
- Votre **broker a des spreads serrés** (< 15 points XAUUSD)

### ❌ Éviter Si
- Vous préférez du **set & forget**
- Vous voulez un **DD minimal** (< 3%)
- Vous ne pouvez **pas surveiller** régulièrement
- Vous êtes en **challenge réel** pour la première fois
- Votre connexion est **instable**

---

## 🚀 RÉSUMÉ

**GoldSniperEA_PropFirm_M5_Aggressive** = Version TURBO pour :
- ⚡ **15-25 trades/jour** sur M5
- 🎯 **3%/jour** objectif (10% en 3-5 jours)
- 🔥 **3 positions** simultanées à 1% chacune
- ⏰ **14h de trading**/jour (London + NY)
- 📊 **Monitoring actif** requis

**Prêt à être agressif ? 🔥⚡**

---

## 📞 SUPPORT

En cas de problème :
1. Vérifier `PROPFIRM_USER_GUIDE.md` (guide principal)
2. Consulter les logs MT5
3. Vérifier dashboard PropFirm
4. Basculer en H1 Conservative si DD > 5%

**Bon trading ! 🚀**
