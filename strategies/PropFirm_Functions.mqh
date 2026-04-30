//+------------------------------------------------------------------+
//| 🏦 PROPFIRM RISK MANAGEMENT FUNCTIONS                             |
//+------------------------------------------------------------------+

//+------------------------------------------------------------------+
//| Check and reset daily variables                                   |
//+------------------------------------------------------------------+
void PropFirm_CheckDailyReset()
{
    if(!Use_PropFirm_Mode) return;
    
    MqlDateTime dt;
    TimeToStruct(TimeCurrent(), dt);
    
    // Check if it's a new day
    MqlDateTime last_dt;
    TimeToStruct(g_last_day_reset, last_dt);
    
    if(dt.day != last_dt.day || g_last_day_reset == 0) {
        // New day detected - reset daily variables
        g_equity_start_day = AccountInfoDouble(ACCOUNT_EQUITY);
        g_today_profit = 0;
        g_trades_today = 0;
        g_trading_disabled_today = false; // Re-enable trading for new day
        g_last_day_reset = TimeCurrent();
        
        // Update peak balance if needed
        double current_balance = AccountInfoDouble(ACCOUNT_BALANCE);
        if(current_balance > g_balance_peak || g_balance_peak == 0) {
            g_balance_peak = current_balance;
        }
        
        Print("🔄 PropFirm Daily Reset | Date: ", TimeToString(TimeCurrent(), TIME_DATE), 
              " | Starting Equity: ", g_equity_start_day);
    }
}

//+------------------------------------------------------------------+
//| Check PropFirm risk limits                                        |
//| Returns: true if trading allowed, false if limits exceeded        |
//+------------------------------------------------------------------+
bool PropFirm_CheckRiskLimits()
{
    if(!Use_PropFirm_Mode) return true;
    
    // Check global disable (total DD exceeded)
    if(g_trading_disabled_global) {
        Print("⛔ Trading GLOBALLY DISABLED - Total Drawdown limit exceeded");
        return false;
    }
    
    // Check daily disable
    if(g_trading_disabled_today) {
        Print("⛔ Trading disabled for today - Daily limit reached");
        return false;
    }
    
    double current_equity = AccountInfoDouble(ACCOUNT_EQUITY);
    
    // 1. Check Daily Loss Limit
    double daily_pnl = current_equity - g_equity_start_day;
    double daily_pnl_pct = (daily_pnl / g_equity_start_day) * 100.0;
    
    if(daily_pnl_pct <= -Max_Daily_Loss_Pct) {
        g_trading_disabled_today = true;
        Print("❌ DAILY LOSS LIMIT BREACHED: ", DoubleToString(daily_pnl_pct, 2), "% (Max: ", Max_Daily_Loss_Pct, "%)");
        Print("⛔ Trading disabled for today");
        return false;
    }
    
    // 2. Check Total Drawdown
    double total_dd = 0;
    if(g_balance_peak > 0) {
        total_dd = ((g_balance_peak - current_equity) / g_balance_peak) * 100.0;
    }
    
    if(total_dd >= Max_Total_DD_Pct) {
        g_trading_disabled_global = true;
        Print("❌ TOTAL DRAWDOWN LIMIT EXCEEDED: ", DoubleToString(total_dd, 2), "% (Max: ", Max_Total_DD_Pct, "%)");
        Print("⛔ Trading PERMANENTLY DISABLED");
        return false;
    }
    
    // 3. Check Daily Profit Target (stop if reached)
    if(daily_pnl_pct >= Daily_Profit_Target_Pct) {
        g_trading_disabled_today = true;
        Print("✅ DAILY PROFIT TARGET REACHED: ", DoubleToString(daily_pnl_pct, 2), "% (Target: ", Daily_Profit_Target_Pct, "%)");
        Print("🔒 Trading stopped for today to preserve gains");
        return false;
    }
    
    // 4. Consistency Rule - max 45% of total profit in one day
    if(g_total_profit > 0) {
        double daily_profit_ratio = (daily_pnl / g_total_profit) * 100.0;
        if(daily_profit_ratio > Max_Daily_Profit_Pct) {
            g_trading_disabled_today = true;
            Print("⚠️ CONSISTENCY RULE VIOLATED: Today's profit = ", DoubleToString(daily_profit_ratio, 1), 
                  "% of total (Max: ", Max_Daily_Profit_Pct, "%)");
            Print("🔒 Trading stopped for today");
            return false;
        }
    }
    
    return true;
}

