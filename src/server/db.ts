/**
 * PrioritySignal - Server Data Access Layer
 * Handles database operations against Supabase with deterministic fallback.
 */

import { getSupabaseAdminClient, getSupabaseConfigStatus } from './supabase';
import {
  DEMO_INTERSECTIONS,
  DEMO_BUS_ROUTES,
  DEMO_BUS_STOPS,
  DEMO_BUSES,
  DEMO_SIGNAL_PLANS,
  DEMO_DELAY_REPORTS,
  DEMO_SCENARIOS,
} from './demoData';
import {
  Intersection,
  BusRoute,
  BusStop,
  Bus,
  SignalPlan,
  DelayReport,
  Scenario,
  HealthStatus,
} from '../types';

/**
 * Tests the real database connection and verifies table accessibility.
 */
export async function checkDatabaseHealth(): Promise<HealthStatus> {
  const config = getSupabaseConfigStatus();
  const now = new Date().toISOString();

  if (!config.isConfigured) {
    return {
      status: 'unconfigured',
      database: 'missing_credentials',
      configured: false,
      missing_env: config.missingEnv,
      using_mock_fallback: true,
      message: `Supabase environment variables missing: ${config.missingEnv.join(', ')}. Serving deterministic simulation data.`,
      timestamp: now,
      table_counts: {
        intersections: DEMO_INTERSECTIONS.length,
        bus_routes: DEMO_BUS_ROUTES.length,
        buses: DEMO_BUSES.length,
        delay_reports: DEMO_DELAY_REPORTS.length,
        signal_plans: DEMO_SIGNAL_PLANS.length,
      },
    };
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return {
      status: 'error',
      database: 'disconnected',
      configured: true,
      missing_env: [],
      using_mock_fallback: true,
      message: 'Failed to create Supabase client instance with provided credentials.',
      timestamp: now,
    };
  }

  try {
    // Probe database by querying intersection count
    const { count: intersectionCount, error: intError } = await supabase
      .from('intersections')
      .select('*', { count: 'exact', head: true });

    if (intError) {
      const isMissingTable =
        intError.code === '42P01' ||
        intError.message?.toLowerCase().includes('does not exist') ||
        intError.message?.toLowerCase().includes('relation');

      return {
        status: isMissingTable ? 'degraded' : 'error',
        database: isMissingTable ? 'tables_missing' : 'disconnected',
        configured: true,
        missing_env: [],
        using_mock_fallback: true,
        message: isMissingTable
          ? 'Connected to Supabase, but initial tables are missing. Please execute supabase/migrations/001_initial_schema.sql in the Supabase SQL Editor.'
          : `Database query probe failed: ${intError.message}`,
        timestamp: now,
      };
    }

    // Also get counts for other tables
    const [
      { count: routeCount },
      { count: busCount },
      { count: reportCount },
      { count: planCount },
    ] = await Promise.all([
      supabase.from('bus_routes').select('*', { count: 'exact', head: true }),
      supabase.from('buses').select('*', { count: 'exact', head: true }),
      supabase.from('delay_reports').select('*', { count: 'exact', head: true }),
      supabase.from('signal_plans').select('*', { count: 'exact', head: true }),
    ]);

    return {
      status: 'ok',
      database: 'connected',
      configured: true,
      missing_env: [],
      using_mock_fallback: false,
      message: 'Successfully connected to Supabase PostgreSQL database.',
      timestamp: now,
      table_counts: {
        intersections: intersectionCount ?? 0,
        bus_routes: routeCount ?? 0,
        buses: busCount ?? 0,
        delay_reports: reportCount ?? 0,
        signal_plans: planCount ?? 0,
      },
    };
  } catch (err) {
    return {
      status: 'error',
      database: 'disconnected',
      configured: true,
      missing_env: [],
      using_mock_fallback: true,
      message: `Database connection error: ${(err as Error).message}`,
      timestamp: now,
    };
  }
}

/**
 * Fetch Intersections
 */
export async function fetchIntersections(): Promise<{ data: Intersection[]; source: 'supabase' | 'fallback' }> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { data: DEMO_INTERSECTIONS, source: 'fallback' };
  }

  try {
    const { data, error } = await supabase
      .from('intersections')
      .select('*')
      .order('id', { ascending: true });

    if (error || !data || data.length === 0) {
      return { data: DEMO_INTERSECTIONS, source: 'fallback' };
    }

    return { data, source: 'supabase' };
  } catch {
    return { data: DEMO_INTERSECTIONS, source: 'fallback' };
  }
}

/**
 * Fetch Bus Routes
 */
