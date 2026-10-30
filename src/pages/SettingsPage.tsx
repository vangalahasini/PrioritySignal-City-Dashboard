import React, { useState } from 'react';
import { HealthStatus, Scenario, Intersection, BusRoute, DelayReport, SignalPlan } from '../types';
import { DemoDataNotice } from '../components/DemoDataNotice';
import {
  Settings as SettingsIcon,
  Database,
  Server,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Shield,
  Download,
  FileText,
  Sliders,
  Info,
  Palette,
  Terminal,
} from 'lucide-react';
import {
  exportMetricsCsv,
  exportDelayReportsCsv,
  exportSignalPlansJson,
  generatePdfReport,
} from '../utils/exportUtils';

interface SettingsPageProps {
  health: HealthStatus | null;
  loading: boolean;
  onRefresh: () => void;
  scenarios?: Scenario[];
  intersections?: Intersection[];
  routes?: BusRoute[];
  delayReports?: DelayReport[];
  signalPlans?: SignalPlan[];
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  health,
  loading,
  onRefresh,
  scenarios = [],
  intersections = [],
  routes = [],
  delayReports = [],
  signalPlans = [],
}) => {
  const isConnected = health?.database === 'connected';
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);
  const [pdfSuccess, setPdfSuccess] = useState<string | null>(null);

  const handleExportPdf = () => {
    if (scenarios.length === 0) {
      alert('Please ensure at least one scenario exists before generating a PDF report.');
      return;
    }
    setDownloadingPdf(true);
    try {
      const activeScenario = scenarios[0];
      generatePdfReport({
        scenarioName: activeScenario.name,
        baseline: activeScenario.baseline_metrics || {
          totalPersonDelaySeconds: 42000,
          averageBusDelaySeconds: 42,
          averageBusTravelTimeSeconds: 650,
          peopleMovedPerGreenSecond: 1.18,
          carDelayIncreasePercent: 0,
          constraintViolations: [],
        },
        optimized: activeScenario.optimized_metrics || {
          totalPersonDelaySeconds: 31000,
          averageBusDelaySeconds: 32,
          averageBusTravelTimeSeconds: 520,
          peopleMovedPerGreenSecond: 2.85,
          carDelayIncreasePercent: 7.4,
          constraintViolations: [],
        },
        intersections,
        routes,
      });
      setPdfSuccess('Executive PDF report downloaded successfully.');
      setTimeout(() => setPdfSuccess(null), 4000);
    } catch (err) {
      alert(`PDF generation failed: ${(err as Error).message}`);
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">System Settings & Data Exports</h1>
          <p className="text-sm text-slate-400 mt-1">
            Audit system configurations, export operational datasets, and inspect mathematical constraints.
          </p>
        </div>

        <DemoDataNotice />
      </div>

      {pdfSuccess && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{pdfSuccess}</span>
        </div>
      )}

      {/* Export and Reporting Panel */}
      <div className="bg-gradient-to-r from-sky-950/30 via-slate-900 to-indigo-950/30 border border-sky-800/40 rounded-xl p-6 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Exports & Executive Reporting</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Download simulation evaluations, commuter feedback records, and signal timing plans.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* PDF Report */}
          <button
            onClick={handleExportPdf}
            disabled={downloadingPdf}
            className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-cyan-500/60 text-left transition-all hover:bg-slate-850 group"
          >
            <div className="flex items-center justify-between text-cyan-400 mb-2">
              <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                PDF
              </span>
            </div>
            <div className="text-sm font-semibold text-white">Executive PDF Report</div>
            <p className="text-[11px] text-slate-400 mt-1">
              Formatted multi-section briefing with KPIs, delta tables, and disclaimer.
            </p>
          </button>

          {/* Metrics CSV */}
          <button
            onClick={() => exportMetricsCsv(scenarios)}
            className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-emerald-500/60 text-left transition-all hover:bg-slate-850 group"
          >
            <div className="flex items-center justify-between text-emerald-400 mb-2">
              <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800">
                CSV
              </span>
            </div>
            <div className="text-sm font-semibold text-white">Performance Metrics CSV</div>
            <p className="text-[11px] text-slate-400 mt-1">
              Baseline vs optimized person-delay, bus delay, and throughput rows.
            </p>
          </button>

          {/* Commuter Feedback CSV */}
          <button
            onClick={() => exportDelayReportsCsv(delayReports)}
            className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-amber-500/60 text-left transition-all hover:bg-slate-850 group"
          >
            <div className="flex items-center justify-between text-amber-400 mb-2">
              <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950 border border-amber-800">
                CSV
              </span>
            </div>
            <div className="text-sm font-semibold text-white">Commuter Feedback CSV</div>
            <p className="text-[11px] text-slate-400 mt-1">
              {delayReports.length} passenger delay reports with crowding and timestamp.
            </p>
          </button>

          {/* Signal Plans JSON */}
          <button
            onClick={() => exportSignalPlansJson(signalPlans)}
            className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-indigo-500/60 text-left transition-all hover:bg-slate-850 group"
          >
            <div className="flex items-center justify-between text-indigo-400 mb-2">
              <FileCode className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950 border border-indigo-800">
                JSON
              </span>
            </div>
            <div className="text-sm font-semibold text-white">Signal Plans JSON</div>
            <p className="text-[11px] text-slate-400 mt-1">
              Full phase splits, transit priority flags, and cycle length payloads.
            </p>
          </button>
        </div>
      </div>

      {/* Database Connection Diagnostic Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                isConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              {isConnected ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Database Health & Connectivity</h2>
              <p className="text-xs text-slate-400">
                Probed via server-side service role client (/api/health)
              </p>
            </div>
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Test Connection</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
            <div className="text-slate-500 uppercase tracking-wider text-[10px]">Connection State</div>
            <div className="text-sm font-bold text-white capitalize">{health?.database || 'Probing...'}</div>
            <div className="text-[11px] text-slate-400 font-sans">{health?.message}</div>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
            <div className="text-slate-500 uppercase tracking-wider text-[10px]">Data Mode</div>
            <div className="text-sm font-bold text-cyan-400">
              {health?.using_mock_fallback ? 'Deterministic Fallback' : 'Supabase PostgreSQL'}
            </div>
            <div className="text-[11px] text-slate-400 font-sans">
              Last probe: {new Date(health?.timestamp || '').toLocaleTimeString()}
            </div>
          </div>
        </div>

        {health?.missing_env && health.missing_env.length > 0 && (
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Missing Environment Variables:</span>
            </div>
            <p className="text-slate-300 text-[11.5px] leading-relaxed">
              The following variables are not present:{' '}
              {health.missing_env.map((envName) => (
                <code key={envName} className="mx-1 px-1.5 py-0.5 rounded bg-slate-900 border border-amber-500/30 text-amber-200 font-mono">
                  {envName}
                </code>
              ))}
            </p>
          </div>
        )}
      </div>

      {/* Project Info, Data Source Description, Simulation Assumptions & Constraints */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project & Data Source Info */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>Project & Data Source Architecture</span>
          </div>
          <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <p>
              <strong>PrioritySignal</strong> is built on the tenet:{' '}
              <em>"People First. Smarter Signals. Better Cities."</em>
            </p>
            <p>
              <strong>Data Source:</strong> Active simulation operates with deterministic synthetic transit telemetry or validated static GTFS ZIP imports. No live GPS or real-world cellular trackers are claimed.
            </p>
            <p>
              <strong>Theme:</strong> Dark Charcoal & Navy Executive Palette with Electric Cyan/Blue Accents designed for continuous urban operations centers.
            </p>
          </div>
        </div>

        {/* Simulation Assumptions & Optimization Constraints */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Mathematical Constraints & Guardrails</span>
          </div>
          <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <ul className="space-y-1 text-slate-400 font-mono text-[11.5px]">
              <li>• <strong className="text-white">Bus Occupancy Weight:</strong> 3.0x multiplier over auto occupancy.</li>
              <li>• <strong className="text-white">Pedestrian Clearance:</strong> Minimum 10.0s walk clearance enforced across all crosswalk splits.</li>
              <li>• <strong className="text-white">Car Delay Ceiling:</strong> Max 10.0% cross-street auto delay increase constraint.</li>
              <li>• <strong className="text-white">Yellow/All-Red:</strong> Strict 4.0s yellow + 2.0s all-red clearance interval preservation.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Mandatory Hackathon Disclaimer */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-center space-y-1">
        <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
          Official Hackathon Demonstration Notice
        </div>
        <p className="text-xs text-slate-400 max-w-2xl mx-auto leading-relaxed">
          DEMO SIMULATION ONLY — NO REAL TRAFFIC SIGNALS ARE CONTROLLED. This software evaluates signal timing algorithms against simulated GTFS routes and passenger occupancy profiles.
        </p>
      </div>
    </div>
  );
};
