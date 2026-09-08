"""
Studio Cadenza - Production Package Builder (ManufacturingBundleService)
Collects and packages all 6 generated CAM and specification assets into a single downloadable .ZIP bundle:
1. Passport_Report.pdf
2. CAD_Waterjet_Path.dxf
3. 3D_CNC_Mold.step
4. 3D_Print_Prototype.stl
5. Glaze_Pigments_Channels.rip
6. Floor_Layout_Matrix.json
"""

import os
import json
import zipfile
import tempfile
from typing import Dict, Any
from models import TileDesignRequest, CAMQCCheckResult
from cad_kernel_service import CADKernelService
from waterjet_service import WaterjetService
from glaze_channel_service import GlazeChannelService
from pdf_report_service import PDFReportService

class ManufacturingBundleService:
    def __init__(self):
        pass

    def build_complete_zip(self, req: TileDesignRequest, output_zip_path: str) -> str:
        """
        Generates and compiles all 6 industrial manufacturing files into output_zip_path
        """
        temp_dir = tempfile.mkdtemp(prefix="cadenza_bundle_")
        try:
            # 1. CAM & QC calculation
            waterjet_srv = WaterjetService(kerf_mm=0.75)
            qc_result = waterjet_srv.run_algorithmic_qc(req.vector_paths, req.dimensions)

            calcs = {
                "singleTileMassKg": round(((req.dimensions.width_mm/10)*(req.dimensions.height_mm/10)*(req.dimensions.thickness_mm/10)*0.0024*0.855), 2),
                "floorAreaM2": 200.0,
                "tilesWithWasteCount": 330,
                "groutVolumeLiters": 28.4,
            }

            # 2. Generate PDF Report
            passport_id = req.passport_id or "CAD-2026-9142-JED"
            pdf_path = os.path.join(temp_dir, "Passport_Report.pdf")
            pdf_srv = PDFReportService(passport_id=passport_id)
            pdf_srv.compile_pdf(req, qc_result, calcs, pdf_path)

            # 3. Generate DXF Waterjet File
            dxf_path = os.path.join(temp_dir, "CAD_Waterjet_Path.dxf")
            waterjet_srv.export_dxf(req.vector_paths, req.dimensions, dxf_path)

            # 4. Generate 3D STEP & STL
            cad_srv = CADKernelService(req.dimensions)
            step_path = os.path.join(temp_dir, "3D_CNC_Mold.step")
            cad_srv.export_step(step_path)

            stl_path = os.path.join(temp_dir, "3D_Print_Prototype.stl")
            cad_srv.export_stl(stl_path)

            # 5. Generate Glaze RIP File
            glaze_srv = GlazeChannelService()
            rip_path = os.path.join(temp_dir, "Glaze_Pigments_Channels.rip")
            channels = glaze_srv.separate_glaze_channels(None)
            glaze_srv.export_rip_file(channels, req.dimensions.width_mm, req.dimensions.height_mm, rip_path)

            # 6. Generate Floor Layout Matrix JSON
            json_path = os.path.join(temp_dir, "Floor_Layout_Matrix.json")
            matrix_data = {
                "project_title": "Studio Cadenza Architectural Tile Installation Matrix",
                "passport_id": passport_id,
                "floor_span_m": {"width": 20.0, "length": 10.0, "area_m2": 200.0},
                "tile_format_mm": {
                    "width": req.dimensions.width_mm,
                    "height": req.dimensions.height_mm,
                    "thickness": req.dimensions.thickness_mm,
                    "grout_joint": req.dimensions.grout_joint_mm,
                },
                "total_tiles_with_waste": calcs["tilesWithWasteCount"],
                "grout_volume_liters": calcs["groutVolumeLiters"],
            }
            with open(json_path, "w") as f:
                json.dump(matrix_data, f, indent=2)

            # Zip everything
            with zipfile.ZipFile(output_zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
                zipf.write(pdf_path, arcname="Passport_Report.pdf")
                zipf.write(dxf_path, arcname="CAD_Waterjet_Path.dxf")
                zipf.write(step_path, arcname="3D_CNC_Mold.step")
                zipf.write(stl_path, arcname="3D_Print_Prototype.stl")
                zipf.write(rip_path, arcname="Glaze_Pigments_Channels.rip")
                zipf.write(json_path, arcname="Floor_Layout_Matrix.json")

            return output_zip_path

        finally:
            pass
