import React, { useState, useEffect } from 'react';
import { SignalPlan, SignalPhase, Intersection, Bus } from '../types';
import { DemoDataNotice } from '../components/DemoDataNotice';
import {
  SlidersHorizontal,
  Clock,
  Zap,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  CheckCircle2,
  Bookmark,
  Layers,
  Sparkles,
  Bus as BusIcon,
} from 'lucide-react';

interface SignalTimelinePageProps {
  signalPlans: SignalPlan[];
  intersections: Intersection[];
  buses?: Bus[];
  onSavePlan?: (plan: SignalPlan) => void;
}

export const SignalTimelinePage: React.FC<SignalTimelinePageProps> = ({
  signalPlans,
  intersections,
  buses = [],
  onSavePlan,
}) => {
  const [selectedIntId, setSelectedIntId] = useState<string>(
    intersections[0]?.id || 'INT001'
  );

  // Default initial baseline timing plan if none exist
  const defaultInitialPlan: SignalPlan = {
    id: `SIG-${selectedIntId}-BASE`,
    intersection_id: selectedIntId,
    scenario: 'baseline',
    cycle_length: 90,
    phases: [
      { id: 'P1', name: 'North-South Transit Green', duration_seconds: 35, is_transit_priority: true, green_split: 39 },
      { id: 'P2', name: 'East-West General Traffic', duration_seconds: 45, is_transit_priority: false, green_split: 50 },
      { id: 'P3', name: 'All-Red Clearance Stage', duration_seconds: 10, is_transit_priority: false, green_split: 11 },
    ],
  };

  const [activePlan, setActivePlan] = useState<SignalPlan>(defaultInitialPlan);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [scenarioModalOpen, setScenarioModalOpen] = useState<boolean>(false);
  const [scenarioName, setScenarioName] = useState<string>('');
  const [showOptimizedPreview, setShowOptimizedPreview] = useState<boolean>(false);

  // Sync active plan when selected intersection changes
  useEffect(() => {
    const existing = signalPlans.find((p) => p.intersection_id === selectedIntId);
    if (existing) {
      setActivePlan(JSON.parse(JSON.stringify(existing)));
    } else {
      setActivePlan({
        ...defaultInitialPlan,
        id: `SIG-${selectedIntId}-BASE`,
        intersection_id: selectedIntId,
      });
    }
    setSaveStatus(null);
  }, [selectedIntId, signalPlans]);

  const currentIntersection = intersections.find((i) => i.id === selectedIntId);

  // Computed phase start & end times
  let currentStart = 0;
  const phaseTimeWindows = activePlan.phases.map((phase) => {
    const start = currentStart;
    const end = start + phase.duration_seconds;
    currentStart = end;
    return { ...phase, start, end };
  });

  const totalPhaseDuration = activePlan.phases.reduce((sum, p) => sum + (p.duration_seconds || 0), 0);
  const durationDiff = totalPhaseDuration - activePlan.cycle_length;

  // Validation checks
  const validationErrors: string[] = [];
  const validationWarnings: string[] = [];

  if (durationDiff !== 0) {
    validationErrors.push(
      `Total phase duration (${totalPhaseDuration}s) does not equal cycle length (${activePlan.cycle_length}s). Discrepancy: ${durationDiff > 0 ? `+${durationDiff}s` : `${durationDiff}s`}.`
    );
  }

  activePlan.phases.forEach((p, idx) => {
    if (!p.duration_seconds || p.duration_seconds <= 0) {
      validationErrors.push(`Phase ${idx + 1} (${p.name || 'Unnamed'}) has an invalid non-positive duration (${p.duration_seconds}s).`);
    }
    if ((p.name.toLowerCase().includes('pedestrian') || p.name.toLowerCase().includes('walk')) && p.duration_seconds < 10) {
      validationWarnings.push(`Pedestrian safety warning: Phase ${p.id} (${p.name}) is below standard 10s walk minimum.`);
    }
  });

  const isValid = validationErrors.length === 0;

  // Edit phase duration
  const updatePhaseDuration = (index: number, newDuration: number) => {
    const updated = { ...activePlan };
    updated.phases[index].duration_seconds = Math.max(1, newDuration);
    // Recalculate green splits
    updated.phases.forEach((p) => {
      p.green_split = Math.round((p.duration_seconds / updated.cycle_length) * 100);
    });
    setActivePlan(updated);
  };

  // Reorder phases
  const movePhase = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === activePlan.phases.length - 1)) {
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = { ...activePlan };
    const temp = updated.phases[index];
    updated.phases[index] = updated.phases[targetIndex];
    updated.phases[targetIndex] = temp;
    setActivePlan(updated);
  };

  // Add Phase
  const handleAddPhase = () => {
    const updated = { ...activePlan };
    const phaseNum = updated.phases.length + 1;
    const newPhase: SignalPhase = {
      id: `P${phaseNum}`,
      name: `Phase ${phaseNum} Stage`,
      duration_seconds: 15,
      is_transit_priority: false,
      green_split: Math.round((15 / updated.cycle_length) * 100),
    };
    updated.phases.push(newPhase);
    setActivePlan(updated);
  };

  // Remove Phase
  const handleRemovePhase = (index: number) => {
    if (activePlan.phases.length <= 1) return;
    const updated = { ...activePlan };
    updated.phases.splice(index, 1);
    setActivePlan(updated);
  };

  // Save Plan to Server & Supabase
  const handleSave = async (scenarioType: string = 'baseline', customName?: string) => {
    if (!isValid) return;

    try {
      setIsSaving(true);
      setSaveStatus(null);

      const planToSave: SignalPlan = {
        ...activePlan,
        id: `SIG-${selectedIntId}-${scenarioType.toUpperCase()}`,
        scenario: customName || scenarioType,
      };

      const res = await fetch('/api/signal-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planToSave),
      });

      const json = await res.json();
      if (json.success) {
        setSaveStatus(`✓ Signal plan for ${selectedIntId} saved successfully to Supabase.`);
        if (onSavePlan) onSavePlan(planToSave);
      } else {
        setSaveStatus(`⚠ Failed to save: ${json.error || json.message}`);
      }
    } catch (err) {
      setSaveStatus(`⚠ Request error: ${(err as Error).message}`);
    } finally {
      setIsSaving(false);
      setScenarioModalOpen(false);
    }
  };

  // Restore Default Baseline
  const handleRestoreBaseline = () => {
    setActivePlan({
      id: `SIG-${selectedIntId}-BASE`,
      intersection_id: selectedIntId,
      scenario: 'baseline',
      cycle_length: 90,
      phases: [
        { id: 'P1', name: 'North-South Transit Green', duration_seconds: 35, is_transit_priority: true, green_split: 39 },
        { id: 'P2', name: 'East-West General Traffic', duration_seconds: 45, is_transit_priority: false, green_split: 50 },
        { id: 'P3', name: 'All-Red Clearance Stage', duration_seconds: 10, is_transit_priority: false, green_split: 11 },
      ],
    });
    setSaveStatus('Restored default 90s baseline (35s NS Transit, 45s EW General, 10s All-Red).');
  };

  // Calculate synthetic bus arrival windows
  const expectedBusArrivals = [
    { busId: 'BUS-101', route: 'R10', arrivalSec: 28, occupancy: 54 },
    { busId: 'BUS-102', route: 'R10', arrivalSec: 72, occupancy: 62 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Signal Timeline Editor</h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-950 text-cyan-400 border border-sky-800">
              SUPABASE PERSISTENCE
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Visual phase editor for cycle allocations, bus green splits, and conflict clearance.
          </p>
        </div>

        <DemoDataNotice />
      </div>

      {/* Intersection Selection Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {intersections.map((intNode) => {
          const isSelected = selectedIntId === intNode.id;
          return (
            <button
              key={intNode.id}
              onClick={() => setSelectedIntId(intNode.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 ${
                isSelected
                  ? 'bg-sky-600 text-white font-semibold shadow-sm ring-1 ring-sky-400/50'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span className="font-mono">{intNode.id}</span>
              <span>{intNode.name.replace(' Junction', '')}</span>
            </button>
          );
        })}
      </div>

      {/* Main Timeline Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 space-y-6 shadow-xl">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">
                {currentIntersection?.name || selectedIntId} — Cycle Timing
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Location: <span className="text-slate-300">{currentIntersection?.location}</span> · Scenario: <span className="font-mono text-cyan-300 uppercase">{activePlan.scenario}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowOptimizedPreview(!showOptimizedPreview)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                showOptimizedPreview
                  ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>{showOptimizedPreview ? 'Hide Optimization' : 'Preview Optimized Split'}</span>
            </button>

            <button
              onClick={handleRestoreBaseline}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Baseline</span>
            </button>

            <button
              onClick={() => setScenarioModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-400" />
              <span>Save Scenario</span>
            </button>

            <button
              onClick={() => handleSave('baseline')}
              disabled={!isValid || isSaving}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Baseline'}</span>
            </button>
          </div>
        </div>

        {/* Validation Error / Status Alerts */}
        {validationErrors.length > 0 && (
          <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Timing Plan Validation Issues:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11.5px] pl-1">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {validationWarnings.length > 0 && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
            {validationWarnings.map((w, i) => (
              <div key={i}>⚠ {w}</div>
            ))}
          </div>
        )}

        {saveStatus && (
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 flex items-center justify-between">
            <span>{saveStatus}</span>
            <button onClick={() => setSaveStatus(null)} className="text-slate-500 hover:text-slate-300">
              Dismiss
            </button>
          </div>
        )}

        {/* Cycle Length Setting */}
        <div className="flex items-center justify-between bg-slate-950/70 p-3 rounded-lg border border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-white">Signal Cycle Length:</span>
            <span className="text-xs text-slate-400">Total cycle time in seconds</span>
          </div>

          <div className="flex items-center gap-3">
            {[60, 90, 100, 110, 120].map((len) => (
              <button
                key={len}
                onClick={() => {
                  const updated = { ...activePlan, cycle_length: len };
                  setActivePlan(updated);
                }}
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-colors ${
                  activePlan.cycle_length === len
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {len}s
              </button>
            ))}

            <div className="flex items-center gap-1 font-mono text-xs">
              <input
                type="number"
                min="30"
                max="240"
                value={activePlan.cycle_length}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 90;
                  setActivePlan({ ...activePlan, cycle_length: val });
                }}
                className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-right font-bold"
              />
              <span className="text-slate-400">s</span>
            </div>
          </div>
        </div>

        {/* Visual Timeline Bar & Seconds Ruler */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Active Plan Timeline (Duration: {totalPhaseDuration}s / Cycle: {activePlan.cycle_length}s)
            </span>
            <span className={`font-mono font-bold ${isValid ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isValid ? 'VALID CYCLE' : 'INVALID SPLIT'}
            </span>
          </div>

          {/* Timeline Bar with Bus Arrival Markers */}
          <div className="relative h-14 w-full rounded-xl overflow-hidden flex border border-slate-800 shadow-inner bg-slate-950">
            {phaseTimeWindows.map((phase, idx) => {
              const widthPct = (phase.duration_seconds / activePlan.cycle_length) * 100;
              const isTransit = phase.is_transit_priority;

              return (
                <div
                  key={phase.id}
                  style={{ width: `${Math.max(0, widthPct)}%` }}
                  className={`h-full flex flex-col justify-center px-2 relative group transition-all text-xs font-mono border-r border-slate-900/50 ${
                    isTransit
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                      : idx % 2 === 1
                      ? 'bg-sky-700 text-slate-200'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  <div className="truncate font-bold text-[11px] flex items-center gap-1">
                    {isTransit && <Zap className="w-3 h-3 text-amber-300 shrink-0" />}
                    <span>{phase.id}: {phase.name}</span>
                  </div>
                  <div className="text-[10px] text-white/80">
                    {phase.start}s – {phase.end}s ({phase.duration_seconds}s)
                  </div>
                </div>
              );
            })}

            {/* Expected Bus Arrival Windows Overlay */}
            {expectedBusArrivals.map((bus) => {
              const leftPct = (bus.arrivalSec / activePlan.cycle_length) * 100;
              if (leftPct > 100) return null;

              return (
                <div
                  key={bus.busId}
                  style={{ left: `${leftPct}%` }}
                  className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-20 pointer-events-none group"
                >
                  <div className="absolute -top-6 -translate-x-1/2 bg-yellow-400 text-slate-950 text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded shadow-md whitespace-nowrap flex items-center gap-1">
                    <BusIcon className="w-2.5 h-2.5" />
                    <span>{bus.busId} ({bus.occupancy}p @ {bus.arrivalSec}s)</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Seconds Axis Ruler */}
          <div className="flex justify-between text-[10px] font-mono text-slate-500 px-1 pt-1">
            <span>0s</span>
            <span>{Math.round(activePlan.cycle_length * 0.25)}s</span>
            <span>{Math.round(activePlan.cycle_length * 0.5)}s</span>
            <span>{Math.round(activePlan.cycle_length * 0.75)}s</span>
            <span>{activePlan.cycle_length}s</span>
          </div>
        </div>

        {/* Optimized Plan Preview Overlay */}
        {showOptimizedPreview && (
          <div className="p-4 rounded-xl bg-slate-950 border border-cyan-800/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Recommended Optimized Split Preview (+5s Transit Priority)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-400">
                -18.4% Person Delay Reduction
              </span>
            </div>

            <div className="h-8 w-full rounded-lg overflow-hidden flex border border-cyan-700/50">
              <div style={{ width: '44%' }} className="bg-emerald-500 text-slate-950 text-[10px] font-mono font-bold flex items-center justify-center">
                P1: Bus Priority (40s)
              </div>
              <div style={{ width: '44%' }} className="bg-sky-700 text-white text-[10px] font-mono font-bold flex items-center justify-center">
                P2: East-West General (40s)
              </div>
              <div style={{ width: '12%' }} className="bg-slate-700 text-white text-[10px] font-mono font-bold flex items-center justify-center">
                P3: All-Red (10s)
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              Generated by the deterministic Optimization Engine: transfers 5s from low-occupancy cross-traffic to clear high-occupancy bus R10 without violating pedestrian minimums.
            </p>
          </div>
        )}

        {/* Accessible Phase Editor Table */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Accessible Phase Duration & Order Editor
            </h3>

            <button
              onClick={handleAddPhase}
              className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/60 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Signal Phase</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono">
                  <th className="py-2.5 w-16">STAGE</th>
                  <th className="py-2.5">MOVEMENT / PHASE NAME</th>
                  <th className="py-2.5 text-center">TRANSIT PRIORITY</th>
                  <th className="py-2.5 text-right w-44">DURATION (SEC)</th>
                  <th className="py-2.5 text-right w-24">SPLIT %</th>
                  <th className="py-2.5 text-right w-28">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {activePlan.phases.map((phase, idx) => (
                  <tr key={phase.id} className="hover:bg-slate-800/20">
                    <td className="py-3 font-mono font-bold text-cyan-400">{phase.id}</td>
                    <td className="py-3">
                      <input
                        type="text"
                        value={phase.name}
                        onChange={(e) => {
                          const updated = { ...activePlan };
                          updated.phases[idx].name = e.target.value;
                          setActivePlan(updated);
                        }}
                        className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white w-full max-w-xs focus:outline-none focus:border-cyan-500"
                      />
                    </td>
                    <td className="py-3 text-center">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={phase.is_transit_priority || false}
                          onChange={(e) => {
                            const updated = { ...activePlan };
                            updated.phases[idx].is_transit_priority = e.target.checked;
                            setActivePlan(updated);
                          }}
                          className="rounded accent-emerald-500 cursor-pointer w-4 h-4"
                        />
                        <span className="text-[11px] text-slate-300">Bus Priority</span>
                      </label>
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updatePhaseDuration(idx, phase.duration_seconds - 1)}
                          className="w-7 h-7 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 font-bold border border-slate-700"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={activePlan.cycle_length}
                          value={phase.duration_seconds}
                          onChange={(e) => updatePhaseDuration(idx, parseInt(e.target.value, 10) || 1)}
                          className="w-14 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-center font-mono font-bold text-white"
                        />
                        <button
                          type="button"
                          onClick={() => updatePhaseDuration(idx, phase.duration_seconds + 1)}
                          className="w-7 h-7 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 font-bold border border-slate-700"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="py-3 text-right font-mono text-slate-300 tabular-nums">
                      {Math.round((phase.duration_seconds / activePlan.cycle_length) * 100)}%
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => movePhase(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                          title="Move phase earlier"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => movePhase(idx, 'down')}
                          disabled={idx === activePlan.phases.length - 1}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                          title="Move phase later"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemovePhase(idx)}
                          disabled={activePlan.phases.length <= 1}
                          className="p-1 text-rose-400 hover:text-rose-300 disabled:opacity-30"
                          title="Delete phase"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Save Scenario Modal */}
      {scenarioModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Save Named Scenario Plan</h3>
            <p className="text-xs text-slate-400 mb-4">
              Give this customized timing plan a name (e.g. "Morning Rush Priority", "Game Day Evacuation").
            </p>

            <input
              type="text"
              required
              placeholder="e.g. Peak Transit Surge Split"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white mb-4 focus:outline-none focus:border-cyan-500"
            />

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setScenarioModalOpen(false)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSave('scenario', scenarioName || 'Custom Scenario')}
                className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg"
              >
                Save Scenario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
