import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  Database, 
  Code2, 
  FileCode, 
  Layers, 
  Cpu, 
  BookOpen
} from 'lucide-react';
import { 
  ARCHITECTURE_DIAGRAM_ASCII, 
  POSTGIS_DDL_SQL, 
  PYTHON_SAMGEO_PIPELINE, 
  FASTAPI_GATEWAY_CODE 
} from '../data/architecturalSpecs';

interface CodeArtifactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'arch' | 'sql' | 'python' | 'fastapi' | 'guide';
}

export const CodeArtifactsModal: React.FC<CodeArtifactsModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'arch',
}) => {
  const [activeTab, setActiveTab] = useState<'arch' | 'sql' | 'python' | 'fastapi' | 'guide'>(defaultTab);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const getActiveCode = () => {
    switch (activeTab) {
      case 'arch':
        return ARCHITECTURE_DIAGRAM_ASCII;
      case 'sql':
        return POSTGIS_DDL_SQL;
      case 'python':
        return PYTHON_SAMGEO_PIPELINE;
      case 'fastapi':
        return FASTAPI_GATEWAY_CODE;
      case 'guide':
        return DEPLOYMENT_GUIDE_TEXT;
      default:
        return '';
    }
  };

  const getFileName = () => {
    switch (activeTab) {
      case 'arch':
        return 'naksha_system_architecture.txt';
      case 'sql':
        return 'naksha_postgis_schema.sql';
      case 'python':
        return 'naksha_samgeo_pipeline.py';
      case 'fastapi':
        return 'naksha_ogc_gateway.py';
      case 'guide':
        return 'deployment_instructions.md';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([getActiveCode()], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = getFileName();
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden text-neutral-200 text-xs">
        {/* Header */}
        <div className="p-4 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-black text-white border border-neutral-700">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                NAKSHA GeoAI Technical Architecture &amp; Production Code Hub
              </h3>
              <p className="text-neutral-400 text-xs">
                SIH PS ID: 26013 &bull; Production-grade SQL DDL, Python SAM-Geo, FastAPI Gateway, and System Flows
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

        {/* Tab Controls Bar */}
        <div className="px-4 py-2.5 bg-neutral-950 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('arch')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'arch'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>1. Architecture Diagram</span>
            </button>

            <button
              onClick={() => setActiveTab('sql')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'sql'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>2. PostGIS DDL Schema</span>
            </button>

            <button
              onClick={() => setActiveTab('python')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'python'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>3. Python SAM-Geo Script</span>
            </button>

            <button
              onClick={() => setActiveTab('fastapi')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'fastapi'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>4. FastAPI OGC Gateway</span>
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'guide'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>5. Deployment &amp; Docker</span>
            </button>
          </div>

          {/* Copy & Download Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 text-xs font-medium transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span className="text-white font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Copy Code</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>

        {/* Code Content Viewer */}
        <div className="flex-1 overflow-auto p-4 bg-black font-mono text-[11px] leading-relaxed text-neutral-200 select-text">
          <pre className="whitespace-pre overflow-x-auto p-2">
            {getActiveCode()}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-3 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between text-neutral-400 text-[11px]">
          <span>Format: Complete production-grade executable code without placeholders</span>
          <span>File: <strong className="text-white font-mono">{getFileName()}</strong></span>
        </div>
      </div>
    </div>
  );
};

export const DEPLOYMENT_GUIDE_TEXT = `# NAKSHA GeoAI Platform: Step-by-Step Setup & Deployment Guide
# Ministry of Rural Development / DoLR - SIH PS ID: 26013

## 1. System Requirements & Hardware Sizing
- OS: Ubuntu 22.04 LTS (x86_64)
- CPU: 8+ vCPU
- RAM: 32 GB Minimum (64 GB Recommended for large drone ortho tiles)
- GPU: NVIDIA RTX 4090 / A10G / Tesla T4 (with CUDA 12.0+ for SAM-Geo ViT-H inference)
- Storage: 500 GB NVMe SSD (PostgreSQL NVMe storage with tablespace optimization)

## 2. PostgreSQL 15 + PostGIS Installation & Setup
\`\`\`bash
# 1. Install PostgreSQL 15 & PostGIS 3.3
sudo apt update && sudo apt install -y postgresql-15 postgresql-15-postgis-3 postgresql-15-postgis-3-scripts gdal-bin

# 2. Configure Database & User
sudo -u postgres psql -c "CREATE USER naksha_admin WITH PASSWORD 'secret';"
sudo -u postgres psql -c "CREATE DATABASE naksha_gis OWNER naksha_admin;"
sudo -u postgres psql -d naksha_gis -c "CREATE EXTENSION postgis; CREATE EXTENSION postgis_topology; CREATE EXTENSION \\"uuid-ossp\\";"

# 3. Apply DDL Schema and Triggers
psql -h localhost -U naksha_admin -d naksha_gis -f naksha_postgis_schema.sql
\`\`\`

## 3. Python Environment & SAM-Geo Dependencies
\`\`\`bash
# Create isolated Python virtual environment
conda create -n naksha_geoai python=3.10 -y
conda activate naksha_geoai

# Install PyTorch with CUDA 12.1
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121

# Install Geospatial & SAM-Geo Libraries
pip install segment-geospatial rasterio geopandas shapely opencv-python psycopg2-binary fastapi uvicorn asyncpg

# Download SAM ViT-H Pretrained Checkpoint
wget https://dl.fbaipublicfiles.com/segment_anything/sam_vit_h_4b8939.pth -O /opt/models/sam_vit_h.pth
\`\`\`

## 4. Launching the OGC Gateway & RESTful API
\`\`\`bash
export DATABASE_URL="postgresql://naksha_admin:secret@localhost:5432/naksha_gis"
uvicorn naksha_ogc_gateway:app --host 0.0.0.0 --port 8000 --workers 4
\`\`\`

## 5. Production Docker & Container Orchestration
### Dockerfile (FastAPI + GDAL + PyTorch + SAM-Geo)
\`\`\`dockerfile
FROM nvidia/cuda:12.1.1-runtime-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y \\
    python3.10 python3-pip python3-dev \\
    gdal-bin libgdal-dev \\
    libgl1-mesa-glx libglib2.0-0 \\
    curl git \\
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt
COPY . .

EXPOSE 8000
CMD ["uvicorn", "naksha_ogc_gateway:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
\`\`\`

### docker-compose.yml (PostGIS 15 + GeoAI Service + Web-GIS Frontend)
\`\`\`yaml
version: '3.8'

services:
  naksha-db:
    image: postgis/postgis:15-3.3
    container_name: naksha-postgis
    environment:
      POSTGRES_DB: naksha_gis
      POSTGRES_USER: naksha_admin
      POSTGRES_PASSWORD: secret_spatial_pass
    volumes:
      - postgis_data:/var/lib/postgresql/data
      - ./naksha_postgis_schema.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped

  naksha-geoai-api:
    build: .
    container_name: naksha-geoai-backend
    depends_on:
      - naksha-db
    environment:
      DATABASE_URL: postgresql://naksha_admin:secret_spatial_pass@naksha-db:5432/naksha_gis
    ports:
      - "8000:8000"
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    restart: unless-stopped

  naksha-frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    container_name: naksha-webgis-ui
    ports:
      - "3000:80"
    depends_on:
      - naksha-geoai-api
    restart: unless-stopped

volumes:
  postgis_data:
\`\`\`

## 6. Web-GIS Frontend Deployment
\`\`\`bash
npm install
npm run build
# Serve static dist or proxy via NGINX with Leaflet / OpenLayers
\`\`\`
`;
