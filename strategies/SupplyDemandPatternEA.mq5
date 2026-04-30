//+------------------------------------------------------------------+
//|                                    SupplyDemandPatternEA.mq5      |
//|                                      Multi-Timeframe Strategy     |
//|                              Supply/Demand + Pattern Recognition  |
//|                                         VERSION 2.0 - CORRECTED   |
//+------------------------------------------------------------------+
#property copyright "HaresTech"
#property link      ""
#property version   "2.00"
#property strict

#include <Trade\Trade.mqh>

//--- Input Parameters
input group "=== TREND FILTER (DAILY) ==="
input int InpEMA_Fast = 50;              // EMA Fast Period
input int InpEMA_Slow = 200;             // EMA Slow Period

input group "=== SUPPLY/DEMAND ZONES (H4) ==="
input int InpZoneImpulse = 300;          // Minimum impulse for zone (points) [RELAXED]
input int InpZoneBars = 5;               // Bars for impulse
input int InpZoneBuffer = 300;           // Zone entry buffer (points) [RELAXED]
input double InpZoneBoundaryPct = 100.0; // Zone boundary % (30-50) [RELAXED to 100%]

input group "=== PATTERN DETECTION (H1) ==="
input bool InpEnablePatterns = true;     // Enable Pattern Detection
input int InpPatternTolerance = 250;     // Pattern tolerance (points) [RELAXED]
input int InpNecklineBuffer = 30;        // Neckline break buffer (points)
input bool InpEnableHnS = true;          // Enable Head & Shoulders detection

input group "=== CONFIRMATION (M15) ==="
input bool InpRequireConfirmation = true; // Require M15 confirmation
input int InpEMA_M15 = 20;               // EMA Period for M15

input group "=== RISK MANAGEMENT ==="
input double InpRiskPercent = 0.5;       // Risk per trade (%)
input double InpRiskReward = 2.0;        // Risk:Reward ratio
input int InpSL_Buffer = 200;            // Stop Loss buffer (points)
input int InpMaxTradesPerDay = 3;        // Max trades per day [INCREASED]

input group "=== BREAK-EVEN & TRAILING ==="
input bool InpEnableBreakEven = true;    // Enable Break-Even
input double InpBE_RRatio = 1.0;         // Move to BE at this R-multiple
input bool InpEnableTrailing = false;    // Enable Trailing Stop
input int InpTrailingDistance = 300;     // Trailing distance (points)

input group "=== VOLATILITY FILTER ==="
input bool InpEnableATR = false;         // Enable ATR filter
input int InpATR_Period = 14;            // ATR Period
input double InpATR_Multiplier = 1.0;    // Minimum ATR multiplier

//--- Global Variables
CTrade trade;
datetime lastTradeDate = 0;
int tradesThisDay = 0;

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

// Pattern structure with details
struct PatternDetails {
   int type;           // Pattern type
   double neckline;    // Neckline price
   double patternLow;  // Lowest point in pattern
   double patternHigh; // Highest point in pattern
   bool isValid;       // Is pattern valid
};

PatternDetails lastPattern;

// Pattern types
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
   trade.SetExpertMagicNumber(123456);
   trade.SetDeviationInPoints(50);
   trade.SetTypeFilling(ORDER_FILLING_FOK);
   
   Print("=== Supply/Demand Pattern EA v2.0 Initialized ===");
   Print("Risk per trade: ", InpRiskPercent, "%");
   Print("Risk:Reward: 1:", InpRiskReward);
   
   // Initialize zones
   currentDemandZone.isValid = false;
   currentSupplyZone.isValid = false;
   
   // Initialize pattern
   lastPattern.isValid = false;
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("EA stopped. Reason: ", reason);
}

