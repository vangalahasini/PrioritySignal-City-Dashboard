# PrioritySignal – City Dashboard

> **People First. Smarter Signals. Better Cities.**

PrioritySignal is a modern urban mobility and transit signal priority (TSP) evaluation platform. It helps city traffic planners, metropolitan planning organizations (MPOs), and transit agencies optimize signal splits for **people moved per green second**, rather than merely vehicles moved.

---

## 🏆 Key Principles & Hackathon Mission

1. **People First:** A bus carrying 60 commuters deserves priority over a single-occupancy vehicle. We optimize for minimum aggregate passenger person-delay.
2. **Safety by Design:** Pedestrian clearance minimums (10.0s floor) and yellow/all-red safety intervals are strictly non-negotiable hard constraints.
3. **Balanced Mobility:** Cross-street auto delay is bounded by a strict policy cap (max +10.0% increase) to prevent corridor gridlock.
4. **Transparent Intelligence:** AI briefings generated via Google Gemini 3.8 Flash explain actual computed metrics—never invented numbers.
5. **No Hallucinations / Safety Disclaimer:**
   > **DEMO SIMULATION ONLY — NO REAL TRAFFIC SIGNALS ARE CONTROLLED.**
   > All signal plans and bus telemetry operate in deterministic simulation or imported static GTFS mode.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion
- **Visualizations:** Recharts (7 comparison charts), Leaflet + OpenStreetMap (interactive corridor routing)
- **Backend Runtime:** Node.js, Express (mounted alongside Vite development middleware via `tsx server.ts`)
- **Database & Persistence:** Supabase PostgreSQL with Row Level Security (RLS) and transparent deterministic fallback
- **AI Integration:** Official `@google/genai` TypeScript SDK (`gemini-3.8-flash`) executed strictly server-side
- **GTFS Parsing:** Standard static GTFS ZIP parser powered by `JSZip`
- **Reporting:** Client-side vector PDF generation via `jsPDF`, CSV metrics export, and JSON signal plans

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 20+ installed
- (Optional) Supabase project credentials for cloud PostgreSQL persistence
- (Optional) Google Gemini API Key for AI Executive Briefings

### 2. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your environment variables:
```env
# Gemini API Key (Server-side only)
GEMINI_API_KEY="your-gemini-api-key"

# Supabase PostgreSQL (Server-side only)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SECRET_KEY="your-supabase-service-role-key"

# App URL (Configured automatically in AI Studio / Cloud Run)
APP_URL="http://localhost:3000"
```
*Note: If Supabase credentials are not provided, PrioritySignal automatically engages its high-fidelity deterministic fallback engine with full interactive capabilities.*

### 3. Install & Start Development Server
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Database Setup & Migration

If using Supabase, apply the SQL schema in `supabase/migrations/001_initial_schema.sql` via the Supabase SQL Editor:

```sql
-- Creates 8 core mobility tables:
-- 1. intersections
-- 2. bus_routes
-- 3. bus_stops
-- 4. simulated_buses
-- 5. signal_plans
-- 6. delay_reports
-- 7. simulation_parameters
-- 8. scenarios
```

### Seeding Initial Demo Data
To populate the 6 Downtown corridor intersections, 3 bus routes, 6 simulated buses, and 6 active signal plans:
- Click **"Seed Demo Data"** directly on the dashboard banner, or
- Run an HTTP POST:
```bash
curl -X POST http://localhost:3000/api/seed
```

---

## 🚌 Static GTFS Import

PrioritySignal supports standard GTFS static ZIP feeds containing:
- `agency.txt`
- `routes.txt`
- `trips.txt`
- `stops.txt`
- `stop_times.txt`
- `shapes.txt` (optional)

Upload any transit feed via the **GTFS & Demo Data** tab. The parser validates referential integrity and saves parsed routes and stops to the active schema.

---

## 📊 Core Pages & Architecture

1. **Transit Priority Operations (Overview):**
   Corridor schematics, KPI metrics, approaching bus ETA HUD, and Hackathon presentation before/after summary.
2. **GTFS & Demo Data:**
   Feed inspector and static GTFS ZIP import engine with live validation reports.
3. **Corridor Map & Bus Routes:**
   Interactive Leaflet map tracking buses, signal phase states, and real-time +6s priority green extension recommendations.
4. **Signal Timeline Editor:**
   Visual cycle-length editor with drag/slider allocation of green splits and pedestrian safety guards.
5. **Commuter Delay Reports:**
   Public submission portal (`/delay-report`) clustering rider crowding complaints into priority weightings.
6. **Optimization Engine:**
   Reallocates green time from low-occupancy phases to high-occupancy transit phases using passenger-throughput equations.
7. **Performance Metrics Dashboard:**
   7 comparison Recharts charts and 7 KPIs with explicit units (`passenger-seconds`, `seconds`, `people/second`).
8. **Scenario Comparison Matrix:**
   Side-by-side scenario differential audit with rename and delete capabilities.
9. **Gemini AI Insights:**
   Plain-language transit director briefings auditing person-hours saved, trade-offs, and pedestrian clearance safety floors.
10. **System Settings & Exports:**
    Download Executive PDF report, CSV metrics, CSV commuter feedback, and JSON signal plans.

---

## 🚢 Deployment to Vercel

PrioritySignal is structured for rapid deployment:
1. Push repository to GitHub.
2. Import project into Vercel.
3. Configure `GEMINI_API_KEY`, `SUPABASE_URL`, and `SUPABASE_SECRET_KEY` in Vercel Environment Variables.
4. Deploy!

---

## ⚖️ License & Disclaimer

Built for Hackathon Demonstration.
**DEMO SIMULATION ONLY — NO REAL TRAFFIC SIGNALS ARE CONTROLLED.**
