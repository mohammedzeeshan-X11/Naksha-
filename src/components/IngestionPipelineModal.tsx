import React, { useState } from 'react';
import { 
  X, 
  Cpu, 
  Play, 
  CheckCircle2, 
  Terminal, 
  Satellite, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { PipelineStep } from '../types/naksha';

interface IngestionPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPipelineCompleted: () => void;
}

export const IngestionPipelineModal: React.FC<IngestionPipelineModalProps> = ({
  isOpen,
  onClose,
  onPipelineCompleted,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [logs, setLogs] = useState<string[]>([]);
  const selectedFile = 'pune_uav_flight_2026_ori.tif (2.4 GB)';

  const steps: PipelineStep[] = [
    {
      id: 'crs',
      name: 'CRS Normalization & GDAL Reprojection',
      module: 'GDAL / Rasterio',
      status: 'idle',
      details: 'Reproject source raw raster to EPSG:4326 (WGS84) & EPSG:32643 (UTM 43N)',
    },
    {
      id: 'cog',
      name: 'Cloud-Optimized GeoTIFF (COG) Generation',
      module: 'GDAL translate',
      status: 'idle',
      details: '512x512 tile blocking, DEFLATE compression, internal overviews [2, 4, 8, 16]',
    },
    {
      id: 'gcp',
      name: 'Automated GCP Matching Engine',
      module: 'OpenCV SIFT + RANSAC',
      status: 'idle',
      details: 'Extract tie-points between legacy 1974 scanned Musavi map and drone ORI',
    },
    {
      id: 'sam',
      name: 'SAM-Geo Deep Feature Segmentation',
      module: 'Segment Anything (ViT-H)',
      status: 'idle',
      details: 'Inference on 1024x1024 overlapping patches, pred_iou_thresh=0.88',
    },
    {
      id: 'vectorize',
      name: 'Douglas-Peucker & Orthogonal Regularization',
      module: 'Shapely / GeoPandas',
      status: 'idle',
      details: 'Simplify noise (tol=0.15m), rectify right angles on structural footprints',
    },
    {
      id: 'postgis',
      name: 'PostGIS ST_Snap & Discrepancy Matrix',
      module: 'PostGIS 15+ / Topology',
      status: 'idle',
      details: 'Execute spatial triggers: compute Hausdorff distance, IoU, and ULPIN',
    },
  ];

  if (!isOpen) return null;

  const runPipelineSimulation = async () => {
    setIsRunning(true);
    setLogs([]);
    setCurrentStepIndex(0);

    const stepLogs = [
      [
        '[GDAL] Inspecting raster header: pune_uav_flight_2026_ori.tif',
        '[GDAL] Detected sensor: Sony RX1R II (42.4 MP). Dimensions: 18,400 x 14,200 px',
        '[GDAL] Reprojecting from arbitrary UAV coordinate frame -> EPSG:4326 / EPSG:32643',
        '[GDAL] CRS normalization completed with 0 errors.',
      ],
      [
        '[COG] Building Cloud-Optimized GeoTIFF with 512x512 internal block tiling...',
        '[COG] Calculating overviews at resolutions 1/2, 1/4, 1/8, 1/16...',
        '[COG] Compression applied: DEFLATE with PREDICTOR=2. Output COG size: 1.1 GB.',
        '[COG] Cloud-Optimized GeoTIFF ready for HTTP Range Request streaming.',
      ],
      [
        '[OpenCV] Detecting SIFT keypoints on legacy cadastral scan (MH-PN-0948)...',
        '[OpenCV] Matched 842 candidate tie-points with drone orthophoto benchmarks.',
        '[OpenCV] Executing RANSAC Homography estimation with 5.0px inlier threshold.',
        '[OpenCV] 614 high-confidence GCP tie-points verified. Affine matrix calculated (RMSE: 1.4cm).',
      ],
      [
        '[SAM-Geo] Loading SAM ViT-H backbone into GPU memory (device=CUDA:0)...',
        '[SAM-Geo] Generating automatic mask grid: 32 points per side, min_mask_region_area=50',
        '[SAM-Geo] Processed 48 spatial tiles across cadastral sector.',
        '[SAM-Geo] AI detected 100% building footprints and boundary walls.',
      ],
      [
        '[GeoPandas] Polygonizing binary raster mask contours into Shapely Polygons...',
        '[GeoPandas] Executing Douglas-Peucker simplification (0.15m tolerance)...',
        '[GeoPandas] Applying orthogonal regularization on architectural building corners.',
        '[GeoPandas] Validated geometries with ST_IsValid: 0 self-intersections.',
      ],
      [
        '[PostGIS] Opening transactional connection pool to PostgreSQL 15+ PostGIS...',
        '[PostGIS] Executing ST_Snap across adjacent parcel edges with 0.5m threshold.',
        '[PostGIS] Trigger fn_calculate_parcel_metrics() invoked.',
        '[PostGIS] Computed spatial Hausdorff distances, IoU overlap ratios, and area deviations.',
        '[PostGIS] Synchronized 8 parcels into table land_parcels. ULPINs generated.',
      ],
    ];

    for (let i = 0; i < steps.length; i++) {
      setCurrentStepIndex(i);
      for (const line of stepLogs[i]) {
        await new Promise(r => setTimeout(r, 220));
        setLogs(prev => [...prev, line]);
      }
      await new Promise(r => setTimeout(r, 250));
    }

    setIsRunning(false);
    onPipelineCompleted();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden text-neutral-200 text-xs">
        {/* Header */}
        <div className="p-4 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-black text-white border border-neutral-700">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                GeoAI Ingestion &amp; Feature Extraction Pipeline Runner
              </h3>
              <p className="text-neutral-400 text-xs">
                Production ETL: GDAL COG Conversion &bull; SAM-Geo ViT-H Segmentation &bull; PostGIS Auto-Topology Snapping
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors border border-neutral-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* File Ingestion Selector */}
          <div className="bg-black p-4 rounded-lg border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="p-2.5 rounded bg-neutral-900 text-white border border-neutral-700">
                <Satellite className="w-5 h-5" />
              </div>
              <div>
                <span className="text-neutral-400 text-[11px] block">Target Drone Flight Survey:</span>
                <span className="font-mono font-semibold text-white text-xs">{selectedFile}</span>
                <span className="text-[10px] text-neutral-500 block">Ground Sampling Distance (GSD): 3.5cm &bull; CORS SoI Reference</span>
              </div>
            </div>

            <button
              onClick={runPipelineSimulation}
              disabled={isRunning}
              className={`px-4 py-2.5 rounded-md font-semibold text-xs flex items-center gap-2 shadow transition-all ${
                isRunning
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
                  : 'bg-white hover:bg-neutral-200 text-black'
              }`}
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span className="text-white">Processing GeoAI Pipeline...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-black" />
                  <span>Execute GeoAI Pipeline</span>
                </>
              )}
            </button>
          </div>

          {/* Step Progress Tracker */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {steps.map((st, idx) => {
              const isPast = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex && isRunning;
              const isDone = !isRunning && currentStepIndex >= steps.length - 1;

              return (
                <div
                  key={st.id}
                  className={`p-3 rounded-lg border transition-all ${
                    isCurrent
                      ? 'border-white bg-neutral-900'
                      : isPast || isDone
                      ? 'border-neutral-700 bg-neutral-900/60'
                      : 'border-neutral-850 bg-black opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">
                      {st.module}
                    </span>
                    {isCurrent ? (
                      <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" />
                    ) : isPast || isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-neutral-800" />
                    )}
                  </div>
                  <h4 className="font-semibold text-white text-xs">{st.name}</h4>
                  <p className="text-[11px] text-neutral-400 mt-1">{st.details}</p>
                </div>
              );
            })}
          </div>

          {/* Terminal Logs Window */}
          <div className="bg-black rounded-lg border border-neutral-800 p-3.5 font-mono text-[11px] h-60 overflow-y-auto space-y-1 shadow-inner">
            <div className="flex items-center gap-2 text-neutral-500 pb-2 border-b border-neutral-900 mb-2">
              <Terminal className="w-3.5 h-3.5 text-neutral-400" />
              <span>GeoAI Execution Console Output:</span>
            </div>
            {logs.length === 0 ? (
              <span className="text-neutral-600 italic">
                Press "Execute GeoAI Pipeline" above to run the automated SAM-Geo + GDAL + PostGIS ingestion workflow...
              </span>
            ) : (
              logs.map((line, lidx) => (
                <div key={lidx} className="text-neutral-300 flex items-start gap-2">
                  <span className="text-neutral-500 select-none">&gt;</span>
                  <span className="text-neutral-200">
                    {line}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between">
          <span className="text-[11px] text-neutral-400 font-mono">
            Backbone: Segment Anything Model (SAM-Geo ViT-H) + OpenCV SIFT
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
