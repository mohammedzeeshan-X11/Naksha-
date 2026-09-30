import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { MapViewer } from './components/MapViewer';
import { OpenLayersMapViewer } from './components/OpenLayersMapViewer';
import { SplitScreenViewer } from './components/SplitScreenViewer';
import { ConflictQueue } from './components/ConflictQueue';
import { ParcelDetailDrawer } from './components/ParcelDetailDrawer';
import { CodeArtifactsModal } from './components/CodeArtifactsModal';
import { IngestionPipelineModal } from './components/IngestionPipelineModal';
import { 
  INITIAL_PARCELS, 
  INITIAL_GCPS, 
  DRONE_SURVEY_INFO, 
  INITIAL_AUDIT_LOGS 
} from './data/mockSpatialData';
import { ParcelRecord, AuditLogEntry } from './types/naksha';
import { Sparkles, X } from 'lucide-react';

export default function App() {
  const [parcels, setParcels] = useState<ParcelRecord[]>(INITIAL_PARCELS);
  const [gcps, setGcps] = useState(INITIAL_GCPS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [selectedParcel, setSelectedParcel] = useState<ParcelRecord | null>(null);
  const [currentTab, setCurrentTab] = useState<'landing' | 'map' | 'split' | 'queue'>('landing');
  const [mapEngine, setMapEngine] = useState<'openlayers' | 'leaflet'>('openlayers');
  const [isCodeHubOpen, setIsCodeHubOpen] = useState<boolean>(false);
  const [isPipelineOpen, setIsPipelineOpen] = useState<boolean>(false);
  const [isTopologyRunning, setIsTopologyRunning] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Run automated topology cleaner (ST_Snap, ST_MakeValid, gap filling)
  const handleRunAutoTopology = () => {
    setIsTopologyRunning(true);
    showToast('Running PostGIS ST_Snap & ST_MakeValid across all parcels...');

    setTimeout(() => {
      setParcels(prev => 
        prev.map(p => {
          if (p.id === 'p-107') {
            return {
              ...p,
              confidenceScore: 95,
              status: 'harmonized',
              conflictType: 'none',
              hausdorffDistanceMeters: 0.11,
              overlapRatio: 0.982,
              notes: 'Successfully snapped to adjacent parcel edge using ST_Snap (0.5m tolerance). Sliver gap eliminated.',
            };
          }
          return p;
        })
      );

      const newAudit: AuditLogEntry = {
        id: `aud-${Date.now()}`,
        ulpin: '27-013-0948-00107',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        surveyor: 'PostGIS Automated Topology Daemon',
        role: 'Spatial Engine',
        action: 'BOUNDARY_SNAPPED',
        previousConfidence: 82,
        newConfidence: 95,
        remarks: 'Batch topology reconciliation: ST_Snap applied with 0.50m threshold. Cadastral sliver gap resolved.',
      };

      setAuditLogs(prev => [newAudit, ...prev]);
      setIsTopologyRunning(false);
      showToast('Topology auto-cleaning complete: 1 sliver gap snapped & resolved!');
    }, 1200);
  };

  // Resolve or mutate parcel status from surveyor workbench
  const handleResolveParcel = (
    parcelId: string, 
    action: 'HARMONIZED_APPROVED' | 'CORS_DISPATCHED' | 'BOUNDARY_SNAPPED', 
    remarks: string
  ) => {
    let updatedParcel: ParcelRecord | null = null;

    setParcels(prev => 
      prev.map(p => {
        if (p.id === parcelId) {
          const newScore = action === 'HARMONIZED_APPROVED' ? 98 : action === 'BOUNDARY_SNAPPED' ? 94 : p.confidenceScore;
          const newStatus = action === 'HARMONIZED_APPROVED' || action === 'BOUNDARY_SNAPPED' 
            ? 'harmonized' 
            : 'cors_resurvey';
          const newConflict = action === 'HARMONIZED_APPROVED' || action === 'BOUNDARY_SNAPPED' 
            ? 'none' 
            : p.conflictType;

          updatedParcel = {
            ...p,
            confidenceScore: newScore,
            status: newStatus,
            conflictType: newConflict,
            surveyorNotes: remarks,
          };
          return updatedParcel;
        }
        return p;
      })
    );

    if (updatedParcel) {
      const p = updatedParcel as ParcelRecord;
      const newAudit: AuditLogEntry = {
        id: `aud-${Date.now()}`,
        ulpin: p.ulpin,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        surveyor: 'K. S. Verma (Superintendent of Land Records)',
        role: 'Zonal Revenue Officer',
        action,
        previousConfidence: p.confidenceScore,
        newConfidence: p.confidenceScore,
        remarks,
      };
      setAuditLogs(prev => [newAudit, ...prev]);
      if (selectedParcel?.id === parcelId) {
        setSelectedParcel(updatedParcel);
      }
      showToast(`Parcel ${p.ulpin} updated: ${action.replace('_', ' ')}`);
    }
  };

  const handlePipelineCompleted = () => {
    setIsPipelineOpen(false);
    showToast('GeoAI Pipeline finished: High-resolution building footprints ingested into PostGIS!');
  };

  return (
    <div className="min-h-screen bg-black flex flex-col font-sans text-neutral-100 select-none">
      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        parcels={parcels}
        onOpenPipeline={() => setIsPipelineOpen(true)}
        onOpenCodeHub={() => setIsCodeHubOpen(true)}
        mapEngine={mapEngine}
        setMapEngine={setMapEngine}
      />

      {/* Main View Workspace */}
      <main className="flex-1 relative overflow-hidden">
        {currentTab === 'landing' && (
          <LandingPage
            onLaunchConsole={(tab = 'map') => setCurrentTab(tab)}
            onOpenCodeHub={() => setIsCodeHubOpen(true)}
            onOpenPipeline={() => setIsPipelineOpen(true)}
            parcels={parcels}
          />
        )}

        {currentTab === 'map' && (
          <>
            {mapEngine === 'openlayers' ? (
              <OpenLayersMapViewer
                parcels={parcels}
                gcps={gcps}
                droneMeta={DRONE_SURVEY_INFO}
                selectedParcel={selectedParcel}
                onSelectParcel={(p) => setSelectedParcel(p)}
                onRunAutoTopology={handleRunAutoTopology}
                isTopologyRunning={isTopologyRunning}
              />
            ) : (
              <MapViewer
                parcels={parcels}
                gcps={gcps}
                droneMeta={DRONE_SURVEY_INFO}
                selectedParcel={selectedParcel}
                onSelectParcel={(p) => setSelectedParcel(p)}
                onRunAutoTopology={handleRunAutoTopology}
                isTopologyRunning={isTopologyRunning}
              />
            )}

            {/* Side Drawer for Parcel Inspection */}
            {selectedParcel && (
              <ParcelDetailDrawer
                parcel={selectedParcel}
                onClose={() => setSelectedParcel(null)}
                onResolve={(action) => {
                  handleResolveParcel(
                    selectedParcel.id, 
                    action, 
                    'Approved directly from interactive Web-GIS inspection drawer.'
                  );
                }}
              />
            )}
          </>
        )}

        {currentTab === 'split' && (
          <SplitScreenViewer
            parcels={parcels}
            selectedParcel={selectedParcel}
            onSelectParcel={(p) => setSelectedParcel(p)}
          />
        )}

        {currentTab === 'queue' && (
          <ConflictQueue
            parcels={parcels}
            auditLogs={auditLogs}
            onResolveParcel={handleResolveParcel}
            onSelectParcel={(p) => {
              setSelectedParcel(p);
              setCurrentTab('map');
            }}
          />
        )}
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-neutral-900 border border-neutral-700 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 text-xs animate-in slide-in-from-bottom-5">
          <Sparkles className="w-4 h-4 text-white shrink-0" />
          <span>{toastMessage}</span>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-neutral-400 hover:text-white ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Architecture & Code Hub Modal */}
      <CodeArtifactsModal
        isOpen={isCodeHubOpen}
        onClose={() => setIsCodeHubOpen(false)}
      />

      {/* GeoAI Ingestion Pipeline Simulator Modal */}
      <IngestionPipelineModal
        isOpen={isPipelineOpen}
        onClose={() => setIsPipelineOpen(false)}
        onPipelineCompleted={handlePipelineCompleted}
      />
    </div>
  );
}
