import socket
import json
import time
from datetime import datetime, timedelta

HOST = '127.0.0.1'
PORT = 5000

def test_get_trades():
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        sock.connect((HOST, PORT))
        
        # Calculate timestamp for 24h ago
        from_time = int((datetime.now() - timedelta(days=1)).timestamp())
        print(f"Requesting trades since: {datetime.fromtimestamp(from_time)} ({from_time})")
        
        request = {
            "command": "GET_RECENT_TRADES",
            "fromTime": from_time
        }
        
        sock.sendall(json.dumps(request, separators=(',', ':')).encode('utf-8'))
        
        data = sock.recv(4096)
        response = json.loads(data.decode('utf-8'))
        
        print("\nResponse:")
        print(json.dumps(response, indent=2))
        
        sock.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_get_trades()