//+------------------------------------------------------------------+
//| Check if current time is during major news                        |
//+------------------------------------------------------------------+
bool PropFirm_IsNewsTime()
{
    if(!Use_PropFirm_Mode || !Avoid_News_Events) return false;
    
    MqlDateTime dt;
    TimeToStruct(TimeCurrent(), dt);
    
    // Hard-coded major news events (NFP, FOMC, CPI)
    // NFP: First Friday of each month at 13:30 GMT (08:30 EST)
    // FOMC: Scheduled (approx 8 times/year) at 18:00 GMT (14:00 EST)
    // CPI: Mid-month (~13th) at 13:30 GMT (08:30 EST)
    
    int current_hour = dt.hour;
    int current_min = dt.min;
    int day_of_month = dt.day;
    int day_of_week = dt.day_of_week; // 0=Sunday, 5=Friday
    
    // NFP Check: First Friday of month, 13:30 GMT ± buffer
    if(day_of_week == 5 && day_of_month <= 7) { // First Friday
        if(current_hour == 13 && MathAbs(current_min - 30) <= News_Buffer_Minutes) {
            Print("📰 NFP News Time Detected - Trading paused");
            return true;
        }
    }
    
    // CPI Check: Around 13th of month, 13:30 GMT ± buffer
    if(day_of_month >= 12 && day_of_month <= 14) {
        if(current_hour == 13 && MathAbs(current_min - 30) <= News_Buffer_Minutes) {
            Print("📰 CPI News Time Detected - Trading paused");
            return true;
        }
    }
    
    // FOMC Check: Wednesdays mid-month (simplified), 18:00 GMT ± buffer
    if(day_of_week == 3 && day_of_month >= 12 && day_of_month <= 18) {
        if(current_hour == 18 && current_min <= News_Buffer_Minutes) {
            Print("📰 Potential FOMC Time - Trading paused");
            return true;
        }
    }
    
    return false;
}

//+------------------------------------------------------------------+
//| Check and close positions before weekend                          |
//+------------------------------------------------------------------+
void PropFirm_CheckWeekendClose()
{
    if(!Use_PropFirm_Mode || !Close_Before_Weekend) return;
    
    MqlDateTime dt;
    TimeToStruct(TimeCurrent(), dt);
    
    // Check if it's Friday and past the close hour
    if(dt.day_of_week == 5 && dt.hour >= Friday_Close_Hour) {
        int total = PositionsTotal();
        if(total > 0) {
            Print("🔒 Weekend approaching - Closing all ", total, " positions");
            
            for(int i = total - 1; i >= 0; i--) {
                ulong ticket = PositionGetTicket(i);
                if(ticket > 0) {
                    if(PositionGetString(POSITION_SYMBOL) == Symbol() && 
                       PositionGetInteger(POSITION_MAGIC) == Magic_Number) {
                        trade.PositionClose(ticket);
                        Print("✅ Position #", ticket, " closed for weekend");
                    }
                }
            }
        }
    }
}

//+------------------------------------------------------------------+
//| Update PropFirm statistics after trade                            |
//+------------------------------------------------------------------+
void PropFirm_UpdateStats(double trade_profit)
{
    if(!Use_PropFirm_Mode) return;
    
    g_today_profit += trade_profit;
    g_total_profit += trade_profit;
    g_trades_today++;
    
    // Update trading days count
    if(g_trades_today == 1) { // First trade of the day
        g_trading_days_count++;
        Print("📅 Trading Days Count: ", g_trading_days_count);
    }
}

