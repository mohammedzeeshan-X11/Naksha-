import React from 'react';
import { 
  Layers, 
  SplitSquareVertical, 
  AlertTriangle, 
  Code2, 
  Cpu, 
  Satellite, 
  CheckCircle2, 
  Radio,
  Home
} from 'lucide-react';
import { ParcelRecord } from '../types/naksha';

interface NavbarProps {
  currentTab: 'landing' | 'map' | 'split' | 'queue';
  setCurrentTab: (tab: 'landing' | 'map' | 'split' | 'queue') => void;
  parcels: ParcelRecord[];
  onOpenPipeline: () => void;
  onOpenCodeHub: () => void;
  mapEngine: 'openlayers' | 'leaflet';
  setMapEngine: (engine: 'openlayers' | 'leaflet') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  parcels,
  onOpenPipeline,
  onOpenCodeHub,
  mapEngine,
  setMapEngine,
}) => {
  const harmonizedCount = parcels.filter(p => p.status === 'harmonized').length;
  const conflictCount = parcels.filter(p => p.status === 'critical_conflict' || p.status === 'pending_review').length;
  const avgConfidence = Math.round(
    parcels.reduce((acc, p) => acc + p.confidenceScore, 0) / (parcels.length || 1)
  );

  return (
    <header className="bg-black/95 backdrop-blur border-b border-neutral-800 text-white sticky top-0 z-50 shadow-md">
      {/* Top Banner with SIH PS ID & Government Programme header */}
      <div className="px-4 py-1.5 bg-neutral-950 text-xs text-neutral-400 flex items-center justify-between border-b border-neutral-850">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white text-black font-semibold tracking-wide text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse"></span>
            SIH PS ID: 26013
          </span>
          <span className="hidden sm:inline text-neutral-700">|</span>
          <span className="hidden sm:inline font-medium text-neutral-300">
            Ministry of Rural Development &bull; Department of Land Resources (DoLR)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-neutral-300 font-mono text-[11px]">
            <Radio className="w-3 h-3 text-white animate-pulse" />
            CORS Network: 4 Stations Locked (RMSE ±1.5cm)
          </div>
          <span className="hidden md:inline text-neutral-700">|</span>
          <span className="hidden md:inline text-neutral-400 font-mono text-[11px]">
            Pilot Zone: Pune Urban Ward 14 (EPSG:4326 / 32643)
          </span>
        </div>
      </div>

      {/* Main Bar */}
      <div className="px-4 py-2 flex items-center justify-between gap-4">
        {/* Brand */}
        <div 
          onClick={() => setCurrentTab('landing')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 rounded-lg bg-neutral-900 border border-neutral-700 p-0.5 flex items-center justify-center shadow-inner group-hover:border-neutral-500 transition-colors">
            <Satellite className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold tracking-tight text-base sm:text-lg text-white">
                NAKSHA <span className="font-light text-neutral-400">GeoAI Platform</span>
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-900 text-neutral-300 border border-neutral-700 font-medium">
                v2.4
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 hidden sm:block tracking-tight">
              AI-Powered Urban Land Harmonization &amp; Spatial Conflict Engine
            </p>
          </div>
        </div>

        {/* View Switcher Tabs (Monochrome Professional) */}
        <nav className="flex items-center bg-neutral-950 p-1 rounded-lg border border-neutral-800 shadow-inner">
          <button
            onClick={() => setCurrentTab('landing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              currentTab === 'landing'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setCurrentTab('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              currentTab === 'map'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Interactive Web-GIS</span>
          </button>

          <button
            onClick={() => setCurrentTab('split')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              currentTab === 'split'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Split-Screen</span> Swipe
          </button>

          <button
            onClick={() => setCurrentTab('queue')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all relative ${
              currentTab === 'queue'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Conflict Queue</span>
            {conflictCount > 0 && (
              <span className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                currentTab === 'queue' ? 'bg-black text-white' : 'bg-white text-black'
              }`}>
                {conflictCount}
              </span>
            )}
          </button>
        </nav>

        {/* Action Controls & Metrics */}
        <div className="flex items-center gap-2">
          {/* Engine Selector (OpenLayers vs Leaflet) */}
          <div className="hidden lg:flex items-center bg-neutral-950 p-0.5 rounded-md border border-neutral-800 text-[11px]">
            <button
              onClick={() => setMapEngine('openlayers')}
              className={`px-2 py-1 rounded font-medium transition-all ${
                mapEngine === 'openlayers'
                  ? 'bg-neutral-800 text-white font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Switch to OpenLayers 10 Web-GIS Engine"
            >
              OpenLayers
            </button>
            <button
              onClick={() => setMapEngine('leaflet')}
              className={`px-2 py-1 rounded font-medium transition-all ${
                mapEngine === 'leaflet'
                  ? 'bg-neutral-800 text-white font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Switch to Leaflet Engine"
            >
              Leaflet
            </button>
          </div>

          {/* Quick Stats Pill */}
          <div className="hidden xl:flex items-center gap-3 px-3 py-1.5 rounded-md bg-neutral-900/80 border border-neutral-800 text-xs">
            <div className="flex items-center gap-1.5 text-neutral-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              <span>Harmonized:</span>
              <strong className="text-white font-mono">{harmonizedCount}/{parcels.length}</strong>
            </div>
            <div className="h-3 w-px bg-neutral-800"></div>
            <div className="text-neutral-300">
              Avg Score: <strong className="text-white font-mono">{avgConfidence}%</strong>
            </div>
          </div>

          {/* Trigger AI ETL Pipeline Modal */}
          <button
            onClick={onOpenPipeline}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-colors border border-neutral-700 shadow-sm"
            title="Simulate Drone GeoTIFF Ingestion & SAM-Geo Segmentation"
          >
            <Cpu className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">GeoAI</span> Pipeline
          </button>

          {/* Architecture & Code Hub Modal */}
          <button
            onClick={onOpenCodeHub}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition-colors shadow-sm"
            title="Inspect PostGIS DDL, Architecture Diagram & Python SAM-Geo Code"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Specs &amp;</span> DDL Code
          </button>
        </div>
      </div>
    </header>
  );
};
