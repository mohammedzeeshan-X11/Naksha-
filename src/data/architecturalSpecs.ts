export const ARCHITECTURE_DIAGRAM_ASCII = `
========================================================================================================================
                  NAKSHA GeoAI PLATFORM: END-TO-END URBAN LAND HARMONIZATION ARCHITECTURE
               Ministry of Rural Development / Department of Land Resources (SIH PS ID: 26013)
========================================================================================================================

  +---------------------------------------------------------------------------------------------------------------+
  |                                        1. MULTI-SOURCE DATA INGESTION                                         |
  +---------------------------------------------------------------------------------------------------------------+
       |                                     |                                   |                    |
   [Drone UAV / ORI]                 [Legacy Cadastral]                   [Survey of India CORS]  [Municipal GIS /]
   (GeoTIFF / COG, GSD <5cm,         (Scanned Musavi / Village Maps,      (Continuous Operating   [Utility Networks]
    RGB + DSM / DTM Elevations)       Shapefiles, PDF Settlement Sheets)   Reference Stations)    (Water, Roads, Power)
       |                                     |                                   |                    |
       v                                     v                                   v                    v
  +---------------------------------------------------------------------------------------------------------------+
  |                              2. ETL PRE-PROCESSING & CRS NORMALIZATION PIPELINE                               |
  |  - Automated CRS Projection to EPSG:4326 (WGS84) & Local UTM Zone (EPSG:32643) using GDAL/Rasterio            |
  |  - Drone GeoTIFF to Cloud-Optimized GeoTIFF (COG) conversion (512x512 Tiling, Overviews, DEFLATE)             |
  |  - Automated GCP Extraction & Feature Matching (SIFT/ORB + Affine/Homography Warp) for Legacy Scans           |
  +---------------------------------------------------------------------------------------------------------------+
                                                     |
                                                     v
  +---------------------------------------------------------------------------------------------------------------+
  |                               3. GeoAI SEGMENTATION & INFERENCE ENGINE                                        |
  |  - Backbone: SAM-Geo (Segment Anything for Geospatial / ViT-H) + Fine-Tuned Building U-Net                     |
  |  - Raster Window Generator: Overlapping 1024x1024 tiles with 128px stride to avoid edge artifacts            |
  |  - Polygon Vectorization: Contour extraction -> Douglas-Peucker simplification -> Orthogonal Regularization  |
  +---------------------------------------------------------------------------------------------------------------+
                                                     |
                                                     v
  +---------------------------------------------------------------------------------------------------------------+
  |                             4. SPATIAL TOPOLOGY & CONFLICT DETECTION ENGINE                                   |
  |  - PostGIS Topology Rules: ST_MakeValid, ST_SnapToGrid(0.001), ST_Node, ST_Polygonize                         |
  |  - Boundary Conflict Analysis:                                                                                |
  |      * Area Deviation Metric:      abs(Area_AI - Area_Revenue) / Area_Revenue * 100%                          |
  |      * Hausdorff Boundary Drift:   ST_HausdorffDistance(geom_ai, geom_revenue) in meters                      |
  |      * Spatial Overlap Ratio:      ST_Area(ST_Intersection) / ST_Area(ST_Union) (IoU)                         |
  |      * Encroachment Polygon:       ST_Difference(geom_ai, geom_revenue) -> Road/Neighbor Encroachment         |
  +---------------------------------------------------------------------------------------------------------------+
                                                     |
                                                     v
  +---------------------------------------------------------------------------------------------------------------+
  |                               5. CONFIDENCE SCORING & SURVEYOR QUEUE DISPATCH                                 |
  |  - Score = (IoU * 0.50) + (1 - normalized_hausdorff * 0.30) + (1 - area_deviation * 0.20)                     |
  |  - High Confidence (>= 80%): Automated Harmonization -> ULPIN (Bhu-Aadhaar 14-digit) Generation               |
  |  - Low Confidence  (< 80%):  Dispatched to "Surveyor Conflict Resolution Workbench" for CORS field re-survey  |
  +---------------------------------------------------------------------------------------------------------------+
                         |                                                       |
                         v                                                       v
  +--------------------------------------------+         +-------------------------------------------------------+
  |    6. SPATIAL DATA PERSISTENCE (PostGIS)   |         |           7. OGC API GATEWAY (FastAPI)                |
  |  - PostgreSQL 15+ with PostGIS 3.3+        | <-----> |  - OGC WMS (Web Map Service) / WFS (Feature Service)   |
  |  - Spatial GIST Indices on all Geometries  |         |  - Vector Tile Server (MVT / Protobuf)                |
  |  - Strict Audit Trails & Revision Triggers |         |  - RESTful CRUD: /parcels, /conflicts, /harmonize     |
  +--------------------------------------------+         +-------------------------------------------------------+
                                                                     |
                                                                     v
  +---------------------------------------------------------------------------------------------------------------+
  |                               8. INTERACTIVE WEB-GIS CLIENT (React + Leaflet / OpenLayers)                    |
  |  - Multi-Layer Map Viewer (Drone ORI, Cadastral Boundaries, AI Footprints, GCP Pillars)                      |
  |  - Real-Time Split-Screen / Swipe Tool for Visual Revenue vs Drone Footprint Overlay Validation              |
  |  - Surveyor Conflict Resolution Workbench (Accept AI, Snap to Cadastral, Dispatch CORS field team)           |
  +---------------------------------------------------------------------------------------------------------------+
`;

