# 🚀 CONFIGURATION "SWING ACTIF" (VISÉE : 10 TRADES / SEMAINE)

Le fichier `SupplyDemandPatternEA.mq5` a été mis à jour avec ces nouveaux paramètres par défaut pour maximiser les opportunités.

## 🎯 RÉGLAGES APPLIQUÉS (Default)

Ces réglages sont maintenant intégrés dans le code, vous n'avez plus besoin de les saisir manuellement à chaque fois.

### 1. Zone Detection (Plus sensible)
- **`InpZoneImpulse` = 300** (était 500)
  - *Effet* : Détecte des zones de Supply/Demand moins "extrêmes", ce qui augmente le nombre de zones valides.
- **`InpZoneBuffer` = 300** (était 200)
  - *Effet* : Accepte que le prix approche la zone sans la toucher parfaitement.

### 2. Trading Zone (100% Active)
- **`InpZoneBoundaryPct` = 100.0** (était 40.0)
  - *Effet* : C'est le changement majeur. Autorise la prise de trade **n'importe où dans la zone** (pas seulement au bord extrême). C'est essentiel pour du Swing régulier.

### 3. Pattern Recognition (Plus tolérant)
- **`InpPatternTolerance` = 250** (était 120)
  - *Effet* : Accepte des figures (Double Tops/Bottoms) un peu moins "parfaites".

### 4. Volume (Plus de trades)
- **`InpMaxTradesPerDay` = 3** (était 1)
  - *Effet* : Permet de prendre plusieurs setups dans la même journée si le marché bouge bien.

---

## 🧪 À TESTER MAINTENANT

Relancez simplement votre Backtest habituel sur 6 mois.

**Résultats Attendus avec cette configuration :**
- **Volume** : ~10-15 trades par semaine (au lieu de 1 tous les mois).
- **Style** : Swing Trading actif.
- **Risque** : Légèrement supérieur car filtres plus larges, mais compensé par le volume et le RR 1:2.

**Si c'est TROP actif (>20 trades/semaine) :**
- Réduisez `InpZoneBoundaryPct` à **80.0**.
- Ou remettez `InpPatternTolerance` à **150**.
