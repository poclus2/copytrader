# ⚡ PLAN D'AVANCE : EA DAY TRADING V3.0

Pour passer d'un "Swing mou" à un "Day Trading performant", nous devons changer la structure temporelle et ajouter des filtres de session.

## 🎯 OBJECTIFS
- **Fréquence** : 1 à 3 trades **par jour** (et non par semaine).
- **Style** : Intraday (positions fermées le soir ou trailing serré).
- **Analyse** : Fractalité plus rapide (H4 -> M30 -> M5).

## 🛠️ CHANGEMENTS TECHNIQUES (V3.0)

### 1. Structure Multi-Timeframe Dynamique
Au lieu de D1/H4/H1 figé, nous passons à :
- **Trend TF** : `H4` (Direction globale)
- **Zone TF** : `M30` (Zones d'intervention intraday)
- **Pattern TF** : `M5` (Entrée précise, SL court)

### 2. Filtre "Smart Money" (Order Blocks)
Sur M30, les simples "zones" sont trop larges. Nous allons affiner la détection :
- **M30 Zone** : Doit être une bougie qui a précédé un mouvement violent (Imbalance).
- C'est plus précis pour le Day Trading.

### 3. Filtre Horaire (Session Trading)
Le Day Trading sur l'Or ne marche QUE pendant Londres et New York.
- **Ajout** : `TradingStartHour` (ex: 09:00) et `TradingEndHour` (ex: 18:00).
- Évite les faux signaux de la session Asie.

### 4. Money Management "Scalper"
- **Risk** : 1% par trade.
- **Partial Close** : Option de sécuriser 50% du profit à 1:1 RR (Psychologie Day Trader).

---

## 📅 NOUVEAUX PARAMÈTRES PAR DÉFAUT

```mql5
TrendTF = PERIOD_H4
ZoneTF = PERIOD_M30
PatternTF = PERIOD_M5

Risk = 1.0%
SessionStart = 09:00
SessionEnd = 20:00
```

Je commence la refonte du code maintenant.
