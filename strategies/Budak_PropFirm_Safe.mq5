//+------------------------------------------------------------------+
//|                                      Budak_PropFirm_Safe.mq5     |
//|                         Grid/Averaging PropFirm Compliant        |
//|                              Optimized for $100k Account         |
//+------------------------------------------------------------------+
#property copyright "PropFirm Safe Edition 2024"
#property link      ""
#property version   "2.00"
#property description "Grid/Averaging strategy with strict PropFirm protections"
#property description "Daily Loss: 4% | Total DD: 8% | Max Trades: 6"
#property description "Optimized for $100,000 account size"

//+------------------------------------------------------------------+
//| Includes                                                          |
//+------------------------------------------------------------------+
#include <Trade\Trade.mqh>
#include <Trade\PositionInfo.mqh>
#include <Trade\AccountInfo.mqh>

//+------------------------------------------------------------------+
//| PropFirm Settings                                                 |
//+------------------------------------------------------------------+
input group "🏦 PROPFIRM PROTECTIONS"
input bool     UsePropFirmMode = true;              // Enable PropFirm strict rules
input string   PropFirmType = "FTMO";               // Type: FTMO, MFF, E8
input double   AccountSize = 100000;                // Account size ($100k)
input double   MaxDailyLossPct = 4.0;               // Max daily loss %
input double   MaxTotalDDPct = 8.0;                 // Max total drawdown %
input double   DailyProfitTarget = 2.5;             // Daily profit target %
input bool     AvoidNewsEvents = true;              // Avoid major news
input int      NewsBufferMinutes = 20;              // Minutes before/after news
input bool     CloseBeforeWeekend = true;           // Close Friday evening
input int      FridayCloseHour = 20;                // Friday close hour

//+------------------------------------------------------------------+
//| Grid/Averaging Settings                                           |
//+------------------------------------------------------------------+
input group "📊 GRID STRATEGY"
input double   StartingLots = 0.10;                 // Starting lot size ($100k optimized)
input double   TakeProfit = 80.0;                   // Take profit in pips
input double   PipStep = 80.0;                      // Distance between orders (pips)
input double   Multiplier = 1.1;                    // Lot multiplier (1.1 safe)
input int      MaxTrades = 6;                       // Max averaging trades (PROPFIRM SAFE)
input double   StopLoss = 300.0;                    // Stop loss in pips (effective)

//+------------------------------------------------------------------+
//| RSI Entry Settings                                                |
//+------------------------------------------------------------------+
input group "📈 ENTRY SIGNALS"
input int      RSI_Period = 5;                      // RSI period
input ENUM_TIMEFRAMES RSI_Timeframe = PERIOD_M15;   // RSI timeframe
input double   RSI_Overbought = 56.0;               // RSI > 56 → SELL
input double   RSI_Oversold = 36.0;                 // RSI < 36 → BUY

//+------------------------------------------------------------------+
//| Risk Management                                                   |
//+------------------------------------------------------------------+
input group "🛡️ ADDITIONAL PROTECTION"
input bool     UseEquityStop = true;                // Use equity stop
input double   TotalEquityRisk = 8.0;               // Max equity risk %
input bool     UseTrailingStop = false;             // Use trailing stop
input double   TrailStart = 100.0;                  // Trailing start (pips)
input double   TrailStop = 100.0;                   // Trailing distance (pips)
input bool     UseTimeOut = false;                  // Use timeout
input double   MaxTradeOpenHours = 48.0;            // Max hours open

//+------------------------------------------------------------------+
//| Global Variables                                                  |
//+------------------------------------------------------------------+
CTrade trade;
CPositionInfo position;
CAccountInfo account;

// PropFirm variables
double g_equity_start_day = 0;
double g_balance_peak = 0;
datetime g_last_day_reset = 0;
bool g_trading_disabled_today = false;
bool g_trading_disabled_global = false;
int g_trading_days_count = 0;
double g_total_profit = 0;
double g_today_profit = 0;
int g_trades_today = 0;