//+------------------------------------------------------------------+
//| Expert tick function                                              |
//+------------------------------------------------------------------+
void OnTick()
{
   // Check if new bar on M15
   static datetime lastBarTime = 0;
   datetime currentBarTime = iTime(_Symbol, PERIOD_M15, 0);
   
   if(currentBarTime == lastBarTime)
      return;
   
   lastBarTime = currentBarTime;
   
   // Check daily trade limit
   MqlDateTime timeStruct;
   TimeToStruct(TimeCurrent(), timeStruct);
   datetime today = StringToTime(IntegerToString(timeStruct.year) + "." + 
                                   IntegerToString(timeStruct.mon) + "." + 
                                   IntegerToString(timeStruct.day));
   
   if(today != lastTradeDate) {
      tradesThisDay = 0;
      lastTradeDate = today;
   }
   
   if(tradesThisDay >= InpMaxTradesPerDay) {
      return;
   }
   
   // Check if position already open
   if(PositionSelect(_Symbol)) {
      ManageOpenPosition();
      return;
   }
   
   // === STEP 1: Determine Daily Trend ===
   int trendBias = GetDailyTrend();
   if(trendBias == 0) {
      return; // Range, no trade
   }
   
   // === STEP 2: Update H4 Zones ===
   UpdateH4Zones();
   
   // === STEP 3: CRITICAL - Check if price is in zone FIRST ===
   double currentPrice = (trendBias == 1) ? SymbolInfoDouble(_Symbol, SYMBOL_BID) : 
                                             SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   
   bool inDemandZone = IsPriceInDemandZone(currentPrice);
   bool inSupplyZone = IsPriceInSupplyZone(currentPrice);
   
   // 🔴 CORRECTION CRITIQUE: PAS DE ZONE = PAS DE TRADE
   if(trendBias == 1 && !inDemandZone) {
      Print("BUY bias but NOT in Demand Zone - Skipping");
      return;
   }
   
   if(trendBias == -1 && !inSupplyZone) {
      Print("SELL bias but NOT in Supply Zone - Skipping");
      return;
   }
   
   // === STEP 4: Detect H1 Pattern (ONLY IF IN ZONE) ===
   if(!InpEnablePatterns) return;
   
   // 🔴 CORRECTION: Pattern detection avec zone validation intégrée
   PatternType pattern = DetectH1PatternStrict(trendBias);
   
   if(pattern == PATTERN_NONE || !lastPattern.isValid) {
      return;
   }
   
   // Validate pattern type matches bias
   if(trendBias == 1 && pattern != PATTERN_DOUBLE_BOTTOM && pattern != PATTERN_INV_HNS) {
      Print("Pattern type doesn't match BUY bias");
      return;
   }
   
   if(trendBias == -1 && pattern != PATTERN_DOUBLE_TOP && pattern != PATTERN_HNS) {
      Print("Pattern type doesn't match SELL bias");
      return;
   }
   
   // === STEP 5: ATR Filter (Optional) ===
   if(InpEnableATR) {
      if(!CheckATRFilter()) {
         Print("ATR filter failed - Low volatility");
         return;
      }
   }
   
   // === STEP 6: M15 Confirmation ===
   if(InpRequireConfirmation) {
      bool confirmed = CheckM15Confirmation(trendBias);
      if(!confirmed) {
         Print("M15 confirmation failed");
         return;
      }
   }
   
   // === STEP 7: Open Trade with Pattern-Based SL ===
   OpenTrade(trendBias, pattern);
}

//+------------------------------------------------------------------+
//| Get Daily Trend Bias                                              |
//+------------------------------------------------------------------+
int GetDailyTrend()
{
   double ema50[], ema200[];
   ArraySetAsSeries(ema50, true);
   ArraySetAsSeries(ema200, true);
   
   int handleEMA50 = iMA(_Symbol, PERIOD_D1, InpEMA_Fast, 0, MODE_EMA, PRICE_CLOSE);
   int handleEMA200 = iMA(_Symbol, PERIOD_D1, InpEMA_Slow, 0, MODE_EMA, PRICE_CLOSE);
   
   if(handleEMA50 == INVALID_HANDLE || handleEMA200 == INVALID_HANDLE) {
      Print("Error creating EMA handles");
      return 0;
   }
   
   if(CopyBuffer(handleEMA50, 0, 0, 2, ema50) < 2 || 
      CopyBuffer(handleEMA200, 0, 0, 2, ema200) < 2) {
      return 0;
   }
   
   IndicatorRelease(handleEMA50);
   IndicatorRelease(handleEMA200);
   
   if(ema50[0] > ema200[0]) return 1;   // BUY bias
   if(ema50[0] < ema200[0]) return -1;  // SELL bias
   
   return 0; // Range
}

