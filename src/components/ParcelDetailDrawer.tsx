import React from 'react';
import { 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  MapPin, 
  Radio, 
  Sparkles, 
  Scale, 
  Compass, 
  Building2, 
  FileCheck2,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { ParcelRecord } from '../types/naksha';

interface ParcelDetailDrawerProps {
  parcel: ParcelRecord | null;
  onClose: () => void;
  onResolve: (action: 'HARMONIZED_APPROVED' | 'CORS_DISPATCHED' | 'BOUNDARY_SNAPPED') => void;
}

export const ParcelDetailDrawer: React.FC<ParcelDetailDrawerProps> = ({
  parcel,
  onClose,
  onResolve,
}) => {
  if (!parcel) return null;

  const isHarmonized = parcel.status === 'harmonized';
  const isCritical = parcel.status === 'critical_conflict';
  const isPending = parcel.status === 'pending_review';
  const areaDiff = parcel.aiDetectedAreaSqm - parcel.recordedAreaSqm;
  const areaDiffPct = ((areaDiff / parcel.recordedAreaSqm) * 100).toFixed(1);

  return (
    <div className="absolute top-3 bottom-3 right-3 w-96 bg-neutral-950/98 backdrop-blur-md border border-neutral-800 rounded-xl shadow-2xl z-20 flex flex-col overflow-hidden text-neutral-200 text-xs animate-in slide-in-from-right-4 duration-150">
      {/* Drawer Header */}
      <div className="p-4 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block font-medium">
            Cadastral Parcel Inspection
          </span>
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <span>{parcel.plotNumber}</span>
            <span className="text-neutral-400 font-normal">({parcel.khasraNumber})</span>
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors border border-neutral-700"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {/* ULPIN (Bhu-Aadhaar) Hero Badge */}
        <div className="p-3.5 rounded-lg bg-black border border-neutral-800 space-y-1">
          <div className="text-[10px] font-medium text-neutral-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
              <span>ULPIN (Bhu-Aadhaar Standard)</span>
            </span>
            <span className="px-1.5 py-0.2 rounded bg-neutral-900 text-white font-mono text-[10px] border border-neutral-800">
              DoLR
            </span>
          </div>
          <div className="font-mono text-sm font-bold text-white tracking-widest">
            {parcel.ulpin}
          </div>
        </div>

        {/* Status & Confidence Meter */}
        <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">Harmonization Status:</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono border ${
              isHarmonized
                ? 'bg-white text-black border-white'
                : isCritical
                ? 'bg-neutral-800 text-white border-neutral-600'
                : 'bg-neutral-900 text-neutral-300 border-neutral-700'
            }`}>
              {parcel.status.replace('_', ' ')}
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-neutral-400">Confidence Metric:</span>
              <span className="font-mono font-bold text-white">
                {parcel.confidenceScore}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all rounded-full"
                style={{ width: `${parcel.confidenceScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Area Comparison: Recorded vs Drone ORI */}
        <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-2">
          <div className="font-semibold text-white flex items-center gap-1.5 border-b border-neutral-800 pb-1.5">
            <Scale className="w-3.5 h-3.5 text-neutral-400" />
            <span>Spatial Extent Comparison</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2 rounded bg-black border border-neutral-800">
              <span className="text-[10px] text-neutral-400 block">Legacy Revenue (7/12)</span>
              <span className="font-mono font-bold text-neutral-200 text-sm">{parcel.recordedAreaSqm.toFixed(1)} m²</span>
            </div>
            <div className="p-2 rounded bg-black border border-neutral-800">
              <span className="text-[10px] text-neutral-400 block">Drone ORI Measured</span>
              <span className="font-mono font-bold text-white text-sm">{parcel.aiDetectedAreaSqm.toFixed(1)} m²</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1 px-1">
            <span className="text-neutral-400">Net Variance:</span>
            <span className="font-mono font-bold text-white">
              {areaDiff >= 0 ? '+' : ''}{areaDiff.toFixed(1)} m² ({areaDiffPct}%)
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] px-1">
            <span className="text-neutral-400">Hausdorff Boundary Drift:</span>
            <span className="font-mono font-bold text-white">
              {parcel.hausdorffDistanceMeters} meters
            </span>
          </div>
        </div>

        {/* Ownership & Administrative Attributes */}
        <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-2">
          <div className="font-semibold text-white flex items-center gap-1.5 border-b border-neutral-800 pb-1.5">
            <Building2 className="w-3.5 h-3.5 text-neutral-400" />
            <span>Administrative Details</span>
          </div>

          <div className="space-y-1.5 text-neutral-300">
            <div className="flex justify-between">
              <span className="text-neutral-500">Record Owner:</span>
              <span className="font-medium text-white">{parcel.ownerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Land Use:</span>
              <span className="text-neutral-200">{parcel.landUse}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Jurisdiction:</span>
              <span className="text-neutral-200">{parcel.municipalWard}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Last Survey:</span>
              <span className="font-mono text-neutral-400">{parcel.lastSurveyDate}</span>
            </div>
          </div>
        </div>

        {/* Conflict Diagnostic Info */}
        {parcel.conflictType !== 'none' && (
          <div className="p-3 rounded-lg bg-black border border-neutral-700 space-y-1.5">
            <div className="flex items-center gap-1.5 text-white font-semibold">
              <AlertTriangle className="w-4 h-4 text-white" />
              <span>Conflict Diagnosis: {parcel.conflictType.replace('_', ' ').toUpperCase()}</span>
            </div>
            <p className="text-neutral-300 text-[11px] leading-relaxed">
              {parcel.notes}
            </p>
            {parcel.surveyorNotes && (
              <div className="pt-1.5 border-t border-neutral-800 text-[11px] text-neutral-300">
                <strong className="text-white">Surveyor Field Note:</strong> {parcel.surveyorNotes}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Quick Action Buttons */}
      <div className="p-3.5 bg-neutral-900 border-t border-neutral-800 space-y-2">
        <button
          onClick={() => onResolve('HARMONIZED_APPROVED')}
          className="w-full py-2 px-3 rounded-lg bg-white hover:bg-neutral-200 text-black font-semibold flex items-center justify-center gap-1.5 transition-colors shadow"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Approve &amp; Harmonize Boundary</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onResolve('BOUNDARY_SNAPPED')}
            className="py-1.5 px-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium flex items-center justify-center gap-1 transition-colors border border-neutral-700"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>ST_Snap</span>
          </button>
          <button
            onClick={() => onResolve('CORS_DISPATCHED')}
            className="py-1.5 px-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium flex items-center justify-center gap-1 transition-colors border border-neutral-700"
          >
            <Radio className="w-3.5 h-3.5 text-white" />
            <span>CORS Rover</span>
          </button>
        </div>
      </div>
    </div>
  );
};
