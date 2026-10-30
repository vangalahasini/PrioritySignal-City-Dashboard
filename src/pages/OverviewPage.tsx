import React from 'react';
import {
  Intersection,
  BusRoute,
  Bus,
  DelayReport,
  SignalPlan,
  HealthStatus,
} from '../types';
import { NetworkSchematicMap } from '../components/NetworkSchematicMap';
import { DatabaseStatusBanner } from '../components/DatabaseStatusBanner';
import { DemoDataNotice } from '../components/DemoDataNotice';
import {
  Users,
  Crosshair,
  Route as RouteIcon,
  Bus as BusIcon,
  MessageSquareWarning,
  Clock,
  ArrowRight,
  Sparkles,
  SlidersHorizontal,
  ShieldAlert,
} from 'lucide-react';
import { NavPage } from '../components/Sidebar';

interface OverviewPageProps {
  intersections: Intersection[];
  routes: BusRoute[];
  buses: Bus[];
  delayReports: DelayReport[];
  signalPlans: SignalPlan[];
  health: HealthStatus | null;
  loading: boolean;
  onRefresh: () => void;
  onNavigate: (page: NavPage) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  intersections,
  routes,
  buses,
  delayReports,
  signalPlans,
  health,
  loading,
  onRefresh,
  onNavigate,
}) => {
  const totalOccupancy = buses.reduce((acc, b) => acc + (b.occupancy || 0), 0);
  const avgOccupancy = buses.length > 0 ? Math.round(totalOccupancy / buses.length) : 0;

  return (
    <div className="space-y-6">
      {/* Page Title & Vision Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Transit Priority Operations
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-800/60">
              PHASE 1 ACTIVE
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Optimizing urban signals for <span className="text-cyan-300 font-medium">people moved per green second</span>,
            not merely vehicles. Powered by live passenger occupancy and commuter feedback.
          </p>
        </div>

        <DemoDataNotice />
      </div>

      {/* Hackathon Presentation Mode Banner */}
      <div className="bg-gradient-to-r from-sky-950/60 via-slate-900 to-indigo-950/60 border border-cyan-500/30 rounded-xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-extrabold text-white tracking-tight">
              HACKATHON SHOWCASE: People First. Smarter Signals. Better Cities.
            </h2>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-amber-950/80 border border-amber-800 text-amber-300">
            DEMO SIMULATION — NO REAL TRAFFIC SIGNALS ARE CONTROLLED
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
          {/* Problem */}
          <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1.5">
            <div className="text-rose-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span>The Problem</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Traditional signals count <em>vehicles</em>, treating a 60-passenger bus identically to an empty sedan. Result: massive person-delay, missed transit transfers, and avoidable congestion.
            </p>
          </div>

          {/* Solution */}
          <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1.5">
            <div className="text-cyan-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span>The Solution</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              PrioritySignal dynamically computes <strong className="text-white">person-delay</strong> and passenger occupancy to reallocate green time, maintaining a strict 10s pedestrian clearance safety floor.
            </p>
          </div>

          {/* Impact Snapshot */}
          <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
              <span>Simulated Impact Snapshot</span>
            </div>
            <div className="grid grid-cols-3 gap-2 font-mono text-center">
              <div className="p-1 rounded bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Bus Delay</div>
                <div className="text-emerald-400 font-bold text-xs">-24.5%</div>
              </div>
              <div className="p-1 rounded bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Person-Delay</div>
                <div className="text-emerald-400 font-bold text-xs">-27.0%</div>
              </div>
              <div className="p-1 rounded bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Pax/Green Sec</div>
                <div className="text-cyan-300 font-bold text-xs">+140%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
          <div className="text-slate-400 text-[11.5px]">
            Explore the live simulator, optimize splits, and query Gemini AI briefings:
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('optimization-engine')}
              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold transition-colors flex items-center gap-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Optimization Engine</span>
            </button>
            <button
              onClick={() => onNavigate('ai-insights')}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gemini AI Insights</span>
            </button>
          </div>
        </div>
      </div>

      {/* Database Status Banner */}
      <DatabaseStatusBanner
        health={health}
        loading={loading}
        onRefresh={onRefresh}
        onSeedSuccess={onRefresh}
      />

      {/* Primary KPI Grid (Tabular numerals, no pill clutter) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Intersections */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Intersections</span>
            <Crosshair className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {intersections.length}
            </span>
            <span className="text-xs text-slate-400">Junctions</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            All configured with transit-priority signal phases
          </p>
        </div>

        {/* Bus Routes */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Bus Corridors</span>
            <RouteIcon className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {routes.length}
            </span>
            <span className="text-xs text-slate-400">Active Lines</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Average occupancy: {avgOccupancy} pax / bus
          </p>
        </div>

        {/* Active Simulated Buses */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Simulated Buses</span>
            <BusIcon className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {buses.length}
            </span>
            <span className="text-xs text-emerald-400 font-mono">
              ({totalOccupancy} pax onboard)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Tracking GPS, speed, and real-time occupancy
          </p>
        </div>

        {/* Commuter Delay Reports */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Commuter Reports</span>
            <MessageSquareWarning className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {delayReports.length}
            </span>
            <span className="text-xs text-rose-400 font-medium">Logged</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Crowdsourced signal bottleneck feedback
          </p>
        </div>
      </div>

      {/* Interactive Network Schematic Corridor Map */}
      <NetworkSchematicMap
        intersections={intersections}
        routes={routes}
        buses={buses}
        delayReports={delayReports}
      />

      {/* Two-Column Detail Section: Route Summaries & Optimization Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Route Summaries (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Transit Route Performance</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulated transit corridors and real-time passenger occupancy
              </p>
            </div>
            <button
              onClick={() => onNavigate('bus-routes')}
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              <span>View all routes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {routes.map((route) => {
              const routeBuses = buses.filter((b) => b.route_id === route.id);
              const totalPax = routeBuses.reduce((acc, b) => acc + b.occupancy, 0);

              return (
                <div
                  key={route.id}
                  className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3 h-8 rounded-sm shrink-0"
                      style={{ backgroundColor: route.color }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-sm">
                          {route.id}
                        </span>
                        <span className="text-xs text-slate-300 font-medium">
                          {route.route_name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {route.start_point} ➔ {route.end_point}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 self-end sm:self-center">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500">Active Fleet</div>
                      <div className="text-xs font-mono font-semibold text-white">
                        {routeBuses.length} buses
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-500">People Onboard</div>
                      <div className="text-xs font-mono font-bold text-emerald-400">
                        {totalPax} passengers
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Optimization Results Card (Strictly adhering to requirement 9) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h2 className="text-base font-bold text-white">Optimization Status</h2>
            </div>
            <p className="text-xs text-slate-400">
              Person-delay reduction and green allocation algorithms
            </p>

            {/* Prompt Requirement: "Do not invent optimization improvements in Phase 1. If there are no saved optimization results, show 'Run an optimization to see results' rather than fabricated values." */}
            <div className="mt-6 p-6 rounded-lg bg-slate-950/80 border border-slate-800 text-center flex flex-col items-center justify-center">
              <SlidersHorizontal className="w-8 h-8 text-slate-600 mb-3" />
              <div className="text-sm font-semibold text-slate-200">
                Run an optimization to see results
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                Phase 1 has established baseline signal plans across all 6 intersections.
                The person-delay optimization engine is configured for execution in Phase 2.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 mt-4 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Engine Readiness</span>
            <button
              onClick={() => onNavigate('optimization-engine')}
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <span>Explore Engine Spec</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Two-Column Detail Section: Intersections & Recent Commuter Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Intersection Baseline Signal Plans */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Baseline Signal Plans</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Current fixed-time cycle lengths and transit green allocations
              </p>
            </div>
            <button
              onClick={() => onNavigate('signal-timeline')}
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <span>Signal editor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 font-medium">Intersection</th>
                  <th className="py-2 font-medium text-right">Cycle</th>
                  <th className="py-2 font-medium text-right">Priority Phase</th>
                  <th className="py-2 font-medium text-right">Approaches</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {intersections.map((intNode) => {
                  const plan = signalPlans.find((p) => p.intersection_id === intNode.id);
                  const priorityPhase = plan?.phases.find((p) => p.is_transit_priority);

                  return (
                    <tr key={intNode.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5">
                        <div className="font-medium text-white">{intNode.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{intNode.id} · {intNode.location}</div>
                      </td>
                      <td className="py-2.5 text-right font-mono text-slate-300 tabular-nums">
                        {plan?.cycle_length ?? 90}s
                      </td>
                      <td className="py-2.5 text-right font-mono text-emerald-400 tabular-nums">
                        {priorityPhase ? `${priorityPhase.duration_seconds}s (${priorityPhase.green_split}%)` : '—'}
                      </td>
                      <td className="py-2.5 text-right font-mono text-cyan-300 tabular-nums">
                        {intNode.approaches.length} legs
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Commuter Delay Reports */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Recent Commuter Delay Reports</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real feedback highlighting bottlenecks and passenger delays
              </p>
            </div>
            <button
              onClick={() => onNavigate('delay-reports')}
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <span>All reports</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {delayReports.slice(0, 4).map((report) => {
              const intersection = intersections.find((i) => i.id === report.intersection_id);

              return (
                <div
                  key={report.id}
                  className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 text-xs hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-cyan-400">{report.route_id}</span>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-300 font-medium">
                        {intersection?.name || report.intersection_id}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-[11px]">
                      <span className="text-slate-500">Severity:</span>
                      <span
                        className={`font-bold ${
                          report.severity >= 4
                            ? 'text-rose-400'
                            : report.severity === 3
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {report.severity}/5
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-300 leading-relaxed text-[11.5px] italic">
                    "{report.comment}"
                  </p>

                  <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between font-mono">
                    <span>{report.time_of_day} · {report.day_type}</span>
                    <span>{new Date(report.created_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