export const POSTGIS_DDL_SQL = `-- ============================================================================
-- NAKSHA GeoAI Platform: PostgreSQL 15+ with PostGIS Spatial DDL Schema
-- Ministry of Rural Development / DoLR - SIH PS ID: 26013
-- Target CRS: EPSG:4326 (WGS84 Geographic) & EPSG:32643 (UTM Zone 43N Projected)
-- ============================================================================

-- 1. Enable Required Spatial Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Enumeration Types
DO $$ BEGIN
    CREATE TYPE parcel_status_enum AS ENUM (
        'harmonized', 
        'pending_review', 
        'critical_conflict', 
        'cors_resurvey'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE conflict_type_enum AS ENUM (
        'none', 
        'encroachment', 
        'boundary_overlap', 
        'unrecorded_construction', 
        'area_discrepancy', 
        'cadastral_gap'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Drone Flight Surveys & COG Metadata Table
CREATE TABLE IF NOT EXISTS drone_surveys (
    survey_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flight_identifier VARCHAR(64) UNIQUE NOT NULL,
    capture_timestamp TIMESTAMPTZ NOT NULL,
    drone_uav_model VARCHAR(128) NOT NULL,
    gsd_centimeters NUMERIC(5,2) NOT NULL CHECK (gsd_centimeters > 0),
    sensor_model VARCHAR(128) NOT NULL,
    cog_storage_uri TEXT NOT NULL,
    dsm_storage_uri TEXT,
    survey_footprint GEOMETRY(Polygon, 4326) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_survey_footprint_valid CHECK (ST_IsValid(survey_footprint))
);

CREATE INDEX IF NOT EXISTS idx_drone_surveys_footprint ON drone_surveys USING GIST (survey_footprint);

-- 4. Ground Control Points (GCP) with CORS Station Linkage
CREATE TABLE IF NOT EXISTS ground_control_points (
    gcp_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gcp_code VARCHAR(32) UNIQUE NOT NULL,
    pillar_name VARCHAR(128) NOT NULL,
    cors_base_station VARCHAR(64) NOT NULL,
    geom GEOMETRY(PointZ, 4326) NOT NULL,
    rmse_horizontal_meters NUMERIC(6,4) NOT NULL DEFAULT 0.0150,
    rmse_vertical_meters NUMERIC(6,4) NOT NULL DEFAULT 0.0200,
    status VARCHAR(32) DEFAULT 'locked' CHECK (status IN ('locked', 'calibrating', 'verified')),
    recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gcp_geom ON ground_control_points USING GIST (geom);

-- 5. Primary Cadastral & Harmonized Land Parcels Table
CREATE TABLE IF NOT EXISTS land_parcels (
    parcel_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ulpin VARCHAR(14) UNIQUE, -- 14-digit Bhu-Aadhaar
    plot_number VARCHAR(64) NOT NULL,
    khasra_number VARCHAR(64) NOT NULL,
    owner_name VARCHAR(256) NOT NULL,
    land_use VARCHAR(64) NOT NULL DEFAULT 'Residential',
    municipal_ward VARCHAR(128) NOT NULL,
    
    -- Dual Geometries (Both in EPSG:4326)
    revenue_boundary GEOMETRY(Polygon, 4326) NOT NULL,
    ai_footprint_boundary GEOMETRY(Polygon, 4326),
    harmonized_boundary GEOMETRY(Polygon, 4326),
    
    -- Metrics
    recorded_area_sqm NUMERIC(12,2) NOT NULL,
    surveyed_area_sqm NUMERIC(12,2),
    confidence_score NUMERIC(5,2) DEFAULT 0.00 CHECK (confidence_score >= 0 AND confidence_score <= 100),
    hausdorff_distance_m NUMERIC(8,3) DEFAULT 0.000,
    overlap_ratio NUMERIC(5,4) DEFAULT 0.0000,
    
    status parcel_status_enum NOT NULL DEFAULT 'pending_review',
    conflict_type conflict_type_enum NOT NULL DEFAULT 'none',
    
    drone_survey_id UUID REFERENCES drone_surveys(survey_id) ON DELETE SET NULL,
    last_updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Spatial Validity Constraints
    CONSTRAINT check_revenue_boundary_valid CHECK (ST_IsValid(revenue_boundary)),
    CONSTRAINT check_ai_boundary_valid CHECK (ai_footprint_boundary IS NULL OR ST_IsValid(ai_footprint_boundary)),
    CONSTRAINT check_harmonized_boundary_valid CHECK (harmonized_boundary IS NULL OR ST_IsValid(harmonized_boundary))
);

-- Spatial GIST Indices for sub-second spatial queries
CREATE INDEX IF NOT EXISTS idx_parcels_revenue_boundary ON land_parcels USING GIST (revenue_boundary);
CREATE INDEX IF NOT EXISTS idx_parcels_ai_boundary ON land_parcels USING GIST (ai_footprint_boundary);
CREATE INDEX IF NOT EXISTS idx_parcels_harmonized_boundary ON land_parcels USING GIST (harmonized_boundary);
CREATE INDEX IF NOT EXISTS idx_parcels_status ON land_parcels (status);
CREATE INDEX IF NOT EXISTS idx_parcels_ulpin ON land_parcels (ulpin);

-- 6. Spatial Conflicts & Encroachment Table
CREATE TABLE IF NOT EXISTS spatial_conflicts (
    conflict_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id UUID NOT NULL REFERENCES land_parcels(parcel_id) ON DELETE CASCADE,
    conflict_type conflict_type_enum NOT NULL,
    encroachment_polygon GEOMETRY(Polygon, 4326),
    encroachment_area_sqm NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    affected_entity VARCHAR(128), -- e.g. "Municipal 12m Public Road", "Plot 42-A"
    detected_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    resolved BOOLEAN DEFAULT FALSE,
    resolution_notes TEXT,
    CONSTRAINT check_encroachment_valid CHECK (encroachment_polygon IS NULL OR ST_IsValid(encroachment_polygon))
);

CREATE INDEX IF NOT EXISTS idx_conflicts_encroachment ON spatial_conflicts USING GIST (encroachment_polygon);
CREATE INDEX IF NOT EXISTS idx_conflicts_parcel ON spatial_conflicts (parcel_id);

-- 7. Immutable Audit Trail for Surveyor Approvals & Legal Recourse
CREATE TABLE IF NOT EXISTS parcel_audit_trail (
    audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id UUID NOT NULL REFERENCES land_parcels(parcel_id) ON DELETE CASCADE,
    ulpin VARCHAR(14),
    surveyor_id VARCHAR(64) NOT NULL,
    surveyor_role VARCHAR(64) NOT NULL,
    action_type VARCHAR(64) NOT NULL,
    previous_confidence NUMERIC(5,2),
    new_confidence NUMERIC(5,2),
    remarks TEXT NOT NULL,
    geom_snapshot GEOMETRY(Polygon, 4326),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_parcel ON parcel_audit_trail (parcel_id);
CREATE INDEX IF NOT EXISTS idx_audit_ulpin ON parcel_audit_trail (ulpin);

-- ============================================================================
-- 8. Spatial Triggers: Auto Area Calculation & Boundary Validation
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_calculate_parcel_metrics()
RETURNS TRIGGER AS $$
DECLARE
    v_intersection_area NUMERIC;
    v_union_area NUMERIC;
    v_hausdorff NUMERIC;
    v_area_diff_ratio NUMERIC;
BEGIN
    -- Ensure geometries are valid
    IF NEW.revenue_boundary IS NOT NULL THEN
        NEW.revenue_boundary := ST_MakeValid(NEW.revenue_boundary);
    END IF;
    
    IF NEW.ai_footprintBoundary IS NOT NULL THEN
        NEW.ai_footprint_boundary := ST_MakeValid(NEW.ai_footprint_boundary);
    END IF;

    -- Calculate surveyed area in square meters using geography (ellipsoidal calculation)
    IF NEW.ai_footprint_boundary IS NOT NULL THEN
        NEW.surveyed_area_sqm := ROUND(ST_Area(NEW.ai_footprint_boundary::geography)::numeric, 2);
        
        -- Calculate spatial intersection & union
        v_intersection_area := ST_Area(ST_Intersection(NEW.revenue_boundary, NEW.ai_footprint_boundary)::geography);
        v_union_area := ST_Area(ST_Union(NEW.revenue_boundary, NEW.ai_footprint_boundary)::geography);
        
        IF v_union_area > 0 THEN
            NEW.overlap_ratio := ROUND((v_intersection_area / v_union_area)::numeric, 4);
        ELSE
            NEW.overlap_ratio := 0.0000;
        END IF;

        -- Calculate Hausdorff Distance in meters
        v_hausdorff := ST_HausdorffDistance(
            ST_Transform(NEW.revenue_boundary, 32643), 
            ST_Transform(NEW.ai_footprint_boundary, 32643)
        );
        NEW.hausdorff_distance_m := ROUND(v_hausdorff::numeric, 3);

        -- Area deviation ratio
        IF NEW.recorded_area_sqm > 0 THEN
            v_area_diff_ratio := ABS(NEW.surveyed_area_sqm - NEW.recorded_area_sqm) / NEW.recorded_area_sqm;
        ELSE
            v_area_diff_ratio := 1.0;
        END IF;

        -- Composite Confidence Score Algorithm (0 to 100)
        NEW.confidence_score := LEAST(100.0, GREATEST(0.0, ROUND((
            (NEW.overlap_ratio * 55.0) + 
            (GREATEST(0.0, 1.0 - (v_hausdorff / 5.0)) * 25.0) + 
            (GREATEST(0.0, 1.0 - v_area_diff_ratio) * 20.0)
        )::numeric, 2)));

        -- Categorize Status & Conflict
        IF NEW.confidence_score >= 80.0 THEN
            NEW.status := 'harmonized';
            NEW.conflict_type := 'none';
            NEW.harmonized_boundary := NEW.ai_footprint_boundary;
        ELSIF v_hausdorff > 2.0 OR v_area_diff_ratio > 0.20 THEN
            NEW.status := 'critical_conflict';
            NEW.conflict_type := 'encroachment';
        ELSE
            NEW.status := 'pending_review';
            NEW.conflict_type := 'boundary_overlap';
        END IF;
    END IF;

    NEW.last_updated := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_parcel_metrics ON land_parcels;
CREATE TRIGGER trg_calculate_parcel_metrics
BEFORE INSERT OR UPDATE OF revenue_boundary, ai_footprint_boundary
ON land_parcels
FOR EACH ROW
EXECUTE FUNCTION fn_calculate_parcel_metrics();
`;

