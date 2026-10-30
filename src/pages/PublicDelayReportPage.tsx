import React, { useState } from 'react';
import { BusRoute, Intersection, DelayReport } from '../types';
import { DemoDataNotice } from '../components/DemoDataNotice';
import {
  MessageSquareWarning,
  Send,
  CheckCircle2,
  AlertCircle,
  Shield,
  ArrowLeft,
} from 'lucide-react';

interface PublicDelayReportPageProps {
  routes: BusRoute[];
  intersections: Intersection[];
  onBackToDashboard?: () => void;
  onReportSubmitted?: (report: DelayReport) => void;
}

export const PublicDelayReportPage: React.FC<PublicDelayReportPageProps> = ({
  routes,
  intersections,
  onBackToDashboard,
  onReportSubmitted,
}) => {
  const [routeId, setRouteId] = useState<string>(routes[0]?.id || 'R10');
  const [intersectionId, setIntersectionId] = useState<string>(intersections[0]?.id || 'INT001');
  const [timeOfDay, setTimeOfDay] = useState<string>('Morning Peak');
  const [dayType, setDayType] = useState<string>('Weekday');
  const [severity, setSeverity] = useState<number>(4);
  const [comment, setComment] = useState<string>('');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (comment.length > 500) {
      setError('Description exceeds maximum permitted length of 500 characters.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/delay-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route_id: routeId,
          intersection_id: intersectionId,
          severity,
          time_of_day: timeOfDay,
          day_type: dayType,
          comment,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSubmitSuccess(true);
        if (onReportSubmitted && json.data) {
          onReportSubmitted(json.data);
        }
      } else {
        setError(json.error || 'Failed to record report. Please try again.');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full max-w-xl mx-auto py-4 px-4 sm:px-6">
      {/* Top Bar with back link */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
        {onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to City Dashboard</span>
          </button>
        )}
        <DemoDataNotice />
      </div>

      {submitSuccess ? (
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-white">Delay Report Submitted Successfully</h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
            Thank you for helping improve city transit. Your report has been recorded in the database and is factored into the PrioritySignal optimization engine to prioritize signal green time.
          </p>
          <div className="pt-4 flex justify-center gap-3">
            <button
              onClick={() => {
                setSubmitSuccess(false);
                setComment('');
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700"
            >
              Submit Another Report
            </button>
            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg"
              >
                Go to Dashboard
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MessageSquareWarning className="w-5 h-5 text-cyan-400" />
              <h1 className="text-xl font-bold text-white">Report Transit Signal Delay</h1>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Help traffic planners eliminate signal bottlenecks. Let us know when your bus is delayed at a red light.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Bus Route */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Affected Bus Route <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={routeId}
                onChange={(e) => setRouteId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              >
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id}: {r.route_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Intersection */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Junction or Intersection <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={intersectionId}
                onChange={(e) => setIntersectionId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {intersections.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.id} — {i.name} ({i.location})
                  </option>
                ))}
              </select>
            </div>

            {/* Time of Day & Day Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Time Window <span className="text-rose-400">*</span>
                </label>
                <select
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Morning Peak">Morning Peak (07:00 – 09:30)</option>
                  <option value="Midday">Midday (11:00 – 14:00)</option>
                  <option value="Evening Peak">Evening Peak (16:30 – 19:00)</option>
                  <option value="Late Night">Late Night (20:00+)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Day of Week <span className="text-rose-400">*</span>
                </label>
                <select
                  value={dayType}
                  onChange={(e) => setDayType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Weekday">Weekday (Mon – Fri)</option>
                  <option value="Weekend">Weekend (Sat – Sun)</option>
                </select>
              </div>
            </div>

            {/* Severity Level (1 - 5) */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Delay Severity: <strong className="text-cyan-400 font-mono">{severity}/5</strong>
                </label>
                <span className="text-[11px] text-slate-400">
                  {severity >= 5
                    ? 'Critical (>90s wait, packed bus)'
                    : severity >= 4
                    ? 'Severe delay'
                    : severity === 3
                    ? 'Moderate red light wait'
                    : 'Minor delay'}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={severity}
                onChange={(e) => setSeverity(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Description */}
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Description of Delay & Passenger Impact</span>
                <span>{comment.length}/500</span>
              </div>
              <textarea
                rows={3}
                maxLength={500}
                placeholder="e.g. Bus R10 held for 85 seconds while cross street had zero cars. More than 50 commuters were late for train transfers..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>

            {/* Privacy Note */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2.5 text-[11px] text-slate-400 leading-relaxed">
              <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>Privacy Notice:</strong> Please do not submit personal names, contact info, vehicle plate numbers, or sensitive confidential information. All reports are aggregated anonymously to optimize signal timings.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 shadow-lg shadow-sky-950/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Submitting Report...' : 'Submit Delay Report'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
