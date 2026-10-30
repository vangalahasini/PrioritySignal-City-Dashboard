/**
 * PrioritySignal - Deterministic Demo Dataset
 * SIMULATED DEMO DATA — NOT LIVE CITY DATA
 * 
 * Includes 6 Intersections, 3 Bus Routes, 12 Simulated Buses,
 * Bus Stops, Baseline Signal Plans, and Commuter Delay Reports.
 */

import {
  Intersection,
  BusRoute,
  BusStop,
  Bus,
  SignalPlan,
  DelayReport,
  Scenario,
} from '../types';

export const DEMO_DATA_NOTICE = 'SIMULATED DEMO DATA — NOT LIVE CITY DATA';

export const DEMO_INTERSECTIONS: Intersection[] = [
  {
    id: 'INT001',
    name: 'Central Market Junction',
    location: 'Market Street & 4th Avenue',
    latitude: 37.7749,
    longitude: -122.4194,
    approaches: [
      { direction: 'Northbound', lanes: 3, hasTransitLane: true, priorityPhase: 1 },
      { direction: 'Southbound', lanes: 3, hasTransitLane: true, priorityPhase: 1 },
      { direction: 'Eastbound', lanes: 2, hasTransitLane: false, priorityPhase: 2 },
      { direction: 'Westbound', lanes: 2, hasTransitLane: false, priorityPhase: 2 },
    ],
  },
  {
    id: 'INT002',
    name: 'City Bus Terminal',
    location: 'Transit Plaza & Grand Concourse',
    latitude: 37.7812,
    longitude: -122.4089,
    approaches: [
      { direction: 'Northbound', lanes: 4, hasTransitLane: true, priorityPhase: 1 },
      { direction: 'Southbound', lanes: 3, hasTransitLane: true, priorityPhase: 1 },
      { direction: 'Eastbound', lanes: 2, hasTransitLane: true, priorityPhase: 3 },
      { direction: 'Westbound', lanes: 2, hasTransitLane: false, priorityPhase: 2 },
    ],
  },
  {
    id: 'INT003',
    name: 'Railway Station Junction',
    location: 'Station Boulevard & Commerce Way',
    latitude: 37.7685,
    longitude: -122.4285,
    approaches: [
      { direction: 'Northbound', lanes: 3, hasTransitLane: false, priorityPhase: 2 },
      { direction: 'Southbound', lanes: 3, hasTransitLane: true, priorityPhase: 1 },
      { direction: 'Eastbound', lanes: 3, hasTransitLane: true, priorityPhase: 1 },
      { direction: 'Westbound', lanes: 3, hasTransitLane: false, priorityPhase: 2 },
    ],
  },
  {
    id: 'INT004',
    name: 'College Road Junction',
    location: 'University Avenue & Science Parkway',
    latitude: 37.7891,
    longitude: -122.4152,
    approaches: [
      { direction: 'Northbound', lanes: 2, hasTransitLane: false, priorityPhase: 2 },
      { direction: 'Southbound', lanes: 2, hasTransitLane: false, priorityPhase: 2 },
      { direction: 'Eastbound', lanes: 2, hasTransitLane: true, priorityPhase: 1 },
      { direction: 'Westbound', lanes: 2, hasTransitLane: true, priorityPhase: 1 },
    ],
  },
  {
    id: 'INT005',
    name: 'Main Hospital Junction',
    location: 'Health Sciences Drive & Civic Center Road',
    latitude: 37.7621,
    longitude: -122.4354,
    approaches: [
      { direction: 'Northbound', lanes: 3, hasTransitLane: true, priorityPhase: 1 },
      { direction: 'Southbound', lanes: 3, hasTransitLane: false, priorityPhase: 2 },
      { direction: 'Eastbound', lanes: 2, hasTransitLane: false, priorityPhase: 3 },
      { direction: 'Westbound', lanes: 2, hasTransitLane: false, priorityPhase: 3 },
    ],
  },
  {
    id: 'INT006',
    name: 'Technology Park Junction',
    location: 'Innovation Boulevard & Silicon Expressway',
    latitude: 37.7562,
    longitude: -122.3987,
    approaches: [
      { direction: 'Northbound', lanes: 4, hasTransitLane: true, priorityPhase: 1 },
      { direction: 'Southbound', lanes: 4, hasTransitLane: true, priorityPhase: 1 },
      { direction: 'Eastbound', lanes: 3, hasTransitLane: false, priorityPhase: 2 },
      { direction: 'Westbound', lanes: 3, hasTransitLane: false, priorityPhase: 2 },
    ],
  },
];

