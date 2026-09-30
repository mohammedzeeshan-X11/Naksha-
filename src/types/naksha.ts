export type ParcelStatus = 'harmonized' | 'pending_review' | 'critical_conflict' | 'cors_resurvey';

export type ConflictType = 
  | 'none'
  | 'encroachment'
  | 'boundary_overlap'
  | 'unrecorded_construction'
  | 'area_discrepancy'
  | 'cadastral_gap';

export interface SpatialCoordinates {
  lat: number;
  lng: number;
}

export interface ParcelRecord {
  id: string;
  ulpin: string; // 14-digit Unique Land Parcel Identification Number (Bhu-Aadhaar)
  plotNumber: string;
  khasraNumber: string;
  ownerName: string;
  recordedAreaSqm: number;
  aiDetectedAreaSqm: number;
  confidenceScore: number; // 0 - 100
  status: ParcelStatus;
  conflictType: ConflictType;
  hausdorffDistanceMeters: number;
  overlapRatio: number; // 0.0 - 1.0
  landUse: 'Residential' | 'Commercial' | 'Mixed Use' | 'Public Utility' | 'Vacant Plot';
  municipalWard: string;
  lastSurveyDate: string;
  droneOrthoMatch: boolean;
  revenueBoundary: SpatialCoordinates[];
  aiFootprintBoundary: SpatialCoordinates[];
  encroachmentPolygon?: SpatialCoordinates[];
  notes?: string;
  surveyorNotes?: string;
}

export interface GCPPoint {
  id: string;
  code: string;
  name: string;
  lat: number;
  lng: number;
  elevationM: number;
  corsBaseStation: string;
  rmseMeters: number;
  status: 'locked' | 'calibrating' | 'verified';
}

export interface DroneLayerMeta {
  flightId: string;
  captureDate: string;
  droneModel: string;
  gsdCm: number; // Ground Sampling Distance
  sensor: string;
  crs: string;
  cogUrl: string;
  oriCoverageSqKm: number;
  dsmAvailable: boolean;
}

export interface AuditLogEntry {
  id: string;
  ulpin: string;
  timestamp: string;
  surveyor: string;
  role: string;
  action: 'AI_INGESTED' | 'HARMONIZED_APPROVED' | 'CORS_DISPATCHED' | 'BOUNDARY_SNAPPED' | 'MANUAL_OVERRIDE';
  previousConfidence: number;
  newConfidence: number;
  remarks: string;
}

export interface PipelineStep {
  id: string;
  name: string;
  module: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  details: string;
  durationMs?: number;
}
