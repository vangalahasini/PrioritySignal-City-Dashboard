import React from 'react';
import {
  LayoutDashboard,
  Database,
  Route as RouteIcon,
  Crosshair,
  SlidersHorizontal,
  MessageSquareWarning,
  Zap,
  BarChart3,
  GitCompare,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
  Radio,
} from 'lucide-react';

export type NavPage =
  | 'overview'
  | 'gtfs-demo'
  | 'bus-routes'
  | 'intersections'
  | 'signal-timeline'
  | 'delay-reports'
  | 'public-delay-report'
  | 'optimization-engine'
  | 'performance-metrics'
  | 'scenario-comparison'
  | 'ai-insights'
  | 'settings';

interface SidebarProps {
  currentPage: NavPage;
  onSelectPage: (page: NavPage) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  id: NavPage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  phase?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  collapsed,
  onToggleCollapse,
}) => {
  const primaryNavItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'gtfs-demo', label: 'GTFS & Demo Data', icon: Database },
    { id: 'bus-routes', label: 'Bus Routes', icon: RouteIcon },
    { id: 'intersections', label: 'Intersections', icon: Crosshair },
    { id: 'signal-timeline', label: 'Signal Timeline Editor', icon: SlidersHorizontal },
    { id: 'delay-reports', label: 'Commuter Delay Reports', icon: MessageSquareWarning },
  ];

  const advancedNavItems: NavItem[] = [
    { id: 'optimization-engine', label: 'Optimization Engine', icon: Zap, phase: 'Phase 2' },
    { id: 'performance-metrics', label: 'Performance Metrics', icon: BarChart3, phase: 'Phase 2' },
    { id: 'scenario-comparison', label: 'Scenario Comparison', icon: GitCompare, phase: 'Phase 2' },
    { id: 'ai-insights', label: 'AI Insights', icon: Sparkles, phase: 'Phase 3' },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`relative bg-slate-950 border-r border-slate-800 transition-all duration-300 flex flex-col z-20 shrink-0 ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Brand Mobility Icon: Traffic Signal + Transit Wave */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 via-cyan-500 to-emerald-400 p-0.5 shrink-0 shadow-lg shadow-sky-950/50">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center relative">
              <Radio className="w-4 h-4 text-cyan-400" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
          </div>

          {!collapsed && (
            <div className="truncate">
              <span className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1">
                PrioritySignal
              </span>
              <span className="block text-[10px] text-slate-400 truncate">
                People First. Smarter Signals.
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Core Operations */}
        <div>
          {!collapsed && (
            <div className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
              Core Operations
            </div>
          )}
          <nav className="space-y-1">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectPage(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-all text-left group ${
                    isActive
                      ? 'bg-sky-500/15 text-sky-300 font-semibold border border-sky-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-300'
                    }`}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Intelligence & Architecture */}
        <div>
          {!collapsed && (
            <div className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
              Analysis & Settings
            </div>
          )}
          <nav className="space-y-1">
            {advancedNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectPage(item.id)}
                  title={collapsed ? `${item.label} (${item.phase || ''})` : undefined}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all text-left group ${
                    isActive
                      ? 'bg-sky-500/15 text-sky-300 font-semibold border border-sky-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-300'
                      }`}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!collapsed && item.phase && (
                    <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                      {item.phase}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Pill */}
      {!collapsed && (
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 text-[11px] text-slate-500">
          <div className="flex items-center justify-between font-mono text-[10px] text-slate-400 mb-1">
            <span>PHASE 1 BUILD</span>
            <span className="text-cyan-400">READY</span>
          </div>
          <div className="text-[10px] text-slate-500 leading-tight">
            Optimizing for people moved per green second.
          </div>
        </div>
      )}
    </aside>
  );
};
