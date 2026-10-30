import React, { useState } from 'react';
import {
  Intersection,
  BusRoute,
  SignalPlan,
  SimulationParameters,
  OptimizationResult,
  SimulationResult,
} from '../types';
import { DemoDataNotice } from '../components/DemoDataNotice';
import {
  Zap,
  Play,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  ShieldCheck,
  Save,
  ArrowRight,
  RefreshCw,
  GitCompare,
} from 'lucide-react';

interface OptimizationEnginePageProps {
  intersections: Intersection[];
  routes: BusRoute[];
  signalPlans: SignalPlan[];
  onSaveScenario?: (name: string, result: OptimizationResult) => void;
}

export const OptimizationEnginePage: React.FC<OptimizationEnginePageProps> = ({
  intersections,
  routes,
  signalPlans,
  onSaveScenario,
}) => {
  // Input parameters
  const [selectedRouteIds, setSelectedRouteIds] = useState<string[]>(routes.map((r) => r.id));
  const [selectedIntersectionIds, setSelectedIntersectionIds] = useState<string[]>(
    intersections.map((i) => i.id)
  );
  const [timeWindow, setTimeWindow] = useState<string>('Morning Peak');
  const [busPriorityWeight, setBusPriorityWeight] = useState<number>(3);
  const [maxCarDelayIncreasePct, setMaxCarDelayIncreasePct] = useState<number>(10);
  const [pedestrianMinimumSeconds, setPedestrianMinimumSeconds] = useState<number>(10);

  // Execution states
  const [isRunningBaseline, setIsRunningBaseline] = useState<boolean>(false);
  const [isRunningOptimization, setIsRunningOptimization] = useState<boolean>(false);
  const [baselineMetrics, setBaselineMetrics] = useState<SimulationResult | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [scenarioName, setScenarioName] = useState<string>('');
  const [scenarioSavedMessage, setScenarioSavedMessage] = useState<string | null>(null);

  const toggleRoute = (id: string) => {
    setSelectedRouteIds((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const toggleIntersection = (id: string) => {
    setSelectedIntersectionIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Run Baseline Simulation
  const handleRunBaseline = async () => {
    try {
      setIsRunningBaseline(true);
      const params: SimulationParameters = {
        routes: selectedRouteIds,
        intersections: selectedIntersectionIds,
        timeWindow,
        busPriorityWeight,
        maxCarDelayIncreasePct,
        pedestrianMinimumSeconds,
      };

      const res = await fetch('/api/simulation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const json = await res.json();
      if (json.success && json.metrics) {
        setBaselineMetrics(json.metrics);
      }
    } catch (err) {
      alert(`Simulation failed: ${(err as Error).message}`);
    } finally {
      setIsRunningBaseline(false);
    }
  };

  // Run Optimization Engine
  const handleRunOptimization = async () => {
    try {
      setIsRunningOptimization(true);
      setScenarioSavedMessage(null);

      const params: SimulationParameters = {
        routes: selectedRouteIds,
        intersections: selectedIntersectionIds,
        timeWindow,
        busPriorityWeight,
        maxCarDelayIncreasePct,
        pedestrianMinimumSeconds,
      };

      const res = await fetch('/api/optimization/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const json = await res.json();
      if (json.success && json.result) {
        setOptimizationResult(json.result);
        setBaselineMetrics(json.result.baselineMetrics);
      }
    } catch (err) {
      alert(`Optimization failed: ${(err as Error).message}`);
    } finally {
      setIsRunningOptimization(false);
    }
  };

  // Save named scenario
  const handleSaveScenario = async () => {
    if (!optimizationResult || !scenarioName.trim()) return;

    try {
      const res = await fetch('/api/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: scenarioName.trim(),
          description: `Optimized transit priority scenario (${timeWindow}, ${busPriorityWeight}x weight, max +${maxCarDelayIncreasePct}% car delay).`,
          baseline_metrics: optimizationResult.baselineMetrics,
          optimized_metrics: optimizationResult.optimizedMetrics,
          signal_plans: optimizationResult.recommendedPlan,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setScenarioSavedMessage(`✓ Scenario "${scenarioName}" saved to Supabase.`);
        if (onSaveScenario) onSaveScenario(scenarioName, optimizationResult);
      }
    } catch (err) {
      alert(`Failed to save scenario: ${(err as Error).message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Transit Priority Optimization Engine
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-950 text-cyan-400 border border-sky-800">
              CORE PROJECT LOGIC
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Minimizes passenger person-delay by dynamically tuning green splits based on passenger loads and commuter feedback.
          </p>
        </div>

        <DemoDataNotice />
      </div>

      {/* Controls & Configuration Panel */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Engine Parameters & Constraints</h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Objective: Minimize ∑ (Bus Delay × Occupancy)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Corridors and Intersections Selection */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Active Transit Corridors
              </label>
              <div className="space-y-1.5">
                {routes.map((r) => (
                  <label
                    key={r.id}
                    className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-950 p-2 rounded-lg border border-slate-800 hover:border-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRouteIds.includes(r.id)}
                      onChange={() => toggleRoute(r.id)}
                      className="accent-cyan-500 rounded"
                    />
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                    <span className="font-mono font-bold text-white">{r.id}</span>
                    <span className="truncate text-slate-400">({r.route_name})</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Time Window
              </label>
              <select
                value={timeWindow}
                onChange={(e) => setTimeWindow(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Morning Peak">Morning Peak (07:00 – 09:30)</option>
                <option value="Midday">Midday (11:00 – 14:00)</option>
                <option value="Evening Peak">Evening Peak (16:30 – 19:00)</option>
                <option value="Late Night">Late Night (20:00+)</option>
              </select>
            </div>
          </div>

          {/* Intersections Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Signalized Junctions ({selectedIntersectionIds.length}/{intersections.length})
            </label>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {intersections.map((intNode) => (
                <label
                  key={intNode.id}
                  className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-950 p-1.5 rounded-lg border border-slate-800 hover:border-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={selectedIntersectionIds.includes(intNode.id)}
                    onChange={() => toggleIntersection(intNode.id)}
                    className="accent-cyan-500 rounded"
                  />
                  <span className="font-mono text-cyan-300 font-bold">{intNode.id}</span>
                  <span className="truncate">{intNode.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sliders & Constraints */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Bus Priority Weight:</span>
                <span className="font-mono text-cyan-400 font-bold">{busPriorityWeight}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={busPriorityWeight}
                onChange={(e) => setBusPriorityWeight(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Multiplies passenger occupancy weight during green allocation
              </span>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Max Cross-Street Car Delay:</span>
                <span className="font-mono text-amber-400 font-bold">+{maxCarDelayIncreasePct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={maxCarDelayIncreasePct}
                onChange={(e) => setMaxCarDelayIncreasePct(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Strict limit on permissible general traffic delay penalty
              </span>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Pedestrian Minimum Green:</span>
                <span className="font-mono text-emerald-400 font-bold">{pedestrianMinimumSeconds}s</span>
              </div>
              <input
                type="range"
                min="8"
                max="20"
                value={pedestrianMinimumSeconds}
                onChange={(e) => setPedestrianMinimumSeconds(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Safety constraint: walk phases cannot be shortened below this floor
              </span>
            </div>
          </div>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Cycle lengths are strictly preserved; green is only safely transferred between phases.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunBaseline}
              disabled={isRunningBaseline || isRunningOptimization}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunningBaseline ? 'animate-spin' : ''}`} />
              <span>{isRunningBaseline ? 'Evaluating Baseline...' : 'Run Baseline Simulation'}</span>
            </button>

            <button
              onClick={handleRunOptimization}
              disabled={isRunningOptimization || isRunningBaseline}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-500 hover:from-sky-500 hover:to-teal-400 rounded-lg shadow-lg shadow-sky-950/40 transition-all disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 ${isRunningOptimization ? 'animate-bounce' : ''}`} />
              <span>{isRunningOptimization ? 'Optimizing Signal Splits...' : 'Run Optimization'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {optimizationResult && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Optimization Results Summary</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Completed {optimizationResult.iterationsTested} candidate iterations across {selectedIntersectionIds.length} signalized junctions.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-mono font-bold px-2.5 py-1 rounded border ${
                  optimizationResult.genuineImprovementAchieved
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : 'bg-amber-950 text-amber-300 border-amber-800'
                }`}
              >
                {optimizationResult.genuineImprovementAchieved
                  ? 'GENUINE IMPROVEMENT ACHIEVED'
                  : 'BASELINE PARETO-OPTIMAL'}
              </span>
            </div>
          </div>

          {/* Metric Comparison Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4">
              <span className="text-xs text-slate-400 block mb-1">Average Bus Delay</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-mono font-bold text-white tabular-nums">
                  {optimizationResult.optimizedMetrics.averageBusDelaySeconds}s
                </span>
                <span
                  className={`text-xs font-mono font-bold ${
                    optimizationResult.percentageChange.busDelayPct < 0
                      ? 'text-emerald-400'
                      : 'text-slate-400'
                  }`}
                >
                  {optimizationResult.percentageChange.busDelayPct > 0 ? '+' : ''}
                  {optimizationResult.percentageChange.busDelayPct}%
                </span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Baseline: {optimizationResult.baselineMetrics.averageBusDelaySeconds}s
              </span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4">
              <span className="text-xs text-slate-400 block mb-1">Total Person-Delay</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-mono font-bold text-emerald-400 tabular-nums">
                  {optimizationResult.optimizedMetrics.totalPersonDelayHours}h
                </span>
                <span
                  className={`text-xs font-mono font-bold ${
                    optimizationResult.percentageChange.personDelayPct < 0
                      ? 'text-emerald-400'
                      : 'text-slate-400'
                  }`}
                >
                  {optimizationResult.percentageChange.personDelayPct > 0 ? '+' : ''}
                  {optimizationResult.percentageChange.personDelayPct}%
                </span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Baseline: {optimizationResult.baselineMetrics.totalPersonDelayHours}h
              </span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4">
              <span className="text-xs text-slate-400 block mb-1">General Car Delay</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-mono font-bold text-slate-200 tabular-nums">
                  {optimizationResult.optimizedMetrics.generalCarDelaySeconds}s
                </span>
                <span
                  className={`text-xs font-mono font-bold ${
                    optimizationResult.constraintValidation.carDelayLimitRespected
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  +{optimizationResult.constraintValidation.actualCarDelayIncreasePct}%
                </span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Permitted limit: +{maxCarDelayIncreasePct}%
              </span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4">
              <span className="text-xs text-slate-400 block mb-1">People / Green Sec</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-mono font-bold text-cyan-300 tabular-nums">
                  {optimizationResult.optimizedMetrics.peopleMovedPerGreenSec}
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  +{optimizationResult.percentageChange.peopleMovedPct}%
                </span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Baseline: {optimizationResult.baselineMetrics.peopleMovedPerGreenSec} pax/s
              </span>
            </div>
          </div>

          {/* Explanation Log */}
          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Optimization Decisions & Constraint Verification:
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {optimizationResult.explanation.map((exp, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-cyan-400">➔</span>
                  <span>{exp}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Save Scenario Bar */}
          <div className="flex items-center justify-between p-4 bg-slate-950/90 rounded-xl border border-slate-800 flex-wrap gap-4">
            <div>
              <h4 className="text-sm font-bold text-white">Save Optimized Timing as Named Scenario</h4>
              <p className="text-xs text-slate-400">
                Persist this recommended plan to the Supabase scenarios table for historical tracking and comparison.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Scenario Name (e.g. Morning Transit Priority v1)"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 w-64"
              />
              <button
                onClick={handleSaveScenario}
                disabled={!scenarioName.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors disabled:opacity-40"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save to Supabase</span>
              </button>
            </div>
          </div>

          {scenarioSavedMessage && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-xs font-mono text-emerald-300">
              {scenarioSavedMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
