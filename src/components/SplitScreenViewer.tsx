import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  SplitSquareVertical, 
  Satellite, 
  FileText, 
  AlertCircle, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  ArrowLeftRight
} from 'lucide-react';
import { ParcelRecord } from '../types/naksha';

interface SplitScreenViewerProps {
  parcels: ParcelRecord[];
  selectedParcel: ParcelRecord | null;
  onSelectParcel: (parcel: ParcelRecord) => void;
}

export const SplitScreenViewer: React.FC<SplitScreenViewerProps> = ({
  parcels,
  selectedParcel,
  onSelectParcel,
}) => {
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0 to 100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus on selected parcel when clicked
  useEffect(() => {
    if (!selectedParcel) return;
    const idx = parcels.findIndex(p => p.id === selectedParcel.id);
    if (idx !== -1) {
      const cols = 2;
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      setPan({ x: (1 - col) * 120, y: (1 - row) * 120 });
      setZoom(1.2);
    }
  }, [selectedParcel, parcels]);

  const handleMouseDownSlider = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
      setSliderPos(pct);
    } else if (isPanning) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      panStartRef.current = { x: e.clientX, y: e.clientY };
    }
  }, [isDragging, isPanning]);

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsPanning(false);
  };

  const handleStartPan = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.no-pan')) return;
    setIsPanning(true);
    panStartRef.current = { x: e.clientX, y: e.clientY };
  };

  return (
    <div 
      className="relative w-full h-[calc(100vh-105px)] overflow-hidden bg-black select-none flex flex-col"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top Banner Toolbar */}
      <div className="px-4 py-2 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-white font-semibold text-xs">
            <ArrowLeftRight className="w-4 h-4 text-white" />
            <span>Harmonization Split-Screen Swipe Tool</span>
          </div>
          <span className="text-neutral-700">|</span>
          <div className="text-xs text-neutral-300 flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-neutral-200 font-mono">
              <Satellite className="w-3.5 h-3.5 text-white" />
              Left: 2026 UAV Drone ORI (3.5cm GSD) + AI Footprints
            </span>
            <span className="text-neutral-600">vs</span>
            <span className="flex items-center gap-1.5 text-neutral-400 font-mono">
              <FileText className="w-3.5 h-3.5 text-neutral-400" />
              Right: 1974 Cadastral Settlement Record (7/12 Extract)
            </span>
          </div>
        </div>

        {/* Pan / Zoom Controls */}
        <div className="flex items-center gap-1.5 no-pan">
          <button
            onClick={() => setZoom(prev => Math.min(2.5, prev + 0.2))}
            className="p-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(0.6, prev - 0.2))}
            className="p-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); setSliderPos(50); }}
            className="p-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700"
            title="Reset Pan & Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Dual Interactive Canvas */}
      <div 
        ref={containerRef}
        onMouseDown={handleStartPan}
        className="relative flex-1 w-full h-full overflow-hidden cursor-grab active:cursor-grabbing bg-black"
      >
        {/* Transformable Canvas Group */}
        <div 
          className="absolute inset-0 w-full h-full transition-transform duration-75"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          {/* Base Layout: Right Side (Legacy Cadastral Revenue Map Style) */}
          <div className="absolute inset-0 w-full h-full bg-[#121212] flex items-center justify-center p-8">
            {/* Cadastral Blueprint Grid Texture */}
            <div className="relative w-[900px] h-[650px] bg-neutral-950 border-2 border-dashed border-neutral-700 rounded-xl p-8 shadow-2xl overflow-hidden">
              {/* Subtle revenue map seal */}
              <div className="absolute top-4 right-4 text-neutral-800 font-serif text-3xl font-bold uppercase select-none pointer-events-none">
                Maharashtra Land Revenue 1974
              </div>
              <div className="absolute bottom-4 left-4 text-neutral-600 font-mono text-[11px] select-none pointer-events-none">
                Cadastral Sheet No. MH-PN-0948 &bull; Settled by Collector Office
              </div>

              {/* Cadastral Parcels (Revenue View) */}
              <div className="grid grid-cols-2 gap-4 w-full h-full">
                {parcels.map((parcel) => {
                  const isSelected = selectedParcel?.id === parcel.id;
                  return (
                    <div
                      key={`cadastral-${parcel.id}`}
                      onClick={() => onSelectParcel(parcel)}
                      className={`relative p-5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected 
                          ? 'border-white bg-neutral-900 shadow-lg ring-1 ring-white' 
                          : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-600 hover:bg-neutral-900'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-xs font-bold text-neutral-300">
                            {parcel.plotNumber} ({parcel.khasraNumber})
                          </span>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-black text-neutral-400 border border-neutral-800">
                            Revenue Map
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-white">{parcel.ownerName}</h4>
                        <p className="text-xs text-neutral-400 mt-1">{parcel.landUse}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs">
                        <span className="text-neutral-500">Record Area:</span>
                        <strong className="text-neutral-200 font-mono">{parcel.recordedAreaSqm.toFixed(1)} sqm</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Overlaid Left Side (2026 Drone Ortho + AI Footprints + Encroachments) */}
          <div 
            className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
            style={{
              clipPath: `polygon(0% 0%, ${sliderPos}% 0%, ${sliderPos}% 100%, 0% 100%)`,
            }}
          >
            <div className="w-full h-full bg-black flex items-center justify-center p-8 pointer-events-auto">
              {/* Drone Orthophoto Container */}
              <div className="relative w-[900px] h-[650px] bg-neutral-950 border-2 border-white rounded-xl p-8 shadow-2xl overflow-hidden">
                {/* Drone Scanlines & HUD */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
                <div className="absolute top-4 left-4 text-neutral-500 font-mono text-[11px] select-none pointer-events-none">
                  UAV ORTHOPHOTO (GSD 3.5CM) &bull; SAM-Geo ViT-H AI SEGMENTATION
                </div>

                {/* Drone AI Parcels */}
                <div className="grid grid-cols-2 gap-4 w-full h-full relative z-10">
                  {parcels.map((parcel) => {
                    const isSelected = selectedParcel?.id === parcel.id;
                    const isCritical = parcel.status === 'critical_conflict';

                    return (
                      <div
                        key={`drone-${parcel.id}`}
                        onClick={() => onSelectParcel(parcel)}
                        className={`relative p-5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                          isCritical
                            ? 'border-neutral-600 bg-neutral-900/80 hover:bg-neutral-900'
                            : 'border-neutral-700 bg-neutral-900/40 hover:bg-neutral-900/70'
                        } ${isSelected ? 'ring-2 ring-white shadow-xl border-white' : ''}`}
                      >
                        {/* Encroachment Alert Banner */}
                        {isCritical && (
                          <div className="absolute -top-2.5 right-4 bg-white text-black text-[10px] font-bold px-2 py-0.5 rounded shadow flex items-center gap-1 font-mono">
                            <AlertCircle className="w-3 h-3" />
                            ENCROACHMENT (+{(parcel.aiDetectedAreaSqm - parcel.recordedAreaSqm).toFixed(1)} sqm)
                          </div>
                        )}

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-xs font-bold text-white">
                              ULPIN: {parcel.ulpin}
                            </span>
                            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-black text-white border border-neutral-700">
                              Confidence {parcel.confidenceScore}%
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-white">{parcel.ownerName}</h4>
                          <p className="text-xs text-neutral-400 mt-1">
                            Drone Measured Area: <strong className="text-white font-mono">{parcel.aiDetectedAreaSqm.toFixed(1)} sqm</strong>
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs">
                          <span className="text-neutral-400">Hausdorff Drift:</span>
                          <span className="font-mono font-semibold text-white">
                            {parcel.hausdorffDistanceMeters}m
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vertical Swipe Divider Handle (Pure Crisp White) */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize z-30 shadow-[0_0_12px_rgba(255,255,255,0.9)]"
          style={{ left: `${sliderPos}%` }}
          onMouseDown={handleMouseDownSlider}
        >
          {/* Circular Grab Button */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black border-2 border-white shadow-2xl flex items-center justify-center text-white text-xs">
            <ArrowLeftRight className="w-3.5 h-3.5 text-white" />
          </div>

          {/* Top Label Tag */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black text-white font-mono text-[10px] px-2 py-0.5 rounded border border-neutral-700 shadow whitespace-nowrap">
            Swipe Divider ({Math.round(sliderPos)}%)
          </div>
        </div>
      </div>

      {/* Bottom Comparison Drawer if Parcel Selected */}
      {selectedParcel && (
        <div className="px-6 py-2.5 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-xs z-20">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-neutral-400">Inspecting Parcel:</span>
              <span className="ml-2 font-mono font-bold text-white">{selectedParcel.ulpin}</span>
              <span className="ml-2 text-neutral-300 font-medium">({selectedParcel.plotNumber})</span>
            </div>
            <div className="h-4 w-px bg-neutral-800"></div>
            <div>
              <span className="text-neutral-400">Recorded:</span>
              <strong className="ml-1 text-neutral-200 font-mono">{selectedParcel.recordedAreaSqm} sqm</strong>
            </div>
            <div>
              <span className="text-neutral-400">Drone Measured:</span>
              <strong className="ml-1 text-white font-mono">{selectedParcel.aiDetectedAreaSqm} sqm</strong>
            </div>
            <div>
              <span className="text-neutral-400">Deviation:</span>
              <strong className="ml-1 font-mono text-white">
                {((selectedParcel.aiDetectedAreaSqm - selectedParcel.recordedAreaSqm) >= 0 ? '+' : '')}
                {(selectedParcel.aiDetectedAreaSqm - selectedParcel.recordedAreaSqm).toFixed(1)} sqm
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded text-[11px] font-semibold uppercase font-mono bg-neutral-900 text-white border border-neutral-700">
              {selectedParcel.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