//+------------------------------------------------------------------+
//| Update H4 Supply/Demand Zones                                     |
//+------------------------------------------------------------------+
void UpdateH4Zones()
{
   static datetime lastZoneUpdate = 0;
   datetime currentH4Bar = iTime(_Symbol, PERIOD_H4, 0);
   
   if(currentH4Bar == lastZoneUpdate)
      return;
   
   lastZoneUpdate = currentH4Bar;
   
   FindDemandZone();
   FindSupplyZone();
}

//+------------------------------------------------------------------+
//| Find Demand Zone (Support + Bullish Impulse)                     |
//+------------------------------------------------------------------+
void FindDemandZone()
{
   double low[], high[], close[];
   ArraySetAsSeries(low, true);
   ArraySetAsSeries(high, true);
   ArraySetAsSeries(close, true);
   
   int bars = 50;
   CopyLow(_Symbol, PERIOD_H4, 0, bars, low);
   CopyHigh(_Symbol, PERIOD_H4, 0, bars, high);
   CopyClose(_Symbol, PERIOD_H4, 0, bars, close);
   
   double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
   
   for(int i = 5; i < bars - InpZoneBars; i++) {
      bool isSwingLow = true;
      
      for(int j = 1; j <= 3; j++) {
         if(low[i] >= low[i-j] || low[i] >= low[i+j]) {
            isSwingLow = false;
            break;
         }
      }
      
      if(!isSwingLow) continue;
      
      // Check for bullish impulse
      double impulse = 0;
      for(int k = i; k >= MathMax(0, i - InpZoneBars); k--) {
         impulse += (close[k] - low[i]) / point;
      }
      
      if(impulse >= InpZoneImpulse) {
         currentDemandZone.low = low[i];
         currentDemandZone.high = low[i] + (InpZoneBuffer * point);
         currentDemandZone.mid = (currentDemandZone.low + currentDemandZone.high) / 2;
         currentDemandZone.isValid = true;
         currentDemandZone.created = iTime(_Symbol, PERIOD_H4, i);
         
         Print("Demand Zone created: ", currentDemandZone.low, " - ", currentDemandZone.high);
         break;
      }
   }
}

//+------------------------------------------------------------------+
//| Find Supply Zone (Resistance + Bearish Impulse)                  |
//+------------------------------------------------------------------+
void FindSupplyZone()
{
   double low[], high[], close[];
   ArraySetAsSeries(low, true);
   ArraySetAsSeries(high, true);
   ArraySetAsSeries(close, true);
   
   int bars = 50;
   CopyLow(_Symbol, PERIOD_H4, 0, bars, low);
   CopyHigh(_Symbol, PERIOD_H4, 0, bars, high);
   CopyClose(_Symbol, PERIOD_H4, 0, bars, close);
   
   double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
   
   for(int i = 5; i < bars - InpZoneBars; i++) {
      bool isSwingHigh = true;
      
      for(int j = 1; j <= 3; j++) {
         if(high[i] <= high[i-j] || high[i] <= high[i+j]) {
            isSwingHigh = false;
            break;
         }
      }
      
      if(!isSwingHigh) continue;
      
      double impulse = 0;
      for(int k = i; k >= MathMax(0, i - InpZoneBars); k--) {
         impulse += (high[i] - close[k]) / point;
      }
      
      if(impulse >= InpZoneImpulse) {
         currentSupplyZone.high = high[i];
         currentSupplyZone.low = high[i] - (InpZoneBuffer * point);
         currentSupplyZone.mid = (currentSupplyZone.low + currentSupplyZone.high) / 2;
         currentSupplyZone.isValid = true;
         currentSupplyZone.created = iTime(_Symbol, PERIOD_H4, i);
         
         Print("Supply Zone created: ", currentSupplyZone.low, " - ", currentSupplyZone.high);
         break;
      }
   }
}

//+------------------------------------------------------------------+
//| Check if price is in Demand Zone                                 |
//+------------------------------------------------------------------+
bool IsPriceInDemandZone(double price)
{
   if(!currentDemandZone.isValid)
      return false;
   
   double buffer = InpZoneBuffer * SymbolInfoDouble(_Symbol, SYMBOL_POINT);
   
   // Basic zone check
   if(price > currentDemandZone.high + buffer || price < currentDemandZone.low)
      return false;
   
   // 🔴 ZONE BOUNDARY CHECK: Pattern must be in bottom 30-40% of demand zone
   double zoneHeight = currentDemandZone.high - currentDemandZone.low;
   double boundaryLimit = currentDemandZone.low + (zoneHeight * (InpZoneBoundaryPct / 100.0));
   
   if(price > boundaryLimit) {
      Print("Price too high in Demand Zone: ", price, " > ", boundaryLimit);
      return false;
   }
   
   return true;
}