// Trading variables
int MagicNumber = 777777;
double slip = 30.0;
datetime timeprev = 0;
datetime expiration = 0;
int NumOfTrades = 0;
double iLots = 0;
bool TradeNow = false;
bool LongTrade = false;
bool ShortTrade = false;
bool NewOrdersPlaced = false;
double AveragePrice = 0;
double PriceTarget = 0;
double BuyTarget = 0;
double SellTarget = 0;
double LastBuyPrice = 0;
double LastSellPrice = 0;
double AccountEquityHighAmt = 0;
double PrevEquity = 0;

// Indicator handle
int handle_rsi;

//+------------------------------------------------------------------+
//| Expert initialization function                                    |
//+------------------------------------------------------------------+
int OnInit()
{
   // Initialize RSI
   handle_rsi = iRSI(_Symbol, RSI_Timeframe, RSI_Period, PRICE_CLOSE);
   if(handle_rsi == INVALID_HANDLE)
   {
      Print("Error creating RSI indicator");
      return(INIT_FAILED);
   }
   
   // Trading settings
   trade.SetExpertMagicNumber(MagicNumber);
   trade.SetDeviationInPoints((int)slip);
   trade.SetTypeFilling(ORDER_FILLING_FOK);
   
   // Initialize PropFirm
   if(UsePropFirmMode)
   {
      PropFirm_Initialize();
   }
   
   Print("========================================");
   Print("Budak PropFirm Safe EA initialized");
   Print("Account Size: $", AccountSize);
   Print("Starting Lots: ", StartingLots);
   Print("Max Trades: ", MaxTrades);
   Print("PropFirm Mode: ", (UsePropFirmMode ? "ENABLED" : "DISABLED"));
   Print("========================================");
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                  |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   IndicatorRelease(handle_rsi);
}

//+------------------------------------------------------------------+
//| Expert tick function                                              |
//+------------------------------------------------------------------+
void OnTick()
{
   // Check once per bar
   if(timeprev == iTime(_Symbol, PERIOD_CURRENT, 0)) return;
   timeprev = iTime(_Symbol, PERIOD_CURRENT, 0);
   
   // PropFirm Risk Management Checks
   if(UsePropFirmMode)
   {
      PropFirm_CheckDailyReset();
      
      if(!PropFirm_CheckRiskLimits())
      {
         return; // Trading disabled
      }
      
      if(PropFirm_IsNewsTime())
      {
         Print("📰 News time - Trading paused");
         return;
      }
      
      PropFirm_CheckWeekendClose();
      PropFirm_DisplayDashboard();
   }
   
   // Trailing stop
   if(UseTrailingStop)
      TrailingAlls(TrailStart, TrailStop, AveragePrice);
   
   // Timeout
   if(UseTimeOut && TimeCurrent() >= expiration)
   {
      CloseAllOrders();
      Print("Closed all due to timeout");
      return;
   }
   
   // Equity stop
   double CurrentPairProfit = CalculateProfit();
   if(UseEquityStop)
   {
      if(CurrentPairProfit < 0 && MathAbs(CurrentPairProfit) > TotalEquityRisk / 100.0 * AccountEquityHigh())
      {
         CloseAllOrders();
         Print("Closed all due to equity stop");
         NewOrdersPlaced = false;
         return;
      }
   }
   
   // Count trades
   int total = CountTrades();
   
   // Check max trades limit
   if(total >= MaxTrades)
   {
      // Only manage existing positions, no new trades
      ManageExistingPositions(total);
      return;
   }
   
   // Determine direction
   DetermineTradeDirection(total);
   
   // Check for new trade
   if(total > 0 && total < MaxTrades)
   {
      CheckAveragingOpportunity(total);
   }
   
   // First trade logic
   if(total < 1)
   {
      CheckFirstTradeEntry();
   }
   
   // Execute pending trades
   if(TradeNow)
   {
      ExecutePendingTrades(total);
   }
   
   // Manage positions
   ManageExistingPositions(total);
}

//+------------------------------------------------------------------+
//| PropFirm Functions                                                |
//+------------------------------------------------------------------+
void PropFirm_Initialize()
{
   g_balance_peak = account.Balance();
   g_equity_start_day = account.Equity();
   g_last_day_reset = TimeCurrent();
   
   Print("🏦 PropFirm Mode Activated");
   Print("Type: ", PropFirmType);
   Print("Max Daily Loss: ", MaxDailyLossPct, "%");
   Print("Max Total DD: ", MaxTotalDDPct, "%");
}

