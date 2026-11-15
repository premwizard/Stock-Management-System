# StockPulse — Enterprise Inventory Management & Smart Stock Lookup System

A modern, production-grade Inventory Management System featuring **sub-5ms multi-criteria partial text search**, **PostgreSQL ACID transactional stock mutations**, **row-level locking concurrency control**, **strict negative stock prevention**, and **real-time SQL stock aggregation**.

---

## 🌟 Key Features

1. **Smart Inventory Search (Core Showcase)**:
   - Instant search across product names, categories, SKUs, brands, and descriptions.
   - Case-insensitive, partial-match query engine powered by PostgreSQL `pg_trgm` GIN indexes.
   - Computes **global matching product counts** and **total available stock units** in a single database roundtrip via Common Table Expressions (CTE), completely independent of pagination.
   - Live query latency telemetry (e.g. `1.8ms database roundtrip`).

2. **Executive Analytics Dashboard**:
   - Real-time KPIs: Total Products, Available Stock Units, Active Categories, In-Stock, Low-Stock, and Out-of-Stock items.
   - Interactive Recharts category distribution visualizations (Bar and Donut modes).
   - Urgent replenishment alert feed showing stock deficit and minimum thresholds.
   - Live stock transaction audit feed.

3. **Complete Inventory & Catalogue Management**:
   - Product creation, editing, and safe deletion with joined stock quantities.
   - Multi-criteria filtering by category, brand, and stock status (`In Stock`, `Low Stock`, `Out of Stock`).
   - Dynamic sorting by name, SKU, available stock, or date.

4. **ACID Transactional Stock Mutations**:
   - **Stock IN**: Add warehouse units with an automated audit movement record.
   - **Stock OUT**: Deduct units with strict **negative stock prevention** and row-level locking (`SELECT ... FOR UPDATE`). Fails and rolls back if requested quantity exceeds available stock.
   - **Adjust**: Physical audit count alignment with automatic delta logging.
   - Double-layered negative stock protection (Service validation + PostgreSQL `CHECK (quantity >= 0)` constraint).

5. **Category Management**:
   - Category CRUD with real-time aggregated product counts and total stock units.
   - Safe relational deletion prevention (rejects deletion if products are assigned).

6. **Immutable Stock Audit Ledger**:
   - Comprehensive log tracking timestamps, SKU, product, movement type (`IN`, `OUT`, `ADJUSTMENT`), previous balance, new balance, and operational reasons.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 6, Tailwind CSS, TanStack Query v5, React Router v6, Axios, Lucide React, Recharts |
| **Backend** | Node.js (ES Modules), Express.js, PostgreSQL 18, `pg` (node-postgres), Zod, Helmet, Morgan, Pino |
| **Database** | PostgreSQL 18 with relational constraints, `pg_trgm` extension, GIN & B-Tree indexes, and connection pooling |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js >= 20
- PostgreSQL 18 running locally on port 5432 (default user: `postgres`, password: `root`)

### Installation & Database Initialization

```bash
# 1. Install root, backend, and frontend dependencies
npm install
npm --prefix backend install
npm --prefix frontend install

# 2. Reset and seed database (Creates schema, indexes, and 148 realistic automotive products)
npm run db:reset
```

### Running the Application

```bash
# Start both backend API (Port 5000) and frontend Vite server (Port 5173) concurrently:
npm run dev
```

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api/v1](http://localhost:5000/api/v1)
- **API Health Check**: [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)

---

## 🧪 Testing & Verification

Run the comprehensive automated test suite covering all 5 modules (136 assertions):

```bash
# Run complete test suite (Foundation + Product/Category + Smart Search + Inventory + Dashboard)
npm --prefix backend run test

# Run code linter (Zero errors, zero warnings)
npm run lint

# Build production frontend bundle
npm run build
```

---

## 🎯 Client Demonstration Walkthrough

When presenting to clients, follow this recommended walkthrough flow:

### Scenario 1: The Primary Example Search ("Car")
1. Open the **Smart Search** page from the sidebar.
2. Click the **"Car"** suggestion chip or type `Car` into the search bar.
3. Highlight to the client:
   - **121 matching car-related products** are returned instantly.
   - **5,378 total available stock units** are computed across all matching products in the database.
   - Notice the engine response time badge (`~2ms`).
   - Navigate to page 2: notice the total units (**5,378**) and matching count (**121**) remain completely accurate and invariant.

### Scenario 2: Category Search ("Tyre")
1. Type `Tyre` into Smart Search.
2. Highlight:
   - **24 matching products** (both car tyres and motorcycle tyres).
   - **1,117 total stock units** aggregated.
   - Exact top results: **Michelin Tyre** (120 units) and **Apollo Tyre** (85 units), directly matching client requirements.

### Scenario 3: Brand Lookup ("Michelin")
1. Type `Michelin`.
2. Notice brand-level partial matching retrieving tyres, pressure gauges, and wheel brushes across multiple categories.

### Scenario 4: Exact SKU Code Search ("TYR-001")
1. Type `TYR-001`.
2. Highlight how relevance-based ranking pinpoints the exact product as the 1st match with 120 stock units.

### Scenario 5: Transaction-Safe Stock Mutation & Negative Stock Prevention
1. Go to **Inventory** page or click the quick action button on `Michelin Tyre`.
2. Click **Stock IN**: Add 15 units with reason `"New container delivery"`. Notice stock increases from 120 to 135 immediately.
3. Click **Stock OUT**: Attempt to remove 500 units. Notice the system immediately rejects the transaction with a friendly error: `"Insufficient stock. Available units: 135, requested reduction: 500"`.
4. Open **Stock History**: Verify the immutable audit trail logged the previous balance (120) and new balance (135) with timestamp and reason.

### Scenario 6: Executive Analytics Dashboard
1. Navigate to **Dashboard**.
2. Show the 6 summary metric cards dynamically loaded from PostgreSQL.
3. Toggle between **Bar** and **Donut** view on the **Stock Distribution by Category** Recharts visualization.
4. Demonstrate the **Low Stock Alerts** feed with deficit calculation.

---

## 📁 Repository Structure

```
├── backend/
│   ├── src/
│   │   ├── config/            # Environment validation (Zod) & pg.Pool connection pool
│   │   ├── controllers/       # Thin HTTP route handlers
│   │   ├── services/          # Business logic & atomic database transactions
│   │   ├── repositories/      # Pure parameterized SQL queries & CTE aggregations
│   │   ├── middleware/        # Error mapping (PG codes), Zod validator, 404 handler
│   │   ├── validators/        # Zod request validation schemas
│   │   ├── utils/             # ApiResponse, ApiError, asyncHandler, Pino logger
│   │   └── database/          # Migrations (DDL), mock seeds (148 products), reset runner
│   └── tests/                 # Automated test suites (Foundation, Products, Search, Inventory, Dashboard)
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable UI (Button, Modal, Table, Badge, Card, Pagination)
│   │   ├── context/           # Light / Dark theme context & persistence
│   │   ├── pages/             # Dashboard, Inventory, SmartSearch, Categories, ProductDetails, StockHistory, Settings
│   │   ├── services/          # Centralized Axios API clients
│   │   └── utils/             # Formatters, status helpers
│   └── vite.config.js         # Proxy configuration to backend (:5000)
└── package.json               # Root scripts
```