//+------------------------------------------------------------------+
//| Check if price is in Supply Zone                                 |
//+------------------------------------------------------------------+
bool IsPriceInSupplyZone(double price)
{
   if(!currentSupplyZone.isValid)
      return false;
   
   double buffer = InpZoneBuffer * SymbolInfoDouble(_Symbol, SYMBOL_POINT);
   
   // Basic zone check
   if(price < currentSupplyZone.low - buffer || price > currentSupplyZone.high)
      return false;
   
   // 🔴 ZONE BOUNDARY CHECK: Pattern must be in top 30-40% of supply zone
   double zoneHeight = currentSupplyZone.high - currentSupplyZone.low;
   double boundaryLimit = currentSupplyZone.high - (zoneHeight * (InpZoneBoundaryPct / 100.0));
   
   if(price < boundaryLimit) {
      Print("Price too low in Supply Zone: ", price, " < ", boundaryLimit);
      return false;
   }
   
   return true;
}

//+------------------------------------------------------------------+
//| 🔴 NEW: Strict Pattern Detection with Zone & Neckline Required  |
//+------------------------------------------------------------------+
PatternType DetectH1PatternStrict(int bias)
{
   double high[], low[], close[];
   ArraySetAsSeries(high, true);
   ArraySetAsSeries(low, true);
   ArraySetAsSeries(close, true);
   
   int bars = 40;
   CopyHigh(_Symbol, PERIOD_H1, 0, bars, high);
   CopyLow(_Symbol, PERIOD_H1, 0, bars, low);
   CopyClose(_Symbol, PERIOD_H1, 0, bars, close);
   
   double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
   double tolerance = InpPatternTolerance * point;
   
   // Only search for patterns matching the bias
   if(bias == 1) {
      // Try Double Bottom first
      PatternType pattern = DetectDoubleBottomStrict(low, high, close, bars, tolerance);
      if(pattern != PATTERN_NONE) return pattern;
      
      // Try Inverse H&S
      if(InpEnableHnS) {
         pattern = DetectInverseHnS(low, high, close, bars, tolerance);
         if(pattern != PATTERN_NONE) return pattern;
      }
   }
   else {
      // Try Double Top first
      PatternType pattern = DetectDoubleTopStrict(high, low, close, bars, tolerance);
      if(pattern != PATTERN_NONE) return pattern;
      
      // Try H&S
      if(InpEnableHnS) {
         pattern = DetectHnS(high, low, close, bars, tolerance);
         if(pattern != PATTERN_NONE) return pattern;
      }
   }
   
   return PATTERN_NONE;
}

//+------------------------------------------------------------------+
//| 🔴 CORRECTED: Double Bottom with MANDATORY Neckline Break       |
//+------------------------------------------------------------------+
PatternType DetectDoubleBottomStrict(const double &low[], const double &high[], 
                                     const double &close[], int bars, double tolerance)
{
   double buffer = InpNecklineBuffer * SymbolInfoDouble(_Symbol, SYMBOL_POINT);
   
   for(int i = 10; i < bars - 10; i++) {
      for(int j = i + 5; j < bars - 5; j++) {
         // Check if two lows are approximately equal
         if(MathAbs(low[i] - low[j]) <= tolerance) {
            // Find neckline (highest point between the two lows)
            double neckline = 0;
            for(int k = i; k <= j; k++) {
               if(high[k] > neckline)
                  neckline = high[k];
            }
            
            // 🔴 MANDATORY: Close H1 must be ABOVE neckline + buffer
            if(close[0] > neckline + buffer) {
               // Pattern valid - store details
               lastPattern.type = PATTERN_DOUBLE_BOTTOM;
               lastPattern.neckline = neckline;
               lastPattern.patternLow = MathMin(low[i], low[j]);
               lastPattern.patternHigh = neckline;
               lastPattern.isValid = true;
               
               Print("✅ Double Bottom CONFIRMED: Neckline=", neckline, " Close=", close[0]);
               return PATTERN_DOUBLE_BOTTOM;
            }
         }
      }
   }
   
   return PATTERN_NONE;
}

