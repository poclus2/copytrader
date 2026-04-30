# Guide de Test - Supply/Demand Pattern EA

## 📋 RÉSUMÉ DE L'EA

Cet EA implémente votre stratégie multi-timeframe complète :

### ✅ Fonctionnalités Implémentées

1. **Filtre de Tendance (Daily)**
   - EMA 50 vs EMA 200
   - BUY si EMA50 > EMA200
   - SELL si EMA50 < EMA200

2. **Zones Supply/Demand (H4)**
   - Détection automatique des zones de support/résistance
   - Basée sur les swing points + impulsion minimale
   - Buffer configurable pour l'entrée

3. **Détection de Patterns (H1)**
   - Double Bottom (pour BUY)
   - Double Top (pour SELL)
   - Détection de cassure de neckline
   - Tolérance configurable

4. **Confirmation (M15)**
   - Engulfing haussier/baissier
   - Pin bar (rejet)
   - Position par rapport à EMA20

5. **Gestion du Risque**
   - Risque fixe : 0.5% par trade
   - Risk:Reward : 1:2 (configurable)
   - Stop Loss intelligent sous/sur le pattern
   - Break-Even automatique à 1R
   - Trailing Stop optionnel
   - Max 1 trade/jour

---

## 🚀 INSTALLATION

### 1. Copier l'EA dans MetaTrader 5

```bash
# Copier le fichier dans le dossier MQL5
Fichier source : strategies/SupplyDemandPatternEA.mq5
Destination MT5 : C:\Users\[VOTRE_NOM]\AppData\Roaming\MetaQuotes\Terminal\[INSTANCE]\MQL5\Experts\
```

**OU** via l'interface MT5 :
1. Ouvrir MetaEditor (F4 dans MT5)
2. Fichier → Ouvrir le dossier de données
3. Naviguer vers `MQL5\Experts`
4. Copier `SupplyDemandPatternEA.mq5`

### 2. Compiler l'EA

1. Ouvrir MetaEditor (F4)
2. Ouvrir `SupplyDemandPatternEA.mq5`
3. Cliquer sur "Compiler" (F7)
4. Vérifier qu'il n'y a aucune erreur

---

## 🧪 TESTS RECOMMANDÉS

### Phase 1 : Backtest sur Données Historiques

#### Configuration du Testeur

1. **Ouvrir le Strategy Tester** (Ctrl+R dans MT5)

2. **Paramètres de Base**
   - Expert Advisor : `SupplyDemandPatternEA`
   - Symbole : `XAUUSD` (GOLD)
   - Période : `M15`
   - Date : Derniers 6 mois
   - Mode : "Every tick based on real ticks"

3. **Paramètres de l'EA à Tester**

```
=== TREND FILTER ===
InpEMA_Fast = 50
InpEMA_Slow = 200

=== ZONES H4 ===
InpZoneImpulse = 500    // Pour XAUUSD, ajuster si nécessaire
InpZoneBars = 5
InpZoneBuffer = 200     // ~$2 pour XAUUSD

=== PATTERNS H1 ===
InpEnablePatterns = true
InpPatternTolerance = 120   // ~$1.2
InpNecklineBuffer = 30      // ~$0.3

=== CONFIRMATION M15 ===
InpRequireConfirmation = true
InpEMA_M15 = 20

=== RISK ===
InpRiskPercent = 0.5
InpRiskReward = 2.0
InpSL_Buffer = 200
InpMaxTradesPerDay = 1

=== BREAK-EVEN ===
InpEnableBreakEven = true
InpBE_RRatio = 1.0
InpEnableTrailing = false
```

4. **Lancer le Test**
   - Cliquer sur "Start"
   - Attendre la fin du backtest
   - Analyser les résultats

#### Résultats à Vérifier

✅ **Profit Factor** : > 1.5 (idéalement > 2.0)
✅ **Win Rate** : 45-60%
✅ **Max Drawdown** : < 15%
✅ **Total Trades** : Au moins 30-50 pour validation statistique
✅ **Profit/Loss Ratio** : Proche de 1:2 (configuré)

---

### Phase 2 : Forward Test (Compte Démo)

1. **Activer l'EA sur compte démo**
   - Ouvrir graphique XAUUSD M15
   - Glisser-déposer l'EA
   - Activer "Allow live trading"
   - Activer "Allow DLL imports" (si nécessaire)

