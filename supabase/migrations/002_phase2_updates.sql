-- PrioritySignal: Phase 2 Database Schema Updates
-- Migration: 002_phase2_updates.sql
-- Description: Adds feed_source tracking to bus_routes, bus_stops, and gtfs_feeds metadata table.

-- 1. Add feed_source to bus_routes if not exists
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bus_routes' AND column_name='feed_source') THEN
    ALTER TABLE bus_routes ADD COLUMN feed_source TEXT NOT NULL DEFAULT 'SIMULATED DEMO DATA';
  END IF;
END $$;

-- 2. GTFS Feeds Audit Table
CREATE TABLE IF NOT EXISTS gtfs_feeds (
  id TEXT PRIMARY KEY,
  feed_name TEXT NOT NULL,
  agency_name TEXT,
  routes_count INTEGER NOT NULL DEFAULT 0,
  stops_count INTEGER NOT NULL DEFAULT 0,
  trips_count INTEGER NOT NULL DEFAULT 0,
  validation_warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE gtfs_feeds ENABLE ROW LEVEL SECURITY;
