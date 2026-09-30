import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import Point from 'ol/geom/Point';
import { Style, Stroke, Fill, Circle as CircleStyle, Text } from 'ol/style';
import { fromLonLat } from 'ol/proj';
import Overlay from 'ol/Overlay';
import { 
  Layers, 
  Sparkles, 
  Sliders, 
  Crosshair, 
  Radio
} from 'lucide-react';
import { ParcelRecord, GCPPoint, DroneLayerMeta } from '../types/naksha';

interface OpenLayersMapViewerProps {
  parcels: ParcelRecord[];
  gcps: GCPPoint[];
  droneMeta: DroneLayerMeta;
  selectedParcel: ParcelRecord | null;
  onSelectParcel: (parcel: ParcelRecord) => void;
  onRunAutoTopology: () => void;
  isTopologyRunning: boolean;
}

export const OpenLayersMapViewer: React.FC<OpenLayersMapViewerProps> = ({
  parcels,
  gcps,
  selectedParcel,
  onSelectParcel,
  onRunAutoTopology,
  isTopologyRunning,
}) => {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const popupElementRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const popupOverlayRef = useRef<Overlay | null>(null);

  // Layer references
  const basemapLayerRef = useRef<TileLayer<XYZ> | null>(null);
  const revenueVectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const aiVectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const conflictVectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const gcpVectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);

  // States
  const [activeBasemap, setActiveBasemap] = useState<'dark' | 'light' | 'satellite'>('dark');
  const [showDroneOrtho, setShowDroneOrtho] = useState(true);
  const [showRevenue, setShowRevenue] = useState(true);
  const [showAIFootprints, setShowAIFootprints] = useState(true);
  const [showConflicts, setShowConflicts] = useState(true);
  const [showGCPs, setShowGCPs] = useState(true);
  const [orthoOpacity, setOrthoOpacity] = useState(0.85);
  const [popupContent, setPopupContent] = useState<string | null>(null);
  const [layerPanelOpen, setLayerPanelOpen] = useState(true);

  const basemapUrls = {
    dark: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    light: 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  };

  // 1. Initialize OpenLayers Map Instance
  useEffect(() => {
    if (!mapElementRef.current || mapInstanceRef.current) return;

    // Basemap tile layer
    const baseSource = new XYZ({
      url: basemapUrls[activeBasemap],
      crossOrigin: 'anonymous',
    });
    const basemapLayer = new TileLayer({
      source: baseSource,
    });
    basemapLayerRef.current = basemapLayer;

    // Vector sources
    const revenueSource = new VectorSource();
    const aiSource = new VectorSource();
    const conflictSource = new VectorSource();
    const gcpSource = new VectorSource();

    // Vector layers
    const revenueLayer = new VectorLayer({
      source: revenueSource,
      zIndex: 10,
    });
    revenueVectorLayerRef.current = revenueLayer;

    const aiLayer = new VectorLayer({
      source: aiSource,
      zIndex: 20,
    });
    aiVectorLayerRef.current = aiLayer;

    const conflictLayer = new VectorLayer({
      source: conflictSource,
      zIndex: 30,
    });
    conflictVectorLayerRef.current = conflictLayer;

    const gcpLayer = new VectorLayer({
      source: gcpSource,
      zIndex: 40,
    });
    gcpVectorLayerRef.current = gcpLayer;

    // Popup Overlay
    const popupOverlay = new Overlay({
      element: popupElementRef.current!,
      autoPan: {
        animation: {
          duration: 200,
        },
      },
    });
    popupOverlayRef.current = popupOverlay;

    // Center on Pune Pilot Sector (18.5300, 73.8450)
    const initialCenter = fromLonLat([73.8450, 18.5300]);

    const map = new Map({
      target: mapElementRef.current,
      layers: [basemapLayer, revenueLayer, aiLayer, conflictLayer, gcpLayer],
      overlays: [popupOverlay],
      view: new View({
        center: initialCenter,
        zoom: 17,
        maxZoom: 21,
        minZoom: 14,
      }),
      controls: [], // custom minimalist controls
    });

    // Click handler for feature selection
    map.on('singleclick', (evt) => {
      let found = false;
      map.forEachFeatureAtPixel(evt.pixel, (feature) => {
        const parcelData = feature.get('parcelData') as ParcelRecord | undefined;
        const gcpData = feature.get('gcpData') as GCPPoint | undefined;

        if (parcelData && !found) {
          found = true;
          onSelectParcel(parcelData);
          setPopupContent(`
            <div class="text-xs font-sans space-y-1 text-neutral-100">
              <div class="font-bold text-white font-mono">ULPIN: ${parcelData.ulpin}</div>
              <div class="text-neutral-200 font-medium">${parcelData.plotNumber} (${parcelData.khasraNumber})</div>
              <div class="text-neutral-400">Owner: <span class="text-white">${parcelData.ownerName}</span></div>
              <div class="text-neutral-400">Confidence: <span class="font-bold text-white">${parcelData.confidenceScore}%</span></div>
              <div class="text-neutral-400">Recorded: ${parcelData.recordedAreaSqm} m² | Drone: ${parcelData.aiDetectedAreaSqm} m²</div>
            </div>
          `);
          popupOverlay.setPosition(evt.coordinate);
        } else if (gcpData && !found) {
          found = true;
          setPopupContent(`
            <div class="text-xs font-sans space-y-1 text-neutral-100">
              <div class="font-bold text-white font-mono">📍 ${gcpData.code}</div>
              <div class="text-white">${gcpData.name}</div>
              <div class="text-neutral-400">CORS Station: <span class="text-neutral-200">${gcpData.corsBaseStation}</span></div>
              <div class="text-neutral-400">Elevation: ${gcpData.elevationM}m MSL (RMSE ±${(gcpData.rmseMeters * 100).toFixed(1)}cm)</div>
            </div>
          `);
          popupOverlay.setPosition(evt.coordinate);
        }
      });

      if (!found) {
        popupOverlay.setPosition(undefined);
      }
    });

    // Pointer cursor on hover
    map.on('pointermove', (evt) => {
      const hit = map.hasFeatureAtPixel(evt.pixel);
      map.getTargetElement().style.cursor = hit ? 'pointer' : '';
    });

    mapInstanceRef.current = map;

    return () => {
      map.setTarget(undefined);
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Basemap Source
  useEffect(() => {
    if (!basemapLayerRef.current) return;
    const source = new XYZ({
      url: basemapUrls[activeBasemap],
      crossOrigin: 'anonymous',
    });
    basemapLayerRef.current.setSource(source);
  }, [activeBasemap]);

  // Update Layer Visibility
  useEffect(() => {
    if (revenueVectorLayerRef.current) revenueVectorLayerRef.current.setVisible(showRevenue);
    if (aiVectorLayerRef.current) aiVectorLayerRef.current.setVisible(showAIFootprints);
    if (conflictVectorLayerRef.current) conflictVectorLayerRef.current.setVisible(showConflicts);
    if (gcpVectorLayerRef.current) gcpVectorLayerRef.current.setVisible(showGCPs);
  }, [showRevenue, showAIFootprints, showConflicts, showGCPs]);

  // Render Features into OpenLayers Sources (Professional Monochrome Styles)
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const revSource = revenueVectorLayerRef.current?.getSource();
    const aiSource = aiVectorLayerRef.current?.getSource();
    const confSource = conflictVectorLayerRef.current?.getSource();
    const gcpSource = gcpVectorLayerRef.current?.getSource();

    revSource?.clear();
    aiSource?.clear();
    confSource?.clear();
    gcpSource?.clear();

    const coordsToOl = (coords: { lat: number; lng: number }[]) => {
      const ring = coords.map(c => fromLonLat([c.lng, c.lat]));
      if (ring.length > 0 && (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1])) {
        ring.push(ring[0]);
      }
      return [ring];
    };

    // 2. Populate Revenue Polygons (Neutral Gray Dashed Line)
    parcels.forEach((p) => {
      const geom = new Polygon(coordsToOl(p.revenueBoundary));
      const feat = new Feature({ geometry: geom, parcelData: p });
      feat.setStyle(
        new Style({
          stroke: new Stroke({
            color: '#a3a3a3', // Neutral gray dashed
            width: 1.5,
            lineDash: [5, 5],
          }),
          fill: new Fill({
            color: 'rgba(255, 255, 255, 0.04)',
          }),
        })
      );
      revSource?.addFeature(feat);
    });

    // 3. Populate AI SAM-Geo Polygons (Crisp White Boundary / Light Monochrome Fill)
    parcels.forEach((p) => {
      const geom = new Polygon(coordsToOl(p.aiFootprintBoundary));
      const feat = new Feature({ geometry: geom, parcelData: p });
      const isSelected = selectedParcel?.id === p.id;

      feat.setStyle(
        new Style({
          stroke: new Stroke({
            color: isSelected ? '#ffffff' : '#e5e5e5',
            width: isSelected ? 3.5 : 2,
          }),
          fill: new Fill({
            color: isSelected ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.12)',
          }),
        })
      );
      aiSource?.addFeature(feat);
    });

    // 4. Populate Spatial Conflict / Encroachment Polygons (Stark Hatch / Fill)
    parcels.forEach((p) => {
      if (p.encroachmentPolygon && p.encroachmentPolygon.length > 0) {
        const geom = new Polygon(coordsToOl(p.encroachmentPolygon));
        const feat = new Feature({ geometry: geom, parcelData: p });
        feat.setStyle(
          new Style({
            stroke: new Stroke({
              color: '#ffffff',
              width: 2,
              lineDash: [3, 3],
            }),
            fill: new Fill({
              color: 'rgba(255, 255, 255, 0.65)',
            }),
          })
        );
        confSource?.addFeature(feat);
      }
    });

    // 5. Populate CORS GCP Benchmarks (Monochrome Pill)
    gcps.forEach((gcp) => {
      const geom = new Point(fromLonLat([gcp.lng, gcp.lat]));
      const feat = new Feature({ geometry: geom, gcpData: gcp });
      feat.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 6,
            fill: new Fill({ color: '#ffffff' }),
            stroke: new Stroke({ color: '#000000', width: 2 }),
          }),
          text: new Text({
            text: gcp.code,
            font: '10px monospace',
            offsetY: -14,
            fill: new Fill({ color: '#ffffff' }),
            stroke: new Stroke({ color: '#000000', width: 3 }),
          }),
        })
      );
      gcpSource?.addFeature(feat);
    });
  }, [parcels, gcps, selectedParcel]);

  // Center on selected parcel
  useEffect(() => {
    if (!selectedParcel || !mapInstanceRef.current) return;
    const firstCoord = selectedParcel.aiFootprintBoundary[0];
    if (firstCoord) {
      const targetCenter = fromLonLat([firstCoord.lng, firstCoord.lat]);
      mapInstanceRef.current.getView().animate({
        center: targetCenter,
        duration: 400,
      });
    }
  }, [selectedParcel]);

  return (
    <div className="relative w-full h-[calc(100vh-105px)] overflow-hidden bg-black flex select-none">
      {/* OpenLayers Map Canvas */}
      <div ref={mapElementRef} className="w-full h-full z-0 cursor-crosshair" />

      {/* Drone Ortho HUD Raster Visual Simulation Effect */}
      {showDroneOrtho && (
        <div 
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{ opacity: orthoOpacity }}
        >
          {/* Subtle drone scanline grid */}
          <div className="w-full h-full bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]"></div>
          {/* Ortho watermark badge */}
          <div className="absolute top-16 left-4 bg-black/90 border border-neutral-700 text-white text-[10px] font-mono px-2 py-1 rounded shadow backdrop-blur flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
            <span>UAV ORTHOPHOTO STREAM (GSD: 3.5cm/px &bull; EPSG:32643 &bull; COG Active)</span>
          </div>
        </div>
      )}

      {/* Popup Overlay Container */}
      <div
        ref={popupElementRef}
        className="bg-black/95 border border-neutral-700 rounded-lg p-3 shadow-2xl backdrop-blur-md max-w-xs text-xs -translate-x-1/2 -translate-y-[120%]"
      >
        {popupContent && (
          <div>
            <div dangerouslySetInnerHTML={{ __html: popupContent }} />
            <button
              onClick={() => popupOverlayRef.current?.setPosition(undefined)}
              className="mt-2 w-full py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[10px] font-medium transition-colors border border-neutral-700"
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* Floating Spatial Controls Header Bar (Top-Left) */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2">
        {/* Basemap Switcher */}
        <div className="flex items-center bg-black/90 backdrop-blur border border-neutral-800 rounded-md p-0.5 shadow-lg text-xs">
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

        {/* Auto Topology Clean Trigger Button */}
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

        {/* Center / Reset View */}
        <button
          onClick={() => {
            mapInstanceRef.current?.getView().animate({
              center: fromLonLat([73.8450, 18.5300]),
              zoom: 17,
              duration: 400,
            });
          }}
          className="p-1.5 rounded-md bg-black/90 backdrop-blur border border-neutral-800 text-neutral-300 hover:text-white shadow"
          title="Reset View to Pune Pilot Ward 14"
        >
          <Crosshair className="w-4 h-4" />
        </button>

        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded bg-black/90 border border-neutral-800 text-[11px] font-mono text-neutral-300 shadow">
          OpenLayers v10.4 &bull; OGC WFS
        </span>
      </div>

      {/* Layer Control Panel (Top-Right) */}
      <div className="absolute top-3 right-3 z-10">
        <div className="bg-black/95 backdrop-blur border border-neutral-800 rounded-lg shadow-xl w-72 overflow-hidden text-xs">
          {/* Header */}
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
              {/* Drone Ortho Layer */}
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

              {/* Cadastral Revenue Layer */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-200 font-medium">
                  <input
                    type="checkbox"
                    checked={showRevenue}
                    onChange={(e) => setShowRevenue(e.target.checked)}
                    className="rounded border-neutral-700 text-white focus:ring-0 bg-neutral-900"
                  />
                  <span>Legacy Cadastral Vectors</span>
                </label>
                <span className="w-3 h-0.5 border-b-2 border-dashed border-neutral-400"></span>
              </div>

              {/* AI SAM-Geo Footprint Layer */}
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

              {/* Spatial Conflict & Encroachment Layer */}
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

              {/* CORS & GCP Pillars */}
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

      {/* Map Legend Overlay (Bottom-Left) */}
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