//+------------------------------------------------------------------+
//| 🔴 CORRECTED: Double Top with MANDATORY Neckline Break          |
//+------------------------------------------------------------------+
PatternType DetectDoubleTopStrict(const double &high[], const double &low[], 
                                  const double &close[], int bars, double tolerance)
{
   double buffer = InpNecklineBuffer * SymbolInfoDouble(_Symbol, SYMBOL_POINT);
   
   for(int i = 10; i < bars - 10; i++) {
      for(int j = i + 5; j < bars - 5; j++) {
         // Check if two highs are approximately equal
         if(MathAbs(high[i] - high[j]) <= tolerance) {
            // Find neckline (lowest point between the two highs)
            double neckline = 999999;
            for(int k = i; k <= j; k++) {
               if(low[k] < neckline)
                  neckline = low[k];
            }
            
            // 🔴 MANDATORY: Close H1 must be BELOW neckline - buffer
            if(close[0] < neckline - buffer) {
               // Pattern valid - store details
               lastPattern.type = PATTERN_DOUBLE_TOP;
               lastPattern.neckline = neckline;
               lastPattern.patternHigh = MathMax(high[i], high[j]);
               lastPattern.patternLow = neckline;
               lastPattern.isValid = true;
               
               Print("✅ Double Top CONFIRMED: Neckline=", neckline, " Close=", close[0]);
               return PATTERN_DOUBLE_TOP;
            }
         }
      }
   }
   
   return PATTERN_NONE;
}

//+------------------------------------------------------------------+
//| 🆕 Inverse Head & Shoulders Detection                            |
//+------------------------------------------------------------------+
PatternType DetectInverseHnS(const double &low[], const double &high[], 
                             const double &close[], int bars, double tolerance)
{
   double buffer = InpNecklineBuffer * SymbolInfoDouble(_Symbol, SYMBOL_POINT);
   
   // Looking for: Left Shoulder - Head - Right Shoulder
   for(int head = 15; head < bars - 15; head++) {
      // Head must be lowest point
      bool isHead = true;
      for(int k = head - 3; k <= head + 3; k++) {
         if(k != head && low[k] <= low[head]) {
            isHead = false;
            break;
         }
      }
      
      if(!isHead) continue;
      
      // Look for left shoulder
      for(int ls = head + 5; ls < head + 15; ls++) {
         if(MathAbs(low[ls] - low[head]) < tolerance) continue; // Too close tohead
         
         // Look for right shoulder
         for(int rs = head - 15; rs < head - 5; rs++) {
            // Shoulders should be approximately equal
            if(MathAbs(low[ls] - low[rs]) > tolerance) continue;
            
            // Both shoulders must be higher than head
            if(low[ls] <= low[head] || low[rs] <= low[head]) continue;
            
            // Find neckline (connect high between shoulders)
            double neckline = MathMax(high[ls], high[rs]);
            
            // Check neckline break
            if(close[0] > neckline + buffer) {
               lastPattern.type = PATTERN_INV_HNS;
               lastPattern.neckline = neckline;
               lastPattern.patternLow = low[head];
               lastPattern.patternHigh = neckline;
               lastPattern.isValid = true;
               
               Print("✅ Inverse H&S CONFIRMED: Head=", low[head], " Neckline=", neckline);
               return PATTERN_INV_HNS;
            }
         }
      }
   }
   
   return PATTERN_NONE;
}

//+------------------------------------------------------------------+
//| 🆕 Head & Shoulders Detection                                    |
//+------------------------------------------------------------------+
PatternType DetectHnS(const double &high[], const double &low[], 
                      const double &close[], int bars, double tolerance)
{
   double buffer = InpNecklineBuffer * SymbolInfoDouble(_Symbol, SYMBOL_POINT);
   
   // Looking for: Left Shoulder - Head - Right Shoulder
   for(int head = 15; head < bars - 15; head++) {
      // Head must be highest point
      bool isHead = true;
      for(int k = head - 3; k <= head + 3; k++) {
         if(k != head && high[k] >= high[head]) {
            isHead = false;
            break;
         }
      }
      
      if(!isHead) continue;
      
      // Look for left shoulder
      for(int ls = head + 5; ls < head + 15; ls++) {
         if(MathAbs(high[ls] - high[head]) < tolerance) continue;
         
         // Look for right shoulder
         for(int rs = head - 15; rs < head - 5; rs++) {
            // Shoulders approximately equal
            if(MathAbs(high[ls] - high[rs]) > tolerance) continue;
            
            // Both shoulders must be lower than head
            if(high[ls] >= high[head] || high[rs] >= high[head]) continue;
            
            // Find neckline
            double neckline = MathMin(low[ls], low[rs]);
            
            // Check neckline break
            if(close[0] < neckline - buffer) {
               lastPattern.type = PATTERN_HNS;
               lastPattern.neckline = neckline;
               lastPattern.patternHigh = high[head];
               lastPattern.patternLow = neckline;
               lastPattern.isValid = true;
               
               Print("✅ H&S CONFIRMED: Head=", high[head], " Neckline=", neckline);
               return PATTERN_HNS;
            }
         }
      }
   }
   
   return PATTERN_NONE;
}

