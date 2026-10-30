import React, { useState } from 'react';
import { Intersection, BusRoute, Bus, DelayReport } from '../types';
import { Bus as BusIcon, Radio, Navigation, Users, Gauge, Clock, Layers } from 'lucide-react';
import { DemoDataNotice } from './DemoDataNotice';

interface NetworkSchematicMapProps {
  intersections: Intersection[];
  routes: BusRoute[];
  buses: Bus[];
  delayReports: DelayReport[];
}

export const NetworkSchematicMap: React.FC<NetworkSchematicMapProps> = ({
  intersections,
  routes,
  buses,
  delayReports,
}) => {
  const [selectedItem, setSelectedItem] = useState<{
    type: 'intersection' | 'bus';
    data: any;
  } | null>(null);

  // Geographic bounds to project SVG coordinates
  // Lat: 37.756 to 37.790 (~0.034 range)
  // Lng: -122.438 to -122.398 (~0.040 range)
  const minLat = 37.754;
  const maxLat = 37.792;
  const minLng = -122.438;
  const maxLng = -122.396;

  const projectX = (lng: number) => {
    return 60 + ((lng - minLng) / (maxLng - minLng)) * 680;
  };

  const projectY = (lat: number) => {
    return 440 - ((lat - minLat) / (maxLat - minLat)) * 380;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden relative shadow-lg">
      {/* Header bar */}
      <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/60">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Transit Corridor & Signal Network Map</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time positions of {buses.length} simulated buses across {intersections.length} prioritized intersections
          </p>
        </div>

        <DemoDataNotice />
      </div>

      {/* Map Canvas */}
      <div className="relative w-full h-[460px] bg-[#070d19] overflow-hidden select-none">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#0284c7 1px, #070d19 1px)',
            backgroundSize: '32px 32px',
            backgroundPosition: '0 0, 16px 16px',
          }}
        />

        <svg className="w-full h-full" viewBox="0 0 800 480" preserveAspectRatio="xMidYMid meet">
          {/* Route Connection Paths */}
          {/* Route 10: Central Market to Bus Terminal */}
          <path
            d={`M ${projectX(-122.4194)} ${projectY(37.7749)} L ${projectX(-122.4089)} ${projectY(37.7812)}`}
            stroke="#0284c7"
            strokeWidth="4"
            strokeDasharray="none"
            opacity="0.8"
          />
          {/* Route 15: Railway Station to Tech Park */}
          <path
            d={`M ${projectX(-122.4285)} ${projectY(37.7685)} Q ${projectX(-122.415)} ${projectY(37.761)} ${projectX(-122.3987)} ${projectY(37.7562)}`}
            stroke="#06b6d4"
            strokeWidth="4"
            opacity="0.8"
          />
          {/* Route 20: College Road to Main Hospital */}
          <path
            d={`M ${projectX(-122.4152)} ${projectY(37.7891)} Q ${projectX(-122.423)} ${projectY(37.777)} ${projectX(-122.4354)} ${projectY(37.7621)}`}
            stroke="#10b981"
            strokeWidth="4"
            opacity="0.8"
          />

          {/* Intersections (Junction Nodes) */}
          {intersections.map((intNode) => {
            const cx = projectX(intNode.longitude);
            const cy = projectY(intNode.latitude);
            const reportsCount = delayReports.filter((r) => r.intersection_id === intNode.id).length;
            const isSelected = selectedItem?.type === 'intersection' && selectedItem?.data?.id === intNode.id;

            return (
              <g
                key={intNode.id}
                className="cursor-pointer group"
                onClick={() => setSelectedItem({ type: 'intersection', data: intNode })}
              >
                {/* Pulse ring if reports exist */}
                {reportsCount > 0 && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r="22"
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    className="animate-spin"
                    style={{ transformOrigin: `${cx}px ${cy}px`, animationDuration: '8s' }}
                  />
                )}

                {/* Outer halo */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isSelected ? 16 : 12}
                  fill="#0f172a"
                  stroke={isSelected ? '#38bdf8' : '#334155'}
                  strokeWidth="2.5"
                />

                {/* Signal core: Green for active, amber if reports */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isSelected ? 8 : 6}
                  fill={reportsCount > 0 ? '#f59e0b' : '#10b981'}
                />

                {/* Label badge */}
                <text
                  x={cx}
                  y={cy + 22}
                  textAnchor="middle"
                  fill="#e2e8f0"
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  {intNode.id}
                </text>
                <text
                  x={cx}
                  y={cy + 34}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="9.5"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  {intNode.name.replace(' Junction', '')}
                </text>
              </g>
            );
          })}

          {/* Active Buses */}
          {buses.map((bus) => {
            const bx = projectX(bus.longitude);
            const by = projectY(bus.latitude);
            const isSelected = selectedItem?.type === 'bus' && selectedItem?.data?.id === bus.id;
            const route = routes.find((r) => r.id === bus.route_id);
            const color = route?.color || '#38bdf8';

            return (
              <g
                key={bus.id}
                className="cursor-pointer"
                onClick={() => setSelectedItem({ type: 'bus', data: bus })}
              >
                <circle
                  cx={bx}
                  cy={by}
                  r={isSelected ? 14 : 10}
                  fill={color}
                  opacity="0.25"
                />
                <circle
                  cx={bx}
                  cy={by}
                  r={isSelected ? 8 : 6}
                  fill={color}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />

                {/* Passenger Occupancy Tag */}
                <rect
                  x={bx + 8}
                  y={by - 14}
                  width="36"
                  height="16"
                  rx="3"
                  fill="#0f172a"
                  stroke={color}
                  strokeWidth="1"
                />
                <text
                  x={bx + 26}
                  y={by - 3}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="8.5"
                  fontWeight="bold"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {bus.occupancy}p
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend Overlay */}
        <div className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 pointer-events-auto">
          <div className="font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
            <Radio className="w-3 h-3 text-cyan-400" />
            <span>Transit Corridor Legend</span>
          </div>
          <div className="space-y-1 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-1 bg-[#0284c7] rounded"></span>
              <span>R10: Central Market ↔ Terminal</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-1 bg-[#06b6d4] rounded"></span>
              <span>R15: Railway ↔ Tech Park</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-1 bg-[#10b981] rounded"></span>
              <span>R20: College Rd ↔ Main Hospital</span>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-slate-800 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Signal Node</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ml-1"></span>
              <span>Delay Hotspot</span>
            </div>
          </div>
        </div>

        {/* Selected Node Details Drawer / Popover */}
        {selectedItem && (
          <div className="absolute top-3 right-3 max-w-xs w-72 bg-slate-900/95 backdrop-blur border border-slate-700/80 rounded-xl p-3.5 shadow-2xl text-xs z-10">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span className="font-bold text-white text-sm">
                {selectedItem.type === 'intersection' ? selectedItem.data.name : selectedItem.data.id}
              </span>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {selectedItem.type === 'intersection' ? (
              <div className="space-y-2 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Location:</span>
                  <span className="font-medium text-white">{selectedItem.data.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Approaches:</span>
                  <span className="font-mono text-cyan-300">{selectedItem.data.approaches.length} legs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Transit Priority:</span>
                  <span className="text-emerald-400 font-semibold">Enabled</span>
                </div>
                <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                  Coordinates: {selectedItem.data.latitude.toFixed(4)}, {selectedItem.data.longitude.toFixed(4)}
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-slate-300">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Assigned Route:</span>
                  <span className="font-bold text-cyan-400">{selectedItem.data.route_id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Passenger Load:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {selectedItem.data.occupancy} persons
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Vehicle Speed:</span>
                  <span className="font-mono text-white">{selectedItem.data.speed} km/h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Current Status:</span>
                  <span className="capitalize font-mono text-amber-300">{selectedItem.data.status}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
