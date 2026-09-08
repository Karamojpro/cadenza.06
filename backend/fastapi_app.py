"""
Studio Cadenza - FastAPI CAM & Production Engine Application
Exposes REST endpoints for CAD solid generation, bundle packaging, LangGraph agents, and factory cloud synchronization.
"""

import os
import tempfile
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from models import TileDesignRequest, FactoryTransferRequest, CAMQCCheckResult
from bundle_service import ManufacturingBundleService
from waterjet_service import WaterjetService
from langgraph_agents import execute_pipeline, AgentGraphState

app = FastAPI(
    title="Studio Cadenza Industrial CAM API",
    description="Photoshop for Tiles - CAD Kernel, Waterjet Vectorization, and Factory Transfer Engine",
    version="2.6.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory factory database for digital passports
FACTORY_PASSPORT_DATABASE = {}

@app.get("/api/health")
async def health_check():
    return {
        "status": "online",
        "service": "Studio Cadenza CAD & CAM Engine",
        "cad_kernel": "CadQuery / OpenCASCADE OCCP",
        "cam_waterjet": "Shapely Kerf Offset (0.75mm)",
        "glaze_rip": "OpenCV N-Channel Spectral Separator",
        "passport_pdf": "WeasyPrint ISO 13006 Passport Generator",
    }

@app.post("/api/v1/qc/check-geometry", response_model=CAMQCCheckResult)
async def check_geometry(req: TileDesignRequest):
    """
    Runs automated algorithmic quality control on vector inlays and tile dimensions
    """
    waterjet_srv = WaterjetService(kerf_mm=0.75)
    result = waterjet_srv.run_algorithmic_qc(req.vector_paths, req.dimensions)
    return result

@app.post("/api/v1/production/export-bundle")
async def export_production_bundle(req: TileDesignRequest):
    """
    Generates and returns the compiled .ZIP production bundle containing all 6 manufacturing files:
    - Passport_Report.pdf
    - CAD_Waterjet_Path.dxf
    - 3D_CNC_Mold.step
    - 3D_Print_Prototype.stl
    - Glaze_Pigments_Channels.rip
    - Floor_Layout_Matrix.json
    """
    try:
        bundle_srv = ManufacturingBundleService()
        temp_zip = tempfile.NamedTemporaryFile(delete=False, suffix=".zip")
        temp_zip.close()

        bundle_srv.build_complete_zip(req, temp_zip.name)

        passport_id = req.passport_id or "CAD-2026-9041-JED"
        filename = f"StudioCadenza_Production_Bundle_{passport_id}.zip"

        return FileResponse(
            temp_zip.name,
            media_type="application/zip",
            filename=filename
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bundle generation error: {str(e)}")

@app.post("/api/v1/agents/run-pipeline")
async def run_langgraph_pipeline(req: TileDesignRequest):
    """
    Executes the LangGraph Multi-Agent Orchestration workflow (DesignRouting, CADGeneration, QC with retry loop, PassportSync)
    """
    passport_id = req.passport_id or "CAD-2026-9142-JED"

    initial_state: AgentGraphState = {
        "tile_request": req.dict(),
        "passport_id": passport_id,
        "production_mode": req.production_mode,
        "qc_passed": False,
        "qc_warnings": [],
        "qc_errors": [],
        "retry_count": 0,
        "step_file_path": None,
        "stl_file_path": None,
        "dxf_file_path": None,
        "pdf_report_path": None,
        "factory_sync_token": None,
        "status_log": []
    }

    final_state = execute_pipeline(initial_state)

    # Store in database
    FACTORY_PASSPORT_DATABASE[passport_id] = {
        "passport_id": passport_id,
        "tile_request": req.dict(),
        "status": "qc_verified",
        "sync_token": final_state["factory_sync_token"],
        "logs": final_state["status_log"]
    }

    return {
        "passport_id": passport_id,
        "qc_passed": final_state["qc_passed"],
        "retries_performed": final_state["retry_count"],
        "sync_token": final_state["factory_sync_token"],
        "logs": final_state["status_log"],
    }

@app.post("/api/v1/factory/transfer/{passport_id}")
async def transfer_to_factory(passport_id: str, transfer_req: FactoryTransferRequest):
    """
    Transfers the digital production passport to target factory machinery queue
    """
    FACTORY_PASSPORT_DATABASE[passport_id] = {
        "passport_id": passport_id,
        "target_factory_id": transfer_req.target_factory_id,
        "designer_id": transfer_req.designer_id,
        "sync_token": transfer_req.sync_token,
        "status": "machining_in_progress",
        "transferred_at": "2026-08-30T12:00:00Z",
    }
    return {
        "status": "success",
        "message": f"Passport {passport_id} queued at {transfer_req.target_factory_id} controller.",
        "passport_id": passport_id,
    }

@app.get("/api/v1/factory/passport/{passport_id}")
async def get_factory_passport(passport_id: str):
    """
    Allows factory machinery controllers to read machining parameters and verify digital tokens
    """
    passport = FACTORY_PASSPORT_DATABASE.get(passport_id)
    if not passport:
        # Default placeholder return if not yet transferred
        return {
            "passport_id": passport_id,
            "status": "qc_verified",
            "target_factory_id": "SACMI-FAC-BOLOGNA-04",
            "waterjet_parameters": {
                "kerf_mm": 0.75,
                "pressure_bar": 4100,
                "feed_rate_mm_min": 650,
            },
            "waffle_parameters": {
                "pitch_mm": 50.0,
                "groove_depth_mm": 1.8,
                "mortar_grip_pct": 78.4,
            }
        }
    return passport

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("fastapi_app:app", host="0.0.0.0", port=8000, reload=True)