export const PYTHON_SAMGEO_PIPELINE = `"""
========================================================================================
NAKSHA GeoAI Ingestion & Extraction Pipeline (Production Implementation)
Module: AI-Extracted Building Footprints & Auto-Georeferencing with SAM-Geo & PostGIS
Author: NAKSHA GeoAI Core Architecture Team (DoLR / MoRD - SIH PS ID: 26013)
========================================================================================
Dependencies:
    pip install torch torchvision rasterio geopandas shapely opencv-python segment-geospatial psycopg2-binary
"""

import os
import sys
import logging
from typing import List, Tuple, Dict, Any
import numpy as np
import cv2
import rasterio
from rasterio.features import shapes
from rasterio.warp import calculate_default_transform, reproject, Resampling
import geopandas as gpd
from shapely.geometry import shape, Polygon, MultiPolygon
from shapely.validation import make_valid
from samgeo import SamGeo
from sqlalchemy import create_engine, text

logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(levelname)s: %(message)s")
logger = logging.getLogger("NAKSHA-GeoAI")


class NakshaGeoAIExtractor:
    """
    Production-grade GeoAI pipeline for drone orthophoto ingest, SAM-Geo building
    footprint extraction, GCP feature matching, and PostGIS database synchronization.
    """

    def __init__(self, db_connection_url: str, model_type: str = "vit_h", checkpoint_path: str = None):
        self.db_url = db_connection_url
        self.engine = create_engine(self.db_url, pool_pre_ping=True)
        self.model_type = model_type
        self.checkpoint = checkpoint_path

        logger.info(f"Initializing SAM-Geo with backbone: {self.model_type}")
        self.sam = SamGeo(
            model_type=self.model_type,
            checkpoint=self.checkpoint,
            automatic=True,
            device="cuda" if self._has_cuda() else "cpu",
            sam_kwargs={
                "points_per_side": 32,
                "pred_iou_thresh": 0.88,
                "stability_score_thresh": 0.95,
                "crop_n_layers": 1,
                "crop_n_points_downscale_factor": 2,
                "min_mask_region_area": 50,  # Filter out trivial micro-artifacts
            }
        )

    @staticmethod
    def _has_cuda() -> bool:
        try:
            import torch
            return torch.cuda.is_available()
        except ImportError:
            return False

    def convert_to_cloud_optimized_geotiff(self, input_tif: str, output_cog: str) -> str:
        """
        Converts standard drone orthophoto into Cloud-Optimized GeoTIFF (COG)
        with internal 512x512 tiling and power-of-2 overviews for real-time Web-GIS streaming.
        """
        logger.info(f"Generating Cloud-Optimized GeoTIFF (COG) for: {input_tif}")
        import subprocess

        cmd = [
            "gdal_translate",
            input_tif,
            output_cog,
            "-of", "COG",
            "-co", "COMPRESS=DEFLATE",
            "-co", "PREDICTOR=2",
            "-co", "BLOCKSIZE=512",
            "-co", "OVERVIEWS=AUTO",
            "-co", "NUM_THREADS=ALL_CPUS"
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode != 0:
            logger.error(f"GDAL COG generation failed: {res.stderr}")
            raise RuntimeError(res.stderr)
        logger.info(f"Successfully created COG: {output_cog}")
        return output_cog

    def auto_georeference_cadastral_map(
        self, 
        legacy_scanned_map: str, 
        drone_ori_raster: str, 
        output_aligned_tif: str
    ) -> np.ndarray:
        """
        Automated Ground Control Point (GCP) matching engine using SIFT/ORB + RANSAC Homography
        to auto-georeference legacy revenue cadastral sheets directly against drone ORI rasters.
        """
        logger.info("Executing automated GCP matching between legacy map & drone ORI...")
        
        # Load grayscale images
        img_legacy = cv2.imread(legacy_scanned_map, cv2.IMREAD_GRAYSCALE)
        img_drone = cv2.imread(drone_ori_raster, cv2.IMREAD_GRAYSCALE)
        
        # Feature detector (SIFT)
        sift = cv2.SIFT_create(nfeatures=5000, contrastThreshold=0.03)
        kp1, des1 = sift.detectAndCompute(img_legacy, None)
        kp2, des2 = sift.detectAndCompute(img_drone, None)

        # FLANN Matcher
        flann = cv2.FlannBasedMatcher(dict(algorithm=1, trees=5), dict(checks=50))
        matches = flann.knnMatch(des1, des2, k=2)

        # Lowe's ratio test filter
        good_matches = [m for m, n in matches if m.distance < 0.70 * n.distance]
        logger.info(f"Found {len(good_matches)} high-confidence tie points.")

        if len(good_matches) < 4:
            raise ValueError("Insufficient GCP tie-points detected for homography calculation.")

        src_pts = np.float32([kp1[m.queryIdx].pt for m in good_matches]).reshape(-1, 1, 2)
        dst_pts = np.float32([kp2[m.trainIdx].pt for m in good_matches]).reshape(-1, 1, 2)

        # Estimate Affine/Homography transformation with RANSAC
        H, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)
        
        # Warp legacy map to align with drone coordinate frame
        h, w = img_drone.shape
        aligned_map = cv2.warpPerspective(img_legacy, H, (w, h))
        cv2.imwrite(output_aligned_tif, aligned_map)
        logger.info(f"Legacy cadastral sheet successfully aligned & saved to: {output_aligned_tif}")
        return H

    def extract_footprints_and_parcels(
        self, 
        drone_raster_path: str, 
        output_vector_path: str
    ) -> gpd.GeoDataFrame:
        """
        Executes SAM-Geo automated segmentation, vectorizes binary mask contours,
        applies Douglas-Peucker simplification, and exports valid GeoPandas GeoDataFrame.
        """
        logger.info(f"Running SAM-Geo deep segmentation on: {drone_raster_path}")
        mask_output = output_vector_path.replace(".geojson", "_mask.tif")

        # Step 1: Run SAM-Geo automatic mask generation
        self.sam.generate(
            source=drone_raster_path,
            output=mask_output,
            foreground=True,
            unique=True
        )

        # Step 2: Polygonize raster masks to Shapely geometries
        logger.info("Polygonizing raster masks with spatial transform...")
        with rasterio.open(mask_output) as src:
            image = src.read(1)
            transform = src.transform
            crs = src.crs

            geoms = []
            for geom, val in shapes(image, mask=(image > 0), transform=transform):
                poly = shape(geom)
                if poly.is_empty:
                    continue
                # Fix self-intersections
                if not poly.is_valid:
                    poly = make_valid(poly)
                
                # Simplify boundary noise (tolerance ~ 0.15m in projected CRS)
                simplified_poly = poly.simplify(0.15, preserve_topology=True)
                
                # Filter small sliver polygons (< 25 sqm)
                if simplified_poly.area >= 25.0:
                    geoms.append(simplified_poly)

        gdf = gpd.GeoDataFrame({"geometry": geoms}, crs=crs)
        logger.info(f"Extracted {len(gdf)} discrete building/parcel boundaries.")

        # Step 3: Reproject to EPSG:4326 for standardization
        if gdf.crs.to_epsg() != 4326:
            gdf = gdf.to_crs(epsg=4326)

        gdf.to_file(output_vector_path, driver="GeoJSON")
        logger.info(f"Vector boundaries exported to: {output_vector_path}")
        return gdf

    def sync_to_postgis(self, gdf: gpd.GeoDataFrame, survey_flight_id: str, ward_name: str):
        """
        Directly streams extracted geometries to PostgreSQL / PostGIS.
        Invokes spatial triggers for automatic conflict computation.
        """
        logger.info(f"Synchronizing {len(gdf)} parcels into PostGIS database...")
        
        with self.engine.begin() as conn:
            # Query survey UUID
            res = conn.execute(
                text("SELECT survey_id FROM drone_surveys WHERE flight_identifier = :fid"),
                {"fid": survey_flight_id}
            ).fetchone()
            survey_uuid = res[0] if res else None

            for idx, row in gdf.iterrows():
                geom_wkt = row.geometry.wkt
                plot_code = f"AUTO-PLT-{idx+1:04d}"
                ulpin_candidate = f"27-013-0948-{idx+100:05d}"

                insert_sql = text("""
                    INSERT INTO land_parcels (
                        ulpin,
                        plot_number,
                        khasra_number,
                        owner_name,
                        land_use,
                        municipal_ward,
                        revenue_boundary,
                        ai_footprint_boundary,
                        recorded_area_sqm,
                        drone_survey_id
                    ) VALUES (
                        :ulpin,
                        :plot_no,
                        :khasra_no,
                        'Pending Verification (Revenue Dept)',
                        'Residential',
                        :ward,
                        ST_GeomFromText(:wkt, 4326),
                        ST_GeomFromText(:wkt, 4326),
                        ROUND(ST_Area(ST_GeomFromText(:wkt, 4326)::geography)::numeric, 2),
                        :survey_id
                    )
                    ON CONFLICT (ulpin) DO UPDATE 
                    SET ai_footprint_boundary = EXCLUDED.ai_footprint_boundary,
                        last_updated = CURRENT_TIMESTAMP;
                """)
                
                conn.execute(insert_sql, {
                    "ulpin": ulpin_candidate,
                    "plot_no": plot_code,
                    "khasra_no": f"KHS-{idx+1}",
                    "ward": ward_name,
                    "wkt": geom_wkt,
                    "survey_id": survey_uuid
                })

        logger.info("PostGIS spatial synchronization complete. Triggers calculated metrics.")


if __name__ == "__main__":
    DB_URI = os.getenv("DATABASE_URL", "postgresql://naksha_admin:secret@localhost:5432/naksha_gis")
    
    pipeline = NakshaGeoAIExtractor(db_connection_url=DB_URI)
    
    # 1. Convert Drone Orthophoto to COG
    # cog_file = pipeline.convert_to_cloud_optimized_geotiff("raw_drone_survey.tif", "drone_cog.tif")
    
    # 2. Extract Footprints with SAM-Geo
    # extracted_gdf = pipeline.extract_footprints_and_parcels("drone_cog.tif", "extracted_parcels.geojson")
    
    # 3. Stream to PostGIS
    # pipeline.sync_to_postgis(extracted_gdf, "FLIGHT-NAKSHA-2026-MH-0948", "Ward 14 (Shivaji Nagar North)")
    print("NAKSHA GeoAI Extraction Pipeline initialized successfully.")
`;

