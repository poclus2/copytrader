# 💰 GUIDE PERFORMANCE : VISER 5% / MOIS

Pour atteindre 5% par mois, il faut ajuster l'équation **Volume x Risque x WinRate**.

## 📊 ANALYSE ACTUELLE
- **Risque actuel** : 0.5% par trade (Très conservateur).
- **Volume** : En cours d'augmentation (~10 trades/semaine).
- **Lot constaté** : 0.3 lot (sur XAUUSD, c'est faible pour un gros capital).

## 🚀 LA SOLUTION MATHÉMATIQUE

Pour faire 5% / mois avec un Win Rate de 50-60% et un RR de 1:2 :
Il vous faut **+5R à +8R nets** par mois.

Avec un risque de **0.5%**, cela exige **10 à 16 trades gagnants** (nets) par mois, ce qui est énorme en Swing.

👉 **Il faut augmenter le risque par trade.**

---

## ⚙️ MODIFICATIONS RECOMMANDÉES

### 1. Augmenter le Risque (Le levier principal)
Passez de **0.5%** à **2.0%** par trade.
- 1 trade gagnant (RR 1:2) = +4% de compte.
- Il suffit de **2 bons trades** dans le mois pour faire votre objectif.
- Perte max par trade = 2% (acceptable en Swing).

**Dans le code / Inputs :**
`InpRiskPercent = 2.0`

### 2. Levier "Agressif" (Optionnel)
Si vous voulez vraiment "charger" :
`InpRiskPercent = 3.0`
- Mais attention au Drawdown.

---

## 📝 CALCUL DU LOT (Vérification)
L'EA calcule le lot ainsi :
`Lot = (Capital * Risque%) / (Distance SL en argent)`

*Exemple :* 
Capital $10,000, Risque 2% = $200 de risque.
SL à 200 points ($2 sur l'or).
Lot = 1.0.

Si votre lot est petit (0.3), c'est soit que :
1. Votre capital test est petit.
2. Votre SL est large (ce qui est bien en Swing).
3. Le risque % est trop faible.

✅ **Changez `InpRiskPercent` à 2.0 ou 3.0 et relancez !**