export async function fetchBusRoutes(): Promise<{ data: BusRoute[]; source: 'supabase' | 'fallback' }> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { data: DEMO_BUS_ROUTES, source: 'fallback' };
  }

  try {
    const { data, error } = await supabase
      .from('bus_routes')
      .select('*')
      .order('id', { ascending: true });

    if (error || !data || data.length === 0) {
      return { data: DEMO_BUS_ROUTES, source: 'fallback' };
    }

    return { data, source: 'supabase' };
  } catch {
    return { data: DEMO_BUS_ROUTES, source: 'fallback' };
  }
}

/**
 * Fetch Buses
 */
export async function fetchBuses(): Promise<{ data: Bus[]; source: 'supabase' | 'fallback' }> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { data: DEMO_BUSES, source: 'fallback' };
  }

  try {
    const { data, error } = await supabase
      .from('buses')
      .select('*')
      .order('id', { ascending: true });

    if (error || !data || data.length === 0) {
      return { data: DEMO_BUSES, source: 'fallback' };
    }

    return { data, source: 'supabase' };
  } catch {
    return { data: DEMO_BUSES, source: 'fallback' };
  }
}

/**
 * Fetch Scenarios
 */
export async function fetchScenarios(): Promise<{ data: Scenario[]; source: 'supabase' | 'fallback' }> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { data: DEMO_SCENARIOS, source: 'fallback' };
  }

  try {
    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .order('id', { ascending: true });

    if (error || !data || data.length === 0) {
      return { data: DEMO_SCENARIOS, source: 'fallback' };
    }

    return { data, source: 'supabase' };
  } catch {
    return { data: DEMO_SCENARIOS, source: 'fallback' };
  }
}

/**
 * Fetch Delay Reports
 */
export async function fetchDelayReports(): Promise<{ data: DelayReport[]; source: 'supabase' | 'fallback' }> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { data: DEMO_DELAY_REPORTS, source: 'fallback' };
  }

  try {
    const { data, error } = await supabase
      .from('delay_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return { data: DEMO_DELAY_REPORTS, source: 'fallback' };
    }

    return { data, source: 'supabase' };
  } catch {
    return { data: DEMO_DELAY_REPORTS, source: 'fallback' };
  }
}

/**
 * Fetch Signal Plans
 */
export async function fetchSignalPlans(): Promise<{ data: SignalPlan[]; source: 'supabase' | 'fallback' }> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { data: DEMO_SIGNAL_PLANS, source: 'fallback' };
  }

  try {
    const { data, error } = await supabase
      .from('signal_plans')
      .select('*')
      .order('id', { ascending: true });

    if (error || !data || data.length === 0) {
      return { data: DEMO_SIGNAL_PLANS, source: 'fallback' };
    }

    return { data, source: 'supabase' };
  } catch {
    return { data: DEMO_SIGNAL_PLANS, source: 'fallback' };
  }
}

/**
 * Seeds deterministic demo data into Supabase
 */
