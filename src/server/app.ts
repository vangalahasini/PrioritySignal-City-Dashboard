/**
 * PrioritySignal - Express Application & API Handlers
 * 
 * Reusable Express application mounted for both local development (server.ts)
 * and Vercel serverless deployment (api/index.ts).
 */

import express, { Request, Response, Router } from 'express';
import {
  checkDatabaseHealth,
  fetchIntersections,
  fetchBusRoutes,
  fetchBuses,
  fetchScenarios,
  fetchDelayReports,
  fetchSignalPlans,
  seedDemoData,
  createIntersection,
  updateIntersection,
  deleteIntersection,
  saveSignalPlan,
  createDelayReport,
  saveScenario,
  updateScenario,
  deleteScenario,
  saveGtfsImport,
  tickBusSimulation,
  resetBusSimulation,
} from './db';
import { DEMO_DATA_NOTICE } from './demoData';
import { runSimulation } from './simulationEngine';
import { optimizeSignalPlans, computeDelayHotspots } from './optimizationEngine';
import { parseAndValidateGtfsZip } from './gtfsParser';
import { generateAiInsights } from './aiService';
import { Intersection, SignalPlan, DelayReport, SimulationParameters, Scenario } from '../types';

export const app = express();

// Basic JSON middleware with 10mb limit for GTFS base64 uploads
app.use(express.json({ limit: '10mb' }));

// Safe logger middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      console.log(`[API] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Basic IP rate limiting store for public delay report endpoint
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string, maxRequests: number = 30, windowMs: number = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

const apiRouter = Router();

// ---------------------------------------------------------------------------
// Health Check & Database Probing
// ---------------------------------------------------------------------------

