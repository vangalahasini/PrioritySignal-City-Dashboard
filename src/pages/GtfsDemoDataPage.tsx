import React, { useState } from 'react';
import {
  Intersection,
  BusRoute,
  Bus,
  DelayReport,
  SignalPlan,
  HealthStatus,
  GtfsValidationResult,
} from '../types';
import { DemoDataNotice } from '../components/DemoDataNotice';
import JSZip from 'jszip';
import {
  Database,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  FileCode,
  Upload,
  AlertTriangle,
  CheckCircle2,
  FileArchive,
  Download,
  Info,
} from 'lucide-react';

interface GtfsDemoDataPageProps {
  intersections: Intersection[];
  routes: BusRoute[];
  buses: Bus[];
  delayReports: DelayReport[];
  signalPlans: SignalPlan[];
  health: HealthStatus | null;
  onRefresh: () => void;
}

export const GtfsDemoDataPage: React.FC<GtfsDemoDataPageProps> = ({
  intersections,
  routes,
  buses,
  delayReports,
  signalPlans,
  health,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'buses' | 'intersections' | 'routes' | 'plans' | 'reports'>('buses');
  const [seeding, setSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // GTFS Import State
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message?: string;
    validation?: GtfsValidationResult;
    source?: string;
  } | null>(null);
  const [feedSource, setFeedSource] = useState<string>('SIMULATED DEMO DATA');

  const handleSeed = async () => {
    try {
      setSeeding(true);
      setSeedStatus(null);
      const res = await fetch('/api/seed', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setSeedStatus(`✓ ${json.message}`);
        setFeedSource('SIMULATED DEMO DATA');
        onRefresh();
      } else {
        setSeedStatus(`⚠ Error: ${json.message}`);
      }
    } catch (err) {
      setSeedStatus(`⚠ Request failed: ${(err as Error).message}`);
    } finally {
      setSeeding(false);
    }
  };

  // Handle GTFS file selection & upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      setImportResult({
        success: false,
        message: 'Invalid file format. Please upload a standard GTFS .zip archive.',
      });
      return;
    }

    try {
      setIsImporting(true);
      setImportResult(null);

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const res = await fetch('/api/gtfs/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64Zip: base64, filename: file.name }),
          });

          const json = await res.json();
          setImportResult(json);
          if (json.success) {
            setFeedSource('IMPORTED STATIC GTFS');
            onRefresh();
          }
        } catch (postErr) {
          setImportResult({
            success: false,
            message: `Upload request failed: ${(postErr as Error).message}`,
          });
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setImportResult({
        success: false,
        message: `Failed to read file: ${(err as Error).message}`,
      });
      setIsImporting(false);
    }
  };

  // Generate and download a sample test GTFS zip archive
  const handleDownloadSampleGtfs = async () => {
    const zip = new JSZip();
    zip.file(
      'agency.txt',
      'agency_id,agency_name,agency_url,agency_timezone\nMETRO,Metro City Transit,https://example.gov/transit,America/Los_Angeles\n'
    );
    zip.file(
      'routes.txt',
      'route_id,agency_id,route_short_name,route_long_name,route_type,route_color\nR10,METRO,R10,Central Market to Terminal Express,3,0284c7\nR15,METRO,R15,Railway to Tech Park Concourse,3,06b6d4\nR20,METRO,R20,University to Hospital Corridor,3,10b981\n'
    );
    zip.file(
      'stops.txt',
      'stop_id,stop_name,stop_lat,stop_lon\nSTP-101,Central Market North,37.7752,-122.4190\nSTP-102,Market & 6th St,37.7770,-122.4150\nSTP-103,Civic Plaza Express,37.7790,-122.4120\nSTP-104,Bus Terminal Bay 3,37.7812,-122.4089\n'
    );
    zip.file(
      'trips.txt',
      'route_id,service_id,trip_id,trip_headsign\nR10,WK,TRIP-101,Outbound Terminal\nR15,WK,TRIP-151,Tech Campus Concourse\n'
    );
    zip.file(
      'stop_times.txt',
      'trip_id,arrival_time,departure_time,stop_id,stop_sequence\nTRIP-101,08:00:00,08:00:30,STP-101,1\nTRIP-101,08:05:00,08:05:30,STP-102,2\nTRIP-101,08:10:00,08:10:30,STP-103,3\nTRIP-101,08:15:00,08:15:30,STP-104,4\n'
    );

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_metro_gtfs.zip';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copySqlMigrationCommand = () => {
    navigator.clipboard.writeText(`supabase/migrations/001_initial_schema.sql`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              GTFS & Demo Data Integration
            </h1>
            <span
              className={`text-xs font-mono px-2 py-0.5 rounded font-bold border ${
                feedSource === 'IMPORTED STATIC GTFS'
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60'
                  : 'bg-amber-950/80 text-amber-300 border-amber-700/60'
              }`}
            >
              {feedSource}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Static GTFS specification ZIP validator, synthetic transit corridors, and Supabase seeder.
          </p>
        </div>

        <DemoDataNotice />
      </div>

      {/* Static GTFS ZIP Upload Panel */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <FileArchive className="w-5 h-5 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">Import Static GTFS Archive (.zip)</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              Accepts standard static GTFS feeds containing <code className="text-cyan-300">agency.txt</code>, <code className="text-cyan-300">routes.txt</code>, <code className="text-cyan-300">trips.txt</code>, <code className="text-cyan-300">stops.txt</code>, and <code className="text-cyan-300">stop_times.txt</code>. Validates headers, data types, and trip-to-stop relational integrity.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadSampleGtfs}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
              title="Download verified standard sample GTFS .zip"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Sample GTFS ZIP</span>
            </button>

            <label className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm transition-all cursor-pointer">
              <Upload className={`w-3.5 h-3.5 ${isImporting ? 'animate-bounce' : ''}`} />
              <span>{isImporting ? 'Validating Feed...' : 'Upload GTFS ZIP'}</span>
              <input
                type="file"
                accept=".zip"
                disabled={isImporting}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Validation & Import Summary Feedback */}
        {importResult && (
          <div
            className={`p-4 rounded-xl border text-xs space-y-2 ${
              importResult.success
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              {importResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <span>{importResult.message}</span>
            </div>

            {importResult.validation?.summary && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-800/60 font-mono text-slate-200">
                <div className="p-2 bg-slate-950/60 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Agencies</span>
                  <span className="font-bold">{importResult.validation.summary.agencyCount}</span>
                </div>
                <div className="p-2 bg-slate-950/60 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Routes</span>
                  <span className="font-bold">{importResult.validation.summary.routesCount}</span>
                </div>
                <div className="p-2 bg-slate-950/60 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Trips</span>
                  <span className="font-bold">{importResult.validation.summary.tripsCount}</span>
                </div>
                <div className="p-2 bg-slate-950/60 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Stops</span>
                  <span className="font-bold">{importResult.validation.summary.stopsCount}</span>
                </div>
                <div className="p-2 bg-slate-950/60 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Stop Times</span>
                  <span className="font-bold">{importResult.validation.summary.stopTimesCount}</span>
                </div>
              </div>
            )}

            {importResult.validation?.errors && importResult.validation.errors.length > 0 && (
              <div className="pt-2 text-rose-300 space-y-1">
                <strong>Validation Errors:</strong>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  {importResult.validation.errors.map((e, idx) => (
                    <li key={idx}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            {importResult.validation?.warnings && importResult.validation.warnings.length > 0 && (
              <div className="pt-2 text-amber-300 space-y-1">
                <strong>Warnings:</strong>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  {importResult.validation.warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Disclaimer on feed type */}
        <div className="flex items-center gap-2 text-slate-500 text-[11px] font-mono">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Note: Static GTFS schedules provide planned trip stops. Live GPS vehicle tracking is not configured for this hackathon preview.</span>
        </div>
      </div>

      {/* Database Seeder Control Panel */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">Deterministic Database Seeder</h2>
              <span className="text-xs px-2 py-0.5 rounded bg-sky-950 text-sky-300 font-mono border border-sky-800/50">
                UPSERT SAFE
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Seeds deterministic primary keys (<code className="text-cyan-300">INT001</code>–<code className="text-cyan-300">INT006</code>, <code className="text-cyan-300">R10</code>, <code className="text-cyan-300">R15</code>, <code className="text-cyan-300">R20</code>, and 12 buses) with realistic coordinates, passenger counts, and baseline timing plans. Safe to execute multiple times without duplicating rows.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 rounded-lg shadow-sm transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
              <span>{seeding ? 'Seeding Database...' : 'Seed / Reseed Demo Data'}</span>
            </button>
          </div>
        </div>

        {seedStatus && (
          <div className="mt-4 p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300">
            {seedStatus}
          </div>
        )}
      </div>

      {/* Migration Instructions Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Supabase SQL Migration File</h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            supabase/migrations/001_initial_schema.sql
          </span>
        </div>
        <p className="text-xs text-slate-300 mb-3 leading-relaxed">
          The database schema includes 8 PostgreSQL tables (<code className="text-cyan-300 font-mono">intersections</code>, <code className="text-cyan-300 font-mono">bus_routes</code>, <code className="text-cyan-300 font-mono">bus_stops</code>, <code className="text-cyan-300 font-mono">buses</code>, <code className="text-cyan-300 font-mono">signal_plans</code>, <code className="text-cyan-300 font-mono">delay_reports</code>, <code className="text-cyan-300 font-mono">scenarios</code>, <code className="text-cyan-300 font-mono">simulation_runs</code>), performance indexes, and enabled Row Level Security (RLS).
        </p>
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 font-mono text-xs text-slate-300 flex items-center justify-between">
          <span className="truncate">Apply schema in Supabase Dashboard → SQL Editor → New Query → Paste contents → Run</span>
          <button
            onClick={copySqlMigrationCommand}
            className="flex items-center gap-1.5 px-2.5 py-1 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded border border-slate-700 transition-colors shrink-0 ml-3"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span className="text-[11px]">{copied ? 'Copied' : 'Copy Path'}</span>
          </button>
        </div>
      </div>

      {/* Data Explorer Tabs */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
        {/* Tab Buttons */}
        <div className="flex items-center gap-1 p-2 bg-slate-950/80 border-b border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('buses')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'buses'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Simulated Buses ({buses.length})
          </button>
          <button
            onClick={() => setActiveTab('intersections')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'intersections'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Intersections ({intersections.length})
          </button>
          <button
            onClick={() => setActiveTab('routes')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'routes'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Bus Routes ({routes.length})
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'plans'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Signal Plans ({signalPlans.length})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'reports'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Delay Reports ({delayReports.length})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-4 overflow-x-auto">
          {activeTab === 'buses' && (
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono">
                  <th className="py-2.5">BUS ID</th>
                  <th className="py-2.5">ROUTE</th>
                  <th className="py-2.5">COORDINATES</th>
                  <th className="py-2.5 text-right">OCCUPANCY</th>
                  <th className="py-2.5 text-right">SPEED</th>
                  <th className="py-2.5">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {buses.map((bus) => (
                  <tr key={bus.id} className="hover:bg-slate-800/30">
                    <td className="py-2 text-white font-bold">{bus.id}</td>
                    <td className="py-2 text-cyan-400 font-semibold">{bus.route_id}</td>
                    <td className="py-2 text-slate-400 tabular-nums">
                      {bus.latitude.toFixed(4)}, {bus.longitude.toFixed(4)}
                    </td>
                    <td className="py-2 text-right text-emerald-400 font-bold tabular-nums">
                      {bus.occupancy} pax
                    </td>
                    <td className="py-2 text-right text-slate-300 tabular-nums">
                      {bus.speed} km/h
                    </td>
                    <td className="py-2">
                      <span className="capitalize text-amber-300 font-sans text-xs">
                        {bus.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'intersections' && (
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5">ID</th>
                  <th className="py-2.5">Name</th>
                  <th className="py-2.5">Location</th>
                  <th className="py-2.5">Coordinates</th>
                  <th className="py-2.5 text-right">Approaches</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {intersections.map((intNode) => (
                  <tr key={intNode.id} className="hover:bg-slate-800/30">
                    <td className="py-2 font-mono font-bold text-cyan-400">{intNode.id}</td>
                    <td className="py-2 font-semibold text-white">{intNode.name}</td>
                    <td className="py-2 text-slate-400">{intNode.location}</td>
                    <td className="py-2 font-mono text-slate-400 tabular-nums">
                      {intNode.latitude.toFixed(4)}, {intNode.longitude.toFixed(4)}
                    </td>
                    <td className="py-2 text-right font-mono text-emerald-400 tabular-nums">
                      {intNode.approaches.length} approaches
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'routes' && (
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5">Route</th>
                  <th className="py-2.5">Name</th>
                  <th className="py-2.5">Origin ➔ Destination</th>
                  <th className="py-2.5 text-right">Avg Occupancy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {routes.map((route) => (
                  <tr key={route.id} className="hover:bg-slate-800/30">
                    <td className="py-2 font-mono font-bold text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: route.color }} />
                      <span>{route.id}</span>
                    </td>
                    <td className="py-2 font-semibold text-white">{route.route_name}</td>
                    <td className="py-2 text-slate-400 font-mono text-[11px]">
                      {route.start_point} ➔ {route.end_point}
                    </td>
                    <td className="py-2 text-right font-mono font-bold text-emerald-400 tabular-nums">
                      {route.average_occupancy} passengers
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'plans' && (
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5">Plan ID</th>
                  <th className="py-2.5">Intersection</th>
                  <th className="py-2.5">Scenario</th>
                  <th className="py-2.5 text-right">Cycle Length</th>
                  <th className="py-2.5 text-right">Phase Stages</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {signalPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-slate-800/30">
                    <td className="py-2 font-bold text-cyan-400">{plan.id}</td>
                    <td className="py-2 text-white font-semibold">{plan.intersection_id}</td>
                    <td className="py-2 text-slate-300">{plan.scenario}</td>
                    <td className="py-2 text-right text-emerald-400 font-bold tabular-nums">
                      {plan.cycle_length}s
                    </td>
                    <td className="py-2 text-right text-slate-400 tabular-nums">
                      {plan.phases.length} phases
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-2">
              {delayReports.map((report) => (
                <div key={report.id} className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1 font-mono">
                    <span className="font-bold text-cyan-400">{report.id} · Route {report.route_id} · Junction {report.intersection_id}</span>
                    <span className="text-rose-400 font-semibold">Severity {report.severity}/5</span>
                  </div>
                  <p className="text-slate-300 text-xs italic">"{report.comment}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
