# Runbook

## Deployment
1. Ensure Docker and Docker Compose are installed.
2. Run `docker-compose up -d`.
3. Access UI at `http://localhost:5173`.
4. Access API at `http://localhost:3000`.

## Incidents

### Orphan Orders
- **Symptom**: Slave has an open position that Master closed.
- **Action**:
  1. Check logs for "Order cancellation failed".
  2. Manually close position on Slave broker.
  3. Check network connectivity.

### Queue Backlog
- **Symptom**: High latency in trade copying.
- **Action**:
  1. Check RabbitMQ queue depth.
  2. Scale up Worker instances.
  3. Check database performance.

## Security
- Rotate API Keys every 90 days.
- Ensure database backups are encrypted.
