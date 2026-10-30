import React, { useState } from 'react';
import { Intersection, SignalPlan, BusRoute, Approach } from '../types';
import { DemoDataNotice } from '../components/DemoDataNotice';
import {
  Crosshair,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Compass,
  CheckCircle2,
  AlertTriangle,
  X,
  Layers,
  SlidersHorizontal,
} from 'lucide-react';

interface IntersectionsPageProps {
  intersections: Intersection[];
  signalPlans: SignalPlan[];
  routes: BusRoute[];
  onRefresh?: () => void;
}

export const IntersectionsPage: React.FC<IntersectionsPageProps> = ({
  intersections,
  signalPlans,
  routes,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRouteFilter, setSelectedRouteFilter] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string>(intersections[0]?.id || 'INT001');

  // Modal State for Add / Edit
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form Fields
  const [formId, setFormId] = useState<string>('');
  const [formName, setFormName] = useState<string>('');
  const [formLocation, setFormLocation] = useState<string>('');
  const [formLatitude, setFormLatitude] = useState<number>(37.7750);
  const [formLongitude, setFormLongitude] = useState<number>(-122.4190);
  const [formApproaches, setFormApproaches] = useState<Approach[]>([
    { direction: 'Northbound', lanes: 3, hasTransitLane: true, priorityPhase: 1 },
    { direction: 'Southbound', lanes: 3, hasTransitLane: true, priorityPhase: 1 },
    { direction: 'Eastbound', lanes: 2, hasTransitLane: false, priorityPhase: 2 },
    { direction: 'Westbound', lanes: 2, hasTransitLane: false, priorityPhase: 2 },
  ]);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // Filtered Intersections
  const filteredIntersections = intersections.filter((i) => {
    const matchesSearch =
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.id.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const selectedIntersection = intersections.find((i) => i.id === selectedId) || intersections[0];
  const selectedPlan = signalPlans.find((p) => p.intersection_id === selectedId);

  const openCreateModal = () => {
    setModalMode('create');
    setFormId(`INT00${intersections.length + 1}`);
    setFormName('');
    setFormLocation('');
    setFormLatitude(37.7725);
    setFormLongitude(-122.4180);
    setFormApproaches([
      { direction: 'Northbound', lanes: 3, hasTransitLane: true, priorityPhase: 1 },
      { direction: 'Southbound', lanes: 3, hasTransitLane: true, priorityPhase: 1 },
      { direction: 'Eastbound', lanes: 2, hasTransitLane: false, priorityPhase: 2 },
      { direction: 'Westbound', lanes: 2, hasTransitLane: false, priorityPhase: 2 },
    ]);
    setFormError(null);
  };

  const openEditModal = (intNode: Intersection) => {
    setModalMode('edit');
    setFormId(intNode.id);
    setFormName(intNode.name);
    setFormLocation(intNode.location);
    setFormLatitude(intNode.latitude);
    setFormLongitude(intNode.longitude);
    setFormApproaches(JSON.parse(JSON.stringify(intNode.approaches)));
    setFormError(null);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formId || !formName || !formLocation) {
      setFormError('Please fill in ID, Name, and Location.');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      const payload: Intersection = {
        id: formId.trim().toUpperCase(),
        name: formName.trim(),
        location: formLocation.trim(),
        latitude: formLatitude,
        longitude: formLongitude,
        approaches: formApproaches,
      };

      const url = modalMode === 'create' ? '/api/intersections' : `/api/intersections/${formId}`;
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setModalMode(null);
        if (onRefresh) onRefresh();
      } else {
        setFormError(json.error || 'Failed to save intersection');
      }
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/intersections/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setDeleteConfirmId(null);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      alert(`Delete failed: ${(err as Error).message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Signalized Intersections</h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-950 text-cyan-400 border border-sky-800">
              SUPABASE PERSISTENCE
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Manage intersection geometry, approaches, lane allocations, and signal phase configurations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <DemoDataNotice />
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Intersection</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[240px] max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search junctions by name, location, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Showing <span className="text-white font-bold">{filteredIntersections.length}</span> of {intersections.length} intersections
        </div>
      </div>

      {/* Intersection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIntersections.map((intNode) => {
          const isSelected = selectedId === intNode.id;
          const plan = signalPlans.find((p) => p.intersection_id === intNode.id);
          const transitApproaches = intNode.approaches.filter((a) => a.hasTransitLane);

          return (
            <div
              key={intNode.id}
              onClick={() => setSelectedId(intNode.id)}
              className={`cursor-pointer rounded-xl p-5 border transition-all ${
                isSelected
                  ? 'bg-slate-900 border-cyan-500/60 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/40'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-sm font-bold text-cyan-400">{intNode.id}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(intNode);
                    }}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                    title="Edit intersection"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(intNode.id);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800"
                    title="Delete intersection"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h2 className="text-base font-bold text-white mb-1">{intNode.name}</h2>
              <p className="text-xs text-slate-400 mb-4">{intNode.location}</p>

              <div className="space-y-1.5 pt-3 border-t border-slate-800 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Cycle Length:</span>
                  <span className="font-mono text-cyan-300 font-semibold">{plan?.cycle_length ?? 90}s</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Approaches:</span>
                  <span className="font-mono text-white">{intNode.approaches.length} legs</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Transit Lanes:</span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    {transitApproaches.length} dedicated
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Coordinates:</span>
                  <span className="font-mono text-[11px] text-slate-400">
                    {intNode.latitude.toFixed(4)}, {intNode.longitude.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Intersection Details & Approaches Inspector */}
      {selectedIntersection && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-cyan-400" />
                <h2 className="text-lg font-bold text-white">
                  {selectedIntersection.name} ({selectedIntersection.id})
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {selectedIntersection.location} · {selectedIntersection.latitude.toFixed(4)}, {selectedIntersection.longitude.toFixed(4)}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => openEditModal(selectedIntersection)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Configuration</span>
              </button>
            </div>
          </div>

          {/* Approaches Inspector Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {selectedIntersection.approaches.map((app, idx) => (
              <div key={idx} className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    {app.direction} Leg
                  </span>
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="text-xl font-mono font-bold text-white">
                  {app.lanes} <span className="text-xs font-normal text-slate-400">traffic lanes</span>
                </div>
                <div className="pt-2 border-t border-slate-800 text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Bus Lane:</span>
                    <span className={app.hasTransitLane ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                      {app.hasTransitLane ? 'Dedicated' : 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Priority Stage:</span>
                    <span className="font-mono text-cyan-300">Phase {app.priorityPhase || 1}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Intersection Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white">
                {modalMode === 'create' ? 'Add Signalized Intersection' : `Edit Intersection ${formId}`}
              </h3>
              <button onClick={() => setModalMode(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveForm} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Intersection ID</label>
                  <input
                    type="text"
                    required
                    disabled={modalMode === 'edit'}
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    placeholder="e.g. INT007"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Intersection Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Harbor Boulevard Junction"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Street Location / Crossway</label>
                <input
                  type="text"
                  required
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="e.g. Harbor Blvd & Pier 39 Way"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formLatitude}
                    onChange={(e) => setFormLatitude(parseFloat(e.target.value) || 37.77)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formLongitude}
                    onChange={(e) => setFormLongitude(parseFloat(e.target.value) || -122.41)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Approaches Editor */}
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-xs font-bold text-slate-200 mb-2">
                  Approach Legs & Transit Priority Lanes
                </label>
                <div className="space-y-2">
                  {formApproaches.map((app, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800 text-xs">
                      <span className="w-24 font-bold text-white text-[11px] uppercase">{app.direction}</span>
                      <div className="flex items-center gap-1 font-mono">
                        <span className="text-slate-400">Lanes:</span>
                        <input
                          type="number"
                          min="1"
                          max="6"
                          value={app.lanes}
                          onChange={(e) => {
                            const updated = [...formApproaches];
                            updated[idx].lanes = parseInt(e.target.value, 10) || 1;
                            setFormApproaches(updated);
                          }}
                          className="w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center text-white"
                        />
                      </div>
                      <label className="flex items-center gap-1 cursor-pointer ml-2">
                        <input
                          type="checkbox"
                          checked={app.hasTransitLane || false}
                          onChange={(e) => {
                            const updated = [...formApproaches];
                            updated[idx].hasTransitLane = e.target.checked;
                            setFormApproaches(updated);
                          }}
                          className="accent-emerald-500"
                        />
                        <span className="text-slate-300 text-[11px]">Transit Lane</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : 'Save Intersection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Delete Intersection {deleteConfirmId}?</h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              This will remove the intersection, its approach configurations, and baseline signal plans from the database.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
