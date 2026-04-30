//+------------------------------------------------------------------+
//|                                              HarestechBridge.mq5 |
//|                                    Copyright 2024, Harestech Inc |
//|                                             https://harestech.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, Harestech Inc"
#property link      "https://harestech.com"
#property version   "2.01"
#property strict

#include <Trade\Trade.mqh>
#include <JAson.mqh>

//--- input parameters
input int      ServerPort = 5000;      // TCP Port to listen on

//--- WinSock Constants
#define AF_INET         2
#define SOCK_STREAM     1
#define IPPROTO_TCP     6
#define INVALID_SOCKET  -1
#define SOCKET_ERROR    -1
#define FIONBIO         0x8004667E

//--- WinSock Structures
struct sockaddr_in
  {
   short             sin_family;
   ushort            sin_port;
   uint              sin_addr;
   char              sin_zero[8];
  };

//--- WinSock DLL Imports
#import "ws2_32.dll"
int WSAStartup(ushort wVersionRequested, char &lpWSAData[]);
int WSACleanup();
int socket(int af, int type, int protocol);
int bind(int s, sockaddr_in &name, int namelen);
int listen(int s, int backlog);
int accept(int s, sockaddr_in &addr, int &addrlen);
int closesocket(int s);
int send(int s, char &buf[], int len, int flags);
int recv(int s, char &buf[], int len, int flags);
uint inet_addr(const uchar &cp[]);
ushort htons(ushort hostshort);
int ioctlsocket(int s, int cmd, int &argp);
#import

//--- Global variables
int serverSocket = INVALID_SOCKET;
CTrade trade;
char wsaData[400]; // Buffer for WSAData

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
  {
   // Initialize WinSock
   if(WSAStartup(0x202, wsaData) != 0)
     {
      Print("WSAStartup failed");
      return(INIT_FAILED);
     }

   // Create socket
   serverSocket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
   if(serverSocket == INVALID_SOCKET)
     {
      Print("Failed to create socket");
      WSACleanup();
      return(INIT_FAILED);
     }

   // Set non-blocking mode
   int nonBlocking = 1;
   if(ioctlsocket(serverSocket, FIONBIO, nonBlocking) == SOCKET_ERROR)
     {
      Print("Failed to set non-blocking mode");
      closesocket(serverSocket);
      WSACleanup();
      return(INIT_FAILED);
     }

   // Setup address structure
   sockaddr_in service;
   service.sin_family = AF_INET;
   service.sin_addr = 0; // INADDR_ANY
   service.sin_port = htons((ushort)ServerPort);

   // Bind
   if(bind(serverSocket, service, sizeof(service)) == SOCKET_ERROR)
     {
      Print("Failed to bind socket to port ", ServerPort);
      closesocket(serverSocket);
      WSACleanup();
      return(INIT_FAILED);
     }

   // Listen
   if(listen(serverSocket, 5) == SOCKET_ERROR)
     {
      Print("Failed to listen on port ", ServerPort);
      closesocket(serverSocket);
      WSACleanup();
      return(INIT_FAILED);
     }

   // Start timer to check for connections every 100ms
   EventSetTimer(1);

   Print("HarestechBridge v2.01 initialized (JSON fix)");
   Print("TCP Server started on port ", ServerPort);
   return(INIT_SUCCEEDED);
  }

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
  {
   EventKillTimer();
   
   if(serverSocket != INVALID_SOCKET)
     {
      closesocket(serverSocket);
      Print("Server socket closed");
     }
   WSACleanup();
  }

//+------------------------------------------------------------------+
//| Timer function - check for incoming connections                  |
//+------------------------------------------------------------------+
void OnTimer()
  {
   sockaddr_in clientAddr;
   int addrLen = sizeof(clientAddr);
   
   // Try to accept a connection (non-blocking)
   int clientSocket = accept(serverSocket, clientAddr, addrLen);
   
   if(clientSocket != INVALID_SOCKET)
     {
      Print("Client connected");
      HandleClient(clientSocket);
      closesocket(clientSocket);
     }
  }

//+------------------------------------------------------------------+
//| Handle client connection and process command                     |
//+------------------------------------------------------------------+
void HandleClient(int clientSocket)
  {
   char buffer[4096];
   ArrayInitialize(buffer, 0);
   
   // Receive data
   int bytesReceived = recv(clientSocket, buffer, ArraySize(buffer) - 1, 0);
   
   if(bytesReceived <= 0)
     {
      Print("Failed to receive data from client");
      return;
     }
   
   // Convert to string
   string request = CharArrayToString(buffer, 0, bytesReceived);
   Print("Received request: ", request);
   
   // Parse JSON and process command
   string response = ProcessCommand(request);
   
   // Send response
   char responseBuffer[];
   StringToCharArray(response, responseBuffer);
   send(clientSocket, responseBuffer, ArraySize(responseBuffer) - 1, 0);
   
   Print("Sent response: ", response);
  }

