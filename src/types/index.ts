/**
 * PrioritySignal - Type Definitions
 * Shared types for models, API responses, and application state
 */

export interface Approach {
  direction: string; // 'Northbound', 'Southbound', 'Eastbound', 'Westbound'
  lanes: number;
  hasTransitLane?: boolean;
  priorityPhase?: number;
}

export interface Intersection {
  id: string; // e.g. 'INT001'
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  approaches: Approach[];
  corridor_name?: string;
  cycle_length_seconds?: number;
  main_street_green_seconds?: number;
  pedestrian_clearance_seconds?: number;
  created_at?: string;
  updated_at?: string;
}

export interface BusRoute {
  id: string; // e.g. 'R10'
  route_name: string;
  name?: string; // friendly alias
  color: string;
  start_point: string;
  end_point: string;
  average_occupancy: number;
  stop_ids?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface BusStop {
  id: string;
  route_id: string;
  stop_name: string;
  latitude: number;
  longitude: number;
  stop_sequence: number;
}

export type BusStatus = 'in-transit' | 'approaching-signal' | 'at-stop' | 'delayed';

export interface Bus {
  id: string; // e.g. 'BUS-101'
  route_id: string;
  latitude: number;
  longitude: number;
  occupancy: number; // Passenger count
  speed: number; // km/h
  status: BusStatus;
  updated_at?: string;
}

export interface SignalPhase {
  id: string;
  name: string;
  duration_seconds: number;
  is_transit_priority?: boolean;
  green_split: number; // percentage (0-100)
}

export interface SignalPlan {
  id: string;
  intersection_id: string;
  scenario: string; // 'baseline' or 'optimized'
  cycle_length: number; // seconds
  phases: SignalPhase[];
  created_at?: string;
  updated_at?: string;
}

export interface DelayReport {
  id: string;
  route_id: string;
  intersection_id: string;
  stop_id?: string | null;
  severity: number; // 1 to 5
  delay_minutes?: number;
  crowding_level?: string;
  description?: string;
  time_of_day: string; // 'Morning Peak', 'Evening Peak', 'Midday', etc.
  day_type: string; // 'Weekday', 'Weekend'
  comment: string;
  created_at?: string;
}

export interface ScenarioMetrics {
  average_bus_delay_sec?: number;
  person_delay_hours?: number;
  people_moved_per_green_sec?: number;
  general_traffic_delay_sec?: number;
  totalPersonDelaySeconds?: number;
  averageBusDelaySeconds?: number;
  averageBusTravelTimeSeconds?: number;
  peopleMovedPerGreenSecond?: number;
  carDelayIncreasePercent?: number;
  constraintViolations?: string[];
  improvement_pct?: number;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  baseline_metrics: ScenarioMetrics;
  optimized_metrics: ScenarioMetrics;
  signal_plans: any[];
  created_at?: string;
  updated_at?: string;
}

export interface SimulationRun {
  id: string;
  scenario_id?: string | null;
  run_type: string;
  input_parameters: Record<string, any>;
  baseline_metrics: Record<string, any>;
  optimized_metrics: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at?: string;
}

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'unconfigured' | 'error';
  database: 'connected' | 'disconnected' | 'missing_credentials' | 'tables_missing';
  configured: boolean;
  missing_env: string[];
  using_mock_fallback: boolean;
  message?: string;
  timestamp: string;
  table_counts?: {
    intersections: number;
    bus_routes: number;
    buses: number;
    delay_reports: number;
    signal_plans: number;
  };
}

export interface SimulationParameters {
  routes: string[];
  intersections: string[];
  timeWindow: string; // 'Morning Peak', 'Evening Peak', 'Midday', 'Late Night'
  busPriorityWeight: number; // 1 to 5
  maxCarDelayIncreasePct: number; // default 10%
  pedestrianMinimumSeconds: number; // default 10s
}

export interface IntersectionSimulationMetric {
  intersectionId: string;
  intersectionName: string;
  busDelaySeconds: number;
  personDelayHours: number;
  carDelaySeconds: number;
  peopleMovedPerGreenSec: number;
  busesProcessed: number;
}

export interface RouteSimulationMetric {
  routeId: string;
  routeName: string;
  busDelaySeconds: number;
  personDelayHours: number;
  averageSpeedKmH: number;
  busesActive: number;
}

export interface SimulationResult {
  totalBusDelaySeconds: number;
  averageBusDelaySeconds: number;
  totalPersonDelayHours: number;
  averagePersonDelayPerBusTripSeconds: number;
  estimatedAverageBusTravelTimeMinutes: number;
  generalCarDelaySeconds: number;
  peopleMovedPerGreenSec: number;
  routeMetrics: RouteSimulationMetric[];
  intersectionMetrics: IntersectionSimulationMetric[];
  timestamp: string;
  totalPersonDelaySeconds?: number;
  averageBusTravelTimeSeconds?: number;
  peopleMovedPerGreenSecond?: number;
  carDelayIncreasePercent?: number;
  constraintViolations?: string[];
}

export interface OptimizationResult {
  baselinePlan: SignalPlan[];
  recommendedPlan: SignalPlan[];
  baselineMetrics: SimulationResult;
  optimizedMetrics: SimulationResult;
  percentageChange: {
    busDelayPct: number;
    personDelayPct: number;
    carDelayPct: number;
    peopleMovedPct: number;
  };
  constraintValidation: {
    carDelayLimitRespected: boolean;
    maxCarDelayIncreasePct: number;
    actualCarDelayIncreasePct: number;
    pedestrianMinimumsRespected: boolean;
    cycleLengthsPreserved: boolean;
    violations: string[];
  };
  explanation: string[];
  genuineImprovementAchieved: boolean;
  iterationsTested: number;
}

export interface DelayHotspot {
  intersectionId: string;
  intersectionName: string;
  reportCount: number;
  averageSeverity: number;
  hotspotScore: number;
  primaryRoutes: string[];
  recentComments: string[];
}

export interface GtfsValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    agencyCount: number;
    routesCount: number;
    tripsCount: number;
    stopsCount: number;
    stopTimesCount: number;
    shapesCount?: number;
  };
}

export interface OverviewMetrics {
  totalIntersections: number;
  totalBusRoutes: number;
  activeBuses: number;
  totalDelayReports: number;
  averageOccupancy: number;
  personDelayMetricNotice: string;
}

export interface AiInsightReport {
  summary: string;
  transitBenefits: string;
  passengerBeneficiaries: string[];
  tradeOffs: string;
  bottleneckIntersections: string[];
  risksAndLimitations: string[];
  nextSimulationRecommendations: string[];
  generatedAt: string;
  modelUsed: string;
  dataSource: string;
}


