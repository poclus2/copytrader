# 🏦 GUIDE D'UTILISATION - GoldSniperEA PropFirm Edition

## 🎯 Introduction

`GoldSniperEA_PropFirm.mq5` est une version optimisée du Gold Sniper EA, conçue spécifiquement pour **passer les challenges PropFirm** (FTMO, MyForexFunds, E8, etc.) tout en respectant leurs règles strictes.

---

## 📋 RÈGLES PROPFIRM IMPLÉMENTÉES

### ✅ Limites de Risque
| Règle | Valeur par défaut | FTMO Standard | Status |
|-------|-------------------|---------------|--------|
| **Max Daily Loss** | 4% | 5% | ✅ Plus strict |
| **Max Total Drawdown** | 8% | 10% | ✅ Plus strict |
| **Daily Profit Target** | 1.5% | - | ✅ Stop si atteint |
| **Risk per Trade** | 0.5% | - | ✅ Ultra-conservateur |

### 🛡️ Protections Automatiques
1. **Daily Reset** : Reset automatique des compteurs à minuit
2. **News Filter** : Arrêt du trading 30min avant/après :
   - NFP (1er vendredi du mois)
   - FOMC (Meetings Fed)
   - CPI (Inflation US)
3. **Weekend Close** : Fermeture automatique des positions vendredi 20h
4. **Consistency Rule** : Max 45% du profit total en une journée

---

## 🚀 CONFIGURATION RAPIDE

### Étape 1 : Paramètres Essentiels

```
=== 🏦 PROPFIRM MODE ===
Use_PropFirm_Mode = true                // ✅ ACTIVER
PropFirm_Type = "FTMO"                  // Type de challenge
Account_Size = 100000                   // Taille du compte ($)

=== 📉 RISK LIMITS ===
Max_Daily_Loss_Pct = 4.0                // Daily loss limit (4% = buffer vs 5%)
Max_Total_DD_Pct = 8.0                  // Total DD limit (8% = buffer vs 10%)
Daily_Profit_Target_Pct = 1.5           // Stop trading si +1.5%/jour
Max_Daily_Profit_Pct = 45.0             // Consistency: max 45% profit/jour

=== 📰 NEWS FILTER ===
Avoid_News_Events = true                // ✅ ACTIVER
News_Buffer_Minutes = 30                // 30min avant/après

=== 🔒 WEEKEND MANAGEMENT ===
Close_Before_Weekend = true             // ✅ ACTIVER
Friday_Close_Hour = 20                  // Fermeture vendredi 20h

=== 💼 POSITION LIMITS ===
PropFirm_Risk_Per_Trade = 0.5           // 0.5% par trade
PropFirm_Max_Positions = 1              // 1 position max
```

### Étape 2 : Stratégie de Trading

**Phase 1 (Objectif : 10% en 4+ jours)**
- Laisser les paramètres par défaut
- Target : 1.5%/jour
- Durée : ~7 jours

**Phase 2 (Objectif : 5% en 4+ jours)**
- Réduire `Daily_Profit_Target_Pct` à 1.0%
- Réduire `PropFirm_Risk_Per_Trade` à 0.3%
- Durée : ~5-6 jours

---

## 📊 DASHBOARD PROPFIRM

En mode **Live**, l'EA affiche un dashboard en temps réel sur le graphique :

```
========== 🏦 PROPFIRM DASHBOARD ==========
Type: FTMO | Account: $100000
Trading Days: 5 | Trades Today: 2
-------------------------------------------
📊 DAILY PERFORMANCE:
  Today PnL: $1,450.00 (1.45%)
  Daily Loss Limit: 4.0% | Buffer: 5.45%
  Daily Profit Target: 1.5%
-------------------------------------------
📉 DRAWDOWN:
  Current DD: 2.30%
  Max Allowed: 8.0% | Buffer: 5.70%
  Peak Balance: $101,450.00
-------------------------------------------
💰 TOTAL PROFIT: $1,450.00
⚡ STATUS: ✅ ACTIVE
==========================================
```

### Légende Status :
- ✅ **ACTIVE** : Trading autorisé
- 🔒 **PAUSED (Daily Limit)** : Limite journalière atteinte (profit target ou daily loss)
- ❌ **DISABLED (DD)** : Drawdown total dépassé - Trading définitivement arrêté

---

## ⚠️ MESSAGES IMPORTANTS