//+------------------------------------------------------------------+
//| Process incoming command                                         |
//+------------------------------------------------------------------+
string ProcessCommand(string request)
  {
   CJAVal json;
   
   if(!json.Deserialize(request))
     {
      return CreateErrorResponse("Invalid JSON format");
     }
   
   string command = json["command"].ToStr();
   
   if(command == "VERIFY")
     {
      return HandleVerify();
     }
   else if(command == "PLACE_TRADE" || command == "TRADE")
     {
      return HandlePlaceTrade(json);
     }
   else if(command == "CLOSE")
     {
      return HandleClose(json);
     }
   else if(command == "GET_TRADES" || command == "GET_RECENT_TRADES")
     {
      return HandleGetTrades(json);
     }
   else
     {
      return CreateErrorResponse("Unknown command: " + command);
     }
  }

//+------------------------------------------------------------------+
//| Handle VERIFY command                                            |
//+------------------------------------------------------------------+
string HandleVerify()
  {
   CJAVal response;
   response["success"] = true;
   response["login"] = IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));
   response["balance"] = AccountInfoDouble(ACCOUNT_BALANCE);
   response["equity"] = AccountInfoDouble(ACCOUNT_EQUITY);
   response["server"] = AccountInfoString(ACCOUNT_SERVER);
   
   return response.Serialize();
  }

//+------------------------------------------------------------------+
//| Handle PLACE_TRADE command                                       |
//+------------------------------------------------------------------+
string HandlePlaceTrade(CJAVal &json)
  {
   string symbol = json["symbol"].ToStr();
   string type = json["type"].ToStr();
   double volume = json["volume"].ToDbl();
   double sl = json["sl"].ToDbl();
   double tp = json["tp"].ToDbl();
   
   // Validate symbol
   if(!SymbolSelect(symbol, true))
     {
      return CreateErrorResponse("Symbol not found: " + symbol);
     }

   // Normalize volume based on symbol properties
   double volStep = SymbolInfoDouble(symbol, SYMBOL_VOLUME_STEP);
   double volMin = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MIN);
   double volMax = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MAX);

   // Round to nearest step
   if(volStep > 0)
     {
      volume = MathRound(volume / volStep) * volStep;
     }

   // Clamp to min/max limits
   if(volume < volMin) volume = volMin;
   if(volume > volMax) volume = volMax;
   
   // Determine order type
   ENUM_ORDER_TYPE orderType = (type == "BUY") ? ORDER_TYPE_BUY : ORDER_TYPE_SELL;
   
   // Get current price
   double price = (type == "BUY") ? SymbolInfoDouble(symbol, SYMBOL_ASK) : SymbolInfoDouble(symbol, SYMBOL_BID);
   
   // Execute trade
   if(trade.PositionOpen(symbol, orderType, volume, price, sl, tp, "CopyTrade"))
     {
      ulong ticket = trade.ResultOrder();
      
      CJAVal response;
      response["success"] = true;
      response["ticket"] = (string)ticket;
      response["price"] = price;
      
      Print("Trade opened: ", ticket);
      return response.Serialize();
     }
   else
     {
      return CreateErrorResponse("Failed to open trade: " + IntegerToString(trade.ResultRetcode()));
     }
  }

//+------------------------------------------------------------------+
//| Handle CLOSE command                                             |
//+------------------------------------------------------------------+
string HandleClose(CJAVal &json)
  {
   ulong ticket = (ulong)StringToInteger(json["ticket"].ToStr());
   
   Print("Attempting to close position with ticket: ", ticket);
   
   // Select position by ticket
   if(!PositionSelectByTicket(ticket))
     {
      Print("Position not found for ticket: ", ticket);
      return CreateErrorResponse("Position not found: " + IntegerToString(ticket));
     }
   
   // Get position details before closing
   string symbol = PositionGetString(POSITION_SYMBOL);
   double profit = PositionGetDouble(POSITION_PROFIT);
   
   // Close position
   if(trade.PositionClose(ticket))
     {
      CJAVal response;
      response["success"] = true;
      response["profit"] = profit;
      response["closePrice"] = PositionGetDouble(POSITION_PRICE_CURRENT);
      
      Print("Position closed successfully: ", ticket, " Profit: ", profit);
      return response.Serialize();
     }
   else
     {
      int errorCode = trade.ResultRetcode();
      string errorMsg = "Failed to close position: " + IntegerToString(errorCode);
      Print(errorMsg);
      return CreateErrorResponse(errorMsg);
     }
  }

