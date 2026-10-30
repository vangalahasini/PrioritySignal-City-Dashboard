/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, NavPage } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { OverviewPage } from './pages/OverviewPage';
import { GtfsDemoDataPage } from './pages/GtfsDemoDataPage';
import { BusRoutesPage } from './pages/BusRoutesPage';
import { IntersectionsPage } from './pages/IntersectionsPage';
import { SignalTimelinePage } from './pages/SignalTimelinePage';
import { DelayReportsPage } from './pages/DelayReportsPage';
import { PublicDelayReportPage } from './pages/PublicDelayReportPage';
import { OptimizationEnginePage } from './pages/OptimizationEnginePage';
import { PerformanceMetricsPage } from './pages/PerformanceMetricsPage';
import { ScenarioComparisonPage } from './pages/ScenarioComparisonPage';
import { AiInsightsPage } from './pages/AiInsightsPage';
import { SettingsPage } from './pages/SettingsPage';
import {
  Intersection,
  BusRoute,
  Bus,
  DelayReport,
  SignalPlan,
  Scenario,
  HealthStatus,
} from './types';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default function App() {
  // Check if initial route is /delay-report
  const initialPage: NavPage =
    typeof window !== 'undefined' && window.location.pathname === '/delay-report'
      ? 'public-delay-report'
      : 'overview';

  const [currentPage, setCurrentPage] = useState<NavPage>(initialPage);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Data states
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [intersections, setIntersections] = useState<Intersection[]>([]);
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [delayReports, setDelayReports] = useState<DelayReport[]>([]);
  const [signalPlans, setSignalPlans] = useState<SignalPlan[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Concurrent data fetching from server API
      const [
        healthRes,
        intRes,
        routesRes,
        busesRes,
        reportsRes,
        plansRes,
        scenRes,
      ] = await Promise.all([
        fetch('/api/health').then((r) => r.json()).catch(() => null),
        fetch('/api/intersections').then((r) => r.json()),
        fetch('/api/routes').then((r) => r.json()),
        fetch('/api/buses').then((r) => r.json()),
        fetch('/api/delay-reports').then((r) => r.json()),
        fetch('/api/signal-plans').then((r) => r.json()),
        fetch('/api/scenarios').then((r) => r.json()),
      ]);

      if (healthRes) setHealth(healthRes);
      if (intRes?.data) setIntersections(intRes.data);
      if (routesRes?.data) setRoutes(routesRes.data);
      if (busesRes?.data) setBuses(busesRes.data);
      if (reportsRes?.data) setDelayReports(reportsRes.data);
      if (plansRes?.data) setSignalPlans(plansRes.data);
      if (scenRes?.data) setScenarios(scenRes.data);
    } catch (err) {
      console.error('[PrioritySignal] Data fetch error:', err);
      setError('Unable to reach the PrioritySignal backend server. Ensure server is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleAddReport = (report: DelayReport) => {
    setDelayReports((prev) => [report, ...prev]);
  };

  const handleBusUpdate = (updatedBuses: Bus[]) => {
    setBuses(updatedBuses);
  };

  const handleSavePlan = (savedPlan: SignalPlan) => {
    setSignalPlans((prev) => {
      const idx = prev.findIndex((p) => p.id === savedPlan.id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = savedPlan;
        return copy;
      }
      return [...prev, savedPlan];
    });
  };

  const handleSaveScenario = (name: string, result: any) => {
    fetchAllData();
  };

  // If user is accessing standalone /delay-report public portal
  if (currentPage === 'public-delay-report') {
    return (
      <div className="min-h-screen bg-[#0b1120] text-slate-100 flex flex-col justify-center py-8">
        <PublicDelayReportPage
          routes={routes}
          intersections={intersections}
          onBackToDashboard={() => setCurrentPage('overview')}
          onReportSubmitted={handleAddReport}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b1120] text-slate-100 font-sans antialiased">
      {/* Sidebar - Desktop and Tablet */}
      <Sidebar
        currentPage={currentPage}
        onSelectPage={(page) => {
          setCurrentPage(page);
          setMobileMenuOpen(false);
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navigation */}
        <TopNav
          currentPage={currentPage}
          onSelectPage={setCurrentPage}
          health={health}
          onRefresh={fetchAllData}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* Viewport Content Area */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={fetchAllData}
                  className="px-2.5 py-1 rounded bg-rose-950 border border-rose-800 text-rose-200 font-medium hover:bg-rose-900 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Page Router */}
            {currentPage === 'overview' && (
              <OverviewPage
                intersections={intersections}
                routes={routes}
                buses={buses}
                delayReports={delayReports}
                signalPlans={signalPlans}
                health={health}
                loading={loading}
                onRefresh={fetchAllData}
                onNavigate={setCurrentPage}
              />
            )}

            {currentPage === 'gtfs-demo' && (
              <GtfsDemoDataPage
                intersections={intersections}
                routes={routes}
                buses={buses}
                delayReports={delayReports}
                signalPlans={signalPlans}
                health={health}
                onRefresh={fetchAllData}
              />
            )}

            {currentPage === 'bus-routes' && (
              <BusRoutesPage
                routes={routes}
                buses={buses}
                intersections={intersections}
                onBusUpdate={handleBusUpdate}
              />
            )}

            {currentPage === 'intersections' && (
              <IntersectionsPage
                intersections={intersections}
                signalPlans={signalPlans}
                routes={routes}
                onRefresh={fetchAllData}
              />
            )}

            {currentPage === 'signal-timeline' && (
              <SignalTimelinePage
                signalPlans={signalPlans}
                intersections={intersections}
                buses={buses}
                onSavePlan={handleSavePlan}
              />
            )}

            {currentPage === 'delay-reports' && (
              <DelayReportsPage
                reports={delayReports}
                intersections={intersections}
                routes={routes}
                onAddReport={handleAddReport}
                onNavigateToPublicForm={() => setCurrentPage('public-delay-report')}
              />
            )}

            {currentPage === 'optimization-engine' && (
              <OptimizationEnginePage
                intersections={intersections}
                routes={routes}
                signalPlans={signalPlans}
                onSaveScenario={handleSaveScenario}
              />
            )}

            {currentPage === 'performance-metrics' && (
              <PerformanceMetricsPage
                intersections={intersections}
                routes={routes}
                buses={buses}
                delayReports={delayReports}
                scenarios={scenarios}
                signalPlans={signalPlans}
                onNavigateToOptimization={() => setCurrentPage('optimization-engine')}
              />
            )}

            {currentPage === 'scenario-comparison' && (
              <ScenarioComparisonPage
                scenarios={scenarios}
                signalPlans={signalPlans}
                onRefresh={fetchAllData}
                onNavigateToOptimization={() => setCurrentPage('optimization-engine')}
              />
            )}

            {currentPage === 'ai-insights' && (
              <AiInsightsPage
                scenarios={scenarios}
                intersections={intersections}
                routes={routes}
                delayReports={delayReports}
                onNavigateToOptimization={() => setCurrentPage('optimization-engine')}
              />
            )}

            {currentPage === 'settings' && (
              <SettingsPage
                health={health}
                loading={loading}
                onRefresh={fetchAllData}
                scenarios={scenarios}
                intersections={intersections}
                routes={routes}
                delayReports={delayReports}
                signalPlans={signalPlans}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