//+------------------------------------------------------------------+
//| 🆕 ATR Volatility Filter                                         |
//+------------------------------------------------------------------+
bool CheckATRFilter()
{
   double atr[];
   ArraySetAsSeries(atr, true);
   
   int handleATR = iATR(_Symbol, PERIOD_H1, InpATR_Period);
   if(handleATR == INVALID_HANDLE) return true; // Skip if error
   
   if(CopyBuffer(handleATR, 0, 0, 2, atr) < 2) {
      IndicatorRelease(handleATR);
      return true;
   }
   
   IndicatorRelease(handleATR);
   
   double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
   double minATR = InpZoneBuffer * point * InpATR_Multiplier;
   
   if(atr[0] < minATR) {
      Print("ATR too low: ", atr[0], " < ", minATR);
      return false;
   }
   
   return true;
}

//+------------------------------------------------------------------+
//| Check M15 Confirmation                                            |
//+------------------------------------------------------------------+
bool CheckM15Confirmation(int bias)
{
   double open[], close[], high[], low[];
   ArraySetAsSeries(open, true);
   ArraySetAsSeries(close, true);
   ArraySetAsSeries(high, true);
   ArraySetAsSeries(low, true);
   
   CopyOpen(_Symbol, PERIOD_M15, 0, 3, open);
   CopyClose(_Symbol, PERIOD_M15, 0, 3, close);
   CopyHigh(_Symbol, PERIOD_M15, 0, 3, high);
   CopyLow(_Symbol, PERIOD_M15, 0, 3, low);
   
   double ema[];
   ArraySetAsSeries(ema, true);
   int handleEMA = iMA(_Symbol, PERIOD_M15, InpEMA_M15, 0, MODE_EMA, PRICE_CLOSE);
   CopyBuffer(handleEMA, 0, 0, 2, ema);
   IndicatorRelease(handleEMA);
   
   if(bias == 1) {
      bool engulfing = (close[1] > open[1] && close[2] < open[2] && close[1] > open[2]);
      
      double bodySize = MathAbs(close[1] - open[1]);
      double lowerWick = MathMin(open[1], close[1]) - low[1];
      bool pinBar = (lowerWick > bodySize * 2);
      
      bool aboveEMA = (close[0] > ema[0]);
      
      return (engulfing || pinBar || aboveEMA);
   }
   else {
      bool engulfing = (close[1] < open[1] && close[2] > open[2] && close[1] < open[2]);
      
      double bodySize = MathAbs(close[1] - open[1]);
      double upperWick = high[1] - MathMax(open[1], close[1]);
      bool pinBar = (upperWick > bodySize * 2);
      
      bool belowEMA = (close[0] < ema[0]);
      
      return (engulfing || pinBar || belowEMA);
   }
   
   return false;
}

