# HarestechBridge EA - Installation Guide

## Overview
This MetaTrader 5 Expert Advisor acts as a TCP bridge between the backend Node.js service and MT5 terminal, enabling remote trade execution and monitoring.

## Dependencies

### JAson Library (Required)
The EA uses the JAson library for JSON parsing. You must install it before compiling.

**Installation Steps:**
1. Download JAson.mqh from: https://www.mql5.com/en/code/13663
2. Copy `JAson.mqh` to: `C:\Users\[YourUsername]\AppData\Roaming\MetaQuotes\Terminal\[TerminalID]\MQL5\Include\`
3. Alternatively, place it in the same directory as the EA

## Compilation

1. Open MetaEditor (F4 in MT5)
2. Open `HarestechBridge_Draft.mq5`
3. Compile (F7)
4. Fix any errors related to JAson library path if needed

## Usage

### Attaching the EA
1. Open MT5 Terminal
2. Navigate to Navigator → Expert Advisors
3. Drag `HarestechBridge_Draft` onto any chart
4. Configure parameters:
   - **ServerPort**: TCP port (default: 5000)
5. Enable AutoTrading (Ctrl+E)

### Verification
- Check the "Experts" tab in the Terminal for initialization messages
- You should see: "HarestechBridge v2.00 initialized" and "TCP Server started on port 5000"

## Supported Commands

The EA responds to the following JSON commands via TCP:

### VERIFY
Tests connection and returns account info
```json
{"command": "VERIFY"}
```

### PLACE_TRADE
Opens a new position
```json
{
  "command": "PLACE_TRADE",
  "symbol": "EURUSD",
  "type": "BUY",
  "volume": 0.1,
  "sl": 1.0850,
  "tp": 1.0950
}
```

### CLOSE
Closes an existing position by ticket
```json
{
  "command": "CLOSE",
  "ticket": "123456789"
}
```

### GET_TRADES
Retrieves trade history from a specific time
```json
{
  "command": "GET_TRADES",
  "from_time": 1638316800
}
```

## Troubleshooting

### EA won't compile
- Ensure JAson.mqh is installed correctly
- Check the include path in the EA matches your JAson installation

### Server won't start
- Check if port 5000 is already in use
- Try a different port in the EA parameters
- Ensure Windows Firewall allows MT5

### Commands not working
- Verify AutoTrading is enabled
- Check the Experts tab for error messages
- Ensure the backend is connecting to the correct port

## Security Notes
- The EA listens on all network interfaces (0.0.0.0)
- For production, consider restricting to localhost (127.0.0.1) only
- Modify the bind address in the code if needed