//+------------------------------------------------------------------+
//| Handle GET_TRADES command                                        |
//+------------------------------------------------------------------+
string HandleGetTrades(CJAVal &json)
  {
   // Support both from_time and fromTime for backend compatibility
   datetime fromTime = 0;
   if(json["fromTime"].ToInt() > 0)
      fromTime = (datetime)json["fromTime"].ToInt();
   else if(json["from_time"].ToInt() > 0)
      fromTime = (datetime)json["from_time"].ToInt();
   
   // Request history
   if(!HistorySelect(fromTime, TimeCurrent()))
     {
      return CreateErrorResponse("Failed to select history");
     }
   
   // Start building JSON manually to avoid library issues
   string jsonResponse = "{\"success\":true,\"trades\":[";
   bool first = true;
   
   // Get deals from history
   int totalDeals = HistoryDealsTotal();
   
   for(int i = 0; i < totalDeals; i++)
     {
      ulong dealTicket = HistoryDealGetTicket(i);
      
      if(dealTicket > 0)
        {
         long dealEntry = HistoryDealGetInteger(dealTicket, DEAL_ENTRY);
         
         // Only include IN and OUT deals (actual trades)
         if(dealEntry == DEAL_ENTRY_IN || dealEntry == DEAL_ENTRY_OUT)
           {
            if(!first) jsonResponse += ",";
            first = false;
            
            jsonResponse += "{";
            jsonResponse += "\"ticket\":\"" + IntegerToString(HistoryDealGetInteger(dealTicket, DEAL_POSITION_ID)) + "\",";
            jsonResponse += "\"order\":\"" + IntegerToString(HistoryDealGetInteger(dealTicket, DEAL_ORDER)) + "\",";
            jsonResponse += "\"time\":" + IntegerToString(HistoryDealGetInteger(dealTicket, DEAL_TIME)) + ",";
            jsonResponse += "\"type\":" + IntegerToString(HistoryDealGetInteger(dealTicket, DEAL_TYPE)) + ",";
            jsonResponse += "\"entry\":" + IntegerToString(dealEntry) + ",";
            jsonResponse += "\"symbol\":\"" + HistoryDealGetString(dealTicket, DEAL_SYMBOL) + "\",";
            jsonResponse += "\"volume\":" + DoubleToString(HistoryDealGetDouble(dealTicket, DEAL_VOLUME), 2) + ",";
            jsonResponse += "\"price\":" + DoubleToString(HistoryDealGetDouble(dealTicket, DEAL_PRICE), 5) + ",";
            jsonResponse += "\"profit\":" + DoubleToString(HistoryDealGetDouble(dealTicket, DEAL_PROFIT), 2) + ",";
            jsonResponse += "\"commission\":" + DoubleToString(HistoryDealGetDouble(dealTicket, DEAL_COMMISSION), 2) + ",";
            jsonResponse += "\"swap\":" + DoubleToString(HistoryDealGetDouble(dealTicket, DEAL_SWAP), 2);
            jsonResponse += "}";
           }
        }
     }
   
   // Also get open positions
   int totalPositions = PositionsTotal();
   
   for(int i = 0; i < totalPositions; i++)
     {
      ulong posTicket = PositionGetTicket(i);
      
      if(posTicket > 0)
        {
         if(!first) jsonResponse += ",";
         first = false;
         
         jsonResponse += "{";
         jsonResponse += "\"ticket\":\"" + IntegerToString(PositionGetInteger(POSITION_TICKET)) + "\",";
         jsonResponse += "\"order\":\"" + IntegerToString(PositionGetInteger(POSITION_TICKET)) + "\",";
         jsonResponse += "\"time\":" + IntegerToString(PositionGetInteger(POSITION_TIME)) + ",";
         jsonResponse += "\"type\":" + IntegerToString(PositionGetInteger(POSITION_TYPE)) + ",";
         jsonResponse += "\"entry\":0,"; // ENTRY_IN for open positions
         jsonResponse += "\"symbol\":\"" + PositionGetString(POSITION_SYMBOL) + "\",";
         jsonResponse += "\"volume\":" + DoubleToString(PositionGetDouble(POSITION_VOLUME), 2) + ",";
         jsonResponse += "\"price\":" + DoubleToString(PositionGetDouble(POSITION_PRICE_OPEN), 5) + ",";
         jsonResponse += "\"profit\":" + DoubleToString(PositionGetDouble(POSITION_PROFIT), 2) + ",";
         jsonResponse += "\"commission\":0.0,";
         jsonResponse += "\"swap\":" + DoubleToString(PositionGetDouble(POSITION_SWAP), 2);
         jsonResponse += "}";
        }
     }
   
   jsonResponse += "]}";
   
   return jsonResponse;
  }

//+------------------------------------------------------------------+
//| Create error response                                            |
//+------------------------------------------------------------------+
string CreateErrorResponse(string errorMessage)
  {
   CJAVal response;
   response["success"] = false;
   response["error"] = errorMessage;
   
   return response.Serialize();
  }

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
  {
   // Not used - we use OnTimer instead
  }
