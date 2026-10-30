/**
 * PrioritySignal - Deterministic Traffic Simulation Engine
 * 
 * Objective: Calculate bus delay, passenger person-delay, car traffic delay,
 * and person-throughput per green second based on deterministic physics
 * and signal phase splits.
 * 
 * Independent of UI and Gemini.
 */

import {
  Intersection,
  BusRoute,
  Bus,
  SignalPlan,
  SimulationParameters,
  SimulationResult,
  IntersectionSimulationMetric,
  RouteSimulationMetric,
  DelayReport,
} from '../types';

export interface BusArrivalEvent {
  busId: string;
  routeId: string;
  intersectionId: string;
  arrivalTimeInCycle: number; // seconds (0 to cycle_length)
  occupancy: number;
  phaseId: string;
  isGreen: boolean;
  delaySeconds: number;
}

/**
 * Calculates uniform signal delay for a movement given arrival time and green window
 */
export function calculatePhaseDelay(
  arrivalSec: number,
  cycleLength: number,
  greenStart: number,
  greenEnd: number
): { isGreen: boolean; delaySec: number } {
  // Normalize arrival time within [0, cycleLength)
  const normArrival = ((arrivalSec % cycleLength) + cycleLength) % cycleLength;

  if (greenStart <= greenEnd) {
    if (normArrival >= greenStart && normArrival < greenEnd) {
      return { isGreen: true, delaySec: 0 };
    }
    // Waiting for next greenStart
    const wait = normArrival < greenStart
      ? greenStart - normArrival
      : cycleLength - normArrival + greenStart;
    return { isGreen: false, delaySec: wait };
  } else {
    // Green wraps around cycle boundary (e.g., start 80, end 20 in 90s cycle)
    if (normArrival >= greenStart || normArrival < greenEnd) {
      return { isGreen: true, delaySec: 0 };
    }
    const wait = greenStart - normArrival;
    return { isGreen: false, delaySec: wait };
  }
}

/**
 * Synthetic car traffic delay calculation based on Webster's uniform delay formula:
 * d = 0.5 * C * (1 - g/C)^2 / (1 - (q/s) * (g/C))
 * where C = cycle length, g = green split, q = arrival rate, s = saturation flow
 */
export function calculateCarApproachDelay(
  cycleLength: number,
  greenDuration: number,
  arrivalRateVehPerHour: number = 650,
  saturationFlowVehPerHour: number = 1800
): number {
  if (cycleLength <= 0 || greenDuration <= 0) return cycleLength;
  const gRatio = Math.min(0.9, Math.max(0.1, greenDuration / cycleLength));
  const qRatio = arrivalRateVehPerHour / 3600;
  const sRatio = saturationFlowVehPerHour / 3600;
  const degreeOfSaturation = Math.min(0.95, qRatio / (sRatio * gRatio));

  const uniformDelay = (0.5 * cycleLength * Math.pow(1 - gRatio, 2)) / Math.max(0.05, (1 - degreeOfSaturation * gRatio));
  return Math.max(4, Math.min(120, uniformDelay));
}

/**
 * Run deterministic simulation for given parameters, intersections, routes, and signal plans
 */
