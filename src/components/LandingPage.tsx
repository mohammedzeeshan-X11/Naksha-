import React from 'react';
import { 
  Satellite, 
  Layers, 
  SplitSquareVertical, 
  AlertTriangle, 
  Database, 
  Cpu, 
  ArrowRight, 
  CheckCircle2, 
  Radio, 
  FileCheck2, 
  MapPin, 
  Code2, 
  Building2, 
  ShieldCheck,
  ChevronRight,
  Terminal,
  Scale
} from 'lucide-react';
import { ParcelRecord } from '../types/naksha';

interface LandingPageProps {
  onLaunchConsole: (initialTab?: 'map' | 'split' | 'queue') => void;
  onOpenCodeHub: () => void;
  onOpenPipeline: () => void;
  parcels: ParcelRecord[];
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchConsole,
  onOpenCodeHub,
  onOpenPipeline,
  parcels,
}) => {
  const harmonizedCount = parcels.filter(p => p.status === 'harmonized').length;
  const conflictCount = parcels.filter(p => p.status !== 'harmonized').length;
  const totalParcels = parcels.length;
  const avgConfidence = Math.round(
    parcels.reduce((acc, p) => acc + p.confidenceScore, 0) / (totalParcels || 1)
  );

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col font-sans selection:bg-neutral-850 selection:text-white">
      {/* Top Ministerial Notification Ribbon */}
      <div className="border-b border-neutral-800 bg-neutral-950 py-2 px-4 text-xs text-neutral-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white tracking-wide">
              NAKSHA PROGRAMME
            </span>
            <span className="text-neutral-600">·</span>
            <span>Ministry of Rural Development &bull; Department of Land Resources (DoLR)</span>
            <span className="text-neutral-600">·</span>
            <span className="font-mono text-neutral-300">SIH PS ID: 26013</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-neutral-400">
            <span className="flex items-center gap-1.5 text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              CORS Network Live (RMSE ±1.5cm)
            </span>
            <span className="text-neutral-700">|</span>
            <span>Pilot: Pune Urban Sector 14</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative border-b border-neutral-800 bg-black pt-16 pb-20 px-4 overflow-hidden">
        {/* Subtle grid backdrop */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-3xl space-y-6">
            <div className="text-xs uppercase font-mono tracking-widest text-neutral-400">
              GeoAI Urban Land Record Harmonization Platform
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.1]">
              Automated cadastral synchronization with sub-centimeter GeoAI precision.
            </h1>

            <p className="text-base sm:text-lg text-neutral-400 leading-relaxed max-w-2xl font-normal">
              An enterprise platform engineered for the NAKSHA Programme to ingest drone orthophotos, auto-georeference legacy revenue settlement sheets, resolve spatial conflicts via PostGIS topology, and generate 14-digit Bhu-Aadhaar (ULPIN) land identity.
            </p>

            {/* Call to Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onLaunchConsole('map')}
                className="px-5 py-2.5 rounded-md bg-white hover:bg-neutral-200 text-black font-semibold text-sm transition-all flex items-center gap-2 shadow-sm"
              >
                <span>Launch Interactive Web-GIS</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onLaunchConsole('split')}
                className="px-5 py-2.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-sm transition-all border border-neutral-700 flex items-center gap-2"
              >
                <SplitSquareVertical className="w-4 h-4 text-neutral-300" />
                <span>Open Split-Screen Swipe</span>
              </button>

              <button
                onClick={onOpenCodeHub}
                className="px-4 py-2.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-900 text-sm font-medium transition-colors border border-transparent hover:border-neutral-800 flex items-center gap-1.5"
              >
                <Code2 className="w-4 h-4" />
                <span>View DDL &amp; GeoAI Specs</span>
              </button>
            </div>

            {/* Live Operational Metrics (Zero-pill, high contrast typography) */}
            <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-6 border-t border-neutral-850">
              <div>
                <div className="text-2xl font-bold font-mono text-white tracking-tight">{totalParcels}</div>
                <div className="text-xs text-neutral-400 mt-0.5">Pilot Parcels Ingested</div>
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-white tracking-tight">{harmonizedCount}</div>
                <div className="text-xs text-neutral-400 mt-0.5">Harmonized (&ge;80%)</div>
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-white tracking-tight">{conflictCount}</div>
                <div className="text-xs text-neutral-400 mt-0.5">Action In Queue</div>
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-white tracking-tight">±1.4 cm</div>
                <div className="text-xs text-neutral-400 mt-0.5">CORS Base RMSE</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Interactive Preview Teaser Card */}
      <section className="border-b border-neutral-800 bg-neutral-950 py-16 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="text-xs uppercase font-mono tracking-widest text-neutral-400 mb-1">
                Mission Capabilities
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Designed for Town Surveyors, Revenue Collectors, and GIS Engineers.
              </h2>
            </div>
            <button
              onClick={() => onLaunchConsole('queue')}
              className="text-xs font-semibold text-white hover:text-neutral-300 flex items-center gap-1 self-start md:self-auto font-mono underline decoration-neutral-700 underline-offset-4"
            >
              <span>Inspect Surveyor Conflict Queue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            {/* Feature 1 */}
            <div className="bg-black border border-neutral-800 p-6 rounded-xl flex flex-col justify-between space-y-4 hover:border-neutral-600 transition-colors">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-neutral-700 flex items-center justify-center">
                  <Satellite className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Multi-Source Ingestion &amp; COG Streaming
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Converts ultra-high-resolution drone GeoTIFFs (3.5cm GSD) into Cloud-Optimized GeoTIFFs (COG) with 512x512 tiling and internal pyramids. Standardizes disparate coordinate systems directly into EPSG:4326 / UTM 43N.
                </p>
              </div>
              <div className="text-[11px] font-mono text-neutral-500 pt-2 border-t border-neutral-850">
                GDAL &bull; Rasterio &bull; COG HTTP Range Requests
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-black border border-neutral-800 p-6 rounded-xl flex flex-col justify-between space-y-4 hover:border-neutral-600 transition-colors">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-neutral-700 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-bold text-white">
                  GeoAI Feature Extraction (SAM-Geo ViT-H)
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Automated building footprint and physical compound wall extraction using the Segment Anything Model for Geospatial. Employs SIFT + RANSAC tie-points to auto-georeference scanned 1974 revenue sheets.
                </p>
              </div>
              <div className="text-[11px] font-mono text-neutral-500 pt-2 border-t border-neutral-850">
                PyTorch &bull; SAM-Geo &bull; OpenCV Feature Matching
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-black border border-neutral-800 p-6 rounded-xl flex flex-col justify-between space-y-4 hover:border-neutral-600 transition-colors">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-neutral-700 flex items-center justify-center">
                  <Database className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-bold text-white">
                  PostGIS Auto-Topology &amp; Conflict Engine
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Enforces rigorous spatial integrity using ST_MakeValid, ST_Snap, and ST_Difference queries. Automatically flags road encroachments and Hausdorff drifts into an immutable auditor queue.
                </p>
              </div>
              <div className="text-[11px] font-mono text-neutral-500 pt-2 border-t border-neutral-850">
                PostgreSQL 15+ &bull; PostGIS Topology &bull; GIST Spatial Index
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* System Workflow Comparison Section */}
      <section className="border-b border-neutral-800 bg-black py-16 px-4">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="max-w-2xl space-y-2">
            <div className="text-xs uppercase font-mono tracking-widest text-neutral-400">
              End-to-End Pipeline
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              From raw drone flight survey to immutable cadastral deed.
            </h2>
            <p className="text-xs text-neutral-400">
              How the NAKSHA platform closes discrepancies between century-old revenue papers and physical ground realities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="border border-neutral-800 bg-neutral-950 p-5 rounded-lg space-y-2">
              <div className="font-mono text-xs text-neutral-500 font-bold">01 / INGESTION</div>
              <h4 className="text-sm font-semibold text-white">UAV &amp; Legacy Ingest</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Raw ortho raster reprojected, converted to Cloud-Optimized GeoTIFF, and matched against CORS SoI pillars.
              </p>
            </div>

            <div className="border border-neutral-800 bg-neutral-950 p-5 rounded-lg space-y-2">
              <div className="font-mono text-xs text-neutral-500 font-bold">02 / SEGMENTATION</div>
              <h4 className="text-sm font-semibold text-white">Deep GeoAI Inference</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                SAM-Geo ViT-H extracts parcel boundaries and building polygons, regularized with Douglas-Peucker simplification.
              </p>
            </div>

            <div className="border border-neutral-800 bg-neutral-950 p-5 rounded-lg space-y-2">
              <div className="font-mono text-xs text-neutral-500 font-bold">03 / HARMONIZATION</div>
              <h4 className="text-sm font-semibold text-white">Discrepancy Matrix</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                PostGIS triggers compute Hausdorff distance, overlap ratio, and road right-of-way encroachment polygons.
              </p>
            </div>

            <div className="border border-neutral-800 bg-neutral-950 p-5 rounded-lg space-y-2">
              <div className="font-mono text-xs text-neutral-500 font-bold">04 / LEGAL MUTATION</div>
              <h4 className="text-sm font-semibold text-white">ULPIN Issuance</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                High-confidence boundaries (&ge;80%) generate 14-digit Bhu-Aadhaar IDs. Discrepancies dispatch CORS rovers.
              </p>
            </div>
          </div>

          {/* Quick Terminal Action */}
          <div className="border border-neutral-800 bg-neutral-950 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded bg-black text-white border border-neutral-800">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Try the GeoAI Ingestion Simulator</div>
                <div className="text-xs text-neutral-400">Run the live step-by-step GDAL &bull; SAM-Geo &bull; PostGIS ETL terminal directly in your browser.</div>
              </div>
            </div>

            <button
              onClick={onOpenPipeline}
              className="px-4 py-2 rounded-md bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold border border-neutral-700 whitespace-nowrap transition-colors"
            >
              Open Pipeline Simulator
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800 bg-black py-10 px-4 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-neutral-900 border border-neutral-700 flex items-center justify-center">
              <Satellite className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-neutral-300">NAKSHA GeoAI Land Record Harmonization Platform</span>
            <span>&bull; SIH Problem Statement ID: 26013</span>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => onLaunchConsole('map')}
              className="hover:text-neutral-200 transition-colors"
            >
              Web-GIS Map
            </button>
            <button 
              onClick={() => onLaunchConsole('split')}
              className="hover:text-neutral-200 transition-colors"
            >
              Split-Screen Tool
            </button>
            <button 
              onClick={() => onLaunchConsole('queue')}
              className="hover:text-neutral-200 transition-colors"
            >
              Conflict Queue
            </button>
            <button 
              onClick={onOpenCodeHub}
              className="hover:text-neutral-200 transition-colors"
            >
              PostGIS SQL Schema
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
