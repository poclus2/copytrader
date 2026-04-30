# 📉 MISSION DRAWDOWN : PASSER DE 65% À <15%

Si vous avez 65% de DD, c'est que l'EA enchaîne les pertes dans les mauvaises conditions. C'est typique d'une stratégie "Breakout/Pattern" dans un marché en range haché.

## 🔍 LE DIAGNOSTIC CLAIR
1. **Acharnement** : L'EA reprend position immédiatement après un SL dans la même zone "piège".
2. **Faux Trend** : L'EMA 50/200 dit "HAUSSIER" mais le marché est plat depuis 3 jours → L'EA achète tous les sommets.
3. **Volatilité M5** : Le bruit du M5 déclenche des patterns qui n'existent pas en structure.

---

## 🛡️ LE PLAN DE BATAILLE V3.1 ("Smart Hunter")

### 1. Protection Anti-Acharnement (Daily Stop)
- **Règle** : Si **2 pertes consécutives** dans la journée → **STOP TRADING** jusqu'à demain.
- *Impact* : Élimine les jours catastrophe qui creusent le compte.

### 2. Filtre de Qualité de Zone (Imbalance)
- Une zone n'est valide que si elle a créé une **bougie impulsive puissante** (Imbalance).
- Fini les petites zones de range qui cassent tout de suite.

### 3. Filtre de "Marché Plat" (ADX)
- Ajout de l'**ADX (Average Directional Index)**.
- **Règle** : On ne trade QUE si `ADX > 25` (Tendance forte confirmée).
- Si `ADX < 25` (Marché mou/range) → **Pas de trade**, même si pattern parfait.

### 4. Zone "One-Shot"
- Une zone ne peut être tradée qu'une seule fois.
- Évite de se faire stopper 3 fois sur le même niveau.

---

## ⚙️ NOUVEAUX PARAMÈTRES V3.1

```mql5
MaxDailyLosses = 2        // Stop après 2 pertes
MinADX = 25               // Filtre trend fort
UseImbalance = true       // Zones de qualité uniquement
Risk = 1.0%               // Risque maîtrisé
```

Je modifie `DayTradingEA_v3.mq5` immédiatement pour intégrer ces boucliers.
