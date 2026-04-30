# 🔥 CONFIGURATION AGGRESSIVE - GoldSniperEA PropFirm

## 🎯 Objectif
Augmenter la fréquence de trading pour atteindre plus rapidement les objectifs PropFirm (10% Phase 1, 5% Phase 2) tout en respectant les limites de risque.

---

## ⚙️ PARAMÈTRES AGGRESSIVE MODE

### 📊 **Timeframe & Confirmations**
```mql5
// Passer de H1 à M15 pour plus de signaux
Timeframe = PERIOD_M15;                    // ⚡ M15 au lieu de H1

// Réduire les confirmations pour accepter plus de trades
Min_Confirmations = 3;                     // ⚡ 3 au lieu de 5

// Augmenter le nombre de trades autorisés
Max_Positions = 2;                         // ⚡ 2 positions simultanées
Max_Simultaneous_Trades = 2;               // ⚡ 2 trades simultanés
max_trades_per_candle = 2;                 // ⚡ 2 trades par bougie M15
```

### 💰 **Risk Management (Toujours PropFirm Safe)**
```mql5
// Risk Management - AJUSTÉ MAIS SAFE
PropFirm_Risk_Per_Trade = 0.75;            // ⚡ 0.75% (au lieu de 0.5%)
PropFirm_Max_Positions = 2;                // ⚡ 2 positions max

// Limites PropFirm - NE PAS CHANGER
Max_Daily_Loss_Pct = 4.0;                  // ✅ Garder 4%
Max_Total_DD_Pct = 8.0;                    // ✅ Garder 8%
Daily_Profit_Target_Pct = 2.5;             // ⚡ 2.5% (au lieu de 1.5%)
```

### ⏰ **Sessions (Plus Larges)**
```mql5
// Étendre les heures de trading
Trade_London_Session = true;               // ✅ London
London_Session_Start = 8;                  // ⚡ 08:00 (au lieu de 09:00)
London_Session_End = 16;                   // ⚡ 16:00 (au lieu de 13:00)

Trade_NewYork_Session = true;              // ⚡ ACTIVER New York
NewYork_Session_Start = 13;                
NewYork_Session_End = 20;                  // ⚡ Jusqu'à 20:00

Trade_Tokyo_Session = false;               // ❌ Garder désactivé (volatilité)
Trade_Sydney_Session = false;              // ❌ Garder désactivé
```

### 🎯 **Stratégie (Plus Permissive)**
```mql5
// Réduire les poids pour accepter plus de signaux
PriceAction_Weight = 3;                    // ⚡ 3 au lieu de 4
SupportResistance_Weight = 4;              // ⚡ 4 au lieu de 5
CandlePatterns_Weight = 2;                 // ✅ Garder
ChartPatterns_Weight = 2;                  // ⚡ 2 au lieu de 3

// Désactiver le filtre de trend strict pour plus de trades
Require_MainTrend_Alignment = false;       // ⚡ DÉSACTIVER
```

### 📰 **News Filter (Ajusté)**
```mql5
// Réduire le buffer news pour ne pas manquer trop de trades
Avoid_News_Events = true;                  // ✅ Garder actif (sécurité)
News_Buffer_Minutes = 15;                  // ⚡ 15min (au lieu de 30min)
```

---

## 📊 RÉSULTAT ATTENDU

### Avec H1 (Conservative) :
- **Trades/jour** : 1-3
- **Profit visé** : 1-1.5%/jour
- **Durée Phase 1** : 7-10 jours

### Avec M15 Aggressive :
- **Trades/jour** : 5-10 ⚡
- **Profit visé** : 2-2.5%/jour ⚡
- **Durée Phase 1** : 4-5 jours ⚡

---

## ⚠️ RISQUES & MITIGATION

### 🔴 Risque Augmenté
- **Plus de trades = Plus d'exposition**
- **M15 = Plus de faux signaux**
- **Risk 0.75% × 2 positions = 1.5% max par moment**

### ✅ Protections Actives
1. **Daily Loss** : Toujours à 4% (arrêt automatique)
2. **Total DD** : Toujours à 8% (arrêt définitif)
3. **Daily Profit Target** : 2.5% (arrêt pour préserver)
4. **News Filter** : Toujours actif (évite volatilité extrême)