//+------------------------------------------------------------------+
//| 🔴 CORRECTED: Open Trade with Pattern-Based SL                  |
//+------------------------------------------------------------------+
void OpenTrade(int bias, PatternType pattern)
{
   if(!lastPattern.isValid) {
      Print("ERROR: Trying to trade without valid pattern details");
      return;
   }
   
   double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   
   double entryPrice, sl, tp;
   
   if(bias == 1) { // BUY
      entryPrice = ask;
      
      // 🔴 SL = Pattern Low + Buffer (CRITICAL CORRECTION)
      sl = lastPattern.patternLow - (InpSL_Buffer * point);
      
      double slPoints = (entryPrice - sl) / point;
      double tpPoints = slPoints * InpRiskReward;
      tp = entryPrice + (tpPoints * point);
      
      sl = NormalizeDouble(sl, _Digits);
      tp = NormalizeDouble(tp, _Digits);
      
      double lotSize = CalculateLotSize(slPoints);
      
      if(trade.Buy(lotSize, _Symbol, entryPrice, sl, tp, "SD Pattern BUY")) {
         Print("✅ BUY OPENED: Entry=", entryPrice, " SL=", sl, " (Pattern Low=", lastPattern.patternLow, ") TP=", tp);
         tradesThisDay++;
      }
   }
   else { // SELL
      entryPrice = bid;
      
      // 🔴 SL = Pattern High + Buffer (CRITICAL CORRECTION)
      sl = lastPattern.patternHigh + (InpSL_Buffer * point);
      
      double slPoints = (sl - entryPrice) / point;
      double tpPoints = slPoints * InpRiskReward;
      tp = entryPrice - (tpPoints * point);
      
      sl = NormalizeDouble(sl, _Digits);
      tp = NormalizeDouble(tp, _Digits);
      
      double lotSize = CalculateLotSize(slPoints);
      
      if(trade.Sell(lotSize, _Symbol, entryPrice, sl, tp, "SD Pattern SELL")) {
         Print("✅ SELL OPENED: Entry=", entryPrice, " SL=", sl, " (Pattern High=", lastPattern.patternHigh, ") TP=", tp);
         tradesThisDay++;
      }
   }
   
   // Invalidate pattern after use
   lastPattern.isValid = false;
}

//+------------------------------------------------------------------+
//| Calculate Lot Size Based on Risk                                 |
//+------------------------------------------------------------------+
double CalculateLotSize(double slPoints)
{
   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   double riskAmount = balance * (InpRiskPercent / 100.0);
   
   double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
   double tickSize = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   
   double slMoney = (slPoints * point / tickSize) * tickValue;
   
   double lotSize = riskAmount / slMoney;
   
   double minLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double maxLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   double lotStep = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
   
   lotSize = MathFloor(lotSize / lotStep) * lotStep;
   lotSize = MathMax(minLot, MathMin(maxLot, lotSize));
   
   return lotSize;
}

//+------------------------------------------------------------------+
//| Manage Open Position (Break-Even, Trailing)                      |
//+------------------------------------------------------------------+
void ManageOpenPosition()
{
   if(!PositionSelect(_Symbol))
      return;
   
   double positionOpenPrice = PositionGetDouble(POSITION_PRICE_OPEN);
   double positionSL = PositionGetDouble(POSITION_SL);
   double positionTP = PositionGetDouble(POSITION_TP);
   long positionType = PositionGetInteger(POSITION_TYPE);
   
   double currentPrice = (positionType == POSITION_TYPE_BUY) ? 
                         SymbolInfoDouble(_Symbol, SYMBOL_BID) :
                         SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   
   double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
   double slDistance = MathAbs(positionOpenPrice - positionSL);
   
   // === BREAK-EVEN ===
   if(InpEnableBreakEven) {
      double beDistance = slDistance * InpBE_RRatio;
      
      if(positionType == POSITION_TYPE_BUY) {
         if(currentPrice >= positionOpenPrice + beDistance && positionSL < positionOpenPrice) {
            double newSL = positionOpenPrice + (10 * point);
            trade.PositionModify(_Symbol, newSL, positionTP);
            Print("✅ Break-Even activated for BUY");
         }
      }
      else {
         if(currentPrice <= positionOpenPrice - beDistance && positionSL > positionOpenPrice) {
            double newSL = positionOpenPrice - (10 * point);
            trade.PositionModify(_Symbol, newSL, positionTP);
            Print("✅ Break-Even activated for SELL");
         }
      }
   }
   
   // === TRAILING STOP ===
   if(InpEnableTrailing) {
      double trailDistance = InpTrailingDistance * point;
      
      if(positionType == POSITION_TYPE_BUY) {
         double newSL = currentPrice - trailDistance;
         if(newSL > positionSL) {
            trade.PositionModify(_Symbol, NormalizeDouble(newSL, _Digits), positionTP);
         }
      }
      else {
         double newSL = currentPrice + trailDistance;
         if(newSL < positionSL) {
            trade.PositionModify(_Symbol, NormalizeDouble(newSL, _Digits), positionTP);
         }
      }
   }
}
//+------------------------------------------------------------------+
