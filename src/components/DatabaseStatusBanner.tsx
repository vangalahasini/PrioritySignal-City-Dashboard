import React, { useState } from 'react';
import { Database, CheckCircle2, AlertTriangle, RefreshCw, Sparkles, Server } from 'lucide-react';
import { HealthStatus } from '../types';

interface DatabaseStatusBannerProps {
  health: HealthStatus | null;
  loading: boolean;
  onRefresh: () => void;
  onSeedSuccess?: () => void;
}

export const DatabaseStatusBanner: React.FC<DatabaseStatusBannerProps> = ({
  health,
  loading,
  onRefresh,
  onSeedSuccess,
}) => {
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      setSeedResult(null);
      const res = await fetch('/api/seed', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setSeedResult(`✓ ${json.message}`);
        if (onSeedSuccess) onSeedSuccess();
      } else {
        setSeedResult(`⚠ ${json.message}`);
      }
    } catch (err) {
      setSeedResult(`⚠ Seeding error: ${(err as Error).message}`);
    } finally {
      setSeeding(false);
    }
  };

  const isConnected = health?.database === 'connected';
  const isUnconfigured = health?.database === 'missing_credentials';
  const isTablesMissing = health?.database === 'tables_missing';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-lg shrink-0 mt-0.5 ${
              isConnected
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : isTablesMissing
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
            }`}
          >
            {isConnected ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : isTablesMissing ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <Database className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">
                {isConnected
                  ? 'Supabase PostgreSQL Database Connected'
                  : isTablesMissing
                  ? 'Supabase Connected — Tables Need Migration'
                  : 'Supabase PostgreSQL Data Layer'}
              </h2>
              <span
                className={`text-xs px-2 py-0.5 rounded font-mono ${
                  isConnected
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {isConnected ? 'LIVE DATABASE' : 'DETERMINISTIC FALLBACK'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {isConnected ? (
                <>
                  Verified connection to remote PostgreSQL tables. All reads and seed queries are persisting
                  to Supabase via server-side service role client.
                </>
              ) : isTablesMissing ? (
                <>
                  Connected to Supabase URL, but the schema tables have not been created. Run{' '}
                  <code className="text-cyan-300 font-mono">supabase/migrations/001_initial_schema.sql</code>{' '}
                  in your Supabase SQL Editor.
                </>
              ) : (
                <>
                  Server operating in fallback mode with full deterministic urban datasets (6 junctions, 3 routes, 12 buses).
                  To connect live PostgreSQL, set <code className="text-cyan-300 font-mono">SUPABASE_URL</code> and{' '}
                  <code className="text-cyan-300 font-mono">SUPABASE_SECRET_KEY</code> in server environment variables.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors disabled:opacity-50"
            title="Check connection health"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Check Health</span>
          </button>

          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 rounded-lg shadow-sm transition-all disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
            <span>{seeding ? 'Seeding Data...' : 'Seed Demo Data'}</span>
          </button>
        </div>
      </div>

      {seedResult && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs font-mono text-cyan-300 flex items-center justify-between">
          <span>{seedResult}</span>
          <button
            onClick={() => setSeedResult(null)}
            className="text-slate-500 hover:text-slate-300 text-xs ml-4"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};
