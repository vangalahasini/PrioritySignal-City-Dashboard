import React from 'react';
import { NavPage } from './Sidebar';
import { HealthStatus } from '../types';
import { Database, Sparkles, RefreshCw, Menu } from 'lucide-react';

interface TopNavProps {
  currentPage: NavPage;
  onSelectPage: (page: NavPage) => void;
  health: HealthStatus | null;
  onRefresh: () => void;
  onOpenMobileMenu?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentPage,
  onSelectPage,
  health,
  onRefresh,
  onOpenMobileMenu,
}) => {
  const isDbConnected = health?.database === 'connected';

  return (
    <header className="h-16 px-6 bg-slate-950/90 backdrop-blur border-b border-slate-800 flex items-center justify-between gap-8 shrink-0 z-10">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800"
            aria-label="Toggle menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => onSelectPage('overview')}
          className="text-base font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-cyan-300 transition-colors flex items-center gap-2"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block"></span>
          <span>PrioritySignal</span>
        </button>
      </div>

      {/* Zone 2: 4–5 clean single-line text navigation links */}
      <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-400">
        <button
          onClick={() => onSelectPage('overview')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            currentPage === 'overview' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => onSelectPage('gtfs-demo')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            currentPage === 'gtfs-demo' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          GTFS & Demo Data
        </button>
        <button
          onClick={() => onSelectPage('bus-routes')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            currentPage === 'bus-routes' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          Bus Routes
        </button>
        <button
          onClick={() => onSelectPage('intersections')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            currentPage === 'intersections' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          Intersections
        </button>
        <button
          onClick={() => onSelectPage('delay-reports')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            currentPage === 'delay-reports' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          Commuter Reports
        </button>
      </nav>

      {/* Zone 3: 1 primary action with quiet status badge */}
      <div className="flex items-center gap-3 shrink-0">
        <div
          className={`hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md text-[11px] font-mono border ${
            isDbConnected
              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isDbConnected ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
          <span className="truncate max-w-[140px]">
            {isDbConnected ? 'Supabase: Connected' : 'Supabase: In-Memory'}
          </span>
        </div>

        <button
          onClick={() => onSelectPage('gtfs-demo')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
        >
          <Database className="w-3.5 h-3.5" />
          <span>Database & Seed</span>
        </button>
      </div>
    </header>
  );
};