---

## 🚀 IMPLÉMENTATION RAPIDE

### Option 1 : Modifier les Paramètres Manuellement
Ouvrir `GoldSniperEA_PropFirm.mq5` dans MetaEditor et changer :

```mql5
// LIGNE 38
input ENUM_TIMEFRAMES Timeframe = PERIOD_M15;   // ⚡ M15

// LIGNE 45
input int Min_Confirmations = 3;                 // ⚡ 3

// LIGNE 43-44
input int Max_Positions = 2;                     // ⚡ 2
input int Max_Simultaneous_Trades = 2;           // ⚡ 2

// LIGNE 223
input double PropFirm_Risk_Per_Trade = 0.75;    // ⚡ 0.75

// LIGNE 211
input double Daily_Profit_Target_Pct = 2.5;     // ⚡ 2.5

// LIGNE 186-187
input int London_Session_Start = 8;              // ⚡ 8
input int London_Session_End = 16;               // ⚡ 16

// LIGNE 188
input bool Trade_NewYork_Session = true;         // ⚡ true

// LIGNE 50
input bool Require_MainTrend_Alignment = false;  // ⚡ false

// LIGNE 216
input int News_Buffer_Minutes = 15;              // ⚡ 15
```

### Option 2 : Créer un Preset
Dans MT5, après avoir attaché l'EA :
1. Modifier les paramètres ci-dessus
2. **Inputs → Save → "PropFirm_Aggressive.set"**
3. Réutiliser ce preset à chaque fois

---

## 📈 STRATÉGIE D'UTILISATION

### Phase 1 (10% en 4 jours) - MODE AGGRESSIVE
```
Jour 1-2: +2.5%/jour × 2 = 5%
Jour 3-4: +2.5%/jour × 2 = 5%
Total: 10% ✅ en 4 jours
```

### Si Trop Risqué
Revenir en mode Conservative :
- `Timeframe = PERIOD_H1`
- `Min_Confirmations = 5`
- `PropFirm_Risk_Per_Trade = 0.5`

---

## 🎓 CONSEILS

### ✅ FAIRE
- **Surveiller le dashboard** toutes les 2-3h
- **Tester en DÉMO** d'abord (1 semaine minimum)
- **Basculer en Conservative** si DD > 3%
- **Arrêter manuellement** si 3 pertes consécutives

### ❌ NE PAS FAIRE
- **Ne pas dépasser** Risk 1%/trade même en aggressive
- **Ne pas désactiver** les news filters
- **Ne pas trader** les jours de news majeurs (NFP/FOMC)
- **Ne pas forcer** si DD > 5%

---

## 🔧 VERSION "EXTREME AGGRESSIVE" (Déconseillé)

Si vous voulez vraiment maximiser (à vos risques) :

```mql5
Timeframe = PERIOD_M5;                      // ⚠️ M5 (très volatile)
Min_Confirmations = 2;                      // ⚠️ 2 (beaucoup de faux signaux)
PropFirm_Risk_Per_Trade = 1.0;             // ⚠️ 1% (limite max)
Daily_Profit_Target_Pct = 3.0;             // ⚠️ 3%
```

**Risque** : DD de 5-8% possible. Réservé aux traders expérimentés.

---

## 📊 COMPARATIF

| Mode | Timeframe | Trades/Jour | Risk/Trade | Durée P1 | DD Moyen |
|------|-----------|-------------|------------|----------|----------|
| **Conservative** | H1 | 1-3 | 0.5% | 7-10j | 2-3% |
| **AGGRESSIVE** | M15 | 5-10 | 0.75% | 4-5j | 3-5% |
| **Extreme** | M5 | 10-20 | 1.0% | 3-4j | 5-8% ⚠️ |

---

## ✅ CHECKLIST MODE AGGRESSIVE

- [ ] Backtest M15 sur 1 mois → DD < 6%
- [ ] Test démo 1 semaine → Résultats cohérents
- [ ] Dashboard fonctionne correctement
- [ ] News calendar à jour
- [ ] Plan de repli vers Conservative si DD > 4%

**Prêt à être agressif ? 🔥**