void PropFirm_CheckDailyReset()
{
   MqlDateTime dt, last_dt;
   TimeToStruct(TimeCurrent(), dt);
   TimeToStruct(g_last_day_reset, last_dt);
   
   if(dt.day != last_dt.day || g_last_day_reset == 0)
   {
      g_equity_start_day = account.Equity();
      g_today_profit = 0;
      g_trades_today = 0;
      g_trading_disabled_today = false;
      g_last_day_reset = TimeCurrent();
      
      if(account.Balance() > g_balance_peak || g_balance_peak == 0)
         g_balance_peak = account.Balance();
      
      Print("🔄 Daily Reset | Equity: $", g_equity_start_day);
   }
}

bool PropFirm_CheckRiskLimits()
{
   if(g_trading_disabled_global)
   {
      Print("⛔ Trading DISABLED - Total DD exceeded");
      return false;
   }
   
   if(g_trading_disabled_today)
   {
      return false;
   }
   
   double current_equity = account.Equity();
   
   // Daily loss check
   double daily_pnl_pct = (current_equity - g_equity_start_day) / g_equity_start_day * 100.0;
   if(daily_pnl_pct <= -MaxDailyLossPct)
   {
      g_trading_disabled_today = true;
      Print("❌ DAILY LOSS LIMIT: ", DoubleToString(daily_pnl_pct, 2), "%");
      CloseAllOrders();
      return false;
   }
   
   // Total DD check
   double total_dd = 0;
   if(g_balance_peak > 0)
      total_dd = (g_balance_peak - current_equity) / g_balance_peak * 100.0;
   
   if(total_dd >= MaxTotalDDPct)
   {
      g_trading_disabled_global = true;
      Print("❌ TOTAL DD EXCEEDED: ", DoubleToString(total_dd, 2), "%");
      CloseAllOrders();
      return false;
   }
   
   // Daily profit target
   if(daily_pnl_pct >= DailyProfitTarget)
   {
      g_trading_disabled_today = true;
      Print("✅ PROFIT TARGET REACHED: ", DoubleToString(daily_pnl_pct, 2), "%");
      return false;
   }
   
   return true;
}

bool PropFirm_IsNewsTime()
{
   if(!AvoidNewsEvents) return false;
   
   MqlDateTime dt;
   TimeToStruct(TimeCurrent(), dt);
   
   int current_hour = dt.hour;
   int current_min = dt.min;
   int day_of_month = dt.day;
   int day_of_week = dt.day_of_week;
   
   // NFP: First Friday, 13:30 GMT
   if(day_of_week == 5 && day_of_month <= 7)
   {
      if(current_hour == 13 && MathAbs(current_min - 30) <= NewsBufferMinutes)
         return true;
   }
   
   // CPI: ~13th, 13:30 GMT
   if(day_of_month >= 12 && day_of_month <= 14)
   {
      if(current_hour == 13 && MathAbs(current_min - 30) <= NewsBufferMinutes)
         return true;
   }
   
   // FOMC: Mid-month Wednesday, 18:00 GMT
   if(day_of_week == 3 && day_of_month >= 12 && day_of_month <= 18)
   {
      if(current_hour == 18 && current_min <= NewsBufferMinutes)
         return true;
   }
   
   return false;
}

void PropFirm_CheckWeekendClose()
{
   if(!CloseBeforeWeekend) return;
   
   MqlDateTime dt;
   TimeToStruct(TimeCurrent(), dt);
   
   if(dt.day_of_week == 5 && dt.hour >= FridayCloseHour)
   {
      CloseAllOrders();
      Print("🔒 Weekend close executed");
   }
}

