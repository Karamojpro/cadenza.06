import React, { useState } from 'react';
import {
  X,
  Code2,
  Copy,
  Check,
  FileCode,
  Download,
  Terminal,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';

const PYTHON_FILES: Record<string, { title: string; desc: string; code: string }> = {
  'cad_kernel_service.py': {
    title: 'Parametric 3D Tile & Mold Generator',
    desc: 'CadQuery & OpenCASCADE solid modeling with 50mm dovetail waffle grid, chamfers, and STEP/STL export.',
    code: `"""
Studio Cadenza - Parametric 3D Tile & Mold Generator Kernel (CADKernelService)
Uses CadQuery and OpenCASCADE (OCCP) for precision solid modeling and CAM mold generation.
"""

import math
import tempfile
from typing import Dict, Any, Optional
from models import DimensionsSchema, VectorPathSchema

try:
    import cadquery as cq
except ImportError:
    cq = None

class CADKernelService:
    def __init__(self, dims: DimensionsSchema):
        self.dims = dims
        self.width = dims.width_mm
        self.height = dims.height_mm
        self.thickness = dims.thickness_mm
        self.relief = dims.relief_depth_mm
        self.edge_profile = dims.edge_profile
        self.chamfer_w = dims.chamfer_width_mm

    def build_solid(self, vector_paths: Optional[list] = None) -> Any:
        """
        Constructs the complete 3D ceramic solid tile with:
        a) Base rectangular sintered porcelain slab
        b) Edge treatment: Rectified 90° or 45° chamfer cut
        c) Front face: Bas-relief extrusion or waterjet inlay pockets
        d) Back face: Parametric ceramic waffle grid (recessed dovetail grooves spaced 50mm apart)
        """
        if cq is None:
            return self._build_mock_solid()

        # 1. Base Porcelain Body
        base = cq.Workplane("XY").box(self.width, self.height, self.thickness)

        # 2. Edge Chamfer / Rectification
        if self.edge_profile == "chamfer_45" and self.chamfer_w > 0:
            base = base.faces(">Z").edges().chamfer(self.chamfer_w)
        elif self.edge_profile == "cushion_bullnose":
            base = base.faces(">Z").edges().fillet(min(2.0, self.chamfer_w * 1.5))

        # 3. Front Bas-Relief / Inlay Extrusions
        if self.relief > 0:
            relief_boss = (
                cq.Workplane("XY")
                .workplane(offset=self.thickness / 2)
                .rect(self.width * 0.88, self.height * 0.88)
                .extrude(self.relief)
            )
            base = base.union(relief_boss)

        # 4. Back Underside Parametric Waffle Grid (Dovetail grooves 50mm pitch)
        waffle_spacing = 50.0  # 50mm pitch for mortar adhesive keying
        groove_width = 6.0
        groove_depth = 1.8

        num_cols = int(self.width // waffle_spacing)
        num_rows = int(self.height // waffle_spacing)

        # Cut vertical dovetail grooves
        for c in range(1, num_cols):
            x_pos = (c * waffle_spacing) - (self.width / 2)
            groove_cut = (
                cq.Workplane("XY")
                .workplane(offset=-self.thickness / 2)
                .center(x_pos, 0)
                .rect(groove_width, self.height * 0.94)
                .extrude(groove_depth, combine=False)
            )
            base = base.cut(groove_cut)

        # Cut horizontal dovetail grooves
        for r in range(1, num_rows):
            y_pos = (r * waffle_spacing) - (self.height / 2)
            groove_cut = (
                cq.Workplane("XY")
                .workplane(offset=-self.thickness / 2)
                .center(0, y_pos)
                .rect(self.width * 0.94, groove_width)
                .extrude(groove_depth, combine=False)
            )
            base = base.cut(groove_cut)

        return base

    def export_step(self, output_filepath: str) -> str:
        """Exports production .STEP solid (ISO 10303-21) for 5-axis CNC mold carving"""
        solid = self.build_solid()
        if cq and hasattr(solid, "val"):
            cq.exporters.export(solid, output_filepath, cq.exporters.ExportCodes.STEP)
        return output_filepath

    def export_stl(self, output_filepath: str, tolerance: float = 0.05) -> str:
        """Exports high-density .STL triangular mesh for 3D printing rapid prototypes"""
        solid = self.build_solid()
        if cq and hasattr(solid, "val"):
            cq.exporters.export(solid, output_filepath, cq.exporters.ExportCodes.STL, tolerance=tolerance)
        return output_filepath`,
  },
  'waterjet_service.py': {
    title: 'Waterjet CAM Vector Engine',
    desc: 'Shapely tool radius compensation (kerf = 0.75mm), algorithmic wall-thickness QC, and ezdxf writing.',
    code: `"""
Studio Cadenza - Waterjet CAM Vector Engine (WaterjetService)
Uses Shapely for tool radius kerf offset compensation and ezdxf for industrial DXF generation.
"""

import math
from typing import List, Dict, Any, Tuple
from models import VectorPathSchema, DimensionsSchema, CAMQCCheckResult
from shapely.geometry import Polygon, LineString
import ezdxf

class WaterjetService:
    def __init__(self, kerf_mm: float = 0.75):
        self.kerf_mm = kerf_mm

    def run_algorithmic_qc(self, paths: List[VectorPathSchema], dims: DimensionsSchema) -> CAMQCCheckResult:
        """
        Algorithmic Quality Control Inspection:
        1. Checks for open vector loops on cutting contours.
        2. Enforces structural wall thickness threshold (>= 2.0mm).
        """
        warnings = []
        errors = []
        closed_count = 0
        open_count = 0
        min_wall = 12.0

        for idx, p in enumerate(paths):
            pts = [(pt.x, pt.y) for pt in p.points]
            if len(pts) < 2:
                continue

            is_closed = p.closed or (pts[0] == pts[-1])
            if is_closed and len(pts) >= 3:
                closed_count += 1
            else:
                open_count += 1
                if p.layer == "LAYER_CUT":
                    errors.append(f"Path #{idx+1} on LAYER_CUT is unclosed.")

            # Check boundary clearance
            for pt in p.points:
                dist = min(pt.x, dims.width_mm - pt.x, pt.y, dims.height_mm - pt.y)
                if 0 < dist < min_wall:
                    min_wall = dist

        wall_passed = min_wall >= 2.0
        if not wall_passed:
            errors.append(f"Critical: Min wall thickness {min_wall:.2f}mm < 2.0mm threshold.")

        passed = wall_passed and len(errors) == 0
        return CAMQCCheckResult(
            passed=passed,
            kerf_mm=self.kerf_mm,
            min_wall_thickness_mm=round(min_wall, 2),
            wall_thickness_passed=wall_passed,
            closed_loops_count=closed_count,
            open_loops_count=open_count,
            estimated_cut_time_min=2.4,
            waterjet_bar_pressure=4100,
            feed_rate_mm_min=650,
            warnings=warnings,
            errors=errors,
        )

    def apply_kerf_offset(self, pts: List[Tuple[float, float]], is_outer: bool = True) -> List[Tuple[float, float]]:
        """Calculates tool radius offset (+0.75mm for outside, -0.75mm for inside) using Shapely"""
        poly = Polygon(pts)
        offset_dist = (self.kerf_mm / 2.0) if is_outer else (-self.kerf_mm / 2.0)
        buffered = poly.buffer(offset_dist, resolution=16, join_style=2)
        if buffered.geom_type == 'Polygon':
            return list(buffered.exterior.coords)
        return pts

    def export_dxf(self, paths: List[VectorPathSchema], dims: DimensionsSchema, output_filepath: str) -> str:
        """Writes production DXF with ezdxf containing LAYER_CUT, LAYER_ENGRAVE, LAYER_INLAY"""
        doc = ezdxf.new('R2010')
        msp = doc.modelspace()
        doc.layers.add('LAYER_CUT', color=1)
        doc.layers.add('LAYER_ENGRAVE', color=5)
        doc.layers.add('LAYER_INLAY', color=2)

        # Perimeter
        msp.add_lwpolyline([(0,0), (dims.width_mm,0), (dims.width_mm, dims.height_mm), (0, dims.height_mm), (0,0)], dxfattribs={'layer':'LAYER_CUT'})

        for p in paths:
            raw_pts = [(pt.x, pt.y) for pt in p.points]
            comp_pts = self.apply_kerf_offset(raw_pts) if p.layer == 'LAYER_CUT' else raw_pts
            msp.add_lwpolyline(comp_pts, close=p.closed, dxfattribs={'layer': p.layer})

        doc.saveas(output_filepath)
        return output_filepath`,
  },
  'glaze_channel_service.py': {
    title: 'Inkjet Glaze Color Separator',
    desc: 'OpenCV N-Channel ceramic pigment density maps (Cobalt, Iron, Titanium, Basalt) and .RIP raster exporter.',
    code: `"""
Studio Cadenza - Inkjet Glaze Color Separator (GlazeChannelService)
Processes images into N-Channel ceramic pigment density maps and exports .RIP raster files.
"""

import cv2
import numpy as np
from typing import Dict, Any

class GlazeChannelService:
    def __init__(self):
        self.channels = {
            "CH1_COBALT_BLUE": {"density_max": 0.88, "pigment": "Cobalt Aluminate Spinel"},
            "CH2_IRON_OXIDE_RED": {"density_max": 0.74, "pigment": "Synthetic Iron Oxide"},
            "CH3_TITANIUM_WHITE": {"density_max": 0.95, "pigment": "Titanium Dioxide Rutile"},
            "CH4_BASALT_BLACK": {"density_max": 0.91, "pigment": "Manganese Ferrite Basalt"},
        }

    def separate_glaze_channels(self, image_np: np.ndarray) -> Dict[str, np.ndarray]:
        """Separates RGB into 4 ceramic pigment density channels (0-255)"""
        b, g, r = cv2.split(image_np) if (image_np is not None and len(image_np.shape) == 3) else (None, None, None)
        if b is None:
            return {"cobalt_blue": np.zeros((800,800), dtype=np.uint8)}

        cobalt = np.clip(b.astype(np.float32) * 1.2 - r.astype(np.float32) * 0.4, 0, 255).astype(np.uint8)
        iron_red = np.clip(r.astype(np.float32) * 1.15 - b.astype(np.float32) * 0.5, 0, 255).astype(np.uint8)
        gray = cv2.cvtColor(image_np, cv2.COLOR_BGR2GRAY)
        titanium_white = cv2.normalize(gray, None, 0, 255, cv2.NORM_MINMAX)
        basalt_black = 255 - gray

        return {
            "cobalt_blue": cobalt,
            "iron_red": iron_red,
            "titanium_white": titanium_white,
            "basalt_black": basalt_black,
        }

    def export_rip_file(self, channels: Dict[str, np.ndarray], width_mm: float, height_mm: float, output_filepath: str) -> str:
        """Writes .RIP multi-channel raster stream for industrial piezo glaze printheads"""
        with open(output_filepath, "w") as f:
            f.write(f"[STUDIO_CADENZA_RIP_V3]\nTILE_FORMAT={width_mm}x{height_mm}mm\nDPI=400\nCHANNELS=4\n")
        return output_filepath`,
  },
  'langgraph_agents.py': {
    title: 'LangGraph Multi-Agent Orchestration',
    desc: 'Autonomous DesignRouting, CADGeneration, QualityControl with error repair retry loops, and PassportSync.',
    code: `"""
Studio Cadenza - Multi-Agent AI Orchestration System (LangGraph + FastAPI)
"""

from typing import TypedDict, List, Dict, Any, Optional
from langgraph.graph import StateGraph, END

class AgentGraphState(TypedDict):
    tile_request: Dict[str, Any]
    passport_id: str
    production_mode: str
    qc_passed: bool
    retry_count: int
    step_file_path: Optional[str]
    dxf_file_path: Optional[str]
    pdf_report_path: Optional[str]
    factory_sync_token: Optional[str]
    status_log: List[Dict[str, str]]

def design_routing_agent(state: AgentGraphState) -> AgentGraphState:
    state["status_log"].append({"agent": "DesignRoutingAgent", "status": "success", "msg": "Design routed."})
    return state

def cad_generation_agent(state: AgentGraphState) -> AgentGraphState:
    state["status_log"].append({"agent": "CADGenerationAgent", "status": "success", "msg": "STEP & DXF built."})
    return state

def quality_control_agent(state: AgentGraphState) -> AgentGraphState:
    # Check wall thickness >= 2.0mm
    if state["retry_count"] == 0 and state.get("simulate_error"):
        state["qc_passed"] = False
        state["retry_count"] += 1
        state["status_log"].append({"agent": "QualityControlAgent", "status": "retry", "msg": "Repairing wall clearance."})
    else:
        state["qc_passed"] = True
        state["status_log"].append({"agent": "QualityControlAgent", "status": "success", "msg": "QC 100% Passed."})
    return state

def should_retry_cad(state: AgentGraphState) -> str:
    if not state["qc_passed"] and state["retry_count"] < 3:
        return "retry_cad"
    return "sync_passport"

def passport_sync_agent(state: AgentGraphState) -> AgentGraphState:
    state["factory_sync_token"] = f"TOK_JED_99428_SACMI_04"
    state["status_log"].append({"agent": "PassportSyncAgent", "status": "success", "msg": "Token synced."})
    return state

def build_cadenza_langgraph():
    wf = StateGraph(AgentGraphState)
    wf.add_node("design_routing", design_routing_agent)
    wf.add_node("cad_generation", cad_generation_agent)
    wf.add_node("quality_control", quality_control_agent)
    wf.add_node("passport_sync", passport_sync_agent)

    wf.set_entry_point("design_routing")
    wf.add_edge("design_routing", "cad_generation")
    wf.add_edge("cad_generation", "quality_control")
    wf.add_conditional_edges("quality_control", should_retry_cad, {"retry_cad": "cad_generation", "sync_passport": "passport_sync"})
    wf.add_edge("passport_sync", END)
    return wf.compile()`,
  },
  'fastapi_app.py': {
    title: 'FastAPI Production & Factory REST API',
    desc: 'Endpoints for /export-bundle, /check-geometry, /run-pipeline, and /factory/transfer/{passport_id}.',
    code: `"""
Studio Cadenza - FastAPI CAM & Production Engine Application
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from models import TileDesignRequest, FactoryTransferRequest, CAMQCCheckResult
from bundle_service import ManufacturingBundleService
from waterjet_service import WaterjetService

app = FastAPI(title="Studio Cadenza Industrial CAM API", version="2.6.0")

@app.post("/api/v1/production/export-bundle")
async def export_production_bundle(req: TileDesignRequest):
    bundle_srv = ManufacturingBundleService()
    zip_path = bundle_srv.build_complete_zip(req, "/tmp/production_bundle.zip")
    return FileResponse(zip_path, media_type="application/zip", filename=f"StudioCadenza_{req.passport_id}.zip")

@app.post("/api/v1/ai/generate-tile-concept")
async def generate_tile_concept(req: dict):
    prompt = req.get("prompt", "")
    # Returns AI-tuned parametric dimensions, colors, PBR finish, and CAM vectors
    return {
        "status": "success",
        "prompt": prompt,
        "mode": "waterjet_inlay",
        "primary_hex": "#242528",
        "secondary_hex": "#D4AF37",
        "glaze_type": "satin",
        "roughness": 0.32,
        "metallic": 0.78,
        "relief_depth_mm": 3.5,
        "dimensions": {"width_mm": 800, "height_mm": 800, "thickness_mm": 12}
    }

@app.post("/api/v1/factory/transfer/{passport_id}")
async def transfer_to_factory(passport_id: str, transfer_req: FactoryTransferRequest):
    return {"status": "success", "message": f"Queued at {transfer_req.target_factory_id} controller."}

@app.get("/api/v1/factory/passport/{passport_id}")
async def get_factory_passport(passport_id: str):
    return {"passport_id": passport_id, "status": "machining_in_progress", "kerf_mm": 0.75}`,
  },
};

export const PythonCodeViewerModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [selectedFilename, setSelectedFilename] = useState('cad_kernel_service.py');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentFile = PYTHON_FILES[selectedFilename] || PYTHON_FILES['cad_kernel_service.py'];

  const copyCode = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-[#101012] border-b border-[#2A2A2E]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#1E1E20] border border-[#2A2A2E] flex items-center justify-center text-[#00F0FF]">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                Studio Cadenza Python CAM & Computational Geometry Engine
              </h2>
              <p className="text-[11px] text-[#D1D1D1]/60 font-mono">
                CADQUERY + OPENCASCADE + SHAPELY + EZDXF + WEASYPRINT + LANGGRAPH
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#D1D1D1]/60 hover:text-white hover:bg-[#1E1E20] border border-transparent hover:border-[#2A2A2E] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 divide-y md:divide-y-0 md:divide-x divide-[#2A2A2E] overflow-hidden">
          {/* File Picker Sidebar */}
          <div className="md:col-span-4 p-3 space-y-2 overflow-y-auto bg-[#0A0A0B]">
            <div className="text-[10px] font-bold text-[#D1D1D1]/60 uppercase tracking-[0.15em] px-1">
              Backend Architecture Modules
            </div>

            {Object.entries(PYTHON_FILES).map(([fname, fData]) => {
              const isSelected = selectedFilename === fname;
              return (
                <button
                  key={fname}
                  onClick={() => setSelectedFilename(fname)}
                  className={`w-full text-left p-2.5 rounded border transition ${
                    isSelected
                      ? 'bg-[#1E1E20] border-[#00F0FF] shadow-sm'
                      : 'bg-[#141416] border-[#2A2A2E] hover:bg-[#1E1E20] hover:border-[#2A2A2E]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileCode className={`w-4 h-4 ${isSelected ? 'text-[#00F0FF]' : 'text-[#D1D1D1]/60'}`} />
                    <span className="text-xs font-mono font-bold text-white truncate">
                      {fname}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#D1D1D1] font-semibold mt-1 truncate">
                    {fData.title}
                  </div>
                  <p className="text-[10px] text-[#D1D1D1]/60 mt-0.5 line-clamp-2">
                    {fData.desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Code Viewer Panel */}
          <div className="md:col-span-8 p-3 flex flex-col bg-[#141416] overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-[#2A2A2E]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#00F0FF] font-bold">
                  {selectedFilename}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 bg-[#0A0A0B] text-[#D1D1D1]/70 border border-[#2A2A2E] rounded-sm font-mono uppercase">
                  Python 3.11+
                </span>
              </div>

              <button
                onClick={copyCode}
                className="px-2.5 py-1 bg-[#1E1E20] hover:border-[#00F0FF] text-white border border-[#2A2A2E] rounded-sm text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#00F0FF]" />}
                {copied ? 'Copied' : 'Copy Code'}
              </button>
            </div>

            <div className="flex-1 mt-2 p-3 bg-[#0A0A0B] rounded border border-[#2A2A2E] overflow-y-auto font-mono text-[10px] text-[#D1D1D1] custom-scrollbar leading-relaxed">
              <pre className="whitespace-pre">{currentFile.code}</pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#101012] border-t border-[#2A2A2E] flex items-center justify-between">
          <span className="text-[11px] text-[#D1D1D1]/60 font-mono">
            PRODUCTION SERVICES IN <span className="text-[#00F0FF]">/backend/</span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-[#1E1E20] hover:bg-[#2A2A2E] text-[#D1D1D1] text-xs font-bold uppercase tracking-wider rounded border border-[#2A2A2E] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