//+------------------------------------------------------------------+
//| Display PropFirm Dashboard                                        |
//+------------------------------------------------------------------+
void PropFirm_DisplayDashboard()
{
    if(!Use_PropFirm_Mode || MQLInfoInteger(MQL_TESTER)) return;
    
    double current_equity = AccountInfoDouble(ACCOUNT_EQUITY);
    double daily_pnl = current_equity - g_equity_start_day;
    double daily_pnl_pct = g_equity_start_day > 0 ? (daily_pnl / g_equity_start_day) * 100.0 : 0;
    
    double total_dd = 0;
    if(g_balance_peak > 0) {
        total_dd = ((g_balance_peak - current_equity) / g_balance_peak) * 100.0;
    }
    
    // Calculate distance to limits
    double daily_loss_buffer = Max_Daily_Loss_Pct + daily_pnl_pct; // How much room left
    double total_dd_buffer = Max_Total_DD_Pct - total_dd;
    
    string status = "\n========== 🏦 PROPFIRM DASHBOARD ==========\n";
    status += "Type: " + PropFirm_Type + " | Account: $" + DoubleToString(Account_Size, 0) + "\n";
    status += "Trading Days: " + IntegerToString(g_trading_days_count) + " | Trades Today: " + IntegerToString(g_trades_today) + "\n";
    status += "-------------------------------------------\n";
    status += "📊 DAILY PERFORMANCE:\n";
    status += "  Today PnL: $" + DoubleToString(daily_pnl, 2) + " (" + DoubleToString(daily_pnl_pct, 2) + "%)\n";
    status += "  Daily Loss Limit: " + DoubleToString(Max_Daily_Loss_Pct, 1) + "% | Buffer: " + DoubleToString(daily_loss_buffer, 2) + "%\n";
    status += "  Daily Profit Target: " + DoubleToString(Daily_Profit_Target_Pct, 1) + "%\n";
    status += "-------------------------------------------\n";
    status += "📉 DRAWDOWN:\n";
    status += "  Current DD: " + DoubleToString(total_dd, 2) + "%\n";
    status += "  Max Allowed: " + DoubleToString(Max_Total_DD_Pct, 1) + "% | Buffer: " + DoubleToString(total_dd_buffer, 2) + "%\n";
    status += "  Peak Balance: $" + DoubleToString(g_balance_peak, 2) + "\n";
    status += "-------------------------------------------\n";
    status += "💰 TOTAL PROFIT: $" + DoubleToString(g_total_profit, 2) + "\n";
    status += "⚡ STATUS: " + (g_trading_disabled_global ? "❌ DISABLED (DD)" : 
                                g_trading_disabled_today ? "🔒 PAUSED (Daily Limit)" : "✅ ACTIVE") + "\n";
    status += "==========================================\n";
    
    Comment(status);
}

//+------------------------------------------------------------------+
//| Initialize PropFirm settings in OnInit                            |
//+------------------------------------------------------------------+
void PropFirm_Initialize()
{
    if(!Use_PropFirm_Mode) return;
    
    g_balance_peak = AccountInfoDouble(ACCOUNT_BALANCE);
    g_equity_start_day = AccountInfoDouble(ACCOUNT_EQUITY);
    g_last_day_reset = TimeCurrent();
    g_trading_disabled_global = false;
    g_trading_disabled_today = false;
    g_trading_days_count = 0;
    g_total_profit = 0;
    g_today_profit = 0;
    g_trades_today = 0;
    
    Print("========================================");
    Print("🏦 PROPFIRM MODE ACTIVATED");
    Print("Type: ", PropFirm_Type);
    Print("Account Size: $", Account_Size);
    Print("Max Daily Loss: ", Max_Daily_Loss_Pct, "%");
    Print("Max Total DD: ", Max_Total_DD_Pct, "%");
    Print("Daily Profit Target: ", Daily_Profit_Target_Pct, "%");
    Print("Risk Per Trade: ", PropFirm_Risk_Per_Trade, "%");
    Print("========================================");
}
