import sys
import json

# Try to import MetaTrader5, fallback to mock if not available
try:
    import MetaTrader5 as mt5
    MT5_AVAILABLE = True
except ImportError:
    # Mock MT5 for development when package is not available
    class MT5Mock:
        RES_S_FAIL = 1
        RES_E_AUTH_FAILED = 2
        RES_E_INVALID_VERSION = 3
        RES_E_NO_CONNECTION = 4
        
        @staticmethod
        def initialize():
            return False  # Simulate MT5 not available
        
        @staticmethod
        def login(login, password, server):
            return False
        
        @staticmethod
        def last_error():
            return (0, "MetaTrader5 package not installed (Python 3.14 incompatible)")
        
        @staticmethod
        def shutdown():
            pass
        
        @staticmethod
        def account_info():
            return None
    
    mt5 = MT5Mock()
    MT5_AVAILABLE = False

def verify_credentials(login, password, server):
    # Check if MT5 package is available
    if not MT5_AVAILABLE:
        return {
            "success": False,
            "error": "MetaTrader5 package not installed. Python 3.14 is not yet supported. Please use Python 3.8-3.12 or test with MT4 instead."
        }
    
    # Initialize MT5
    # Try default initialize first
    if not mt5.initialize():
        # If default fails, try known paths found on the system
        known_paths = [
            r"C:\Program Files\MetaTrader\terminal64.exe",
            r"C:\Program Files\FTMO Global Markets MT5 Terminal\terminal64.exe"
        ]
        
        initialized = False
        for path in known_paths:
            if mt5.initialize(path=path):
                initialized = True
                break
        
        if not initialized:
            error_code, description = mt5.last_error()
            return {
                "success": False,
                "error": f"MT5 initialization failed: ({error_code}, '{description}'). Please ensure MetaTrader 5 is installed and not running with higher privileges."
            }

    # Attempt to login
    # Ensure login is an integer
    try:
        login_int = int(login)
    except ValueError:
         return {
            "success": False,
            "error": "Login must be a number"
        }

    authorized = mt5.login(login_int, password=password, server=server)

    if authorized:
        # Get account info to get balance and equity
        account_info = mt5.account_info()
        mt5.shutdown()
        
        if account_info:
            return {
                "success": True,
                "balance": account_info.balance,
                "equity": account_info.equity,
                "currency": account_info.currency,
                "leverage": account_info.leverage,
                "server": account_info.server,
            }
        else:
             return {
                "success": False,
                "error": "Authorized but failed to get account info"
            }
    else:
        error_code, description = mt5.last_error()
        mt5.shutdown()
        
        # Map MT5 error codes to our status
        # https://www.mql5.com/en/docs/constants/errors
        # -10004: Internal fail
        # -10005: IPC timeout
        # 10011: Auth failed
        # 10012: Invalid version
        # 10013: No connection
        
        if error_code == 10011: # RES_E_AUTH_FAILED
             return {"success": False, "error": "Invalid credentials or server not found in terminal. Please open MT5 manually and ensure the server is added."}
        elif error_code == 10012: # RES_E_INVALID_VERSION
             return {"success": False, "error": "Invalid MT5 version"}
        elif error_code == 10013: # RES_E_NO_CONNECTION
             return {"success": False, "error": "Server unreachable"}
        elif error_code == -10005: # IPC timeout
             return {"success": False, "error": "MT5 Terminal timeout (IPC)"}
        else:
             return {
                "success": False,
                "error": f"Authentication failed: ({error_code}) {description}"
            }

if __name__ == "__main__":
    try:
        # Read input from arguments or stdin
        # Expecting: python verify_mt5.py <login> <password> <server>
        if len(sys.argv) >= 4:
            login = sys.argv[1]
            password = sys.argv[2]
            server = sys.argv[3]
            result = verify_credentials(login, password, server)
        else:
             # Try reading JSON from stdin
            input_data = sys.stdin.read()
            if input_data:
                data = json.loads(input_data)
                result = verify_credentials(data.get("login"), data.get("password"), data.get("server"))
            else:
                result = {"success": False, "error": "Missing arguments"}

        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