2. **Monitorer pendant 1-2 semaines**
   - Vérifier que les trades s'ouvrent selon la logique
   - Vérifier le respect du max 1 trade/jour
   - Vérifier le Break-Even
   - Vérifier les logs dans "Experts"

3. **Logging**
   - Tous les événements sont loggés
   - Onglet "Experts" dans MT5
   - Vérifier les messages :
     - "BUY opened" / "SELL opened"
     - "Break-Even activated"
     - Détails des zones

---

## ⚙️ OPTIMISATION

### Paramètres Critiques à Optimiser

1. **Zone Impulse (InpZoneImpulse)**
   - Tester : 300, 500, 700
   - Impact : Qualité des zones détectées

2. **Pattern Tolerance (InpPatternTolerance)**
   - Tester : 80, 120, 150
   - Impact : Flexibilité de détection des patterns

3. **Risk:Reward (InpRiskReward)**
   - Tester : 1.5, 2.0, 2.5, 3.0
   - Impact : Profit potentiel vs win rate

4. **SL Buffer (InpSL_Buffer)**
   - Tester : 150, 200, 250
   - Impact : Sécurité du SL

### Méthode d'Optimisation MT5

1. Strategy Tester → onglet "Optimization"
2. Sélectionner les paramètres à optimiser
3. Définir les ranges (min, max, step)
4. Critère d'optimisation : "Balance + Profit Factor"
5. Lancer l'optimisation

---

## 📊 ANALYSE DES RÉSULTATS

### Indicateurs Clés

```
Métriques à Surveiller :
- Profit Factor ≥ 1.8
- Sharpe Ratio ≥ 1.0
- Win Rate 50-60%
- Max Consecutive Losses < 5
- Recovery Factor ≥ 3
- Drawdown < 20%
```

### Visualisation

Activer dans MT5 :
- Graphique Equity Curve
- Distribution des trades (gains vs pertes)
- Analyse par jour de la semaine
- Analyse par heure

---

## 🐛 DEBUGGING

### Si Aucun Trade n'est Ouvert

1. **Vérifier Logs "Experts"**
   ```
   Rechercher :
   - "Daily trend: BUY/SELL/RANGE"
   - "Demand/Supply zone created"
   - "Pattern detected"
   ```

2. **Causes Possibles**
   - Trend = Range (EMA50 ≈ EMA200)
   - Pas de zone valide détectée
   - Pattern non détecté
   - Pas de confirmation M15

3. **Solutions**
   - Réduire `InpZoneImpulse` (ex: 300)
   - Augmenter `InpPatternTolerance` (ex: 150)
   - Désactiver temporairement `InpRequireConfirmation`

### Si Trop de Trades Perdants

1. Augmenter `InpSL_Buffer` (plus de marge)
2. Augmenter `InpZoneImpulse` (zones plus strictes)
3. Activer `InpRequireConfirmation`

---

## 🎯 RECOMMANDATIONS

### Pour Débutant
```
InpRiskPercent = 0.3          // Risque conservateur
InpMaxTradesPerDay = 1
InpEnableBreakEven = true
InpEnableTrailing = false     // Laisser TP fixe
```

### Pour Intermédiaire
```
InpRiskPercent = 0.5
InpRiskReward = 2.0
InpEnableTrailing = true
InpTrailingDistance = 300
```

### Pour Avancé
```
Optimiser tous les paramètres
Tester sur plusieurs symboles
Adapter InpZoneImpulse par paire
```

---

## 📝 PROCHAINES ÉTAPES

1. ✅ **Backtest 6 mois** sur XAUUSD
2. ✅ **Forward test 2 semaines** sur démo
3. ⏳ **Optimisation** des paramètres
4. ⏳ **Test sur autres paires** (EURUSD, GBPUSD)
5. ⏳ **Ajout Head & Shoulders** (si patterns Double insuffisants)
6. ⏳ **Live trading** avec capital limité

---

## 🔧 SUPPORT

Si vous rencontrez des problèmes :
1. Vérifier logs dans "Experts"
2. Vérifier compilation sans erreur
3. Tester paramètres par défaut d'abord
4. Me fournir les logs + configuration pour debug

**Bon trading ! 🚀**
