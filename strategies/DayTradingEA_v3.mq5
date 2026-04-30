//+------------------------------------------------------------------+
//|                                           DayTradingEA_v3.mq5     |
//|                                  "The Intraday Hunter"            |
//|                          H4 Trend + M30 Zones + M5 Patterns       |
//|                                      VERSION 3.0 (Day Trading)    |
//+------------------------------------------------------------------+
#property copyright "HaresTech"
#property version   "3.00"
#property strict

#include <Trade\Trade.mqh>

//--- Input Parameters
input group "=== TIME FRAME SETTINGS (FRACTAL) ==="
input ENUM_TIMEFRAMES InpTrendTF = PERIOD_H4;    // Trend Timeframe
input ENUM_TIMEFRAMES InpZoneTF = PERIOD_M30;    // Zone Timeframe
input ENUM_TIMEFRAMES InpPatternTF = PERIOD_M5;  // Pattern Timeframe

input bool InpUseTimeFilter = true;              // Enable Time Filter
input int InpStartHour = 13;                     // Start Hour (User Defined)
input int InpEndHour = 17;                       // End Hour (User Defined)

input group "=== TREND FILTER (H4) ==="
input int InpEMA_Fast = 50;              // EMA Fast Period
input int InpEMA_Slow = 200;             // EMA Slow Period

input group "=== SUPPLY/DEMAND ZONES (M30) ==="
input int InpZoneImpulse = 200;          // Minimum impulse (points) [Tuned for M30]
input int InpZoneBars = 3;               // Bars for impulse [Faster]
input int InpZoneBuffer = 200;           // Zone entry buffer (points)
input double InpZoneBoundaryPct = 100.0; // Trade anywhere in zone

input group "=== PATTERN DETECTION (M5) ==="
input bool InpEnablePatterns = true;     // Enable Pattern Detection
input int InpPatternTolerance = 100;     // Pattern tolerance (points) [Tight for M5]
input int InpNecklineBuffer = 20;        // Neckline break buffer (points)
input bool InpEnableHnS = true;          // Enable Head & Shoulders

input group "=== RISK MANAGEMENT ==="
input double InpRiskPercent = 0.5;       // Risk per trade (%) [Recommandé 0.3-0.5%]
input double InpRiskReward = 2.0;        // Risk:Reward ratio
input int InpSL_Buffer = 100;            // Stop Loss buffer (points)
input int InpMaxTradesPerDay = 3;        // Max trades per day [Strict 3]
input int InpMaxDailyLosses = 2;         // 🛡️ Max consecutive losses/day [STOP TRADING]

input group "=== RISK MANAGER (HARD LIMITS) ==="
input double InpDailyTargetPct = 1.0;    // 🎯 Target Gain Journalier % (+1%)
input double InpDailyLossLimitPct = 5.0; // 🛑 Stop Loss Journalier % (-5%)
input double InpMaxGlobalDD = 10.0;      // 🧱 Max Drawdown Global % (-10%)

input group "=== FILTERS (QUALITY) ==="
input int InpMinADX = 25;                // 🛡️ Min ADX (Avoid Choppy Markets)
input bool InpUseImbalance = true;       // 🛡️ Require Imbalance for Zones

input group "=== MANAGEMENT ==="
input bool InpEnableBreakEven = true;    // Enable Break-Even
input double InpBE_RRatio = 1.0;         // Move to BE at 1R
input bool InpEnableTrailing = true;     // Enable Trailing [Recommended for Day Trading]
input int InpTrailingDistance = 400;     // Trailing distance points [Wider for Volatility]

//--- Global Variables
CTrade trade;
datetime lastTradeDate = 0;
int tradesThisDay = 0;
int lossesThisDay = 0; // Track consecutive losses

// 🔧 RISK MANAGER GLOBALS
double EquityDayStart = 0.0;
datetime DayStartTime = 0;
bool TradingDisabledToday = false;
bool TradingDisabledGlobal = false;
bool IsNewDay = true;

// Zone structure

// Zone structure
struct Zone {
   double high;
   double low;
   double mid;
   bool isValid;
   datetime created;
};

Zone currentDemandZone;
Zone currentSupplyZone;

// Pattern structure
struct PatternDetails {
   int type;
   double neckline;
   double patternLow;
   double patternHigh;
   bool isValid;
};

