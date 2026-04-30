# Copy Trading System

A production-ready Copy Trading System that replicates trades from Master accounts to Slave accounts.

## Architecture

- **Backend**: NestJS (TypeScript)
- **Frontend**: React + Tailwind CSS
- **Database**: PostgreSQL
- **Queue**: RabbitMQ
- **Cache**: Redis

## Directory Structure

- `apps/backend`: NestJS API and Worker
- `apps/frontend`: React Admin UI
- `infra`: Docker Compose and Helm charts
- `docs`: Documentation and Diagrams

## Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose

### Running Locally

```bash
docker-compose up -d
```

### Development

1. **Backend**:
   ```bash
   cd apps/backend
   npm install
   npm run start:dev
   ```

2. **Frontend**:
   ```bash
   cd apps/frontend
   npm install
   npm run dev
   ```
