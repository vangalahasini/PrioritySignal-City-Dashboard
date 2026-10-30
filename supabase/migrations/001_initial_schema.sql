-- PrioritySignal: Initial Database Schema Migration
-- Migration: 001_initial_schema.sql
-- Description: Core tables for intersections, bus routes, stops, buses, signal plans, commuter delay reports, scenarios, and simulation runs.

-- 1. Intersections Table
CREATE TABLE IF NOT EXISTS intersections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  approaches JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Bus Routes Table
CREATE TABLE IF NOT EXISTS bus_routes (
  id TEXT PRIMARY KEY,
  route_name TEXT NOT NULL,
  color TEXT NOT NULL,
  start_point TEXT NOT NULL,
  end_point TEXT NOT NULL,
  average_occupancy INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Bus Stops Table
CREATE TABLE IF NOT EXISTS bus_stops (
  id TEXT PRIMARY KEY,
  route_id TEXT NOT NULL REFERENCES bus_routes(id) ON DELETE CASCADE,
  stop_name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  stop_sequence INTEGER NOT NULL DEFAULT 0
);

-- 4. Simulated Buses Table
CREATE TABLE IF NOT EXISTS buses (
  id TEXT PRIMARY KEY,
  route_id TEXT NOT NULL REFERENCES bus_routes(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  occupancy INTEGER NOT NULL DEFAULT 0,
  speed DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  status TEXT NOT NULL DEFAULT 'in-transit',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Signal Plans Table
CREATE TABLE IF NOT EXISTS signal_plans (
  id TEXT PRIMARY KEY,
  intersection_id TEXT NOT NULL REFERENCES intersections(id) ON DELETE CASCADE,
  scenario TEXT NOT NULL DEFAULT 'baseline',
  cycle_length INTEGER NOT NULL DEFAULT 90,
  phases JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Commuter Delay Reports Table
CREATE TABLE IF NOT EXISTS delay_reports (
  id TEXT PRIMARY KEY,
  route_id TEXT NOT NULL REFERENCES bus_routes(id) ON DELETE CASCADE,
  intersection_id TEXT NOT NULL REFERENCES intersections(id) ON DELETE CASCADE,
  stop_id TEXT REFERENCES bus_stops(id) ON DELETE SET NULL,
  severity INTEGER NOT NULL CHECK (severity >= 1 AND severity <= 5),
  time_of_day TEXT NOT NULL,
  day_type TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Scenarios Table
CREATE TABLE IF NOT EXISTS scenarios (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  baseline_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  optimized_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  signal_plans JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Simulation Runs Table
CREATE TABLE IF NOT EXISTS simulation_runs (
  id TEXT PRIMARY KEY,
  scenario_id TEXT REFERENCES scenarios(id) ON DELETE SET NULL,
  run_type TEXT NOT NULL,
  input_parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
  baseline_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  optimized_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bus_stops_route_id ON bus_stops(route_id);
CREATE INDEX IF NOT EXISTS idx_buses_route_id ON buses(route_id);
CREATE INDEX IF NOT EXISTS idx_signal_plans_intersection_id ON signal_plans(intersection_id);
CREATE INDEX IF NOT EXISTS idx_delay_reports_route_id ON delay_reports(route_id);
CREATE INDEX IF NOT EXISTS idx_delay_reports_intersection_id ON delay_reports(intersection_id);
CREATE INDEX IF NOT EXISTS idx_delay_reports_created_at ON delay_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_simulation_runs_scenario_id ON simulation_runs(scenario_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE intersections ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE delay_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_runs ENABLE ROW LEVEL SECURITY;

-- Notice: All client operations are routed strictly through validated server-side API endpoints
-- utilizing SUPABASE_SECRET_KEY (service_role), which safely bypasses RLS while keeping tables
-- protected from public or anonymous direct table manipulation.