export const DEMO_BUS_ROUTES: BusRoute[] = [
  {
    id: 'R10',
    route_name: 'Central Market to Bus Terminal',
    color: '#0284c7', // Electric Blue
    start_point: 'Central Market Junction',
    end_point: 'City Bus Terminal',
    average_occupancy: 48,
  },
  {
    id: 'R15',
    route_name: 'Railway Station to Technology Park',
    color: '#06b6d4', // Cyan
    start_point: 'Railway Station Junction',
    end_point: 'Technology Park Junction',
    average_occupancy: 56,
  },
  {
    id: 'R20',
    route_name: 'College Road to Main Hospital',
    color: '#10b981', // Emerald
    start_point: 'College Road Junction',
    end_point: 'Main Hospital Junction',
    average_occupancy: 42,
  },
];

export const DEMO_BUS_STOPS: BusStop[] = [
  // R10 Stops
  { id: 'STP-101', route_id: 'R10', stop_name: 'Central Market North', latitude: 37.7752, longitude: -122.4190, stop_sequence: 1 },
  { id: 'STP-102', route_id: 'R10', stop_name: 'Market & 6th St', latitude: 37.7770, longitude: -122.4150, stop_sequence: 2 },
  { id: 'STP-103', route_id: 'R10', stop_name: 'Civic Plaza Express', latitude: 37.7790, longitude: -122.4120, stop_sequence: 3 },
  { id: 'STP-104', route_id: 'R10', stop_name: 'Bus Terminal Bay 3', latitude: 37.7812, longitude: -122.4089, stop_sequence: 4 },

  // R15 Stops
  { id: 'STP-151', route_id: 'R15', stop_name: 'Station Square West', latitude: 37.7682, longitude: -122.4280, stop_sequence: 1 },
  { id: 'STP-152', route_id: 'R15', stop_name: 'Design District Concourse', latitude: 37.7640, longitude: -122.4180, stop_sequence: 2 },
  { id: 'STP-153', route_id: 'R15', stop_name: 'Pier 50 Gateway', latitude: 37.7590, longitude: -122.4080, stop_sequence: 3 },
  { id: 'STP-154', route_id: 'R15', stop_name: 'Tech Campus Entrance', latitude: 37.7562, longitude: -122.3987, stop_sequence: 4 },

  // R20 Stops
  { id: 'STP-201', route_id: 'R20', stop_name: 'University Quad Stop', latitude: 37.7891, longitude: -122.4152, stop_sequence: 1 },
  { id: 'STP-202', route_id: 'R20', stop_name: 'Community College Hall', latitude: 37.7820, longitude: -122.4210, stop_sequence: 2 },
  { id: 'STP-203', route_id: 'R20', stop_name: 'Valley Clinic Hub', latitude: 37.7710, longitude: -122.4290, stop_sequence: 3 },
  { id: 'STP-204', route_id: 'R20', stop_name: 'Hospital Trauma Center', latitude: 37.7621, longitude: -122.4354, stop_sequence: 4 },
];

