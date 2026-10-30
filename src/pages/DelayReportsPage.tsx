import React, { useState } from 'react';
import { DelayReport, Intersection, BusRoute, DelayHotspot } from '../types';
import { DemoDataNotice } from '../components/DemoDataNotice';
import { computeDelayHotspots } from '../server/optimizationEngine';
import {
  MessageSquareWarning,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  Calendar,
  AlertTriangle,
  Flame,
  ArrowUpDown,
  List,
  MapPin,
  ExternalLink,
} from 'lucide-react';

interface DelayReportsPageProps {
  reports: DelayReport[];
  intersections: Intersection[];
  routes: BusRoute[];
  onAddReport?: (report: DelayReport) => void;
  onNavigateToPublicForm?: () => void;
}

export const DelayReportsPage: React.FC<DelayReportsPageProps> = ({
  reports,
  intersections,
  routes,
  onAddReport,
  onNavigateToPublicForm,
}) => {
  const [selectedRoute, setSelectedRoute] = useState<string>('all');
  const [selectedIntersection, setSelectedIntersection] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedDayType, setSelectedDayType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recency' | 'severity'>('recency');
  const [viewMode, setViewMode] = useState<'reports' | 'hotspots'>('reports');

  // Compute summary metrics
  const totalReports = reports.length;
  const avgSeverity = totalReports > 0
    ? Math.round((reports.reduce((s, r) => s + r.severity, 0) / totalReports) * 10) / 10
    : 0;

  // Most reported intersection
  const intCounts: Record<string, number> = {};
  const routeCounts: Record<string, number> = {};
  const timeCounts: Record<string, number> = {};

  reports.forEach((r) => {
    intCounts[r.intersection_id] = (intCounts[r.intersection_id] || 0) + 1;
    routeCounts[r.route_id] = (routeCounts[r.route_id] || 0) + 1;
    timeCounts[r.time_of_day] = (timeCounts[r.time_of_day] || 0) + 1;
  });

  const topIntId = Object.keys(intCounts).sort((a, b) => intCounts[b] - intCounts[a])[0];
  const topIntersection = intersections.find((i) => i.id === topIntId);

  const topRouteId = Object.keys(routeCounts).sort((a, b) => routeCounts[b] - routeCounts[a])[0];
  const topRoute = routes.find((r) => r.id === topRouteId);

  const peakTimeWindow = Object.keys(timeCounts).sort((a, b) => timeCounts[b] - timeCounts[a])[0] || 'Morning Peak';

  // Spatial Hotspots
  const hotspots = computeDelayHotspots(reports, intersections);

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    if (selectedRoute !== 'all' && r.route_id !== selectedRoute) return false;
    if (selectedIntersection !== 'all' && r.intersection_id !== selectedIntersection) return false;
    if (selectedSeverity !== 'all' && r.severity !== parseInt(selectedSeverity, 10)) return false;
    if (selectedDayType !== 'all' && r.day_type !== selectedDayType) return false;
    return true;
  });

  // Sorted reports
  const sortedReports = [...filteredReports].sort((a, b) => {
    if (sortBy === 'severity') {
      return b.severity - a.severity;
    }
    return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Commuter Delay Reports Dashboard
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-950 text-cyan-400 border border-sky-800">
              COMMUNITY FEEDBACK
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Crowdsourced bottleneck reports informing the passenger person-delay optimization engine.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <DemoDataNotice />
          {onNavigateToPublicForm && (
            <button
              onClick={onNavigateToPublicForm}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public /delay-report Form</span>
            </button>
          )}
        </div>
      </div>

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">Total Reports</span>
          <div className="text-2xl font-mono font-bold text-white tabular-nums">{totalReports}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Logged commuter records</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">Average Severity</span>
          <div className="text-2xl font-mono font-bold text-amber-400 tabular-nums">
            {avgSeverity} <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Weighted passenger impact</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">Top Bottleneck Junction</span>
          <div className="text-sm font-bold text-rose-300 truncate">
            {topIntersection ? topIntersection.name : 'Central Market'}
          </div>
          <span className="text-[11px] font-mono text-slate-400 mt-1 block">
            {intCounts[topIntId] || 0} reports logged
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">Peak Delay Window</span>
          <div className="text-sm font-bold text-cyan-300">{peakTimeWindow}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Highest passenger concentration</span>
        </div>
      </div>

      {/* Mode Selector & Filter Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Tab Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('reports')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                viewMode === 'reports' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Individual Reports ({sortedReports.length})
            </button>
            <button
              onClick={() => setViewMode('hotspots')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-colors ${
                viewMode === 'hotspots' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Delay Hotspots ({hotspots.length})</span>
            </button>
          </div>

          {/* Sort By Toggle */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recency' | 'severity')}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="recency">Most Recent First</option>
              <option value="severity">Highest Severity First</option>
            </select>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>Route:</span>
            <select
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-slate-200"
            >
              <option value="all">All Routes</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id}: {r.route_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Intersection:</span>
            <select
              value={selectedIntersection}
              onChange={(e) => setSelectedIntersection(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-slate-200"
            >
              <option value="all">All Intersections</option>
              {intersections.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.id} — {i.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Severity:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-slate-200"
            >
              <option value="all">All Severities</option>
              <option value="5">Severity 5</option>
              <option value="4">Severity 4</option>
              <option value="3">Severity 3</option>
              <option value="2">Severity 2</option>
              <option value="1">Severity 1</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Day Type:</span>
            <select
              value={selectedDayType}
              onChange={(e) => setSelectedDayType(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-slate-200"
            >
              <option value="all">All Days</option>
              <option value="Weekday">Weekday</option>
              <option value="Weekend">Weekend</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'reports' ? (
        <div className="space-y-3">
          {sortedReports.map((report) => {
            const intersection = intersections.find((i) => i.id === report.intersection_id);
            const route = routes.find((r) => r.id === report.route_id);

            return (
              <div
                key={report.id}
                className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: route?.color || '#0284c7' }}
                    />
                    <span className="font-mono font-bold text-white text-sm">
                      {report.route_id}
                    </span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-300 font-semibold text-xs">
                      {intersection?.name || report.intersection_id}
                    </span>
                    <span className="text-slate-500 text-xs">
                      ({intersection?.location || ''})
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400">
                      {report.time_of_day} · {report.day_type}
                    </span>
                    <span
                      className={`font-mono text-xs px-2 py-0.5 rounded font-bold ${
                        report.severity >= 4
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                          : report.severity === 3
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                          : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                      }`}
                    >
                      Severity {report.severity}/5
                    </span>
                  </div>
                </div>

                <p className="text-slate-200 text-sm leading-relaxed mt-2 italic">
                  "{report.comment}"
                </p>

                <div className="mt-3 pt-3 border-t border-slate-800/70 flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>Report ID: {report.id}</span>
                  <span>
                    Timestamp: {new Date(report.created_at || '').toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Delay Hotspots Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hotspots.map((hotspot, idx) => (
            <div
              key={hotspot.intersectionId}
              className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-950 text-cyan-400 font-bold border border-slate-800">
                    Rank #{idx + 1}
                  </span>
                  <h3 className="text-sm font-bold text-white">{hotspot.intersectionName}</h3>
                </div>
                <div className="flex items-center gap-1 text-amber-400 font-mono text-xs font-bold">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Score: {hotspot.hotspotScore}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Report Volume</span>
                  <span className="font-bold text-white">{hotspot.reportCount} reports</span>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Avg Severity</span>
                  <span className="font-bold text-rose-400">{hotspot.averageSeverity} / 5.0</span>
                </div>
              </div>

              {hotspot.recentComments.length > 0 && (
                <div className="text-[11.5px] text-slate-400 italic bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
                  "{hotspot.recentComments[0]}"
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
