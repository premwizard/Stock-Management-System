# StockPulse — Inventory Management & Smart Stock Lookup System

Production-quality Full-Stack Inventory Management System featuring instantaneous multi-criteria partial text search, PostgreSQL ACID transactional stock mutations, negative stock prevention, and real-time stock aggregation.

---

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, TanStack Query v5, Axios, Lucide React, Recharts.
- **Backend**: Node.js, Express.js (ES Modules), PostgreSQL 18, `pg` (node-postgres), Zod, Helmet, Morgan, Pino.
- **Database**: PostgreSQL 18 with relational constraints, `pg_trgm` extension, and connection pooling.

---

## Getting Started

### Prerequisites

- Node.js >= 20
- PostgreSQL 18 running locally on port 5432

### Installation

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### Environment Configuration

1. Copy `.env.example` in `backend/` to `.env`:
   ```bash
   cp backend/.env.example backend/.env
   ```
2. Set database credentials in `backend/.env`.

### Running the Application

```bash
# Start both backend and frontend concurrently
npm run dev

# Or run them individually:
npm run dev:backend   # Express API on http://localhost:5000
npm run dev:frontend  # Vite React App on http://localhost:5173
```

### Verification & Testing

- Health Check Endpoint: `http://localhost:5000/api/v1/health`
- Frontend UI Dashboard: `http://localhost:5173`
- Run Linters: `npm run lint`
- Build Frontend: `npm run build`