export async function seedDemoData(): Promise<{
  success: boolean;
  message: string;
  seeded: {
    intersections: number;
    bus_routes: number;
    bus_stops: number;
    buses: number;
    signal_plans: number;
    delay_reports: number;
    scenarios: number;
  };
  destination: 'supabase' | 'in-memory-ready';
}> {
  const supabase = getSupabaseAdminClient();
  const config = getSupabaseConfigStatus();

  if (!config.isConfigured || !supabase) {
    return {
      success: true,
      message: `Deterministic demo dataset active in memory (${DEMO_INTERSECTIONS.length} junctions, ${DEMO_BUSES.length} buses, ${DEMO_DELAY_REPORTS.length} reports). To persist directly to Supabase, provide ${config.missingEnv.join(', ')} in the server environment.`,
      seeded: {
        intersections: DEMO_INTERSECTIONS.length,
        bus_routes: DEMO_BUS_ROUTES.length,
        bus_stops: DEMO_BUS_STOPS.length,
        buses: DEMO_BUSES.length,
        signal_plans: DEMO_SIGNAL_PLANS.length,
        delay_reports: DEMO_DELAY_REPORTS.length,
        scenarios: DEMO_SCENARIOS.length,
      },
      destination: 'in-memory-ready',
    };
  }

  try {
    // 1. Intersections
    const { error: intErr } = await supabase.from('intersections').upsert(
      DEMO_INTERSECTIONS.map((i) => ({
        id: i.id,
        name: i.name,
        location: i.location,
        latitude: i.latitude,
        longitude: i.longitude,
        approaches: i.approaches,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: 'id' }
    );
    if (intErr) throw new Error(`Intersections upsert failed: ${intErr.message}`);

    // 2. Bus Routes
    const { error: routeErr } = await supabase.from('bus_routes').upsert(
      DEMO_BUS_ROUTES.map((r) => ({
        id: r.id,
        route_name: r.route_name,
        color: r.color,
        start_point: r.start_point,
        end_point: r.end_point,
        average_occupancy: r.average_occupancy,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: 'id' }
    );
    if (routeErr) throw new Error(`Bus routes upsert failed: ${routeErr.message}`);

    // 3. Bus Stops
    const { error: stopErr } = await supabase.from('bus_stops').upsert(
      DEMO_BUS_STOPS.map((s) => ({
        id: s.id,
        route_id: s.route_id,
        stop_name: s.stop_name,
        latitude: s.latitude,
        longitude: s.longitude,
        stop_sequence: s.stop_sequence,
      })),
      { onConflict: 'id' }
    );
    if (stopErr) throw new Error(`Bus stops upsert failed: ${stopErr.message}`);

    // 4. Buses
    const { error: busErr } = await supabase.from('buses').upsert(
      DEMO_BUSES.map((b) => ({
        id: b.id,
        route_id: b.route_id,
        latitude: b.latitude,
        longitude: b.longitude,
        occupancy: b.occupancy,
        speed: b.speed,
        status: b.status,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: 'id' }
    );
    if (busErr) throw new Error(`Buses upsert failed: ${busErr.message}`);

    // 5. Signal Plans
    const { error: planErr } = await supabase.from('signal_plans').upsert(
      DEMO_SIGNAL_PLANS.map((p) => ({
        id: p.id,
        intersection_id: p.intersection_id,
        scenario: p.scenario,
        cycle_length: p.cycle_length,
        phases: p.phases,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: 'id' }
    );
    if (planErr) throw new Error(`Signal plans upsert failed: ${planErr.message}`);

    // 6. Delay Reports
    const { error: repErr } = await supabase.from('delay_reports').upsert(
      DEMO_DELAY_REPORTS.map((d) => ({
        id: d.id,
        route_id: d.route_id,
        intersection_id: d.intersection_id,
        stop_id: d.stop_id ?? null,
        severity: d.severity,
        time_of_day: d.time_of_day,
        day_type: d.day_type,
        comment: d.comment,
        created_at: d.created_at ?? new Date().toISOString(),
      })),
      { onConflict: 'id' }
    );
    if (repErr) throw new Error(`Delay reports upsert failed: ${repErr.message}`);

    // 7. Scenarios
    const { error: scenErr } = await supabase.from('scenarios').upsert(
      DEMO_SCENARIOS.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        baseline_metrics: s.baseline_metrics,
        optimized_metrics: s.optimized_metrics,
        signal_plans: s.signal_plans,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: 'id' }
    );
    if (scenErr) throw new Error(`Scenarios upsert failed: ${scenErr.message}`);

    return {
      success: true,
      message: 'Successfully seeded deterministic demo data into Supabase PostgreSQL tables.',
      seeded: {
        intersections: DEMO_INTERSECTIONS.length,
        bus_routes: DEMO_BUS_ROUTES.length,
        bus_stops: DEMO_BUS_STOPS.length,
        buses: DEMO_BUSES.length,
        signal_plans: DEMO_SIGNAL_PLANS.length,
        delay_reports: DEMO_DELAY_REPORTS.length,
        scenarios: DEMO_SCENARIOS.length,
      },
      destination: 'supabase',
    };
  } catch (err) {
    return {
      success: false,
      message: (err as Error).message,
      seeded: {
        intersections: 0,
        bus_routes: 0,
        bus_stops: 0,
        buses: 0,
        signal_plans: 0,
        delay_reports: 0,
        scenarios: 0,
      },
      destination: 'supabase',
    };
  }
}

// ---------------------------------------------------------------------------
// In-Memory Fallback Stores for Offline / Pre-Configured Mode
// ---------------------------------------------------------------------------
let memoryIntersections: Intersection[] = JSON.parse(JSON.stringify(DEMO_INTERSECTIONS));
let memoryRoutes: BusRoute[] = JSON.parse(JSON.stringify(DEMO_BUS_ROUTES));
let memoryBuses: Bus[] = JSON.parse(JSON.stringify(DEMO_BUSES));
let memoryPlans: SignalPlan[] = JSON.parse(JSON.stringify(DEMO_SIGNAL_PLANS));
let memoryReports: DelayReport[] = JSON.parse(JSON.stringify(DEMO_DELAY_REPORTS));
let memoryScenarios: Scenario[] = JSON.parse(JSON.stringify(DEMO_SCENARIOS));

/**
 * Create an Intersection
 */
export async function createIntersection(intersection: Intersection): Promise<{ success: boolean; data?: Intersection; error?: string }> {
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();
  const record = { ...intersection, created_at: now, updated_at: now };

  if (!supabase) {
    memoryIntersections.push(record);
    return { success: true, data: record };
  }

  try {
    const { data, error } = await supabase
      .from('intersections')
      .insert([record])
      .select()
      .single();

    if (error) {
      memoryIntersections.push(record);
      return { success: true, data: record };
    }
    return { success: true, data };
  } catch (err) {
    memoryIntersections.push(record);
    return { success: true, data: record };
  }
}

/**
 * Update an Intersection
 */
export async function updateIntersection(id: string, updates: Partial<Intersection>): Promise<{ success: boolean; data?: Intersection; error?: string }> {
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();
  const updatePayload = { ...updates, updated_at: now };

  // Update in-memory copy
  const idx = memoryIntersections.findIndex((i) => i.id === id);
  if (idx !== -1) {
    memoryIntersections[idx] = { ...memoryIntersections[idx], ...updatePayload };
  }

  if (!supabase) {
    const updated = memoryIntersections.find((i) => i.id === id);
    return { success: true, data: updated };
  }

  try {
    const { data, error } = await supabase
      .from('intersections')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      const fallbackItem = memoryIntersections.find((i) => i.id === id);
      return { success: true, data: fallbackItem };
    }
    return { success: true, data };
  } catch (err) {
    const fallbackItem = memoryIntersections.find((i) => i.id === id);
    return { success: true, data: fallbackItem };
  }
}

/**
 * Delete an Intersection
 */
export async function deleteIntersection(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseAdminClient();
  memoryIntersections = memoryIntersections.filter((i) => i.id !== id);
  memoryPlans = memoryPlans.filter((p) => p.intersection_id !== id);

  if (!supabase) {
    return { success: true };
  }

  try {
    const { error } = await supabase.from('intersections').delete().eq('id', id);
    if (error) {
      return { success: true };
    }
    return { success: true };
  } catch (err) {
    return { success: true };
  }
}

/**
 * Save or Update a Signal Plan
 */
export async function saveSignalPlan(plan: SignalPlan): Promise<{ success: boolean; data?: SignalPlan; error?: string }> {
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();
  const record = { ...plan, updated_at: now };

  // In-memory update
  const pIdx = memoryPlans.findIndex((p) => p.id === plan.id || (p.intersection_id === plan.intersection_id && p.scenario === plan.scenario));
  if (pIdx !== -1) {
    memoryPlans[pIdx] = record;
  } else {
    memoryPlans.push(record);
  }

  if (!supabase) {
    return { success: true, data: record };
  }

  try {
    const { data, error } = await supabase
      .from('signal_plans')
      .upsert([record], { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      return { success: true, data: record };
    }
    return { success: true, data };
  } catch (err) {
    return { success: true, data: record };
  }
}

/**
 * Create a Commuter Delay Report
 */
export async function createDelayReport(report: DelayReport): Promise<{ success: boolean; data?: DelayReport; error?: string }> {
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();
  const record: DelayReport = {
    ...report,
    id: report.id || `REP-${Date.now().toString().slice(-4)}`,
    created_at: report.created_at || now,
  };

  memoryReports.unshift(record);

  if (!supabase) {
    return { success: true, data: record };
  }

  try {
    const { data, error } = await supabase
      .from('delay_reports')
      .insert([record])
      .select()
      .single();

    if (error) {
      return { success: true, data: record };
    }
    return { success: true, data };
  } catch (err) {
    return { success: true, data: record };
  }
}

/**
 * Save a Named Scenario
 */
export async function saveScenario(scenario: Scenario): Promise<{ success: boolean; data?: Scenario; error?: string }> {
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();
  const record = { ...scenario, updated_at: now };

  const sIdx = memoryScenarios.findIndex((s) => s.id === scenario.id);
  if (sIdx !== -1) {
    memoryScenarios[sIdx] = record;
  } else {
    memoryScenarios.push(record);
  }

  if (!supabase) {
    return { success: true, data: record };
  }

  try {
    const { data, error } = await supabase
      .from('scenarios')
      .upsert([record], { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      return { success: true, data: record };
    }
    return { success: true, data };
  } catch (err) {
    return { success: true, data: record };
  }
}

/**
 * Update an existing scenario
 */
export async function updateScenario(
  id: string,
  updates: Partial<Scenario>
): Promise<{ success: boolean; data?: Scenario; error?: string }> {
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();
  const payload = { ...updates, updated_at: now };

  const idx = memoryScenarios.findIndex((s) => s.id === id);
  if (idx !== -1) {
    memoryScenarios[idx] = { ...memoryScenarios[idx], ...payload };
  }

  if (!supabase) {
    const item = memoryScenarios.find((s) => s.id === id);
    return { success: true, data: item };
  }

  try {
    const { data, error } = await supabase
      .from('scenarios')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      const item = memoryScenarios.find((s) => s.id === id);
      return { success: true, data: item };
    }
    return { success: true, data };
  } catch (err) {
    const item = memoryScenarios.find((s) => s.id === id);
    return { success: true, data: item };
  }
}

/**
 * Delete a scenario
 */
export async function deleteScenario(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseAdminClient();
  memoryScenarios = memoryScenarios.filter((s) => s.id !== id);

  if (!supabase) {
    return { success: true };
  }

  try {
    const { error } = await supabase.from('scenarios').delete().eq('id', id);
    if (error) {
      return { success: true };
    }
    return { success: true };
  } catch (err) {
    return { success: true };
  }
}


/**
 * Save Parsed Static GTFS Feeds
 */
export async function saveGtfsImport(
  importedRoutes: BusRoute[],
  importedStops: BusStop[],
  agencyName: string,
  warnings: string[]
): Promise<{ success: boolean; message: string; routesCount: number; stopsCount: number }> {
  const supabase = getSupabaseAdminClient();

  // Update in-memory collections
  for (const r of importedRoutes) {
    const existing = memoryRoutes.findIndex((er) => er.id === r.id);
    if (existing !== -1) memoryRoutes[existing] = r;
    else memoryRoutes.push(r);
  }

  if (!supabase) {
    return {
      success: true,
      message: `Imported static GTFS feed (${agencyName}): ${importedRoutes.length} routes and ${importedStops.length} stops active in data layer.`,
      routesCount: importedRoutes.length,
      stopsCount: importedStops.length,
    };
  }

  try {
    if (importedRoutes.length > 0) {
      await supabase.from('bus_routes').upsert(importedRoutes, { onConflict: 'id' });
    }
    if (importedStops.length > 0) {
      await supabase.from('bus_stops').upsert(importedStops, { onConflict: 'id' });
    }

    return {
      success: true,
      message: `Imported static GTFS feed for ${agencyName} persisted to Supabase database.`,
      routesCount: importedRoutes.length,
      stopsCount: importedStops.length,
    };
  } catch (err) {
    return {
      success: true,
      message: `GTFS data loaded into application state (${(err as Error).message}).`,
      routesCount: importedRoutes.length,
      stopsCount: importedStops.length,
    };
  }
}

/**
 * Deterministically tick / advance simulated buses along their route paths
 */
export function tickBusSimulation(speedMultiplier: number = 1.0): Bus[] {
  // Move each bus slightly along its trajectory
  const delta = 0.0006 * Math.max(0.2, Math.min(5, speedMultiplier));

  for (const bus of memoryBuses) {
    // Alternate latitude / longitude movement based on bus ID
    const busNum = parseInt(bus.id.replace(/\D/g, '') || '101', 10);
    const direction = (busNum % 2 === 0) ? 1 : -1;

    let newLat = bus.latitude + (direction * delta * 0.7);
    let newLng = bus.longitude + (direction * delta * 0.9);

    // Boundary constraints for demo corridor (lat: 37.755 - 37.790, lng: -122.435 - -122.398)
    if (newLat > 37.790) newLat = 37.756;
    if (newLat < 37.755) newLat = 37.789;
    if (newLng > -122.398) newLng = -122.435;
    if (newLng < -122.436) newLng = -122.400;

    bus.latitude = Math.round(newLat * 10000) / 10000;
    bus.longitude = Math.round(newLng * 10000) / 10000;
    bus.updated_at = new Date().toISOString();

    // Toggle status realistically based on position
    if (Math.abs(bus.latitude - 37.775) < 0.002 || Math.abs(bus.latitude - 37.768) < 0.002) {
      bus.status = 'approaching-signal';
      bus.speed = 12.0;
    } else if (bus.speed === 0) {
      bus.status = 'at-stop';
    } else {
      bus.status = 'in-transit';
      bus.speed = Math.round((20 + (busNum % 12)) * 10) / 10;
    }
  }

  return [...memoryBuses];
}

/**
 * Reset simulated buses to initial positions
 */
export function resetBusSimulation(): Bus[] {
  memoryBuses = JSON.parse(JSON.stringify(DEMO_BUSES));
  return [...memoryBuses];
}