export function runSimulation(
  params: SimulationParameters,
  intersections: Intersection[],
  routes: BusRoute[],
  buses: Bus[],
  signalPlans: SignalPlan[],
  delayReports: DelayReport[] = []
): SimulationResult {
  const activeIntersections = intersections.filter((i) =>
    params.intersections.length === 0 || params.intersections.includes(i.id)
  );
  const activeRoutes = routes.filter((r) =>
    params.routes.length === 0 || params.routes.includes(r.id)
  );

  const busArrivalEvents: BusArrivalEvent[] = [];
  const intersectionMetricsMap: Record<string, IntersectionSimulationMetric> = {};
  const routeMetricsMap: Record<string, RouteSimulationMetric> = {};

  // Initialize intersection metrics
  for (const intNode of activeIntersections) {
    intersectionMetricsMap[intNode.id] = {
      intersectionId: intNode.id,
      intersectionName: intNode.name,
      busDelaySeconds: 0,
      personDelayHours: 0,
      carDelaySeconds: 0,
      peopleMovedPerGreenSec: 0,
      busesProcessed: 0,
    };
  }

  // Initialize route metrics
  for (const route of activeRoutes) {
    routeMetricsMap[route.id] = {
      routeId: route.id,
      routeName: route.route_name,
      busDelaySeconds: 0,
      personDelayHours: 0,
      averageSpeedKmH: 22.0,
      busesActive: buses.filter((b) => b.route_id === route.id).length,
    };
  }

  let totalBusDelaySec = 0;
  let totalPersonDelaySec = 0;
  let totalBusesProcessed = 0;
  let totalGreenSeconds = 0;
  let totalPersonsMoved = 0;
  let weightedCarDelaySum = 0;

  // Simulate each bus along its corridor
  for (const bus of buses) {
    if (!activeRoutes.some((r) => r.id === bus.route_id)) continue;

    // Deterministic arrival sequence through active intersections on route
    // Bus headway: 10-15 minute intervals; arrival offsets derived deterministically from bus ID
    const busNum = parseInt(bus.id.replace(/\D/g, '') || '101', 10);
    const busOffsetBase = (busNum * 17) % 120;

    for (let i = 0; i < activeIntersections.length; i++) {
      const intNode = activeIntersections[i];
      const plan = signalPlans.find((p) => p.intersection_id === intNode.id) || {
        id: `DEFAULT-${intNode.id}`,
        intersection_id: intNode.id,
        scenario: 'baseline',
        cycle_length: 90,
        phases: [
          { id: 'P1', name: 'North-South Transit', duration_seconds: 35, is_transit_priority: true, green_split: 39 },
          { id: 'P2', name: 'East-West General', duration_seconds: 45, is_transit_priority: false, green_split: 50 },
          { id: 'P3', name: 'All-Red Clearance', duration_seconds: 10, is_transit_priority: false, green_split: 11 },
        ],
      };

      const cycleLength = plan.cycle_length || 90;

      // Identify the phase serving this bus approach
      let transitPhase = plan.phases.find((p) => p.is_transit_priority) || plan.phases[0];
      let transitGreenStart = 0;
      for (const p of plan.phases) {
        if (p.id === transitPhase.id) break;
        transitGreenStart += p.duration_seconds;
      }
      const transitGreenEnd = transitGreenStart + transitPhase.duration_seconds;

      // Bus arrives at intersection: deterministic travel time + offset
      const arrivalSec = (busOffsetBase + i * 42) % cycleLength;
      const { isGreen, delaySec } = calculatePhaseDelay(
        arrivalSec,
        cycleLength,
        transitGreenStart,
        transitGreenEnd
      );

      // Core person-delay calculation: passengerOccupancy * delaySeconds
      const personDelay = bus.occupancy * delaySec;

      busArrivalEvents.push({
        busId: bus.id,
        routeId: bus.route_id,
        intersectionId: intNode.id,
        arrivalTimeInCycle: arrivalSec,
        occupancy: bus.occupancy,
        phaseId: transitPhase.id,
        isGreen,
        delaySeconds: delaySec,
      });

      totalBusDelaySec += delaySec;
      totalPersonDelaySec += personDelay;
      totalBusesProcessed++;
      totalPersonsMoved += bus.occupancy;

      // Update intersection aggregate
      const intMetric = intersectionMetricsMap[intNode.id];
      if (intMetric) {
        intMetric.busDelaySeconds += delaySec;
        intMetric.personDelayHours += personDelay / 3600;
        intMetric.busesProcessed++;
      }

      // Update route aggregate
      const routeMetric = routeMetricsMap[bus.route_id];
      if (routeMetric) {
        routeMetric.busDelaySeconds += delaySec;
        routeMetric.personDelayHours += personDelay / 3600;
      }
    }
  }

  // Calculate car delays and person throughput per green second for each intersection
  for (const intNode of activeIntersections) {
    const plan = signalPlans.find((p) => p.intersection_id === intNode.id);
    const cycleLength = plan?.cycle_length || 90;
    const nonTransitPhases = plan?.phases.filter((p) => !p.is_transit_priority) || [];
    const transitPhase = plan?.phases.find((p) => p.is_transit_priority);

    const nonTransitGreenSec = nonTransitPhases.reduce((s, p) => s + p.duration_seconds, 0);
    const transitGreenSec = transitPhase ? transitPhase.duration_seconds : 35;

    totalGreenSeconds += transitGreenSec;

    // Cross-street car delay
    const carDelay = calculateCarApproachDelay(cycleLength, nonTransitGreenSec);
    weightedCarDelaySum += carDelay;

    const intMetric = intersectionMetricsMap[intNode.id];
    if (intMetric) {
      intMetric.carDelaySeconds = Math.round(carDelay * 10) / 10;
      intMetric.busDelaySeconds = intMetric.busesProcessed > 0
        ? Math.round((intMetric.busDelaySeconds / intMetric.busesProcessed) * 10) / 10
        : 0;
      intMetric.personDelayHours = Math.round(intMetric.personDelayHours * 10) / 10;

      // Persons moved per transit green second
      const paxOnJunction = busArrivalEvents
        .filter((e) => e.intersectionId === intNode.id)
        .reduce((sum, e) => sum + e.occupancy, 0);
      intMetric.peopleMovedPerGreenSec = transitGreenSec > 0
        ? Math.round((paxOnJunction / transitGreenSec) * 100) / 100
        : 0;
    }
  }

  // Finalize route metrics
  for (const rId in routeMetricsMap) {
    const rm = routeMetricsMap[rId];
    const busesOnRoute = buses.filter((b) => b.route_id === rId);
    if (busesOnRoute.length > 0) {
      rm.busDelaySeconds = Math.round((rm.busDelaySeconds / busesOnRoute.length) * 10) / 10;
      rm.personDelayHours = Math.round(rm.personDelayHours * 10) / 10;
      // Speed degradation based on delay
      rm.averageSpeedKmH = Math.max(12, Math.round((28 - (rm.busDelaySeconds * 0.15)) * 10) / 10);
    }
  }

  const avgBusDelay = totalBusesProcessed > 0 ? totalBusDelaySec / totalBusesProcessed : 0;
  const avgPersonDelayPerTrip = totalBusesProcessed > 0 ? (totalPersonDelaySec / totalBusesProcessed) : 0;
  const avgCarDelay = activeIntersections.length > 0 ? weightedCarDelaySum / activeIntersections.length : 0;
  const overallPeopleMovedPerGreenSec = totalGreenSeconds > 0
    ? Math.round((totalPersonsMoved / totalGreenSeconds) * 100) / 100
    : 1.18;

  return {
    totalBusDelaySeconds: Math.round(totalBusDelaySec),
    averageBusDelaySeconds: Math.round(avgBusDelay * 10) / 10,
    totalPersonDelayHours: Math.round((totalPersonDelaySec / 3600) * 10) / 10,
    averagePersonDelayPerBusTripSeconds: Math.round(avgPersonDelayPerTrip * 10) / 10,
    estimatedAverageBusTravelTimeMinutes: Math.round((14.5 + avgBusDelay / 60) * 10) / 10,
    generalCarDelaySeconds: Math.round(avgCarDelay * 10) / 10,
    peopleMovedPerGreenSec: overallPeopleMovedPerGreenSec,
    routeMetrics: Object.values(routeMetricsMap),
    intersectionMetrics: Object.values(intersectionMetricsMap),
    timestamp: new Date().toISOString(),
  };
}
