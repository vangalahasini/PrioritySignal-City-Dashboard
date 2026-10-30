import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import { Intersection, BusRoute, Bus, BusStop } from '../types';
import { Play, Pause, RotateCcw, FastForward, Navigation, Users, Gauge, Radio, AlertTriangle } from 'lucide-react';
import { DemoDataNotice } from './DemoDataNotice';

interface CorridorLeafletMapProps {
  intersections: Intersection[];
  routes: BusRoute[];
  buses: Bus[];
  stops?: BusStop[];
  onBusUpdate?: (buses: Bus[]) => void;
  selectedRouteId?: string | null;
  selectedIntersectionId?: string | null;
  onSelectIntersection?: (id: string) => void;
  onSelectRoute?: (id: string) => void;
}

export const CorridorLeafletMap: React.FC<CorridorLeafletMapProps> = ({
  intersections,
  routes,
  buses: initialBuses,
  stops = [],
  onBusUpdate,
  selectedRouteId,
  selectedIntersectionId,
  onSelectIntersection,
  onSelectRoute,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const busMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const polylinesRef = useRef<L.Polyline[]>([]);
  const intMarkersRef = useRef<L.Marker[]>([]);

  // CARTO API Key from Vite Environment
  const cartoApiKey = import.meta.env.VITE_CARTO_API_KEY;

  // Simulation Controls State
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [localBuses, setLocalBuses] = useState<Bus[]>(initialBuses);
  const [activeTab, setActiveTab] = useState<'all' | string>(selectedRouteId || 'all');

  // Keep localBuses in sync if parent passes updated fleet
  useEffect(() => {
    if (initialBuses.length > 0) {
      setLocalBuses(initialBuses);
    }
  }, [initialBuses]);

  // Simulation tick loop
  const handleTick = useCallback(async () => {
    try {
      const res = await fetch('/api/simulation/tick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speed: speedMultiplier }),
      });
      const data = await res.json();
      if (data.success && data.buses) {
        setLocalBuses(data.buses);
        if (onBusUpdate) onBusUpdate(data.buses);
      }
    } catch {
      // Graceful local movement fallback if network glitch
      setLocalBuses((prev) =>
        prev.map((b) => ({
          ...b,
          latitude: b.latitude + (Math.random() - 0.5) * 0.0005,
          longitude: b.longitude + (Math.random() - 0.5) * 0.0005,
        }))
      );
    }
  }, [speedMultiplier, onBusUpdate]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(handleTick, 1000 / Math.max(1, speedMultiplier));
    return () => clearInterval(interval);
  }, [isPlaying, speedMultiplier, handleTick]);

  const handleReset = async () => {
    try {
      const res = await fetch('/api/simulation/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.buses) {
        setLocalBuses(data.buses);
        if (onBusUpdate) onBusUpdate(data.buses);
      }
    } catch {
      // Local fallback
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Centered around demo city corridor (San Francisco downtown latitude/longitude)
    const map = L.map(mapContainerRef.current, {
      center: [37.773, -122.416],
      zoom: 13,
      zoomControl: true,
      attributionControl: true,
    });

    const tileUrl = cartoApiKey
      ? `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png?api_key=${encodeURIComponent(cartoApiKey)}`
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png';

    // Dark CARTO tile layer with attribution
    L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>',
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [cartoApiKey]);

  // Draw Polylines and Intersections
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous polylines & intersection markers
    polylinesRef.current.forEach((p) => p.remove());
    polylinesRef.current = [];
    intMarkersRef.current.forEach((m) => m.remove());
    intMarkersRef.current = [];

    // Route coordinates
    const routePaths: Record<string, [number, number][]> = {
      R10: [
        [37.7749, -122.4194],
        [37.7770, -122.4150],
        [37.7790, -122.4120],
        [37.7812, -122.4089],
      ],
      R15: [
        [37.7685, -122.4285],
        [37.7640, -122.4180],
        [37.7590, -122.4080],
        [37.7562, -122.3987],
      ],
      R20: [
        [37.7891, -122.4152],
        [37.7820, -122.4210],
        [37.7710, -122.4290],
        [37.7621, -122.4354],
      ],
    };

    // Draw route lines
    routes.forEach((route) => {
      const coords = routePaths[route.id] || [];
      if (coords.length > 0) {
        const poly = L.polyline(coords, {
          color: route.color,
          weight: activeTab === 'all' || activeTab === route.id ? 5 : 2,
          opacity: activeTab === 'all' || activeTab === route.id ? 0.85 : 0.25,
          dashArray: undefined,
        }).addTo(map);

        poly.bindTooltip(`Route ${route.id}: ${route.route_name}`, {
          permanent: false,
          className: 'bg-slate-900 text-white font-mono text-xs border border-slate-700',
        });

        polylinesRef.current.push(poly);
      }
    });

    // Draw Intersections with custom DivIcon
    intersections.forEach((intNode) => {
      const isSelected = selectedIntersectionId === intNode.id;
      const html = `
        <div style="
          width: 28px;
          height: 28px;
          background-color: #0f172a;
          border: 2px solid ${isSelected ? '#38bdf8' : '#0284c7'};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 10px rgba(2, 132, 199, 0.5);
          cursor: pointer;
        ">
          <div style="width: 10px; height: 10px; background-color: #10b981; border-radius: 50%;"></div>
        </div>
      `;

      const icon = L.divIcon({
        html,
        className: 'custom-int-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([intNode.latitude, intNode.longitude], { icon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; min-width: 160px;">
          <strong style="font-size: 13px; color: #0284c7;">${intNode.id}</strong><br/>
          <strong>${intNode.name}</strong><br/>
          <span style="color: #64748b;">${intNode.location}</span><br/>
          <div style="margin-top: 4px; font-weight: bold; color: #059669;">Transit Priority Active</div>
        </div>
      `);

      marker.on('click', () => {
        if (onSelectIntersection) onSelectIntersection(intNode.id);
      });

      intMarkersRef.current.push(marker);
    });
  }, [intersections, routes, activeTab, selectedIntersectionId, onSelectIntersection]);

  // Update Moving Bus Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    localBuses.forEach((bus) => {
      if (activeTab !== 'all' && bus.route_id !== activeTab) {
        if (busMarkersRef.current.has(bus.id)) {
          busMarkersRef.current.get(bus.id)!.remove();
          busMarkersRef.current.delete(bus.id);
        }
        return;
      }

      const route = routes.find((r) => r.id === bus.route_id);
      const color = route?.color || '#38bdf8';

      const busHtml = `
        <div style="
          position: relative;
          cursor: pointer;
          transform: translate(-50%, -50%);
        ">
          <div style="
            width: 22px;
            height: 22px;
            background-color: ${color};
            border: 2px solid #ffffff;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.6);
          ">
            <span style="color: #ffffff; font-size: 9px; font-weight: 800; font-family: monospace;">B</span>
          </div>
          <div style="
            position: absolute;
            top: -16px;
            left: 50%;
            transform: translateX(-50%);
            background: #0f172a;
            border: 1px solid ${color};
            color: #ffffff;
            padding: 1px 4px;
            border-radius: 4px;
            font-size: 8.5px;
            font-weight: bold;
            font-family: monospace;
            white-space: nowrap;
          ">
            ${bus.occupancy}p
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: busHtml,
        className: 'custom-bus-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      if (busMarkersRef.current.has(bus.id)) {
        const marker = busMarkersRef.current.get(bus.id)!;
        marker.setLatLng([bus.latitude, bus.longitude]);
        marker.setIcon(customIcon);
      } else {
        const marker = L.marker([bus.latitude, bus.longitude], { icon: customIcon }).addTo(map);
        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #0f172a;">
            <strong style="color: ${color}; font-size: 13px;">${bus.id} (${bus.route_id})</strong><br/>
            <strong>Load:</strong> ${bus.occupancy} passengers<br/>
            <strong>Speed:</strong> ${bus.speed} km/h<br/>
            <strong>Status:</strong> ${bus.status}
          </div>
        `);
        busMarkersRef.current.set(bus.id, marker);
      }
    });
  }, [localBuses, activeTab, routes]);

  // Find approaching bus recommendation for HUD
  const approachingBusInfo = React.useMemo(() => {
    if (localBuses.length === 0 || intersections.length === 0) return null;

    let nearestBus: Bus | null = null;
    let nearestIntersection: Intersection | null = null;
    let minDistance = Infinity;

    localBuses.forEach((b) => {
      intersections.forEach((ix) => {
        const dLat = b.latitude - ix.latitude;
        const dLng = b.longitude - ix.longitude;
        const dist = Math.sqrt(dLat * dLat + dLng * dLng);
        if (dist < minDistance) {
          minDistance = dist;
          nearestBus = b;
          nearestIntersection = ix;
        }
      });
    });

    if (!nearestBus || !nearestIntersection) return null;

    const distMeters = Math.round(minDistance * 111000);
    const speedMps = 10;
    const etaSec = Math.max(3, Math.round(distMeters / speedMps));
    const busOcc = (nearestBus as Bus).occupancy || 45;
    const needGreenExtension = etaSec <= 25;

    return {
      bus: nearestBus as Bus,
      intersection: nearestIntersection as Intersection,
      distMeters,
      etaSec,
      occupancy: busOcc,
      recommendedAction: needGreenExtension
        ? `+6s Green Extension Recommended (High Occupancy: ${busOcc} passengers)`
        : `Phase Synchronization: Vehicle arrival predicted in ${etaSec}s`,
    };
  }, [localBuses, intersections]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Simulation Top Control Bar */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? 'Pause Simulation' : 'Resume Simulation'}</span>
          </button>

          <button
            onClick={handleReset}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 transition-colors"
            title="Reset bus positions"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            {[1.0, 2.0, 4.0].map((s) => (
              <button
                key={s}
                onClick={() => setSpeedMultiplier(s)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  speedMultiplier === s
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Route Filter Selector */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs">
          <button
            onClick={() => {
              setActiveTab('all');
              if (onSelectRoute) onSelectRoute('');
            }}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Corridors
          </button>
          {routes.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                setActiveTab(r.id);
                if (onSelectRoute) onSelectRoute(r.id);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeTab === r.id
                  ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
              <span>{r.id}</span>
            </button>
          ))}
        </div>

        <DemoDataNotice />
      </div>

      {/* Approaching Bus Real-Time Priority Recommendation HUD */}
      {approachingBusInfo && (
        <div className="bg-sky-950/80 border-b border-sky-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
            <span className="font-mono text-cyan-300 font-bold">
              {approachingBusInfo.bus.id} ({approachingBusInfo.bus.route_id})
            </span>
            <span className="text-slate-400">approaching</span>
            <span className="font-semibold text-white">
              {approachingBusInfo.intersection.name}
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-cyan-300 font-mono">
              ETA: ~{approachingBusInfo.etaSec}s ({approachingBusInfo.distMeters}m)
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold">
              {approachingBusInfo.recommendedAction}
            </span>
          </div>
        </div>
      )}

      {/* CARTO Configuration Warning Banner */}
      {!cartoApiKey && (
        <div className="bg-amber-950/70 border-b border-amber-800/60 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>CARTO Basemap Configuration Notice:</strong> <code className="bg-amber-900/60 px-1 py-0.5 rounded text-amber-300 font-mono">VITE_CARTO_API_KEY</code> is not configured. Falling back to default CARTO dark basemap.
            </span>
          </div>
          <span className="text-[11px] text-amber-400/90 font-medium">Add to Vercel Environment Variables</span>
        </div>
      )}

      {/* Leaflet Map Canvas */}
      <div className="relative w-full h-[480px] bg-[#070d19]">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Map Legend Overlay */}
        <div className="absolute bottom-3 left-3 bg-slate-950/90 backdrop-blur border border-slate-800 rounded-lg p-3 text-xs text-slate-300 pointer-events-auto z-10 shadow-lg space-y-1.5">
          <div className="font-semibold text-white text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>Map Layers</span>
          </div>
          <div className="text-[11px] space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full border-2 border-sky-400 bg-emerald-500 inline-block" />
              <span>Signalized Junction ({intersections.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-cyan-500 border border-white inline-block" />
              <span>Simulated Transit Fleet ({localBuses.length})</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 pt-1 border-t border-slate-800">
              <span>Simulation Status:</span>
              <span className={isPlaying ? 'text-emerald-400 font-mono' : 'text-amber-400 font-mono'}>
                {isPlaying ? `Running (${speedMultiplier}x)` : 'Paused'}
              </span>
            </div>
          </div>
        </div>

        {/* Permanent Mandatory Simulation Disclaimer */}
        <div className="absolute top-3 right-3 bg-slate-950/90 backdrop-blur border border-slate-800 rounded-md px-3 py-1.5 text-[10px] font-mono text-amber-400 pointer-events-auto z-10 shadow">
          DEMO SIMULATION — NO REAL TRAFFIC SIGNALS ARE CONTROLLED
        </div>
      </div>
    </div>
  );
};