PatternDetails lastPattern;

enum PatternType {
   PATTERN_NONE = 0,
   PATTERN_DOUBLE_BOTTOM = 1,
   PATTERN_DOUBLE_TOP = 2,
   PATTERN_INV_HNS = 3,
   PATTERN_HNS = 4
};

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   trade.SetExpertMagicNumber(999888); // Different Magic Number for V3
   trade.SetDeviationInPoints(30);
   trade.SetTypeFilling(ORDER_FILLING_FOK);
   
   Print("=== DayTrading EA v3.0 'The Hunter' Initialized ===");
   Print("Trend: ", EnumToString(InpTrendTF), " | Zone: ", EnumToString(InpZoneTF), " | Pattern: ", EnumToString(InpPatternTF));
   
   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason) {}

// Removed Transaction Listener as counters are managed in OnTick/CheckNewDay/OpenTrade logic now?
// Actually logic dictates "2 losses consecutive". We still need to track CLOSED trades to increment lossesThisDay.
// Keeping standard OnTradeTransaction for that specific counter.
void OnTradeTransaction(const MqlTradeTransaction& trans,
                        const MqlTradeRequest& request,
                        const MqlTradeResult& result)
{
   if(trans.type == TRADE_TRANSACTION_DEAL_ADD) {
      if(HistoryDealSelect(trans.deal)) {
         long entry = HistoryDealGetInteger(trans.deal, DEAL_ENTRY);
         if(entry == DEAL_ENTRY_OUT) { // Trade Closed
             double profit = HistoryDealGetDouble(trans.deal, DEAL_PROFIT);
             // Profit % tracking is now done via EquityDayStart globally in OnTick
             
             if(profit < 0) {
                 lossesThisDay++; // Consecutive Loss
                 tradesThisDay++; // Count as trade used
             } else if(profit > 0) {
                 lossesThisDay = 0; // Reset consecutive streak
                 tradesThisDay++; // Count as trade used
             }
         }
      }
   }
}

void OnTick()
{
   // 1. 🕒 Détection Nouveau Jour & Init
   CheckNewDay();
   
   // 2. ⛔ BLOQUAGE TRADING
   if(TradingDisabledToday || TradingDisabledGlobal) return;

   // 3. 🛑 RÈGLES JOURNALIÈRES (Monitoring continu)
   CheckDailyRiskRules();
   if(TradingDisabledToday || TradingDisabledGlobal) return;
   
   // Check New Bar on Pattern Structure (M5)
   static datetime lastBarTime = 0;
   datetime currentBarTime = iTime(_Symbol, InpPatternTF, 0);
   if(currentBarTime == lastBarTime) return;
   lastBarTime = currentBarTime; // Work only on closed bars
   
   // Check Time Filter STRICT (UTC/Server Hour)
   if(InpUseTimeFilter) {
      MqlDateTime dt;
      TimeToStruct(TimeCurrent(), dt);
      if(dt.hour < InpStartHour || dt.hour >= InpEndHour) return;
   }
   
   // Check Daily Count Limits
   if(tradesThisDay >= InpMaxTradesPerDay) return;
   if(lossesThisDay >= InpMaxDailyLosses) {
       TradingDisabledToday = true;
       Print("⛔ Stop Journée: 2 Pertes Consécutives.");
       return;
   }
   
   // Check ADX Filter (Avoid Chop)
   if(!CheckADXFilter(InpTrendTF)) return;
   
   // Manage Positions
   ManageOpenPosition();
   
   // === STEP 1: Trend (H4) ===
   int trendBias = GetTrend(InpTrendTF);
   if(trendBias == 0) return;
   
   // === STEP 2: Zones (M30) ===
   UpdateZones(InpZoneTF);
   
   // === STEP 3: Price in Zone? ===
   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   double checkPrice = (trendBias == 1) ? bid : ask;
   
   bool inDemand = IsPriceInZone(checkPrice, currentDemandZone);
   bool inSupply = IsPriceInZone(checkPrice, currentSupplyZone);
   
   if(trendBias == 1 && !inDemand) return;
   if(trendBias == -1 && !inSupply) return;
   
   // === STEP 4: Patterns (M5) ===
   PatternType pattern = DetectPattern(InpPatternTF, trendBias);
   
   if(pattern != PATTERN_NONE) {
       OpenTrade(trendBias, pattern);
   }
}