export const DEMO_BUSES: Bus[] = [
  // 4 buses on R10
  {
    id: 'BUS-101',
    route_id: 'R10',
    latitude: 37.7761,
    longitude: -122.4172,
    occupancy: 54,
    speed: 24.5,
    status: 'in-transit',
  },
  {
    id: 'BUS-102',
    route_id: 'R10',
    latitude: 37.7749,
    longitude: -122.4194,
    occupancy: 62,
    speed: 0.0,
    status: 'approaching-signal',
  },
  {
    id: 'BUS-103',
    route_id: 'R10',
    latitude: 37.7802,
    longitude: -122.4105,
    occupancy: 38,
    speed: 18.2,
    status: 'in-transit',
  },
  {
    id: 'BUS-104',
    route_id: 'R10',
    latitude: 37.7812,
    longitude: -122.4089,
    occupancy: 45,
    speed: 0.0,
    status: 'at-stop',
  },

  // 4 buses on R15
  {
    id: 'BUS-151',
    route_id: 'R15',
    latitude: 37.7665,
    longitude: -122.4230,
    occupancy: 65,
    speed: 0.0,
    status: 'delayed',
  },
  {
    id: 'BUS-152',
    route_id: 'R15',
    latitude: 37.7615,
    longitude: -122.4135,
    occupancy: 58,
    speed: 28.0,
    status: 'in-transit',
  },
  {
    id: 'BUS-153',
    route_id: 'R15',
    latitude: 37.7570,
    longitude: -122.4020,
    occupancy: 49,
    speed: 12.4,
    status: 'approaching-signal',
  },
  {
    id: 'BUS-154',
    route_id: 'R15',
    latitude: 37.7562,
    longitude: -122.3987,
    occupancy: 52,
    speed: 0.0,
    status: 'at-stop',
  },

  // 4 buses on R20
  {
    id: 'BUS-201',
    route_id: 'R20',
    latitude: 37.7850,
    longitude: -122.4180,
    occupancy: 46,
    speed: 21.0,
    status: 'in-transit',
  },
  {
    id: 'BUS-202',
    route_id: 'R20',
    latitude: 37.7780,
    longitude: -122.4240,
    occupancy: 51,
    speed: 0.0,
    status: 'delayed',
  },
  {
    id: 'BUS-203',
    route_id: 'R20',
    latitude: 37.7690,
    longitude: -122.4310,
    occupancy: 36,
    speed: 26.5,
    status: 'in-transit',
  },
  {
    id: 'BUS-204',
    route_id: 'R20',
    latitude: 37.7621,
    longitude: -122.4354,
    occupancy: 39,
    speed: 0.0,
    status: 'approaching-signal',
  },
];

export const DEMO_SIGNAL_PLANS: SignalPlan[] = [
  {
    id: 'SIG-INT001-BASE',
    intersection_id: 'INT001',
    scenario: 'baseline',
    cycle_length: 100,
    phases: [
      { id: 'P1', name: 'North-South Transit Corridor', duration_seconds: 40, is_transit_priority: true, green_split: 40 },
      { id: 'P2', name: 'East-West General Traffic', duration_seconds: 35, is_transit_priority: false, green_split: 35 },
      { id: 'P3', name: 'Protected Left Turns', duration_seconds: 15, is_transit_priority: false, green_split: 15 },
      { id: 'P4', name: 'Pedestrian Clearance', duration_seconds: 10, is_transit_priority: false, green_split: 10 },
    ],
  },
  {
    id: 'SIG-INT002-BASE',
    intersection_id: 'INT002',
    scenario: 'baseline',
    cycle_length: 110,
    phases: [
      { id: 'P1', name: 'Terminal Outbound Bus Lane', duration_seconds: 45, is_transit_priority: true, green_split: 41 },
      { id: 'P2', name: 'Grand Concourse Crossway', duration_seconds: 35, is_transit_priority: false, green_split: 32 },
      { id: 'P3', name: 'North Approach Left', duration_seconds: 15, is_transit_priority: false, green_split: 14 },
      { id: 'P4', name: 'All-Way Walk Stage', duration_seconds: 15, is_transit_priority: false, green_split: 13 },
    ],
  },
  {
    id: 'SIG-INT003-BASE',
    intersection_id: 'INT003',
    scenario: 'baseline',
    cycle_length: 90,
    phases: [
      { id: 'P1', name: 'Commerce Way Bus Bypass', duration_seconds: 35, is_transit_priority: true, green_split: 39 },
      { id: 'P2', name: 'Station Blvd Through', duration_seconds: 35, is_transit_priority: false, green_split: 39 },
      { id: 'P3', name: 'Station Turnaround', duration_seconds: 20, is_transit_priority: false, green_split: 22 },
    ],
  },
  {
    id: 'SIG-INT004-BASE',
    intersection_id: 'INT004',
    scenario: 'baseline',
    cycle_length: 90,
    phases: [
      { id: 'P1', name: 'Science Pkwy Transit Split', duration_seconds: 30, is_transit_priority: true, green_split: 33 },
      { id: 'P2', name: 'University Ave Through', duration_seconds: 40, is_transit_priority: false, green_split: 44 },
      { id: 'P3', name: 'Campus Pedestrian Priority', duration_seconds: 20, is_transit_priority: false, green_split: 23 },
    ],
  },
  {
    id: 'SIG-INT005-BASE',
    intersection_id: 'INT005',
    scenario: 'baseline',
    cycle_length: 120,
    phases: [
      { id: 'P1', name: 'Emergency & Bus Priority North', duration_seconds: 50, is_transit_priority: true, green_split: 42 },
      { id: 'P2', name: 'Civic Center Crossway', duration_seconds: 40, is_transit_priority: false, green_split: 33 },
      { id: 'P3', name: 'Hospital Access Loop', duration_seconds: 30, is_transit_priority: false, green_split: 25 },
    ],
  },
  {
    id: 'SIG-INT006-BASE',
    intersection_id: 'INT006',
    scenario: 'baseline',
    cycle_length: 100,
    phases: [
      { id: 'P1', name: 'Innovation Blvd Busway', duration_seconds: 40, is_transit_priority: true, green_split: 40 },
      { id: 'P2', name: 'Silicon Expressway Flow', duration_seconds: 45, is_transit_priority: false, green_split: 45 },
      { id: 'P3', name: 'Tech Campus Shuttle Turn', duration_seconds: 15, is_transit_priority: false, green_split: 15 },
    ],
  },
];

