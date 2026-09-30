import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Layers, 
  Sliders, 
  Sparkles, 
  Crosshair,
  Maximize2
} from 'lucide-react';
import { ParcelRecord, GCPPoint, DroneLayerMeta } from '../types/naksha';

interface MapViewerProps {
  parcels: ParcelRecord[];
  gcps: GCPPoint[];
  droneMeta: DroneLayerMeta;
  selectedParcel: ParcelRecord | null;
  onSelectParcel: (parcel: ParcelRecord) => void;
  onRunAutoTopology: () => void;
  isTopologyRunning: boolean;
}

export const MapViewer: React.FC<MapViewerProps> = ({
  parcels,
  gcps,
  selectedParcel,
  onSelectParcel,
  onRunAutoTopology,
  isTopologyRunning,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  
  // Layer group refs
  const revenueLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const aiFootprintLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const conflictLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const gcpLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const droneOverlayRef = useRef<L.ImageOverlay | null>(null);

  // Layer Visibility State
  const [showDroneOrtho, setShowDroneOrtho] = useState(true);
  const [showRevenueCadastral, setShowRevenueCadastral] = useState(true);
  const [showAIFootprints, setShowAIFootprints] = useState(true);
  const [showConflicts, setShowConflicts] = useState(true);
  const [showGCPs, setShowGCPs] = useState(true);
  const [orthoOpacity, setOrthoOpacity] = useState(0.85);
  const [activeBasemap, setActiveBasemap] = useState<'dark' | 'light' | 'satellite'>('dark');
  const [layerPanelOpen, setLayerPanelOpen] = useState(true);

  // Basemap Tile Layers
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const basemapUrls = {
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [18.5300, 73.8450],
      zoom: 17,
      minZoom: 14,
      maxZoom: 21,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const tileLayer = L.tileLayer(basemapUrls[activeBasemap], {
      attribution: '&copy; CartoDB contributors',
      maxZoom: 21,
      maxNativeZoom: 19,
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    revenueLayerGroupRef.current = L.layerGroup().addTo(map);
    aiFootprintLayerGroupRef.current = L.layerGroup().addTo(map);
    conflictLayerGroupRef.current = L.layerGroup().addTo(map);
    gcpLayerGroupRef.current = L.layerGroup().addTo(map);

    const droneBounds: L.LatLngBoundsExpression = [
      [18.5280, 73.8432],
      [18.5320, 73.8472],
    ];

    const svgDroneOverlay = `
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff" stroke-width="0.3" stroke-opacity="0.2"/>
          </pattern>
        </defs>
        <rect width="800" height="800" fill="url(#grid)" />
        <text x="30" y="50" font-family="monospace" font-size="14" fill="#ffffff" opacity="0.5">UAV ORI GSD: 3.5cm/px [NAKSHA-UAV-2026]</text>
      </svg>
    `;
    const droneSvgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgDroneOverlay);
    const overlay = L.imageOverlay(droneSvgUrl, droneBounds, {
      opacity: orthoOpacity,
      interactive: false,
    }).addTo(map);
    droneOverlayRef.current = overlay;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    tileLayerRef.current.setUrl(basemapUrls[activeBasemap]);
  }, [activeBasemap]);

  useEffect(() => {
    if (!droneOverlayRef.current) return;
    droneOverlayRef.current.setOpacity(showDroneOrtho ? orthoOpacity : 0);
  }, [showDroneOrtho, orthoOpacity]);

  // Render Vector Layers & Markers (Monochrome)
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    revenueLayerGroupRef.current?.clearLayers();
    aiFootprintLayerGroupRef.current?.clearLayers();
    conflictLayerGroupRef.current?.clearLayers();
    gcpLayerGroupRef.current?.clearLayers();

    // 2. Revenue Cadastral Boundaries (Dashed Grey)
    if (showRevenueCadastral && revenueLayerGroupRef.current) {
      parcels.forEach((p) => {
        const latlngs: L.LatLngExpression[] = p.revenueBoundary.map(pt => [pt.lat, pt.lng]);
        const poly = L.polygon(latlngs, {
          color: '#a3a3a3',
          weight: 1.5,
          dashArray: '5, 5',
          fillColor: '#ffffff',
          fillOpacity: 0.05,
        });

        poly.on('click', () => onSelectParcel(p));
        poly.bindTooltip(
          `<div class="text-xs font-sans text-neutral-100 bg-neutral-900 border border-neutral-700 p-1.5 rounded">
            <strong>Revenue Khasra:</strong> ${p.khasraNumber}<br/>
            <strong>Plot:</strong> ${p.plotNumber}<br/>
            <strong>Owner:</strong> ${p.ownerName}
          </div>`,
          { sticky: true }
        );

        revenueLayerGroupRef.current?.addLayer(poly);
      });
    }

    // 3. AI Footprints (Crisp White / Subtle Fill)
    if (showAIFootprints && aiFootprintLayerGroupRef.current) {
      parcels.forEach((p) => {
        const latlngs: L.LatLngExpression[] = p.aiFootprintBoundary.map(pt => [pt.lat, pt.lng]);
        const isSelected = selectedParcel?.id === p.id;

        const poly = L.polygon(latlngs, {
          color: isSelected ? '#ffffff' : '#d4d4d4',
          weight: isSelected ? 3.5 : 2,
          fillColor: '#ffffff',
          fillOpacity: isSelected ? 0.35 : 0.12,
        });

        poly.on('click', () => onSelectParcel(p));
        poly.bindTooltip(
          `<div class="text-xs font-sans text-neutral-100 bg-black border border-neutral-700 p-1.5 rounded">
            <span class="font-bold text-white">ULPIN: ${p.ulpin}</span><br/>
            Confidence: <span class="font-bold text-white">${p.confidenceScore}%</span><br/>
            Status: <span class="uppercase text-[10px]">${p.status.replace('_', ' ')}</span>
          </div>`,
          { sticky: true }
        );

        aiFootprintLayerGroupRef.current?.addLayer(poly);
      });
    }

    // 4. Conflicts / Encroachments (Bright White Fill)
    if (showConflicts && conflictLayerGroupRef.current) {
      parcels.forEach((p) => {
        if (p.encroachmentPolygon && p.encroachmentPolygon.length > 0) {
          const latlngs: L.LatLngExpression[] = p.encroachmentPolygon.map(pt => [pt.lat, pt.lng]);
          const encPoly = L.polygon(latlngs, {
            color: '#ffffff',
            weight: 2,
            dashArray: '3, 3',
            fillColor: '#ffffff',
            fillOpacity: 0.65,
          });

          encPoly.on('click', () => onSelectParcel(p));
          encPoly.bindTooltip(
            `<div class="text-xs font-sans text-white bg-black border border-neutral-700 p-1.5 rounded">
              <strong class="text-white">Spatial Encroachment (ST_Diff)</strong><br/>
              Hausdorff Drift: ${p.hausdorffDistanceMeters}m<br/>
              Type: ${p.conflictType.replace('_', ' ')}
            </div>`,
            { sticky: true }
          );

          conflictLayerGroupRef.current?.addLayer(encPoly);
        }
      });
    }

    // 5. CORS GCP Pillars
    if (showGCPs && gcpLayerGroupRef.current) {
      gcps.forEach((gcp) => {
        const marker = L.circleMarker([gcp.lat, gcp.lng], {
          radius: 6,
          color: '#000000',
          fillColor: '#ffffff',
          fillOpacity: 1,
          weight: 2,
        });

        marker.bindTooltip(
          `<div class="text-xs font-sans bg-black text-white border border-neutral-700 p-1.5 rounded">
            <strong class="text-white">📍 ${gcp.code}</strong><br/>
            ${gcp.name}<br/>
            Elevation: ${gcp.elevationM}m MSL (RMSE ±${(gcp.rmseMeters * 100).toFixed(1)}cm)
          </div>`,
          { sticky: true }
        );

        gcpLayerGroupRef.current?.addLayer(marker);
      });
    }
  }, [
    parcels,
    gcps,
    selectedParcel,
    showRevenueCadastral,
    showAIFootprints,
    showConflicts,
    showGCPs,
    onSelectParcel,
  ]);

  useEffect(() => {
    if (!selectedParcel || !mapInstanceRef.current) return;
    const centerPt = selectedParcel.aiFootprintBoundary[0];
    if (centerPt) {
      mapInstanceRef.current.panTo([centerPt.lat, centerPt.lng], { animate: true, duration: 0.4 });
    }
  }, [selectedParcel]);

  return (
    <div className="relative w-full h-[calc(100vh-105px)] overflow-hidden bg-black flex select-none">
      <div ref={mapContainerRef} className="w-full h-full z-0 cursor-crosshair" />

      {/* Floating Spatial Controls Header Bar */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2">
        <div className="flex items-center bg-black/90 backdrop-blur border border-neutral-800 rounded-md p-0.5 shadow text-xs">
          <button
            onClick={() => setActiveBasemap('dark')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeBasemap === 'dark' ? 'bg-white text-black font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Carto Dark
          </button>
          <button
            onClick={() => setActiveBasemap('light')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeBasemap === 'light' ? 'bg-white text-black font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Carto Light
          </button>
          <button
            onClick={() => setActiveBasemap('satellite')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeBasemap === 'satellite' ? 'bg-white text-black font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Satellite
          </button>
        </div>

        <button
          onClick={onRunAutoTopology}
          disabled={isTopologyRunning}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold shadow transition-all border ${
            isTopologyRunning 
              ? 'bg-neutral-800 text-white border-neutral-600 animate-pulse'
              : 'bg-white hover:bg-neutral-200 text-black border-white'
          }`}
          title="Run PostGIS ST_Snap, ST_MakeValid, and remove sliver gaps across all parcel boundaries"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isTopologyRunning ? 'animate-spin' : ''}`} />
          <span>{isTopologyRunning ? 'Running PostGIS ST_MakeValid...' : 'Auto-Clean Topology (ST_Snap)'}</span>
        </button>

        <button
          onClick={() => mapInstanceRef.current?.setView([18.5300, 73.8450], 17)}
          className="p-1.5 rounded-md bg-black/90 backdrop-blur border border-neutral-800 text-neutral-300 hover:text-white shadow"
          title="Reset View to Pune Pilot Ward 14"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>

      {/* Layer Control Panel */}
      <div className="absolute top-3 right-3 z-10">
        <div className="bg-black/95 backdrop-blur border border-neutral-800 rounded-lg shadow-xl w-72 overflow-hidden text-xs">
          <div 
            onClick={() => setLayerPanelOpen(!layerPanelOpen)}
            className="px-3 py-2 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-2 font-medium text-white">
              <Layers className="w-3.5 h-3.5 text-white" />
              <span>Spatial Layers &amp; Overlays</span>
            </div>
            <Sliders className="w-3.5 h-3.5 text-neutral-400" />
          </div>

          {layerPanelOpen && (
            <div className="p-3 space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-200 font-medium">
                    <input
                      type="checkbox"
                      checked={showDroneOrtho}
                      onChange={(e) => setShowDroneOrtho(e.target.checked)}
                      className="rounded border-neutral-700 text-white focus:ring-0 bg-neutral-900"
                    />
                    <span>Drone ORI Orthophoto</span>
                  </label>
                  <span className="text-[10px] font-mono text-white bg-neutral-900 px-1.5 py-0.2 rounded border border-neutral-700">
                    GSD: 3.5cm
                  </span>
                </div>
                {showDroneOrtho && (
                  <div className="flex items-center gap-2 pl-5 pt-1">
                    <span className="text-[10px] text-neutral-400">Opacity:</span>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={orthoOpacity}
                      onChange={(e) => setOrthoOpacity(parseFloat(e.target.value))}
                      className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                    <span className="text-[10px] text-neutral-400 w-7 font-mono">{Math.round(orthoOpacity * 100)}%</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-200 font-medium">
                  <input
                    type="checkbox"
                    checked={showRevenueCadastral}
                    onChange={(e) => setShowRevenueCadastral(e.target.checked)}
                    className="rounded border-neutral-700 text-white focus:ring-0 bg-neutral-900"
                  />
                  <span>Legacy Cadastral Vectors</span>
                </label>
                <span className="w-3 h-0.5 border-b-2 border-dashed border-neutral-400"></span>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-200 font-medium">
                  <input
                    type="checkbox"
                    checked={showAIFootprints}
                    onChange={(e) => setShowAIFootprints(e.target.checked)}
                    className="rounded border-neutral-700 text-white focus:ring-0 bg-neutral-900"
                  />
                  <span>AI SAM-Geo Footprints</span>
                </label>
                <span className="w-2.5 h-2.5 rounded-sm bg-neutral-700 border border-white"></span>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-200 font-medium">
                  <input
                    type="checkbox"
                    checked={showConflicts}
                    onChange={(e) => setShowConflicts(e.target.checked)}
                    className="rounded border-neutral-700 text-white focus:ring-0 bg-neutral-900"
                  />
                  <span>Encroachments (ST_Diff)</span>
                </label>
                <span className="w-2.5 h-2.5 rounded-sm bg-white border border-neutral-400"></span>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-200 font-medium">
                  <input
                    type="checkbox"
                    checked={showGCPs}
                    onChange={(e) => setShowGCPs(e.target.checked)}
                    className="rounded border-neutral-700 text-white focus:ring-0 bg-neutral-900"
                  />
                  <span>CORS Ground Control Points</span>
                </label>
                <span className="w-2.5 h-2.5 rounded-full bg-white border border-black"></span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-black/90 backdrop-blur border border-neutral-800 rounded-lg p-3 shadow-xl text-xs space-y-1.5 max-w-xs select-none">
        <div className="font-semibold text-white border-b border-neutral-800 pb-1 flex items-center justify-between">
          <span>Cadastral Boundary Legend</span>
          <span className="text-[10px] text-neutral-400 font-normal">EPSG:4326 / 32643</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] pt-1 text-neutral-300">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-neutral-800 border border-white"></span>
            <span>Harmonized (&ge;80%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-neutral-900 border border-neutral-600"></span>
            <span>Review / Conflict</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-b-2 border-dashed border-neutral-400"></span>
            <span>Revenue Record</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-white border border-black"></span>
            <span>ST_Difference</span>
          </div>
        </div>
      </div>
    </div>
  );
};