void PropFirm_DisplayDashboard()
{
   if(MQLInfoInteger(MQL_TESTER)) return;
   
   double current_equity = account.Equity();
   double daily_pnl = current_equity - g_equity_start_day;
   double daily_pnl_pct = g_equity_start_day > 0 ? (daily_pnl / g_equity_start_day) * 100.0 : 0;
   
   double total_dd = 0;
   if(g_balance_peak > 0)
      total_dd = ((g_balance_peak - current_equity) / g_balance_peak) * 100.0;
   
   string status = "\n========== 🏦 BUDAK PROPFIRM DASHBOARD ==========\n";
   status += "Type: " + PropFirmType + " | Account: $" + DoubleToString(AccountSize, 0) + "\n";
   status += "Trades Today: " + IntegerToString(g_trades_today) + " | Max: " + IntegerToString(MaxTrades) + "\n";
   status += "-------------------------------------------\n";
   status += "📊 DAILY: $" + DoubleToString(daily_pnl, 2) + " (" + DoubleToString(daily_pnl_pct, 2) + "%)\n";
   status += "  Limit: " + DoubleToString(MaxDailyLossPct, 1) + "% | Target: " + DoubleToString(DailyProfitTarget, 1) + "%\n";
   status += "-------------------------------------------\n";
   status += "📉 DD: " + DoubleToString(total_dd, 2) + "% | Max: " + DoubleToString(MaxTotalDDPct, 1) + "%\n";
   status += "  Peak: $" + DoubleToString(g_balance_peak, 2) + "\n";
   status += "-------------------------------------------\n";
   status += "⚡ STATUS: " + (g_trading_disabled_global ? "❌ DISABLED" : 
                              g_trading_disabled_today ? "🔒 PAUSED" : "✅ ACTIVE") + "\n";
   status += "==========================================\n";
   
   Comment(status);
}

//+------------------------------------------------------------------+
//| Trading Logic Functions                                           |
//+------------------------------------------------------------------+
int CountTrades()
{
   int count = 0;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(position.SelectByIndex(i))
      {
         if(position.Symbol() == _Symbol && position.Magic() == MagicNumber)
            count++;
      }
   }
   return count;
}

void DetermineTradeDirection(int total)
{
   if(total == 0)
   {
      LongTrade = false;
      ShortTrade = false;
      TradeNow = true;
      return;
   }
   
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(position.SelectByIndex(i))
      {
         if(position.Symbol() == _Symbol && position.Magic() == MagicNumber)
         {
            if(position.PositionType() == POSITION_TYPE_BUY)
            {
               LongTrade = true;
               ShortTrade = false;
               return;
            }
            else if(position.PositionType() == POSITION_TYPE_SELL)
            {
               LongTrade = false;
               ShortTrade = true;
               return;
            }
         }
      }
   }
}

void CheckAveragingOpportunity(int total)
{
   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
   
   LastBuyPrice = FindLastBuyPrice();
   LastSellPrice = FindLastSellPrice();
   
   if(LongTrade && LastBuyPrice - ask >= PipStep * point)
      TradeNow = true;
   
   if(ShortTrade && bid - LastSellPrice >= PipStep * point)
      TradeNow = true;
}

void CheckFirstTradeEntry()
{
   double rsi[];
   ArraySetAsSeries(rsi, true);
   
   if(CopyBuffer(handle_rsi, 0, 0, 3, rsi) < 3)
      return;
   
   double close_prev = iClose(_Symbol, PERIOD_CURRENT, 2);
   double close_curr = iClose(_Symbol, PERIOD_CURRENT, 1);
   
   if(close_prev > close_curr && rsi[1] > RSI_Overbought)
   {
      // SELL signal
      ShortTrade = true;
      LongTrade = false;
      TradeNow = true;
   }
   else if(close_prev < close_curr && rsi[1] < RSI_Oversold)
   {
      // BUY signal
      LongTrade = true;
      ShortTrade = false;
      TradeNow = true;
   }
}

void ExecutePendingTrades(int total)
{
   NumOfTrades = total;
   iLots = NormalizeDouble(StartingLots * MathPow(Multiplier, NumOfTrades), 2);
   
   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   
   if(ShortTrade)
   {
      if(trade.Sell(iLots, _Symbol, bid, 0, 0, "Budak-" + IntegerToString(NumOfTrades)))
      {
         Print("SELL order placed: ", iLots, " lots");
         TradeNow = false;
         NewOrdersPlaced = true;
         g_trades_today++;
      }
   }
   else if(LongTrade)
   {
      if(trade.Buy(iLots, _Symbol, ask, 0, 0, "Budak-" + IntegerToString(NumOfTrades)))
      {
         Print("BUY order placed: ", iLots, " lots");
         TradeNow = false;
         NewOrdersPlaced = true;
         g_trades_today++;
      }
   }
}

