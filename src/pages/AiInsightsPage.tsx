import React, { useState } from 'react';
import { DemoDataNotice } from '../components/DemoDataNotice';
import {
  Sparkles,
  Brain,
  FileText,
  ShieldCheck,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Users,
  Compass,
  ArrowRight,
  TrendingDown,
  Info,
} from 'lucide-react';
import { Scenario, Intersection, BusRoute, DelayReport, AiInsightReport } from '../types';

interface AiInsightsPageProps {
  scenarios: Scenario[];
  intersections: Intersection[];
  routes: BusRoute[];
  delayReports: DelayReport[];
  onNavigateToOptimization?: () => void;
}

export const AiInsightsPage: React.FC<AiInsightsPageProps> = ({
  scenarios,
  intersections,
  routes,
  delayReports,
  onNavigateToOptimization,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    scenarios[0]?.id || ''
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [report, setReport] = useState<AiInsightReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const selectedScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];

  const handleGenerateInsights = async () => {
    if (!selectedScenario) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseline: selectedScenario.baseline_metrics,
          optimized: selectedScenario.optimized_metrics,
        }),
      });

      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
      } else {
        setError(data.error || 'Failed to generate AI insights.');
      }
    } catch (err) {
      setError((err as Error).message || 'Network error reaching AI insights service.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReport = () => {
    if (!report) return;
    const text = `
PRIORITYSIGNAL — GEMINI AI TRANSIT BRIEFING
Scenario: ${selectedScenario?.name || 'Corridor Priority'}
Generated: ${report.generatedAt}
Engine: ${report.modelUsed}

1. EXECUTIVE SUMMARY
${report.summary}

2. TRANSIT & BUS ADHERENCE BENEFITS
${report.transitBenefits}

3. PRIMARY PASSENGER BENEFICIARIES
${report.passengerBeneficiaries.map((b) => `• ${b}`).join('\n')}

4. TRADE-OFFS & CROSS-STREET IMPACT
${report.tradeOffs}

5. REMAINING BOTTLENECK INTERSECTIONS
${report.bottleneckIntersections.map((b) => `• ${b}`).join('\n')}

6. MODEL ASSUMPTIONS & RISKS
${report.risksAndLimitations.map((r) => `• ${r}`).join('\n')}

7. NEXT SIMULATION RECOMMENDATIONS
${report.nextSimulationRecommendations.map((n) => `• ${n}`).join('\n')}

NOTICE: DEMO SIMULATION ONLY — NO REAL TRAFFIC SIGNALS ARE CONTROLLED.
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Gemini AI Strategic Insights & Executive Briefings
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
              GEMINI-3.8-FLASH
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Server-side AI synthesis of measured simulation data into plain-language council briefings, trade-off audits, and commuter sentiment clustering.
          </p>
        </div>

        <DemoDataNotice />
      </div>

      {/* Control Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="text-slate-400 font-medium">Select Scenario to Analyze:</span>
          <select
            value={selectedScenarioId}
            onChange={(e) => setSelectedScenarioId(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500 font-medium"
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.id})
              </option>
            ))}
          </select>

          {selectedScenario && (
            <div className="text-slate-500 text-[11px] font-mono">
              Measured delay savings:{' '}
              <span className="text-emerald-400 font-bold">
                {selectedScenario.baseline_metrics?.averageBusDelaySeconds &&
                selectedScenario.optimized_metrics?.averageBusDelaySeconds
                  ? `-${(
                      selectedScenario.baseline_metrics.averageBusDelaySeconds -
                      selectedScenario.optimized_metrics.averageBusDelaySeconds
                    ).toFixed(1)}s / bus`
                  : 'Pending'}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {report && (
            <button
              onClick={handleCopyReport}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Briefing' : 'Copy Full Report'}</span>
            </button>
          )}

          <button
            onClick={handleGenerateInsights}
            disabled={loading || !selectedScenario}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white text-xs font-semibold shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Sparkles className="w-4 h-4 text-cyan-200" />
            )}
            <span>{loading ? 'Synthesizing with Gemini...' : report ? 'Regenerate Briefing' : 'Generate Executive Briefing'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Briefing Output Cards */}
      {report ? (
        <div className="space-y-6">
          {/* Metadata bar */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 bg-slate-950/60 border border-slate-800/80 rounded-lg px-4 py-2.5">
            <div className="flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Model: <span className="text-white font-semibold">{report.modelUsed}</span></span>
              <span>·</span>
              <span>Source: <span className="text-cyan-300">{report.dataSource}</span></span>
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              Generated: {new Date(report.generatedAt).toLocaleTimeString()}
            </div>
          </div>

          {/* Section 1: Executive Summary */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
              <FileText className="w-4 h-4" />
              <span>1. Executive Summary for City Council & Transit Leadership</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-sans">
              {report.summary}
            </p>
          </div>

          {/* Section 2: Transit Benefits & Beneficiaries Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <Brain className="w-4 h-4" />
                <span>2. Why Priority Timing Benefits Transit</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {report.transitBenefits}
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
                <Users className="w-4 h-4" />
                <span>3. Primary Commuter Beneficiaries</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {report.passengerBeneficiaries.map((b, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold shrink-0">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Section 3: Trade-Offs & Bottlenecks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <TrendingDown className="w-4 h-4" />
                <span>4. Measured Auto & Cross-Street Trade-Offs</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {report.tradeOffs}
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>5. Remaining Bottleneck Intersections</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {report.bottleneckIntersections.map((ix, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold shrink-0">•</span>
                    <span>{ix}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Section 4: Risks & Next Simulation Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>6. Modeling Assumptions & Limitations</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {report.risksAndLimitations.map((risk, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold shrink-0">•</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                <Compass className="w-4 h-4" />
                <span>7. Next Simulation Iteration Steps</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {report.nextSimulationRecommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold shrink-0">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Permanent Disclaimer */}
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-center text-[11px] text-slate-500 font-mono">
            DEMO SIMULATION ONLY — NO REAL TRAFFIC SIGNALS ARE CONTROLLED. Generated using Google Gemini API based on deterministic simulation outputs.
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-10 text-center space-y-4 max-w-2xl mx-auto">
          <div className="w-12 h-12 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center mx-auto">
            <Brain className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-white">Generate Plain-Language Executive Briefings</h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
            Click <strong>"Generate Executive Briefing"</strong> to evaluate scenario <span className="text-cyan-300 font-mono font-semibold">{selectedScenario?.name || 'Selected Corridor'}</span> with Gemini AI. It audits person-delay trade-offs, commuter bottleneck clustering, and pedestrian clearance safety.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-2 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Strict server-side execution. Zero fabricated numbers.</span>
          </div>
        </div>
      )}
    </div>
  );
};
