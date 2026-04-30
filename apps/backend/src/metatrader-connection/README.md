# MetaTrader Connection Verification

This module provides real MetaTrader (MT4/MT5) account credential verification for the copy trading system.

## Features

- **Real Connection Testing**: Performs actual authentication against MT4/MT5 servers
- **MT5 Support**: Uses the official `MetaTrader5` Python package for full authentication
- **MT4 Support**: TCP connectivity check to verify server reachability
- **Admin Dashboard Integration**: "Test Connection" button in Master and Slave account forms
- **Form Validation**: Blocks account creation until credentials are validated

## Architecture

### Backend Components

#### MetaTrader Connection Module
Located in `apps/backend/src/metatrader-connection/`

- **`metatrader-connection.module.ts`**: NestJS module registration
- **`metatrader-connection.controller.ts`**: REST API endpoint
- **`metatrader-connection.service.ts`**: Main service orchestrating verification
- **`mt5-adapter.service.ts`**: MT5 verification via Python script
- **`mt4-adapter.service.ts`**: MT4 TCP connectivity check
- **`scripts/verify_mt5.py`**: Python script using MetaTrader5 package

#### API Endpoint

```
POST /api/v1/brokers/metatrader/verify-connection
```

**Request:**
```json
{
  "platform": "mt4" | "mt5",
  "login": "1234567",
  "password": "xxxxxxx",
  "server": "BrokerName-Demo",
  "host": "broker.server.com",  // MT4 only
  "port": 443                    // MT4 only
}
```

**Response:**
```json
{
  "status": "valid" | "invalid_credentials" | "server_unreachable" | "connection_timeout" | "network_error" | "unknown_error",
  "details": "Optional error message"
}
```

### Frontend Components

Enhanced forms in:
- `apps/frontend/src/pages/Masters.tsx`
- `apps/frontend/src/pages/Slaves.tsx`

Features added:
- Platform selector (MT4/MT5)
- Conditional fields (host/port for MT4)
- "Test Connection" button
- Real-time connection status display
- Form submission blocking until valid

## Setup Instructions

### Prerequisites

#### For MT5 Verification

1. **Install Python** (3.8+)
2. **Install MetaTrader5 package:**
   ```bash
   pip install MetaTrader5
   ```
3. **Note**: The MetaTrader5 package requires MetaTrader 5 to be installed on the machine, or at minimum the MT5 terminal binaries accessible.

#### For MT4 Verification

No additional dependencies required. The MT4 adapter uses Node.js built-in `net` module for TCP connectivity checks.

### Configuration

No additional configuration required. The backend will automatically use the Python environment's `python` command.

## Usage

### Testing MT5 Connection

1. Navigate to Masters or Slaves page
2. Click "Add Master" or "Add Slave"
3. Select "MetaTrader" as broker
4. Fill in credentials:
   - Login (account number)
   - Password
   - Server (e.g., "MetaQuotes-Demo")
   - Platform: Select "MetaTrader 5"
5. Click "Test Connection"
6. Wait for validation result
7. Create button will be enabled only if connection is valid

### Testing MT4 Connection

1. Follow steps 1-3 above
2. Fill in credentials:
   - Login
   - Password
   - Server
   - Platform: Select "MetaTrader 4"
   - Host (server IP/domain)
   - Port (server port, e.g., 443)
3. Click "Test Connection"
4. System will verify server reachability

## Implementation Details

### MT5 Verification Process

1. Frontend sends credentials to backend
2. Backend spawns Python process with `verify_mt5.py`
3. Python script:
   - Initializes MT5 connection
   - Attempts login with provided credentials
   - Returns structured JSON response
4. Backend parses response and returns to frontend

### MT4 Verification Process

1. Frontend sends credentials + host/port to backend
2. Backend creates TCP socket connection
3. Attempts to connect to specified host:port
4. Returns reachability status

**Note**: Full MT4 authentication requires proprietary protocol implementation. Current implementation verifies server reachability only.

### Error Handling

The system maps various MT4/MT5 errors to standardized statuses:
- `valid`: Authentication successful
- `invalid_credentials`: Wrong login/password
- `server_unreachable`: Cannot connect to server
- `connection_timeout`: Connection timed out (5s default)
- `network_error`: Network-level error
- `unknown_error`: Unexpected error with details

### Security Considerations

- Passwords are never stored
- Credentials only in memory during request
- No sensitive information in logs
- Rate limiting recommended (not yet implemented)
- TLS/SSL support when available

## Testing

### Manual Testing

#### MT5 Demo Account Test

You can use MetaQuotes demo server for testing:
1. Login: Get from https://www.metatrader5.com/en/terminal/help/start_advanced/demo_account
2. Server: "MetaQuotes-Demo"
3. Password: Your demo password

#### MT4 Server Test

Test with any MT4 broker's server address and port (typically 443).

### Automated Tests

Unit tests location: `apps/backend/src/metatrader-connection/*.spec.ts` (to be implemented)

Run tests:
```bash
cd apps/backend
npm run test
```

## Troubleshooting

### MT5 Connection Fails

1. **Verify Python installation:**
   ```bash
   python --version
   ```

2. **Verify MetaTrader5 package:**
   ```bash
   python -c "import MetaTrader5 as mt5; print(mt5.__version__)"
   ```

3. **Check MT5 Terminal:**
   - Ensure MT5 is installed
   - Try manual connection in MT5 Terminal first

### MT4 Connection Fails

1. **Verify host/port:**
   - Check broker documentation for correct server address
   - Common ports: 443, 444, 1433

2. **Firewall issues:**
   - Ensure outbound connections to broker servers are allowed

### Python Script Errors

Check backend logs for Python stderr output. Common issues:
- Python not in PATH
- MetaTrader5 package not installed
- MT5 Terminal not installed

## Future Enhancements

- Full MT4 authentication (requires Manager API or bridge)
- Connection timeout configuration
- Rate limiting for verification requests
- Credential caching (with encryption)
- Async verification with job queue
- Support for broker-specific certificates
- WebSocket-based real-time verification