//+------------------------------------------------------------------+
//| Helper: Get Trend                                                |
//+------------------------------------------------------------------+
int GetTrend(ENUM_TIMEFRAMES tf)
{
   double ema50[], ema200[];
   ArraySetAsSeries(ema50, true);
   ArraySetAsSeries(ema200, true);
   
   int h50 = iMA(_Symbol, tf, InpEMA_Fast, 0, MODE_EMA, PRICE_CLOSE);
   int h200 = iMA(_Symbol, tf, InpEMA_Slow, 0, MODE_EMA, PRICE_CLOSE);
   
   if(h50 == INVALID_HANDLE || h200 == INVALID_HANDLE) return 0;
   
   CopyBuffer(h50, 0, 0, 1, ema50);
   CopyBuffer(h200, 0, 0, 1, ema200);
   
   IndicatorRelease(h50);
   IndicatorRelease(h200);
   
   if(ema50[0] > ema200[0]) return 1;
   if(ema50[0] < ema200[0]) return -1;
   
   return 0;
}

//+------------------------------------------------------------------+
//| Helper: Check ADX Filter (Trend Strength)                        |
//+------------------------------------------------------------------+
bool CheckADXFilter(ENUM_TIMEFRAMES tf)
{
   double adx[];
   ArraySetAsSeries(adx, true);
   int handle = iADX(_Symbol, tf, 14);
   
   if(handle == INVALID_HANDLE) return true;
   CopyBuffer(handle, 0, 0, 1, adx);
   IndicatorRelease(handle);
   
   return (adx[0] >= InpMinADX);
}