export const DEMO_DELAY_REPORTS: DelayReport[] = [
  {
    id: 'REP-001',
    route_id: 'R10',
    intersection_id: 'INT001',
    stop_id: 'STP-101',
    severity: 4,
    time_of_day: 'Morning Peak',
    day_type: 'Weekday',
    comment: 'Bus R10 with over 55 passengers was held at red signal for 78 seconds while empty cross-street had green. We lost our train connection.',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'REP-002',
    route_id: 'R15',
    intersection_id: 'INT003',
    stop_id: 'STP-151',
    severity: 5,
    time_of_day: 'Morning Peak',
    day_type: 'Weekday',
    comment: 'Severe bottleneck outside Railway Station. 60+ commuters packed like sardines while signal cycle repeatedly gave only 18s green to the bus lane.',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'REP-003',
    route_id: 'R20',
    intersection_id: 'INT004',
    stop_id: 'STP-202',
    severity: 3,
    time_of_day: 'Midday',
    day_type: 'Weekday',
    comment: 'Signal does not detect approaching buses; the driver had to wait through full 90-second cycle twice during student dismissal.',
    created_at: new Date(Date.now() - 3600000 * 7).toISOString(),
  },
  {
    id: 'REP-004',
    route_id: 'R15',
    intersection_id: 'INT006',
    stop_id: 'STP-153',
    severity: 4,
    time_of_day: 'Evening Peak',
    day_type: 'Weekday',
    comment: 'Tech Park rush hour: express bus delayed 8 minutes over just two signal cycles. Over 50 people delayed on a single vehicle.',
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'REP-005',
    route_id: 'R10',
    intersection_id: 'INT002',
    stop_id: 'STP-104',
    severity: 2,
    time_of_day: 'Midday',
    day_type: 'Weekend',
    comment: 'Terminal exit queue builds up quickly when signal timing reverts to fixed vehicle-count splits instead of priority green.',
    created_at: new Date(Date.now() - 3600000 * 28).toISOString(),
  },
];

export const DEMO_SCENARIOS: Scenario[] = [
  {
    id: 'SCEN-001',
    name: 'Citywide Transit Priority Baseline',
    description: 'Current fixed-time signal configuration across all 6 core urban junctions without person-delay optimization.',
    baseline_metrics: {
      average_bus_delay_sec: 42.5,
      person_delay_hours: 312.4,
      people_moved_per_green_sec: 1.18,
      general_traffic_delay_sec: 28.2,
    },
    optimized_metrics: {
      // Empty or unrun in Phase 1
    },
    signal_plans: DEMO_SIGNAL_PLANS,
  },
];
