# Acceptance Criteria

## 1. Master Trade Replication
- **Scenario**: Master places a MARKET BUY order.
- **Expected**: All active slaves subscribed to this master should receive a corresponding order.
- **Verification**:
  1. Call `POST /copy/test` with a trade payload.
  2. Check logs for "Order placed for slave <ID>".
  3. Verify `MockAdapter` logs "MockAdapter placing order".

## 2. Scaling Logic
- **Scenario**: Slave configured with 50% ratio.
- **Expected**: Slave order quantity should be 50% of Master order quantity.
- **Verification**:
  1. Master trade quantity = 1.0.
  2. Slave order quantity should be 0.5.

## 3. Error Handling
- **Scenario**: Broker API fails.
- **Expected**: System logs error, retries (if configured), and does not crash.
- **Verification**:
  1. Simulate Adapter failure.
  2. Check logs for "Failed to copy to slave".