void ManageExistingPositions(int total)
{
   if(total == 0) return;
   
   // Calculate average price
   AveragePrice = 0;
   double Count = 0;
   
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(position.SelectByIndex(i))
      {
         if(position.Symbol() == _Symbol && position.Magic() == MagicNumber)
         {
            AveragePrice += position.PriceOpen() * position.Volume();
            Count += position.Volume();
         }
      }
   }
   
   if(Count > 0)
      AveragePrice = NormalizeDouble(AveragePrice / Count, _Digits);
   
   // Set TP based on average
   if(NewOrdersPlaced && total > 0)
   {
      double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
      
      for(int i = PositionsTotal() - 1; i >= 0; i--)
      {
         if(position.SelectByIndex(i))
         {
            if(position.Symbol() == _Symbol && position.Magic() == MagicNumber)
            {
               double tp = 0;
               double sl = 0;
               
               if(position.PositionType() == POSITION_TYPE_BUY)
               {
                  tp = AveragePrice + TakeProfit * point;
                  sl = AveragePrice - StopLoss * point;
               }
               else
               {
                  tp = AveragePrice - TakeProfit * point;
                  sl = AveragePrice + StopLoss * point;
               }
               
               trade.PositionModify(position.Ticket(), sl, tp);
            }
         }
      }
      NewOrdersPlaced = false;
   }
}

//+------------------------------------------------------------------+
//| Helper Functions                                                  |
//+------------------------------------------------------------------+
double FindLastBuyPrice()
{
   double price = 0;
   ulong last_ticket = 0;
   
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(position.SelectByIndex(i))
      {
         if(position.Symbol() == _Symbol && position.Magic() == MagicNumber && 
            position.PositionType() == POSITION_TYPE_BUY)
         {
            if(position.Ticket() > last_ticket)
            {
               last_ticket = position.Ticket();
               price = position.PriceOpen();
            }
         }
      }
   }
   return price;
}

double FindLastSellPrice()
{
   double price = 0;
   ulong last_ticket = 0;
   
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(position.SelectByIndex(i))
      {
         if(position.Symbol() == _Symbol && position.Magic() == MagicNumber && 
            position.PositionType() == POSITION_TYPE_SELL)
         {
            if(position.Ticket() > last_ticket)
            {
               last_ticket = position.Ticket();
               price = position.PriceOpen();
            }
         }
      }
   }
   return price;
}

double CalculateProfit()
{
   double profit = 0;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(position.SelectByIndex(i))
      {
         if(position.Symbol() == _Symbol && position.Magic() == MagicNumber)
            profit += position.Profit();
      }
   }
   return profit;
}

void CloseAllOrders()
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(position.SelectByIndex(i))
      {
         if(position.Symbol() == _Symbol && position.Magic() == MagicNumber)
         {
            trade.PositionClose(position.Ticket());
            Sleep(100);
         }
      }
   }
}

double AccountEquityHigh()
{
   if(CountTrades() == 0)
      AccountEquityHighAmt = account.Equity();
   
   if(AccountEquityHighAmt < PrevEquity)
      AccountEquityHighAmt = PrevEquity;
   else
      AccountEquityHighAmt = account.Equity();
   
   PrevEquity = account.Equity();
   return AccountEquityHighAmt;
}

void TrailingAlls(double pStart, double pStop, double avgPrice)
{
   if(pStop == 0) return;
   
   double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(position.SelectByIndex(i))
      {
         if(position.Symbol() == _Symbol && position.Magic() == MagicNumber)
         {
            if(position.PositionType() == POSITION_TYPE_BUY)
            {
               double distance = (bid - avgPrice) / point;
               if(distance >= pStart)
               {
                  double new_sl = bid - pStop * point;
                  if(new_sl > position.StopLoss())
                     trade.PositionModify(position.Ticket(), new_sl, position.TakeProfit());
               }
            }
            else
            {
               double distance = (avgPrice - ask) / point;
               if(distance >= pStart)
               {
                  double new_sl = ask + pStop * point;
                  if(new_sl < position.StopLoss() || position.StopLoss() == 0)
                     trade.PositionModify(position.Ticket(), new_sl, position.TakeProfit());
               }
            }
         }
      }
   }
}
//+------------------------------------------------------------------+