apiRouter.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await checkDatabaseHealth();
    res.status(health.status === 'ok' ? 200 : health.status === 'unconfigured' ? 200 : 503).json({
      ...health,
      notice: DEMO_DATA_NOTICE,
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      configured: false,
      message: (err as Error).message || 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// ---------------------------------------------------------------------------
// Core Data Retrieval Routes
// ---------------------------------------------------------------------------

apiRouter.get('/intersections', async (req: Request, res: Response) => {
  try {
    const { data, source } = await fetchIntersections();
    res.json({
      success: true,
      count: data.length,
      source,
      notice: DEMO_DATA_NOTICE,
      data,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve intersections' });
  }
});

apiRouter.get('/routes', async (req: Request, res: Response) => {
  try {
    const { data, source } = await fetchBusRoutes();
    res.json({
      success: true,
      count: data.length,
      source,
      notice: DEMO_DATA_NOTICE,
      data,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve bus routes' });
  }
});

apiRouter.get('/buses', async (req: Request, res: Response) => {
  try {
    const { data, source } = await fetchBuses();
    res.json({
      success: true,
      count: data.length,
      source,
      notice: DEMO_DATA_NOTICE,
      data,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve buses' });
  }
});

apiRouter.get('/scenarios', async (req: Request, res: Response) => {
  try {
    const { data, source } = await fetchScenarios();
    res.json({
      success: true,
      count: data.length,
      source,
      notice: DEMO_DATA_NOTICE,
      data,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve scenarios' });
  }
});

apiRouter.get('/delay-reports', async (req: Request, res: Response) => {
  try {
    const { data, source } = await fetchDelayReports();
    res.json({
      success: true,
      count: data.length,
      source,
      notice: DEMO_DATA_NOTICE,
      data,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve delay reports' });
  }
});

apiRouter.get('/delay-reports/hotspots', async (req: Request, res: Response) => {
  try {
    const [reports, intersections] = await Promise.all([
      fetchDelayReports(),
      fetchIntersections(),
    ]);
    const hotspots = computeDelayHotspots(reports.data, intersections.data);
    res.json({
      success: true,
      count: hotspots.length,
      notice: DEMO_DATA_NOTICE,
      data: hotspots,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to compute delay hotspots' });
  }
});

apiRouter.get('/signal-plans', async (req: Request, res: Response) => {
  try {
    const { data, source } = await fetchSignalPlans();
    res.json({
      success: true,
      count: data.length,
      source,
      notice: DEMO_DATA_NOTICE,
      data,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve signal plans' });
  }
});

apiRouter.post('/seed', async (req: Request, res: Response) => {
  try {
    const result = await seedDemoData();
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: (err as Error).message || 'Failed to seed demo data',
    });
  }
});

apiRouter.get('/stats', async (req: Request, res: Response) => {
  try {
    const [intersections, routes, buses, reports] = await Promise.all([
      fetchIntersections(),
      fetchBusRoutes(),
      fetchBuses(),
      fetchDelayReports(),
    ]);

    const totalOccupancy = buses.data.reduce((sum, b) => sum + (b.occupancy || 0), 0);
    const avgOccupancy = buses.data.length > 0 ? Math.round(totalOccupancy / buses.data.length) : 0;

    res.json({
      success: true,
      totalIntersections: intersections.data.length,
      totalBusRoutes: routes.data.length,
      activeBuses: buses.data.length,
      totalDelayReports: reports.data.length,
      averageOccupancy: avgOccupancy,
      totalPassengerVolume: totalOccupancy,
      source: intersections.source,
      notice: DEMO_DATA_NOTICE,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to compile stats' });
  }
});

// ---------------------------------------------------------------------------
// Intersection Management (CRUD)
// ---------------------------------------------------------------------------

apiRouter.post('/intersections', async (req: Request, res: Response) => {
  try {
    const { id, name, location, latitude, longitude, approaches } = req.body;

    if (!id || !name || !location || typeof latitude !== 'number' || typeof longitude !== 'number') {
      res.status(400).json({
        success: false,
        error: 'Validation failed: id, name, location, latitude, and longitude are required.',
      });
      return;
    }

    const newIntersection: Intersection = {
      id: id.trim().toUpperCase(),
      name: name.trim(),
      location: location.trim(),
      latitude,
      longitude,
      approaches: Array.isArray(approaches) ? approaches : [],
    };

    const result = await createIntersection(newIntersection);
    res.status(result.success ? 201 : 400).json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.put('/intersections/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const result = await updateIntersection(id, updates);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.delete('/intersections/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await deleteIntersection(id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// ---------------------------------------------------------------------------
// Signal Plan Management
// ---------------------------------------------------------------------------

apiRouter.post('/signal-plans', async (req: Request, res: Response) => {
  try {
    const plan: SignalPlan = req.body;

    if (!plan.id || !plan.intersection_id || !plan.cycle_length || !Array.isArray(plan.phases)) {
      res.status(400).json({
        success: false,
        error: 'Validation failed: id, intersection_id, cycle_length, and phases are required.',
      });
      return;
    }

    const totalDuration = plan.phases.reduce((sum, p) => sum + (p.duration_seconds || 0), 0);
    if (totalDuration !== plan.cycle_length) {
      res.status(400).json({
        success: false,
        error: `Validation error: Total phase duration (${totalDuration}s) must exactly match cycle length (${plan.cycle_length}s).`,
      });
      return;
    }

    for (const p of plan.phases) {
      if (!p.duration_seconds || p.duration_seconds <= 0) {
        res.status(400).json({
          success: false,
          error: `Validation error: Phase ${p.id} (${p.name}) duration must be strictly positive.`,
        });
        return;
      }
    }

    const result = await saveSignalPlan(plan);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// ---------------------------------------------------------------------------
// Commuter Delay Reports
// ---------------------------------------------------------------------------

apiRouter.post('/delay-reports', async (req: Request, res: Response) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  if (!checkRateLimit(clientIp)) {
    res.status(429).json({
      success: false,
      error: 'Rate limit exceeded. Please wait a minute before submitting another delay report.',
    });
    return;
  }

  try {
    const { route_id, intersection_id, stop_id, severity, time_of_day, day_type, comment } = req.body;

    if (!route_id || !intersection_id || !severity || !time_of_day || !day_type) {
      res.status(400).json({
        success: false,
        error: 'Validation failed: route_id, intersection_id, severity, time_of_day, and day_type are required.',
      });
      return;
    }

    const numSeverity = parseInt(severity, 10);
    if (isNaN(numSeverity) || numSeverity < 1 || numSeverity > 5) {
      res.status(400).json({
        success: false,
        error: 'Validation failed: severity must be an integer between 1 and 5.',
      });
      return;
    }

    if (comment && comment.length > 500) {
      res.status(400).json({
        success: false,
        error: 'Validation failed: comment exceeds maximum permitted length (500 characters).',
      });
      return;
    }

    const report: DelayReport = {
      id: `REP-${Date.now().toString().slice(-5)}`,
      route_id: route_id.trim(),
      intersection_id: intersection_id.trim(),
      stop_id: stop_id ? stop_id.trim() : null,
      severity: numSeverity,
      time_of_day: time_of_day.trim(),
      day_type: day_type.trim(),
      comment: (comment || 'Commuter delay logged.').trim(),
      created_at: new Date().toISOString(),
    };

    const result = await createDelayReport(report);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// ---------------------------------------------------------------------------
// GTFS Import Route
// ---------------------------------------------------------------------------

apiRouter.post('/gtfs/import', async (req: Request, res: Response) => {
  try {
    const { base64Zip } = req.body;

    if (!base64Zip) {
      res.status(400).json({
        success: false,
        error: 'No GTFS ZIP payload provided. Base64 encoded zip file is required.',
      });
      return;
    }

    const cleanBase64 = base64Zip.replace(/^data:application\/(zip|x-zip-compressed|octet-stream);base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const parsed = await parseAndValidateGtfsZip(buffer);

    if (!parsed.validation.isValid) {
      res.status(400).json({
        success: false,
        validation: parsed.validation,
        error: 'GTFS feed validation failed. Please address the errors listed in the validation summary.',
      });
      return;
    }

    const saveResult = await saveGtfsImport(
      parsed.routes,
      parsed.stops,
      parsed.agencyName || 'Imported Transit Agency',
      parsed.validation.warnings
    );

    res.json({
      success: true,
      message: saveResult.message,
      validation: parsed.validation,
      importedRoutes: parsed.routes.length,
      importedStops: parsed.stops.length,
      source: 'IMPORTED STATIC GTFS',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: `GTFS import processing failed: ${(err as Error).message}`,
    });
  }
});

// ---------------------------------------------------------------------------
// Deterministic Simulation & Optimization Routes
// ---------------------------------------------------------------------------

const handleSimulationRun = async (req: Request, res: Response) => {
  try {
    const params: SimulationParameters = req.body || {
      routes: [],
      intersections: [],
      timeWindow: 'Morning Peak',
      busPriorityWeight: 3,
      maxCarDelayIncreasePct: 10,
      pedestrianMinimumSeconds: 10,
    };

    const [intersections, routes, buses, plans, reports] = await Promise.all([
      fetchIntersections(),
      fetchBusRoutes(),
      fetchBuses(),
      fetchSignalPlans(),
      fetchDelayReports(),
    ]);

    const result = runSimulation(
      params,
      intersections.data,
      routes.data,
      buses.data,
      plans.data,
      reports.data
    );

    res.json({
      success: true,
      notice: DEMO_DATA_NOTICE,
      metrics: result,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
};

apiRouter.post('/simulation/run', handleSimulationRun);
apiRouter.post('/simulate', handleSimulationRun);

apiRouter.post('/simulation/tick', (req: Request, res: Response) => {
  try {
    const speed = parseFloat(req.body.speed) || 1.0;
    const buses = tickBusSimulation(speed);
    res.json({
      success: true,
      buses,
      notice: DEMO_DATA_NOTICE,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.post('/simulation/reset', (req: Request, res: Response) => {
  try {
    const buses = resetBusSimulation();
    res.json({
      success: true,
      buses,
      notice: DEMO_DATA_NOTICE,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

const handleOptimizationRun = async (req: Request, res: Response) => {
  try {
    const params: SimulationParameters = req.body || {
      routes: [],
      intersections: [],
      timeWindow: 'Morning Peak',
      busPriorityWeight: 3,
      maxCarDelayIncreasePct: 10,
      pedestrianMinimumSeconds: 10,
    };

    const [intersections, routes, buses, plans, reports] = await Promise.all([
      fetchIntersections(),
      fetchBusRoutes(),
      fetchBuses(),
      fetchSignalPlans(),
      fetchDelayReports(),
    ]);

    const optimizationResult = optimizeSignalPlans(
      params,
      intersections.data,
      routes.data,
      buses.data,
      plans.data,
      reports.data
    );

    res.json({
      success: true,
      notice: DEMO_DATA_NOTICE,
      result: optimizationResult,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
};

apiRouter.post('/optimization/run', handleOptimizationRun);
apiRouter.post('/optimize', handleOptimizationRun);
apiRouter.get('/optimize/hotspots', async (req: Request, res: Response) => {
  try {
    const [reports, intersections] = await Promise.all([
      fetchDelayReports(),
      fetchIntersections(),
    ]);
    const hotspots = computeDelayHotspots(reports.data, intersections.data);
    res.json({
      success: true,
      count: hotspots.length,
      notice: DEMO_DATA_NOTICE,
      data: hotspots,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to compute delay hotspots' });
  }
});

// ---------------------------------------------------------------------------
// Scenario Management
// ---------------------------------------------------------------------------

apiRouter.post('/scenarios', async (req: Request, res: Response) => {
  try {
    const { name, description, baseline_metrics, optimized_metrics, signal_plans } = req.body;

    if (!name) {
      res.status(400).json({ success: false, error: 'Scenario name is required.' });
      return;
    }

    const scenario: Scenario = {
      id: `SCEN-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      description: (description || 'Optimized transit priority timing scenario.').trim(),
      baseline_metrics: baseline_metrics || {},
      optimized_metrics: optimized_metrics || {},
      signal_plans: signal_plans || [],
    };

    const result = await saveScenario(scenario);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.put('/scenarios/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const result = await updateScenario(id, { name, description });
    if (!result.success) {
      res.status(404).json(result);
      return;
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.delete('/scenarios/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await deleteScenario(id);
    if (!result.success) {
      res.status(404).json(result);
      return;
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// ---------------------------------------------------------------------------
// Server-Side Gemini AI Insights
// ---------------------------------------------------------------------------

apiRouter.post('/ai/insights', async (req: Request, res: Response) => {
  try {
    const { baseline, optimized } = req.body;

    if (!baseline || !optimized) {
      res.status(400).json({
        success: false,
        error: 'Both baseline and optimized simulation results are required to generate AI insights.',
      });
      return;
    }

    const [intersections, routes, delayReports, signalPlans] = await Promise.all([
      fetchIntersections(),
      fetchBusRoutes(),
      fetchDelayReports(),
      fetchSignalPlans(),
    ]);

    const insightReport = await generateAiInsights(
      baseline,
      optimized,
      intersections.data,
      routes.data,
      signalPlans.data,
      delayReports.data
    );

    res.json({
      success: true,
      report: insightReport,
      notice: DEMO_DATA_NOTICE,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: `Failed to generate AI insights: ${(err as Error).message}`,
    });
  }
});

// ---------------------------------------------------------------------------
// Export Endpoints
// ---------------------------------------------------------------------------

apiRouter.get('/export/metrics.csv', async (req: Request, res: Response) => {
  try {
    const { data: scenarios } = await fetchScenarios();
    const rows = [
      'Scenario ID,Scenario Name,Total Person Delay (p-sec),Avg Delay Per Bus (sec),Avg Travel Time (sec),People Moved Per Green Sec,Car Delay Increase (%),Constraint Violations',
    ];

    for (const s of scenarios) {
      const b = s.baseline_metrics;
      const o = s.optimized_metrics;
      if (b && b.totalPersonDelaySeconds !== undefined) {
        rows.push(
          `"${s.id}-BASELINE","${s.name} (Baseline)",${b.totalPersonDelaySeconds || 0},${b.averageBusDelaySeconds || 0},${b.averageBusTravelTimeSeconds || 0},${b.peopleMovedPerGreenSecond || 0},0,0`
        );
      }
      if (o && o.totalPersonDelaySeconds !== undefined) {
        rows.push(
          `"${s.id}-OPTIMIZED","${s.name} (Optimized)",${o.totalPersonDelaySeconds || 0},${o.averageBusDelaySeconds || 0},${o.averageBusTravelTimeSeconds || 0},${o.peopleMovedPerGreenSecond || 0},${o.carDelayIncreasePercent || 0},${o.constraintViolations?.length || 0}`
        );
      }
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="prioritysignal-metrics.csv"');
    res.status(200).send(rows.join('\n'));
  } catch (err) {
    res.status(500).send('Error generating CSV');
  }
});

apiRouter.get('/export/delay-reports.csv', async (req: Request, res: Response) => {
  try {
    const { data: reports } = await fetchDelayReports();
    const rows = [
      'Report ID,Route ID,Intersection ID,Reported Delay (min),Crowding Level,Report Time,Description',
    ];

    for (const r of reports) {
      rows.push(
        `"${r.id}","${r.route_id}","${r.intersection_id || ''}",${r.delay_minutes || 0},"${r.crowding_level || ''}","${r.created_at}","${(r.description || '').replace(/"/g, '""')}"`
      );
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="prioritysignal-delay-reports.csv"');
    res.status(200).send(rows.join('\n'));
  } catch (err) {
    res.status(500).send('Error generating CSV');
  }
});

apiRouter.get('/export/signal-plans.json', async (req: Request, res: Response) => {
  try {
    const { data: plans } = await fetchSignalPlans();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="prioritysignal-plans.json"');
    res.status(200).json({
      exportedAt: new Date().toISOString(),
      source: 'PrioritySignal Optimization Engine',
      plans,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to export signal plans' });
  }
});

apiRouter.get('/export/corridor-summary.csv', async (req: Request, res: Response) => {
  try {
    const [intersections, routes, buses] = await Promise.all([
      fetchIntersections(),
      fetchBusRoutes(),
      fetchBuses(),
    ]);

    const rows = ['Corridor ID,Route Name,Color,Start Point,End Point,Avg Occupancy,Active Fleet Count'];
    for (const r of routes.data) {
      const fleetCount = buses.data.filter((b) => b.route_id === r.id).length;
      rows.push(`"${r.id}","${r.route_name}","${r.color}","${r.start_point}","${r.end_point}",${r.average_occupancy},${fleetCount}`);
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="prioritysignal-corridors.csv"');
    res.status(200).send(rows.join('\n'));
  } catch (err) {
    res.status(500).send('Error generating corridor CSV');
  }
});

apiRouter.get('/export/scenario/:id/report.json', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data: scenarios } = await fetchScenarios();
    const scenario = scenarios.find((s) => s.id === id);

    if (!scenario) {
      res.status(404).json({ error: `Scenario ${id} not found` });
      return;
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="scenario-${id}-report.json"`);
    res.status(200).json({
      scenario,
      exportedAt: new Date().toISOString(),
      generator: 'PrioritySignal Transit Optimization Platform',
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to export scenario' });
  }
});

// Mount the router on both /api (standard) and / (for stripped serverless paths)
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
