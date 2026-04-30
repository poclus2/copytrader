# Copy Trading API

## Authentication

### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}'
```

## Masters

### Create Master
```bash
curl -X POST http://localhost:3000/api/v1/masters \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Binance Master 1",
    "broker": "binance",
    "credentials": {"apiKey": "...", "secret": "..."}
  }'
```

## Slaves

### Create Slave
```bash
curl -X POST http://localhost:3000/api/v1/slaves \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MT4 Slave 1",
    "broker": "metatrader",
    "credentials": {"login": "...", "password": "...", "server": "..."}
  }'
```

## Copy Engine

### Test Trade
```bash
curl -X POST http://localhost:3000/api/v1/copy/test \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "masterId": "<MASTER_UUID>",
    "symbol": "BTCUSDT",
    "side": "BUY",
    "quantity": 0.1
  }'
```
