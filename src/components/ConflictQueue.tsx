import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Filter, 
  MapPin, 
  Radio, 
  FileCheck, 
  History, 
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { ParcelRecord, AuditLogEntry } from '../types/naksha';

interface ConflictQueueProps {
  parcels: ParcelRecord[];
  auditLogs: AuditLogEntry[];
  onResolveParcel: (
    parcelId: string, 
    action: 'HARMONIZED_APPROVED' | 'CORS_DISPATCHED' | 'BOUNDARY_SNAPPED', 
    remarks: string
  ) => void;
  onSelectParcel: (parcel: ParcelRecord) => void;
}

export const ConflictQueue: React.FC<ConflictQueueProps> = ({
  parcels,
  auditLogs,
  onResolveParcel,
  onSelectParcel,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'queue' | 'audit'>('queue');
  const [selectedForAction, setSelectedForAction] = useState<ParcelRecord | null>(null);
  const [resolutionRemarks, setResolutionRemarks] = useState<string>('');

  const filteredParcels = parcels.filter(p => {
    const matchesSearch = 
      p.ulpin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.plotNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.khasraNumber.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'conflicts_only') {
      return p.status === 'critical_conflict' || p.status === 'pending_review';
    }
    if (filterStatus === 'critical') return p.status === 'critical_conflict';
    if (filterStatus === 'pending') return p.status === 'pending_review';
    if (filterStatus === 'harmonized') return p.status === 'harmonized';
    if (filterStatus === 'cors') return p.status === 'cors_resurvey';
    return true;
  });

  const handleExecuteResolution = (action: 'HARMONIZED_APPROVED' | 'CORS_DISPATCHED' | 'BOUNDARY_SNAPPED') => {
    if (!selectedForAction) return;
    const defaultRemarks = {
      HARMONIZED_APPROVED: 'Surveyor verified drone orthophoto physical boundary against field demarcations. Approved for digital ROR.',
      CORS_DISPATCHED: 'High Hausdorff drift (>2m). CORS DGPS field survey team dispatched to benchmark SoI pillars.',
      BOUNDARY_SNAPPED: 'Applied ST_Snap with 0.5m tolerance to reconcile cadastral sliver gap with adjoining plot.',
    }[action];

    onResolveParcel(selectedForAction.id, action, resolutionRemarks || defaultRemarks);
    setSelectedForAction(null);
    setResolutionRemarks('');
  };

  return (
    <div className="w-full h-[calc(100vh-105px)] overflow-y-auto bg-black p-6 text-neutral-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header & Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-950 p-5 rounded-xl border border-neutral-800">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-neutral-900 text-white border border-neutral-700">
                <AlertTriangle className="w-5 h-5 text-white" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Surveyor Spatial Conflict Queue &amp; Harmonization Workbench
                </h2>
                <p className="text-xs text-neutral-400">
                  Review discrepancies flagged by PostGIS auto-topology engine (&lt;80% confidence, boundary drifts, unrecorded constructions).
                </p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1.5 bg-black p-1 rounded-lg border border-neutral-800">
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'queue'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Conflict Queue ({parcels.filter(p => p.status !== 'harmonized').length})
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'audit'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Immutable Audit Trail ({auditLogs.length})</span>
            </button>
          </div>
        </div>

        {activeTab === 'queue' ? (
          <>
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-950 p-3 rounded-lg border border-neutral-800">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search ULPIN, Owner, Plot, or Khasra..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-md text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-white"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                <Filter className="w-3.5 h-3.5 text-neutral-400" />
                <span className="text-xs text-neutral-400 whitespace-nowrap">Filter:</span>
                {[
                  { id: 'all', label: 'All Parcels' },
                  { id: 'conflicts_only', label: 'Action Needed' },
                  { id: 'critical', label: 'Critical (<70%)' },
                  { id: 'pending', label: 'Review (70-79%)' },
                  { id: 'harmonized', label: 'Harmonized' },
                  { id: 'cors', label: 'CORS Re-survey' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setFilterStatus(opt.id)}
                    className={`px-2.5 py-1 rounded text-xs whitespace-nowrap transition-colors font-medium ${
                      filterStatus === opt.id
                        ? 'bg-white text-black font-semibold'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Parcels Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredParcels.map((parcel) => {
                const isCritical = parcel.status === 'critical_conflict';
                const isPending = parcel.status === 'pending_review';
                const isHarmonized = parcel.status === 'harmonized';
                const isCors = parcel.status === 'cors_resurvey';
                const areaDeviation = parcel.aiDetectedAreaSqm - parcel.recordedAreaSqm;

                return (
                  <div
                    key={parcel.id}
                    className={`bg-neutral-950 rounded-xl border p-5 flex flex-col justify-between transition-all hover:border-neutral-500 ${
                      isCritical
                        ? 'border-neutral-700'
                        : isPending
                        ? 'border-neutral-800'
                        : isCors
                        ? 'border-neutral-700'
                        : 'border-neutral-850'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-xs font-bold text-white bg-neutral-900 px-2 py-1 rounded border border-neutral-800">
                          {parcel.plotNumber} &bull; Kh: {parcel.khasraNumber}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono border ${
                          isHarmonized
                            ? 'bg-white text-black border-white'
                            : isCritical
                            ? 'bg-neutral-900 text-white border-neutral-600'
                            : isCors
                            ? 'bg-neutral-900 text-neutral-300 border-neutral-700'
                            : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                        }`}>
                          {parcel.status.replace('_', ' ')}
                        </span>
                      </div>

                      {/* ULPIN & Owner */}
                      <div className="mb-3">
                        <span className="text-[11px] font-mono text-neutral-400 block mb-0.5">
                          ULPIN: {parcel.ulpin}
                        </span>
                        <h3 className="font-semibold text-white text-sm">{parcel.ownerName}</h3>
                        <p className="text-xs text-neutral-400">{parcel.municipalWard}</p>
                      </div>

                      {/* Discrepancy & Confidence Box */}
                      <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-2 mb-3">
                        {/* Confidence Score Bar */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-neutral-400">Confidence Score:</span>
                            <span className="font-mono font-bold text-white">
                              {parcel.confidenceScore}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-white rounded-full transition-all"
                              style={{ width: `${parcel.confidenceScore}%` }}
                            />
                          </div>
                        </div>

                        {/* Quantitative Metrics */}
                        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                          <div>
                            <span className="text-neutral-500 block">Recorded Area</span>
                            <span className="text-neutral-200 font-mono font-medium">{parcel.recordedAreaSqm.toFixed(1)} m²</span>
                          </div>
                          <div>
                            <span className="text-neutral-500 block">Drone ORI Area</span>
                            <span className="text-white font-mono font-medium">{parcel.aiDetectedAreaSqm.toFixed(1)} m²</span>
                          </div>
                          <div>
                            <span className="text-neutral-500 block">Hausdorff Drift</span>
                            <span className="text-white font-mono font-medium">
                              {parcel.hausdorffDistanceMeters}m
                            </span>
                          </div>
                          <div>
                            <span className="text-neutral-500 block">Area Variance</span>
                            <span className="text-white font-mono font-medium">
                              {areaDeviation >= 0 ? '+' : ''}{areaDeviation.toFixed(1)} m²
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Conflict details */}
                      {parcel.conflictType !== 'none' && (
                        <div className="text-[11px] p-2.5 rounded-lg bg-black border border-neutral-800 text-neutral-300 space-y-1 mb-3">
                          <div className="flex items-center gap-1 font-semibold text-white">
                            <AlertTriangle className="w-3.5 h-3.5 text-white" />
                            <span>Conflict: {parcel.conflictType.replace('_', ' ').toUpperCase()}</span>
                          </div>
                          <p className="text-neutral-400 leading-tight">{parcel.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-neutral-850 space-y-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onSelectParcel(parcel)}
                          className="flex-1 py-1.5 px-3 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 border border-neutral-700"
                        >
                          <MapPin className="w-3.5 h-3.5 text-neutral-300" />
                          <span>Locate on Map</span>
                        </button>

                        <button
                          onClick={() => setSelectedForAction(parcel)}
                          className="flex-1 py-1.5 px-3 rounded-md bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Resolve</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* Immutable Audit Trail View */
          <div className="bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden shadow-xl">
            <div className="p-4 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white text-sm">PostGIS Cadastral Mutation &amp; Resolution Audit Log</h3>
                <p className="text-xs text-neutral-400">Cryptographically verifiable trail for legal court admissible land evidence.</p>
              </div>
              <span className="px-2.5 py-1 rounded bg-black text-white border border-neutral-700 text-xs font-mono">
                PostGIS Trigger Enforced
              </span>
            </div>

            <div className="divide-y divide-neutral-850">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-neutral-900/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">{log.ulpin}</span>
                      <span className="text-neutral-600">&bull;</span>
                      <span className="px-2 py-0.5 rounded bg-neutral-800 text-white font-semibold font-mono text-[10px] border border-neutral-700">
                        {log.action}
                      </span>
                    </div>
                    <p className="text-neutral-300">{log.remarks}</p>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                      <span>Surveyor: <strong className="text-neutral-300">{log.surveyor}</strong></span>
                      <span>({log.role})</span>
                    </div>
                  </div>

                  <div className="text-right sm:text-right flex sm:flex-col items-center sm:items-end justify-between gap-1">
                    <span className="font-mono text-[11px] text-neutral-400">{log.timestamp}</span>
                    <div className="flex items-center gap-1 font-mono text-[11px]">
                      <span className="text-neutral-500">{log.previousConfidence}%</span>
                      <ArrowRight className="w-3 h-3 text-neutral-500" />
                      <span className="text-white font-bold">{log.newConfidence}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Surveyor Action Modal */}
        {selectedForAction && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-neutral-950 border border-neutral-700 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div>
                  <h3 className="font-bold text-white text-base">Surveyor Conflict Resolution</h3>
                  <span className="font-mono text-xs text-neutral-400">ULPIN: {selectedForAction.ulpin} ({selectedForAction.plotNumber})</span>
                </div>
                <button
                  onClick={() => setSelectedForAction(null)}
                  className="text-neutral-400 hover:text-white text-sm"
                >
                  &times;
                </button>
              </div>

              <div className="p-3 rounded-lg bg-black border border-neutral-800 text-xs space-y-1">
                <div>Owner: <strong className="text-white">{selectedForAction.ownerName}</strong></div>
                <div>Recorded: <strong className="text-neutral-300">{selectedForAction.recordedAreaSqm} m²</strong> | Drone: <strong className="text-white">{selectedForAction.aiDetectedAreaSqm} m²</strong></div>
                <div>Hausdorff Drift: <strong className="text-white">{selectedForAction.hausdorffDistanceMeters} meters</strong></div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Surveyor Justification / Resolution Remarks:
                </label>
                <textarea
                  rows={3}
                  value={resolutionRemarks}
                  onChange={(e) => setResolutionRemarks(e.target.value)}
                  placeholder="Enter legal findings, CORS baseline observations, or town planning clearance notes..."
                  className="w-full p-2.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => handleExecuteResolution('HARMONIZED_APPROVED')}
                  className="w-full py-2 px-3 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-semibold flex items-center justify-center gap-2 shadow"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Accept AI Harmonized Boundary (Score &rarr; 98%)</span>
                </button>

                <button
                  onClick={() => handleExecuteResolution('BOUNDARY_SNAPPED')}
                  className="w-full py-2 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold flex items-center justify-center gap-2 border border-neutral-700"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>Execute PostGIS ST_Snap (Reconcile Sliver Gap)</span>
                </button>

                <button
                  onClick={() => handleExecuteResolution('CORS_DISPATCHED')}
                  className="w-full py-2 px-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold flex items-center justify-center gap-2 border border-neutral-800"
                >
                  <Radio className="w-4 h-4 text-neutral-300" />
                  <span>Dispatch Field CORS DGPS Team (Millimeter Survey)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
