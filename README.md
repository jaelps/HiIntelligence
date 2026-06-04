# HiIntelligence - Enterprise Financial Intelligence & BI Platform

HiIntelligence is an enterprise-grade Business Intelligence (BI) and Financial Analytics platform designed to monitor, aggregate, and diagnose the sales metrics of 500+ stores in real-time.

---

## ⚡ Technology Stack

### Frontend
- **React 18** with **TypeScript** & **Vite**
- **Material UI (MUI) v6** for UI/UX (featuring responsive layouts & custom glassmorphism)
- **Redux Toolkit** for centralized auth & unread notification counts
- **TanStack Query (React Query)** for query caching & polling updates
- **Recharts** for interactive Area, Line, and Bar charts
- **Microsoft SignalR Client** for persistent socket connections

### Backend
- **ASP.NET Core 9 Web API**
- **Entity Framework Core (EF Core)**
- **SignalR Hubs** (group-aware real-time socket connections)
- **JWT Bearer Authentication** (with role-based access security)
- **Hosted Services** (Data simulation & automated analytic engine)

### Database & Caching (Docker Mode)
- **PostgreSQL 15** (primary persistent database)
- **Redis 7** (high-performance query caching)

---

## 🛠️ System Architecture

### 1. Database Schema (`AppDbContext.cs`)
- `User`: Standard accounts with role constraints (`Administrator`, `RegionalManager`, `StoreManager`).
- `Store`: Administrative metrics, regions, sales targets, dynamic health scores, and operational statuses.
- `FinancialRecord`: Multi-index database model compiling daily revenue, net revenue, gross/net profits, shopper conversion rates, and transaction count.
- `Alert`: Real-time incident logs tracking critical target misses, average ticket declines, and transaction spikes.
- `Notification`: High-priority messages dispatched over SignalR to matching browser sessions.
- `IntelligenceInsight`: Automated NLP guidance summarizing root cause pathology and recovery tasks.

### 2. Live Store Simulator (`StoreDataGenerator.cs`)
- Seeding: Checks DB on startup. If empty, generates **520 stores** across 5 regions (North, South, East, West, Central) and **30 days of historical financial records** (15,600+ entries) to ensure charts are populated with realistic data.
- Live Loop: Every 4 seconds, iterates through stores simulating new cashier transactions, updating today's totals, recalculating health scores, and broadcasting updates via SignalR.
- Incidents: Randomly triggers anomalies (like Store 154's revenue drop) which write to the DB and push real-time toaster messages to connected clients.

### 3. Automated Intelligence Engine (`IntelligenceEngine.cs`)
- Periodically runs statistical rules on the DB.
- Detects stores with a >15% decline in weekly revenue, determines if the drop is due to average ticket size or conversion rate, and generates root cause diagnostic guides.
- Matches requirements: generates the specific analysis for Store 154 (23% month-over-month decline, average ticket down 15%, conversion rate stable, suggesting cashier upselling & promotional reviews).

---

## 🚀 Running the Project

### Option A: Orchestration via Docker Compose (Recommended)
Make sure Docker Desktop is active on your host system:
1. Open a terminal in the project directory: `C:\Users\b\.gemini\antigravity\scratch\HiIntelligence`
2. Run:
   ```bash
   docker compose up --build -d
   ```
3. Open `http://localhost:3000` in your web browser.

### Option B: Local Execution Fallback (Without Docker)
If Docker is not installed, you can run the services directly on your host machine using the provided PowerShell script.
1. The script will verify that you have Node.js and the .NET 9.0 SDK installed.
2. It automatically sets the backend environment to `USE_SQLITE=true`, which configures a local SQLite database file (`hiintelligence.db`) as a fallback database if PostgreSQL is not active.
3. Open PowerShell as Administrator, navigate to the folder, and run:
   ```powershell
   ./run-local.ps1
   ```
4. Access `http://localhost:3000` in your web browser.

---

## 🔑 Demo Access Profiles

To test the security scopes and role-based views, you can click on the preset buttons on the Login page or use the following credentials:

| Username | Password | Role | Access Scope |
| :--- | :--- | :--- | :--- |
| **`admin`** | `admin123` | **Administrator** | Access to all 520 stores, regional statistics, and full reporting exports. |
| **`regional_east`** | `east123` | **Regional Manager** | Locked to the "East" Region. Sees East region dashboards, Top/Bottom 5 rankings in East, and can only query East stores. |
| **`store_101`** | `store123` | **Store Manager** | Locked to Store #101. Automatically lands on Store 101 Detailed Profile, showing live cashier ticks and specific alerts. |