//+------------------------------------------------------------------+
//| Helper: Update Zones (Generic)                                   |
//+------------------------------------------------------------------+
void UpdateZones(ENUM_TIMEFRAMES tf)
{
   // Simplified Zone Logic for Day Trading
   // We look for strong engulfing candles (Imbalance)
   
   double close[], open[], high[], low[];
   ArraySetAsSeries(close, true);
   ArraySetAsSeries(open, true);
   ArraySetAsSeries(high, true);
   ArraySetAsSeries(low, true);
   
   int bars = 100;
   CopyClose(_Symbol, tf, 0, bars, close);
   CopyOpen(_Symbol, tf, 0, bars, open);
   CopyHigh(_Symbol, tf, 0, bars, high);
   CopyLow(_Symbol, tf, 0, bars, low);
   
   double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
   
   // Find Demand (Strong Green Candle)
   for(int i=1; i<bars-5; i++) {
      bool isGreen = close[i] > open[i];
      double body = MathAbs(close[i] - open[i]);
      
      // 🛡️ Imbalance Check: Body must be 2x average body if triggered
      bool isImbalance = true;
      if(InpUseImbalance) {
          double avgBody = 0;
          for(int k=1; k<=5; k++) avgBody += MathAbs(close[i+k]-open[i+k]);
          avgBody /= 5;
          if(body < avgBody * 1.5) isImbalance = false;
      }

      if(isGreen && body > InpZoneImpulse * point && isImbalance) {
         // Potential Demand Zone = Open of this impulsive candle + wicks below
         currentDemandZone.high = open[i];
         currentDemandZone.low = low[i];
         // Check if price hasn't violated it yet
         if(close[0] > currentDemandZone.low) {
            currentDemandZone.isValid = true;
            break; 
         }
      }
   }
   
   // Find Supply (Strong Red Candle)
   for(int i=1; i<bars-5; i++) {
      bool isRed = close[i] < open[i];
      double body = MathAbs(close[i] - open[i]);
      
      // 🛡️ Imbalance Check
      bool isImbalance = true;
      if(InpUseImbalance) {
          double avgBody = 0;
          for(int k=1; k<=5; k++) avgBody += MathAbs(close[i+k]-open[i+k]);
          avgBody /= 5;
          if(body < avgBody * 1.5) isImbalance = false;
      }

      if(isRed && body > InpZoneImpulse * point && isImbalance) {
         // Potential Supply Zone = Open of this impulsive candle + wicks above
         currentSupplyZone.low = open[i];
         currentSupplyZone.high = high[i];
         
         if(close[0] < currentSupplyZone.high) {
            currentSupplyZone.isValid = true;
            break;
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Helper: Check Price in Zone                                      |
//+------------------------------------------------------------------+
bool IsPriceInZone(double price, Zone &zone)
{
   if(!zone.isValid) return false;
   double buffer = InpZoneBuffer * SymbolInfoDouble(_Symbol, SYMBOL_POINT);
   
   if(zone.low == 0 || zone.high == 0) return false; // Safety
   
   // Check if price is near/inside zone
   // For Demand: Price <= High + Buffer
   // For Supply: Price >= Low - Buffer
   // And not broken (Price < Low for Demand)
   
   // We trust zone.high/low are set correctly
   double zHigh = zone.high + buffer;
   double zLow = zone.low - buffer;
   
   return (price <= zHigh && price >= zLow);
}

//+------------------------------------------------------------------+
//| Helper: Detect Pattern (M5)                                      |
//+------------------------------------------------------------------+
PatternType DetectPattern(ENUM_TIMEFRAMES tf, int bias)
{
   double high[], low[], close[];
   ArraySetAsSeries(high, true);
   ArraySetAsSeries(low, true);
   ArraySetAsSeries(close, true);
   
   int bars = 60; // Look back 60 bars on M5 = 5 hours
   CopyHigh(_Symbol, tf, 0, bars, high);
   CopyLow(_Symbol, tf, 0, bars, low);
   CopyClose(_Symbol, tf, 0, bars, close);
   
   double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
   double tolerance = InpPatternTolerance * point;
   double neckBuffer = InpNecklineBuffer * point;
   
   // Reset last pattern
   lastPattern.isValid = false;
   
   if(bias == 1) { // Buy -> Double Bottom
      for(int i=5; i<bars-5; i++) {
         for(int j=i+3; j<bars-3; j++) { // Closer bottoms allowed on M5
             if(MathAbs(low[i] - low[j]) < tolerance) {
                 double neckline = -1;
                 for(int k=i; k<=j; k++) if(high[k] > neckline) neckline = high[k];
                 
                 // Break check
                 if(close[0] > neckline + neckBuffer) {
                     lastPattern.type = PATTERN_DOUBLE_BOTTOM;
                     lastPattern.neckline = neckline;
                     lastPattern.patternLow = MathMin(low[i], low[j]);
                     lastPattern.patternHigh = neckline;
                     lastPattern.isValid = true;
                     return PATTERN_DOUBLE_BOTTOM;
                 }
             }
         }
      }
   }
   else { // Sell -> Double Top
      for(int i=5; i<bars-5; i++) {
         for(int j=i+3; j<bars-3; j++) {
             if(MathAbs(high[i] - high[j]) < tolerance) {
                 double neckline = 999999;
                 for(int k=i; k<=j; k++) if(low[k] < neckline) neckline = low[k];
                 
                 // Break check
                 if(close[0] < neckline - neckBuffer) {
                     lastPattern.type = PATTERN_DOUBLE_TOP;
                     lastPattern.neckline = neckline;
                     lastPattern.patternHigh = MathMax(high[i], high[j]);
                     lastPattern.patternLow = neckline;
                     lastPattern.isValid = true;
                     return PATTERN_DOUBLE_TOP;
                 }
             }
         }
      }
   }
   
   return PATTERN_NONE;
}

//+------------------------------------------------------------------+
//| Action: Open Trade                                               |
//+------------------------------------------------------------------+
void OpenTrade(int bias, PatternType type)
{
   if(!lastPattern.isValid) return;
   
   double patternSL = (bias == 1) ? lastPattern.patternLow : lastPattern.patternHigh;
   double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
   double entry = (bias == 1) ? SymbolInfoDouble(_Symbol, SYMBOL_ASK) : SymbolInfoDouble(_Symbol, SYMBOL_BID);
   
   double sl = (bias == 1) ? patternSL - (InpSL_Buffer * point) : patternSL + (InpSL_Buffer * point);
   double slDist = MathAbs(entry - sl) / point;
   
   double tpDist = slDist * InpRiskReward;
   double tp = (bias == 1) ? entry + (tpDist * point) : entry - (tpDist * point);
   
   sl = NormalizeDouble(sl, _Digits);
   tp = NormalizeDouble(tp, _Digits);
   
   // Lot Calc
   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   double riskMoney = balance * (InpRiskPercent / 100.0);
   double tickVal = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   double lot = riskMoney / (slDist * tickVal);
   lot = NormalizeDouble(lot, 2); 
   if(lot < 0.01) lot = 0.01;
   
   if(bias == 1) trade.Buy(lot, _Symbol, entry, sl, tp, "DayTrading V3 Buy");
   else trade.Sell(lot, _Symbol, entry, sl, tp, "DayTrading V3 Sell");
}

void ManageOpenPosition()
{
   // Basic Trailing implementation
   if(!InpEnableTrailing) return;
   if(!PositionSelect(_Symbol)) return;
   
   double sl = PositionGetDouble(POSITION_SL);
   double open = PositionGetDouble(POSITION_PRICE_OPEN);
   double current = (PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY) ? SymbolInfoDouble(_Symbol, SYMBOL_BID) : SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
   
   if(PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY) {
      if(current > open + (InpTrailingDistance * point)) {
         double newSL = current - (InpTrailingDistance * point);
         if(newSL > sl) trade.PositionModify(_Symbol, newSL, PositionGetDouble(POSITION_TP));
      }
   }
   else {
       if(current < open - (InpTrailingDistance * point)) {
         double newSL = current + (InpTrailingDistance * point);
         if(newSL < sl || sl == 0) trade.PositionModify(_Symbol, newSL, PositionGetDouble(POSITION_TP));
      }
   }
}

//+------------------------------------------------------------------+
//| 🔢 RISK MANAGER HELPERS                                         |
//+------------------------------------------------------------------+
void CheckNewDay()
{
   datetime now = TimeCurrent();
   // Conversion simple pour voir si jour a changé
   MqlDateTime dt;
   TimeToStruct(now, dt);
   datetime today = StringToTime(TimeToString(now, TIME_DATE));
   
   if(DayStartTime == 0 || today != DayStartTime)
   {
      DayStartTime = today;
      EquityDayStart = AccountInfoDouble(ACCOUNT_EQUITY);
      if(EquityDayStart == 0) EquityDayStart = AccountInfoDouble(ACCOUNT_BALANCE); // Fallback
      
      TradingDisabledToday = false;
      tradesThisDay = 0;
      lossesThisDay = 0;
      
      Print("☀️ NOUVEAU JOUR: Equity Start = ", EquityDayStart);
   }
}

double GetDailyPnLPercent()
{
   if(EquityDayStart == 0) return 0.0;
   double equityNow = AccountInfoDouble(ACCOUNT_EQUITY);
   return ((equityNow - EquityDayStart) / EquityDayStart) * 100.0;
}

void CheckDailyRiskRules()
{
   double dailyPnL = GetDailyPnLPercent();
   
   // ✅ STOP GAIN JOURNALIER (+1 %)
   if(dailyPnL >= InpDailyTargetPct) {
      if(!TradingDisabledToday) {
         TradingDisabledToday = true;
         Print("🎯 TARGET ATTEINT (+", dailyPnL, "%). Fin de journée.");
      }
   }
   
   // ❌ STOP LOSS JOURNALIER (−5 %)
   if(dailyPnL <= -InpDailyLossLimitPct) {
      if(!TradingDisabledToday) {
         TradingDisabledToday = true;
         Print("🛑 HARD STOP DAILY (-", dailyPnL, "%). Fin de journée.");
      }
   }
   
   // 🧱 DRAWDOWN GLOBAL (−10 %) - Sur Balance
   double maxBalance = AccountInfoDouble(ACCOUNT_BALANCE);
   double equityNow = AccountInfoDouble(ACCOUNT_EQUITY);
   
   double globalDD = 0;
   if(maxBalance > 0) globalDD = ((maxBalance - equityNow) / maxBalance) * 100.0;
   
   if(globalDD >= InpMaxGlobalDD) {
      if(!TradingDisabledGlobal) {
         TradingDisabledGlobal = true;
         Print("🧱 ALERTE GLOBAL DRAWDOWN (", globalDD, "%). Trading Bloqué.");
      }
   }
}
