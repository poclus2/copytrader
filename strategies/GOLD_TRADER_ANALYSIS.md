# 🕵️ ANALYSE : GOLD TRADER EA (Open Source)

J'ai désossé le code. C'est une **bête de course** modulaire, très différente de notre EA précédent.

## 🏗️ ARCHITECTURE DU ROBOT
Ce n'est pas un simple "Breakout Bot". C'est un **système de consensus**.

### 1. Le Cerveau (Consensus System)
L'EA n'entre pas sur 1 signal. Il entre si la somme des "points" (Confirmations) dépasse un seuil (`Min_Confirmations = 7`).
Chaque stratégie rapporte des points selon son poids :
- **Elliott Waves** : 3 points (Poids lourd)
- **Harmonics** : 3 points
- **Support/Resist** : 3 points
- **Indicateurs (RSI/MACD)** : 1 point
- **Candle Patterns** : 1 point

**👉 Conséquence** : Il ne trade que si *tout le monde est d'accord* (Technique + Chartisme + Vagues). C'est très filtré.

### 2. Les Filtres Intégrés
- **MA Trend Filter** : Ne trade que si le prix est au-dessus/dessous de la MA100.
- **Tilt Filter** : Analyse "l'inclinaison" du marché (Slope).
- **Time Analysis** : Filtre par session (London, NY, Tokyo).
- **Bad Trading Days** : Filtre les jours "pourris" (probablement NFP/FOMC via code en dur ou logique de volatilité).

### 3. Gestion du Risque (Avancée)
- **ATR Stop Loss** : `2.0 * ATR` (Stop dynamique selon la volatilité).
- **ATR Take Profit** : `4.0 * ATR` (Vise des gros ratios 1:2).

---

## 🚀 PISTES D'OPTIMISATION (POUR LE RENDRE RENTABLE)

Le problème de ces EAs "usine à gaz", c'est qu'ils filtrent TROP par défaut.

### Piste 1 : Le "Specialist" (Simplification)
On désactive les modules "ésotériques" (Wolfe Waves, Harmonics qui repeignent souvent) et on se concentre sur le solide :
- **Actifs** : Price Action + Support/Resistance + Volume.
- **Désactivés** : Elliott, Harmonics, Divergence.
- **Objectif** : Rendre l'EA plus rapide et réactif.

### Piste 2 : L'Alignement Session (Comme le V3)
Actuellement, il scanne tout (Tokyo, Sydney...).
- **Action** : On force `Trade_London_Session = true` et `Trade_NewYork_Session = false`.
- On aligne le "Cerveau" sur les horaires qui paient (09h-13h).

### Piste 3 : Le "Heavy Hitter" (Poids lourds)
On augmente le poids de la **Structure de Marché** (Price Action) à 5 points.
Ainsi, un beau setup Price Action peut déclencher un trade quasi seul, sans attendre que le MACD soit d'accord.

---

## 📅 PROCHAINES ÉTAPES
1.  **Nettoyage** : Je désactive les modules inutiles/lents.
2.  **Config "Gold Sniper"** : J'applique nos horaires 09h-13h.
3.  **Backtest** : On compare avec le V3.

Voulez-vous que je prépare cette version optimisée "Gold Sniper" ?
