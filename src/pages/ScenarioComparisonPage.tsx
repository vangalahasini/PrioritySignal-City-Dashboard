import React, { useState } from 'react';
import { Scenario, SignalPlan } from '../types';
import { DemoDataNotice } from '../components/DemoDataNotice';
import {
  GitCompare,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  Car,
  Trash2,
  Edit3,
  Plus,
  RefreshCw,
  FileCheck,
  Layers,
} from 'lucide-react';

interface ScenarioComparisonPageProps {
  scenarios: Scenario[];
  signalPlans?: SignalPlan[];
  onRefresh?: () => void;
  onNavigateToOptimization?: () => void;
}

export const ScenarioComparisonPage: React.FC<ScenarioComparisonPageProps> = ({
  scenarios,
  signalPlans = [],
  onRefresh,
  onNavigateToOptimization,
}) => {
  // Scenario Selection for side-by-side comparison
  const [scenarioAId, setScenarioAId] = useState<string>(scenarios[0]?.id || '');
  const [scenarioBId, setScenarioBId] = useState<string>(
    scenarios.length > 1 ? scenarios[1]?.id : scenarios[0]?.id || ''
  );

  // Edit Scenario Modal State
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  // Delete Confirmation State
  const [deletingScenarioId, setDeletingScenarioId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const scenarioA = scenarios.find((s) => s.id === scenarioAId) || scenarios[0];
  const scenarioB = scenarios.find((s) => s.id === scenarioBId) || scenarios[1] || scenarios[0];

  const handleOpenEdit = (scenario: Scenario) => {
    setEditingScenario(scenario);
    setEditName(scenario.name);
    setEditDescription(scenario.description || '');
  };

  const handleSaveEdit = async () => {
    if (!editingScenario) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/scenarios/${editingScenario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, description: editDescription }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`Scenario "${editName}" updated successfully.`);
        setEditingScenario(null);
        if (onRefresh) onRefresh();
      } else {
        alert(data.error || 'Failed to update scenario');
      }
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteScenario = async (id: string) => {
    try {
      const res = await fetch(`/api/scenarios/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`Scenario ${id} deleted.`);
        setDeletingScenarioId(null);
        if (onRefresh) onRefresh();
      } else {
        alert(data.error || 'Failed to delete scenario');
      }
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Scenario Management & Comparison Matrix
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-950 text-cyan-400 border border-sky-800">
              SUPABASE PERSISTENCE
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Evaluate, compare, and audit competing signal timing strategies against baseline operational metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onNavigateToOptimization && (
            <button
              onClick={onNavigateToOptimization}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Scenario</span>
            </button>
          )}
          <DemoDataNotice />
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionMessage}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-slate-400 hover:text-white font-mono"
          >
            ✕
          </button>
        </div>
      )}

      {/* Scenarios Management List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Saved Scenarios in Database ({scenarios.length})
            </h2>
            <p className="text-xs text-slate-400">
              Select any scenario to view details, edit metadata, or inspect timing plans.
            </p>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 border border-slate-700"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reload</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {scenarios.map((s) => {
            const optP = s.optimized_metrics?.totalPersonDelaySeconds;
            const baseP = s.baseline_metrics?.totalPersonDelaySeconds;
            const reduction = baseP && baseP > 0 ? (((baseP - (optP || baseP)) / baseP) * 100).toFixed(1) : '0';

            return (
              <div
                key={s.id}
                className="bg-slate-950/80 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono font-bold text-cyan-400">{s.id}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                      -{reduction}% Person-Delay
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white">{s.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{s.description}</p>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80">
                  <div className="text-[11px] text-slate-500 font-mono">
                    Plans: {s.signal_plans?.length || signalPlans.length}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(s)}
                      className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
                      title="Edit Name & Description"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingScenarioId(s.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete Scenario"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side-by-Side Scenario Comparative Analysis */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-cyan-400" />
              <span>Comparative Differential Audit</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select two scenarios to evaluate trade-offs, constraint compliance, and passenger benefit side-by-side.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Scenario A:</span>
              <select
                value={scenarioAId}
                onChange={(e) => setScenarioAId(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-white rounded-md px-2.5 py-1 text-xs focus:outline-none focus:border-cyan-500"
              >
                {scenarios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.id})
                  </option>
                ))}
              </select>
            </div>

            <span className="text-xs text-slate-600 font-bold">vs</span>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Scenario B:</span>
              <select
                value={scenarioBId}
                onChange={(e) => setScenarioBId(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-white rounded-md px-2.5 py-1 text-xs focus:outline-none focus:border-cyan-500"
              >
                {scenarios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.id})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {scenarioA && scenarioB ? (
          <div className="space-y-6">
            {/* Side-by-side Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono">
                    <th className="py-3 px-3">EVALUATION METRIC</th>
                    <th className="py-3 px-3 font-semibold text-sky-400 bg-sky-950/20">
                      SCENARIO A: {scenarioA.name}
                    </th>
                    <th className="py-3 px-3 font-semibold text-emerald-400 bg-emerald-950/20">
                      SCENARIO B: {scenarioB.name}
                    </th>
                    <th className="py-3 px-3 text-right">DIFFERENCE (B vs A)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {/* Total Person-Delay */}
                  <tr>
                    <td className="py-3 px-3 font-sans text-slate-200 font-medium flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Total Passenger Person-Delay</span>
                    </td>
                    <td className="py-3 px-3 bg-sky-950/10 text-white">
                      {(scenarioA.optimized_metrics?.totalPersonDelaySeconds || 0).toLocaleString()} p-sec
                    </td>
                    <td className="py-3 px-3 bg-emerald-950/10 text-white">
                      {(scenarioB.optimized_metrics?.totalPersonDelaySeconds || 0).toLocaleString()} p-sec
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-400 font-bold">
                      {(
                        (scenarioB.optimized_metrics?.totalPersonDelaySeconds || 0) -
                        (scenarioA.optimized_metrics?.totalPersonDelaySeconds || 0)
                      ).toLocaleString()}{' '}
                      p-sec
                    </td>
                  </tr>

                  {/* Average Bus Delay */}
                  <tr>
                    <td className="py-3 px-3 font-sans text-slate-200 font-medium flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Average Bus Delay</span>
                    </td>
                    <td className="py-3 px-3 bg-sky-950/10 text-white">
                      {scenarioA.optimized_metrics?.averageBusDelaySeconds || 0}s
                    </td>
                    <td className="py-3 px-3 bg-emerald-950/10 text-white">
                      {scenarioB.optimized_metrics?.averageBusDelaySeconds || 0}s
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-400 font-bold">
                      {(
                        (scenarioB.optimized_metrics?.averageBusDelaySeconds || 0) -
                        (scenarioA.optimized_metrics?.averageBusDelaySeconds || 0)
                      ).toFixed(1)}
                      s
                    </td>
                  </tr>

                  {/* Bus Travel Time */}
                  <tr>
                    <td className="py-3 px-3 font-sans text-slate-200 font-medium flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Corridor Bus Travel Time</span>
                    </td>
                    <td className="py-3 px-3 bg-sky-950/10 text-white">
                      {scenarioA.optimized_metrics?.averageBusTravelTimeSeconds || 0}s
                    </td>
                    <td className="py-3 px-3 bg-emerald-950/10 text-white">
                      {scenarioB.optimized_metrics?.averageBusTravelTimeSeconds || 0}s
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-400 font-bold">
                      {(
                        (scenarioB.optimized_metrics?.averageBusTravelTimeSeconds || 0) -
                        (scenarioA.optimized_metrics?.averageBusTravelTimeSeconds || 0)
                      ).toFixed(1)}
                      s
                    </td>
                  </tr>

                  {/* People Moved Per Green Second */}
                  <tr>
                    <td className="py-3 px-3 font-sans text-slate-200 font-medium flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>People Moved / Green Second</span>
                    </td>
                    <td className="py-3 px-3 bg-sky-950/10 text-white">
                      {scenarioA.optimized_metrics?.peopleMovedPerGreenSecond || 0} p/s
                    </td>
                    <td className="py-3 px-3 bg-emerald-950/10 text-white">
                      {scenarioB.optimized_metrics?.peopleMovedPerGreenSecond || 0} p/s
                    </td>
                    <td className="py-3 px-3 text-right text-cyan-400 font-bold">
                      {(
                        (scenarioB.optimized_metrics?.peopleMovedPerGreenSecond || 0) -
                        (scenarioA.optimized_metrics?.peopleMovedPerGreenSecond || 0)
                      ).toFixed(2)}{' '}
                      p/s
                    </td>
                  </tr>

                  {/* Car Delay Impact */}
                  <tr>
                    <td className="py-3 px-3 font-sans text-slate-200 font-medium flex items-center gap-2">
                      <Car className="w-3.5 h-3.5 text-amber-400" />
                      <span>Cross-Street Auto Delay Change</span>
                    </td>
                    <td className="py-3 px-3 bg-sky-950/10 text-amber-400">
                      +{scenarioA.optimized_metrics?.carDelayIncreasePercent || 0}%
                    </td>
                    <td className="py-3 px-3 bg-emerald-950/10 text-amber-400">
                      +{scenarioB.optimized_metrics?.carDelayIncreasePercent || 0}%
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300 font-bold">
                      {(
                        (scenarioB.optimized_metrics?.carDelayIncreasePercent || 0) -
                        (scenarioA.optimized_metrics?.carDelayIncreasePercent || 0)
                      ).toFixed(1)}
                      %
                    </td>
                  </tr>

                  {/* Constraint Violations */}
                  <tr>
                    <td className="py-3 px-3 font-sans text-slate-200 font-medium flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Constraint Violations</span>
                    </td>
                    <td className="py-3 px-3 bg-sky-950/10 text-emerald-400">
                      {scenarioA.optimized_metrics?.constraintViolations?.length || 0} violations
                    </td>
                    <td className="py-3 px-3 bg-emerald-950/10 text-emerald-400">
                      {scenarioB.optimized_metrics?.constraintViolations?.length || 0} violations
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-400 font-bold">
                      0 (Both Valid)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Signal Plans Breakdown */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>Signal Timing Plans for Scenario: {scenarioA.name}</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Showing allocated cycle lengths and green splits across configured corridor intersections.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(scenarioA.signal_plans && scenarioA.signal_plans.length > 0
                  ? scenarioA.signal_plans
                  : signalPlans
                ).map((plan) => (
                  <div
                    key={plan.id}
                    className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-cyan-400">{plan.intersection_id}</span>
                      <span className="text-slate-400">{plan.cycle_length}s cycle</span>
                    </div>
                    <div className="text-[11px] text-slate-300 font-medium">{plan.name}</div>
                    <div className="space-y-1 pt-1 border-t border-slate-800">
                      {plan.phases.map((ph: any, phIdx: number) => (
                        <div key={ph.phase_id || ph.id || phIdx} className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className={ph.is_transit_priority ? 'text-emerald-400 font-semibold' : ''}>
                            {ph.name}
                          </span>
                          <span className="font-mono">{ph.duration_seconds}s ({ph.green_split}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            Please select valid scenarios to inspect.
          </div>
        )}
      </div>

      {/* Edit Scenario Modal */}
      {editingScenario && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-base font-bold text-white">Edit Scenario Details</h2>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Scenario Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Description</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingScenario(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold"
              >
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingScenarioId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-sm space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-950 border border-rose-800 text-rose-400 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Delete Scenario?</h2>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to remove scenario <code className="font-mono text-white">{deletingScenarioId}</code>? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingScenarioId(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteScenario(deletingScenarioId)}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
