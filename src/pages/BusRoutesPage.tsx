import React, { useState } from 'react';
import { BusRoute, Bus, Intersection, BusStop } from '../types';
import { DemoDataNotice } from '../components/DemoDataNotice';
import { CorridorLeafletMap } from '../components/CorridorLeafletMap';
import { DEMO_BUS_STOPS } from '../server/demoData';
import { Route as RouteIcon, Bus as BusIcon, Users, MapPin, Gauge, Activity, Compass, ArrowRight } from 'lucide-react';

interface BusRoutesPageProps {
  routes: BusRoute[];
  buses: Bus[];
  intersections: Intersection[];
  onBusUpdate?: (buses: Bus[]) => void;
}

export const BusRoutesPage: React.FC<BusRoutesPageProps> = ({
  routes,
  buses,
  intersections,
  onBusUpdate,
}) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string>(routes[0]?.id || 'R10');

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];
  const activeBusesOnRoute = buses.filter((b) => b.route_id === selectedRouteId);
  const totalPax = activeBusesOnRoute.reduce((sum, b) => sum + b.occupancy, 0);

  // Filter stops for selected route
  const stopsForRoute = DEMO_BUS_STOPS.filter((s) => s.route_id === selectedRouteId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Bus Transit Corridors & Map</h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-950 text-cyan-400 border border-sky-800">
              LEAFLET OSM ENGINE
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time deterministic simulation of bus transit lines, stop sequences, and prioritized intersections.
          </p>
        </div>

        <DemoDataNotice />
      </div>

      {/* Interactive Map Component with Simulation Controls */}
      <CorridorLeafletMap
        intersections={intersections}
        routes={routes}
        buses={buses}
        stops={DEMO_BUS_STOPS}
        onBusUpdate={onBusUpdate}
        selectedRouteId={selectedRouteId}
        onSelectRoute={setSelectedRouteId}
      />

      {/* Route Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {routes.map((route) => {
          const routeBuses = buses.filter((b) => b.route_id === route.id);
          const isSelected = selectedRouteId === route.id;
          const routePax = routeBuses.reduce((sum, b) => sum + b.occupancy, 0);

          return (
            <div
              key={route.id}
              onClick={() => setSelectedRouteId(route.id)}
              className={`cursor-pointer rounded-xl p-5 border transition-all ${
                isSelected
                  ? 'bg-slate-900 border-sky-500/60 shadow-lg shadow-sky-950/40 ring-1 ring-sky-500/40'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: route.color }}
                  />
                  <span className="font-mono text-base font-bold text-white">{route.id}</span>
                </div>
                <span className="text-[11px] font-mono text-cyan-400">
                  {routeBuses.length} buses running
                </span>
              </div>

              <h2 className="text-sm font-semibold text-slate-200">{route.route_name}</h2>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <span>{route.start_point}</span>
                <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                <span>{route.end_point}</span>
              </p>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500">Live Passengers</span>
                <span className="font-mono font-bold text-emerald-400 tabular-nums">
                  {routePax} persons
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Route Detail & Stop Sequences */}
      {selectedRoute && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stop Sequences (1 col) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Stops in Sequence</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {stopsForRoute.length} stations
              </span>
            </div>

            <div className="space-y-3 relative before:absolute before:top-2 before:bottom-2 before:left-3 before:w-0.5 before:bg-slate-800">
              {stopsForRoute.map((stop, index) => (
                <div key={stop.id} className="relative flex items-start gap-3 pl-1 text-xs">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold text-white z-10 shrink-0"
                    style={{ backgroundColor: selectedRoute.color }}
                  >
                    {stop.stop_sequence}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200">{stop.stop_name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Buses on Corridor (2 cols) */}
          <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Corridor {selectedRoute.id} Fleet Telemetry
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Vehicles dispatched along {selectedRoute.route_name}
                </p>
              </div>

              <div className="text-right text-xs font-mono">
                <span className="text-slate-500">Total Load: </span>
                <span className="text-emerald-400 font-bold">{totalPax} passengers</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono">
                    <th className="py-2.5">BUS ID</th>
                    <th className="py-2.5">COORDINATES</th>
                    <th className="py-2.5 text-right">OCCUPANCY</th>
                    <th className="py-2.5 text-right">SPEED</th>
                    <th className="py-2.5 text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {activeBusesOnRoute.map((bus) => (
                    <tr key={bus.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 text-white font-bold flex items-center gap-2">
                        <BusIcon className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{bus.id}</span>
                      </td>
                      <td className="py-2.5 text-slate-400 tabular-nums">
                        {bus.latitude.toFixed(4)}, {bus.longitude.toFixed(4)}
                      </td>
                      <td className="py-2.5 text-right text-emerald-400 font-bold tabular-nums">
                        {bus.occupancy} persons
                      </td>
                      <td className="py-2.5 text-right text-slate-300 tabular-nums">
                        {bus.speed} km/h
                      </td>
                      <td className="py-2.5 text-right">
                        <span className="capitalize text-amber-300 font-sans text-xs">
                          {bus.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