### Arrêt Temporaire (Journée)
```
✅ DAILY PROFIT TARGET REACHED: 1.52% (Target: 1.5%)
🔒 Trading stopped for today to preserve gains
```
→ **Normal** : L'EA a atteint l'objectif, il se met en pause jusqu'à demain.

### Arrêt Permanent
```
❌ TOTAL DRAWDOWN LIMIT EXCEEDED: 8.15% (Max: 8.0%)
⛔ Trading PERMANENTLY DISABLED
```
→ **Critique** : Le compte a dépassé le DD max. Arrêter l'EA et analyser.

### News Pause
```
📰 NFP News Time Detected - Trading paused
```
→ **Normal** : L'EA évite les news volatiles.

### Weekend Close
```
🔒 Weekend approaching - Closing all 1 positions
✅ Position #12345 closed for weekend
```
→ **Normal** : Protection contre le gap de weekend.

---

## 🎓 CONSEILS PROPFIRM

### ✅ DO
- **Vérifier le Dashboard** chaque jour
- **Respecter les 4+ jours de trading** minimum
- **Laisser l'EA tourner** sans intervention
- **Surveiller les news** manuellement aussi
- **Optimiser les horaires** : Privilégier London session (09:00-13:00)

### ❌ DON'T
- **Ne pas désactiver** `Use_PropFirm_Mode` en challenge !
- **Ne pas augmenter** `PropFirm_Risk_Per_Trade` au-dessus de 1%
- **Ne pas forcer** le trading après daily limit
- **Ne pas trader** manuellement sur le même compte
- **Ne pas modifier** les limites DD en cours de challenge

---

## 🐛 TROUBLESHOOTING

### "Trading disabled today" mais je veux trader
→ **Attendez demain**. C'est une protection PropFirm (profit target atteint ou daily loss).

### EA ne prend aucun trade
1. Vérifier `Use_PropFirm_Mode = true`
2. Vérifier que le Dashboard montre "✅ ACTIVE"
3. Vérifier l'heure (session London active ?)
4. Vérifier les news (buffer 30min)

### Drawdown augmente rapidement
1. Réduire `PropFirm_Risk_Per_Trade` à 0.3%
2. Augmenter `Min_Confirmations` à 7
3. Désactiver les stratégies volatiles

---

## 📈 OBJECTIFS PROPFIRM

### Phase 1 (10%)
- **Durée visée** : 7-10 jours
- **Objectif daily** : 1.5%
- **Min trades/jour** : 1-2
- **Status** : Passer avec DD < 5%

### Phase 2 (5%)
- **Durée visée** : 5-7 jours  
- **Objectif daily** : 0.8-1%
- **Risk** : Réduire à 0.3%
- **Status** : Passer avec DD < 3%

### Funded Account
- **Objectif** : Croissance stable
- **Risk** : 0.5-1% max
- **Focus** : Consistance > Profit

---

## 🔧 PARAMÈTRES AVANCÉS

### Type PropFirm
```
PropFirm_Type = "FTMO"    // Options: FTMO, MFF, E8, GENERIC
```
Actuellement cosmétique, mais peut être étendu pour des règles spécifiques.

### Account Size
```
Account_Size = 100000     // Doit correspondre au compte réel
```
Utilisé pour les calculs de % et le dashboard.

---

## ✅ CHECKLIST AVANT CHALLENGE

- [ ] `Use_PropFirm_Mode = true`
- [ ] `Max_Daily_Loss_Pct = 4.0` (ou moins)
- [ ] `Max_Total_DD_Pct = 8.0` (ou moins)
- [ ] `PropFirm_Risk_Per_Trade = 0.5`
- [ ] `Avoid_News_Events = true`
- [ ] `Close_Before_Weekend = true`
- [ ] Dashboard s'affiche correctement
- [ ] Session : London (09:00-13:00)
- [ ] Backtest 1 mois → DD < 5%

---

## 🎯 RÉSUMÉ

`GoldSniperEA_PropFirm` est **prêt pour les challenges PropFirm** avec :
- ✅ Respect strict des limites DD (4% daily, 8% total)
- ✅ Filtre news automatique
- ✅ Fermeture weekend automatique
- ✅ Dashboard temps réel
- ✅ Consistency rule
- ✅ Risk ultra-conservateur (0.5%)

**Bon challenge ! 🚀**
