from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any
from datetime import datetime

class DimensionsSchema(BaseModel):
    width_mm: float = Field(default=800.0, ge=100.0, le=2000.0, description="Tile width in mm")
    height_mm: float = Field(default=800.0, ge=100.0, le=2000.0, description="Tile height in mm")
    thickness_mm: float = Field(default=12.0, ge=6.0, le=30.0, description="Porcelain body thickness in mm")
    relief_depth_mm: float = Field(default=3.5, ge=0.0, le=15.0, description="Bas-relief height in mm")
    grout_joint_mm: float = Field(default=2.5, ge=1.0, le=10.0, description="Installation joint in mm")
    edge_profile: Literal["rectified_90", "chamfer_45", "cushion_bullnose"] = "rectified_90"
    chamfer_width_mm: float = 1.0

class FinishSchema(BaseModel):
    roughness: float = Field(default=0.22, ge=0.0, le=1.0)
    metallic: float = Field(default=0.08, ge=0.0, le=1.0)
    glaze_type: Literal["matte", "gloss", "satin", "luster"] = "satin"
    luster_sheen: float = 0.55
    subsurface_scatter: float = 0.25

class CMYKSchema(BaseModel):
    c: int
    m: int
    y: int
    k: int

class ColorDataSchema(BaseModel):
    primary_hex: str = "#1B365D"
    secondary_hex: str = "#D4AF37"
    accent_hex: str = "#F3EFE0"
    cmyk: CMYKSchema
    pantone_code: str = "PANTONE 19-4052 TCX Classic Cobalt"
    pigment_names: List[str] = ["Cobalt Aluminate Spinel", "Calcined Kaolin Alumina"]

class VectorPointSchema(BaseModel):
    x: float
    y: float

class VectorPathSchema(BaseModel):
    id: str
    type: Literal["polyline", "rectangle", "circle", "inlay_contour", "relief_cut"]
    points: List[VectorPointSchema]
    color: str = "#D4AF37"
    closed: bool = True
    layer: Literal["LAYER_CUT", "LAYER_ENGRAVE", "LAYER_INLAY"] = "LAYER_INLAY"
    strokeWidth: float = 2.5
    depth_mm: Optional[float] = 2.5

class TileDesignRequest(BaseModel):
    passport_id: Optional[str] = None
    dimensions: DimensionsSchema
    finish: FinishSchema
    color: ColorDataSchema
    production_mode: Literal["waterjet_inlay", "inkjet_glaze", "3d_mold_relief"] = "waterjet_inlay"
    vector_paths: List[VectorPathSchema] = []
    ai_prompt: Optional[str] = None
    reference_image_b64: Optional[str] = None

class CAMQCCheckResult(BaseModel):
    passed: bool
    kerf_mm: float = 0.75
    min_wall_thickness_mm: float
    wall_thickness_passed: bool
    closed_loops_count: int
    open_loops_count: int
    estimated_cut_time_min: float
    waterjet_bar_pressure: int = 4100
    feed_rate_mm_min: int = 650
    warnings: List[str] = []
    errors: List[str] = []

class FactoryTransferRequest(BaseModel):
    passport_id: str
    target_factory_id: str = "SACMI-FAC-BOLOGNA-04"
    designer_id: str = "ENG-LEAD-7842"
    sync_token: str
    comments: Optional[str] = None