export const FASTAPI_GATEWAY_CODE = `"""
========================================================================================
NAKSHA OGC Web-GIS Service Gateway & RESTful API (FastAPI)
Ministry of Rural Development / DoLR - SIH PS ID: 26013
========================================================================================
Standards Implemented:
  - OGC WFS 2.0 (Web Feature Service for GeoJSON streams)
  - OGC WMS 1.3.0 (Web Map Service proxy for map tile rendering)
  - RESTful Parcel Harmonization & Surveyor Conflict Resolution API
"""

from fastapi import FastAPI, Depends, HTTPException, Query, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import asyncpg
import json
import os

app = FastAPI(
    title="NAKSHA GeoAI Urban Land Harmonization Gateway",
    description="OGC-compliant Spatial API for Urban Land Record Management (DoLR SIH PS ID: 26013)",
    version="2.4.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://naksha_admin:secret@localhost:5432/naksha_gis")


# -----------------------------------------------------------------------------
# Pydantic Schemas
# -----------------------------------------------------------------------------
class HarmonizeApprovalRequest(BaseModel):
    parcel_id: str
    surveyor_id: str = Field(..., example="SURV-MH-842")
    surveyor_role: str = Field(..., example="Deputy Superintendent of Land Records")
    action: str = Field(..., example="HARMONIZED_APPROVED")
    decision_type: str = Field(..., example="ACCEPT_AI_BOUNDARY") # ACCEPT_AI_BOUNDARY | SNAP_TO_REVENUE | FIELD_CORS_DISPATCH
    remarks: str = Field(..., example="Physical boundary wall matches orthophoto within 0.12m. Approved.")

class ParcelQueryResponse(BaseModel):
    parcel_id: str
    ulpin: Optional[str]
    plot_number: str
    khasra_number: str
    owner_name: str
    recorded_area_sqm: float
    surveyed_area_sqm: Optional[float]
    confidence_score: float
    status: str
    conflict_type: str
    hausdorff_distance_m: float
    overlap_ratio: float
    geojson_geometry: dict


# -----------------------------------------------------------------------------
# Database Connection Pool Dependency
# -----------------------------------------------------------------------------
async def get_db_pool():
    pool = await asyncpg.create_pool(DATABASE_URL, min_size=5, max_size=20)
    try:
        yield pool
    finally:
        await pool.close()


# -----------------------------------------------------------------------------
# RESTful Spatial Endpoints
# -----------------------------------------------------------------------------
@app.get("/api/v1/parcels", response_model=List[ParcelQueryResponse])
async def list_parcels(
    ward: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    min_confidence: Optional[float] = 0.0,
    pool=Depends(get_db_pool)
):
    """
    Query parcels with optional spatial/attribute filters and GeoJSON geometry.
    """
    query = """
        SELECT 
            parcel_id::text,
            ulpin,
            plot_number,
            khasra_number,
            owner_name,
            recorded_area_sqm,
            surveyed_area_sqm,
            confidence_score,
            status::text,
            conflict_type::text,
            hausdorff_distance_m,
            overlap_ratio,
            ST_AsGeoJSON(COALESCE(harmonized_boundary, ai_footprint_boundary, revenue_boundary)) as geojson_geom
        FROM land_parcels
        WHERE confidence_score >= $1
          AND ($2::text IS NULL OR municipal_ward = $2)
          AND ($3::text IS NULL OR status::text = $3)
        ORDER BY confidence_score ASC;
    """
    async with pool.acquire() as conn:
        rows = await conn.fetch(query, min_confidence, ward, status_filter)
        return [
            ParcelQueryResponse(
                parcel_id=r["parcel_id"],
                ulpin=r["ulpin"],
                plot_number=r["plot_number"],
                khasra_number=r["khasra_number"],
                owner_name=r["owner_name"],
                recorded_area_sqm=float(r["recorded_area_sqm"]),
                surveyed_area_sqm=float(r["surveyed_area_sqm"]) if r["surveyed_area_sqm"] else None,
                confidence_score=float(r["confidence_score"]),
                status=r["status"],
                conflict_type=r["conflict_type"],
                hausdorff_distance_m=float(r["hausdorff_distance_m"]),
                overlap_ratio=float(r["overlap_ratio"]),
                geojson_geometry=json.loads(r["geojson_geom"]) if r["geojson_geom"] else {}
            )
            for r in rows
        ]


@app.post("/api/v1/conflicts/resolve", status_code=status.HTTP_200_OK)
async def resolve_parcel_conflict(
    payload: HarmonizeApprovalRequest,
    pool=Depends(get_db_pool)
):
    """
    Surveyor conflict resolution endpoint. Updates parcel status and logs an immutable audit trail.
    """
    async with pool.acquire() as conn:
        async with conn.transaction():
            # Check existing parcel
            parcel = await conn.fetchrow(
                "SELECT confidence_score, ulpin FROM land_parcels WHERE parcel_id = $1::uuid", 
                payload.parcel_id
            )
            if not parcel:
                raise HTTPException(status_code=404, detail="Parcel not found.")

            prev_score = parcel["confidence_score"]
            new_score = 98.0 if payload.decision_type == "ACCEPT_AI_BOUNDARY" else prev_score
            new_status = "harmonized" if payload.decision_type == "ACCEPT_AI_BOUNDARY" else "cors_resurvey"

            # Update parcel
            await conn.execute("""
                UPDATE land_parcels
                SET status = $1::parcel_status_enum,
                    confidence_score = $2,
                    harmonized_boundary = CASE 
                        WHEN $3 = 'ACCEPT_AI_BOUNDARY' THEN ai_footprint_boundary 
                        ELSE harmonized_boundary 
                    END,
                    last_updated = CURRENT_TIMESTAMP
                WHERE parcel_id = $4::uuid
            """, new_status, new_score, payload.decision_type, payload.parcel_id)

            # Insert into immutable audit log
            await conn.execute("""
                INSERT INTO parcel_audit_trail (
                    parcel_id, ulpin, surveyor_id, surveyor_role, action_type, 
                    previous_confidence, new_confidence, remarks
                ) VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8)
            """, payload.parcel_id, parcel["ulpin"], payload.surveyor_id, payload.surveyor_role, 
               payload.action, prev_score, new_score, payload.remarks)

    return {"status": "SUCCESS", "message": f"Parcel {payload.parcel_id} successfully updated to {new_status}."}


# -----------------------------------------------------------------------------
# OGC WFS 2.0 Web Feature Service Implementation
# -----------------------------------------------------------------------------
@app.get("/ogc/wfs")
async def ogc_wfs_gateway(
    service: str = "WFS",
    version: str = "2.0.0",
    request: str = "GetFeature",
    typeNames: str = "naksha:land_parcels",
    bbox: Optional[str] = None, # minx,miny,maxx,maxy
    outputFormat: str = "application/json",
    pool=Depends(get_db_pool)
):
    """
    OGC WFS 2.0 Feature Stream endpoint for OpenLayers / Leaflet / QGIS consumption.
    """
    if request != "GetFeature":
        return Response(content="<Exception>Only GetFeature is supported</Exception>", media_type="application/xml")

    spatial_filter = ""
    params = []
    if bbox:
        coords = [float(c) for c in bbox.split(",")]
        spatial_filter = "AND revenue_boundary && ST_MakeEnvelope($1, $2, $3, $4, 4326)"
        params.extend(coords)

    query = f"""
        SELECT json_build_object(
            'type', 'FeatureCollection',
            'features', COALESCE(json_agg(
                json_build_object(
                    'type', 'Feature',
                    'id', parcel_id::text,
                    'geometry', ST_AsGeoJSON(COALESCE(harmonized_boundary, ai_footprint_boundary, revenue_boundary))::json,
                    'properties', json_build_object(
                        'ulpin', ulpin,
                        'plot_number', plot_number,
                        'khasra_number', khasra_number,
                        'owner_name', owner_name,
                        'confidence_score', confidence_score,
                        'status', status,
                        'conflict_type', conflict_type
                    )
                )
            ), '[]'::json)
        ) as geojson
        FROM land_parcels
        WHERE 1=1 {spatial_filter};
    """
    async with pool.acquire() as conn:
        row = await conn.fetchrow(query, *params)
        return json.loads(row["geojson"])
`;
