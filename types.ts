export type GlazeType = 'matte' | 'gloss' | 'satin' | 'luster';
export type EdgeProfile = 'rectified_90' | 'chamfer_45' | 'cushion_bullnose';
export type ApplicationMode = 'single_tile' | 'full_floor_span';
export type ProductionMode = 'waterjet_inlay' | 'inkjet_glaze' | '3d_mold_relief';
export type ArchitecturalArchetype = 'flat_tile' | 'stair_tread' | '3d_wall_panel' | 'skirting_molding' | 'countertop_slab';

export interface StairTreadParams {
  tread_depth_mm: number; // e.g. 330mm
  riser_height_mm: number; // e.g. 180mm
  nosing_type: 'bullnose' | 'mitre_45' | 'chamfer';
  nosing_drop_mm: number; // e.g. 40mm apron lip
  anti_slip_grooves: {
    count: number; // e.g. 4 grooves
    depth_mm: number; // e.g. 1.5mm
    pitch_mm: number; // e.g. 8.0mm
    offset_from_edge_mm: number; // e.g. 25mm
  };
  bonding_joint_angle_deg: number; // 45° miter joint for epoxy bonding
}

export interface WallPanel3DParams {
  relief_amplitude_mm: number; // Max 3D depth, e.g. 30mm
  sculpt_pattern: 'origami_wave' | 'fluted_column' | 'parabolic_facet' | 'hex_pyramid';
  draft_angle_deg: number; // e.g. 8° for ceramic press mold extraction
  panel_interlock: boolean;
  repeating_frequency: number; // waves per meter
  is_press_mold_ready: boolean;
}

export interface SkirtingMoldingParams {
  profile_type: 'cove_base' | 'ogee_classic' | 'modern_shadowline' | 'quarter_round';
  profile_height_mm: number; // e.g. 100mm
  profile_depth_mm: number; // e.g. 18mm
  length_mm: number; // e.g. 1200mm
  corner_miter_deg: number; // 45° or 90°
  reveal_gap_mm: number; // e.g. 5mm shadowline
}

export interface CountertopSlabParams {
  slab_width_mm: number; // Up to 3200mm
  slab_length_mm: number; // Up to 1600mm
  thickness_mm: number; // e.g. 20mm or 12mm
  edge_treatment: 'miter_45_waterfall' | 'bullnose' | 'straight_polished';
  waterfall_drop_mm: number; // e.g. 850mm island side drop
  sink_cutout: {
    enabled: boolean;
    x_offset_mm: number;
    y_offset_mm: number;
    width_mm: number;
    length_mm: number;
    corner_radius_mm: number;
  };
  cooktop_cutout: {
    enabled: boolean;
    x_offset_mm: number;
    y_offset_mm: number;
    width_mm: number;
    length_mm: number;
  };
  vein_matching_flow: 'continuous_waterfall' | 'bookmatch_mirror' | 'slip_match';
}

export interface CeramicMaterialPreset {
  id: string;
  name: string;
  category: 'marble' | 'majolica' | 'stone' | 'terrazzo' | 'metal_oxide' | 'terracotta';
  description: string;
  glaze_type: GlazeType;
  finish: FinishProps;
  primary_hex: string;
  secondary_hex: string;
  accent_hex: string;
  pantone_code: string;
  pigments: string[];
  recommended_archetype: ArchitecturalArchetype;
  firing_temp_celsius: number;
  slip_resistance_rating: string;
  ai_prompt: string;
  tags: string[];
}

export interface CMYK {
  c: number;
  m: number;
  y: number;
  k: number;
}

export interface ColorData {
  primary_hex: string;
  secondary_hex: string;
  accent_hex: string;
  cmyk: CMYK;
  pantone_code: string;
  pigment_names: string[];
}

export interface Dimensions {
  width_mm: number;
  height_mm: number;
  thickness_mm: number;
  relief_depth_mm: number;
  grout_joint_mm: number;
  edge_profile: EdgeProfile;
  chamfer_width_mm: number;
}

export interface FinishProps {
  roughness: number; // 0.0 to 1.0
  metallic: number; // 0.0 to 1.0
  glaze_type: GlazeType;
  luster_sheen: number; // 0.0 to 1.0
  subsurface_scatter: number; // 0.0 to 1.0
  bump_intensity: number; // 0.0 to 2.0
}

export interface ReferenceAssets {
  reference_image_url: string | null;
  ai_prompt: string;
  application_mode: ApplicationMode;
  floor_width_m: number;
  floor_length_m: number;
  texture_canvas_data?: string | null;
}

export interface VectorPoint {
  x: number;
  y: number;
}

/**
 * Non-destructive per-object transform envelope (Phase 2). Applied on top of
 * `VectorPath.points` at render/compute time — points themselves are never
 * mutated by moving/rotating/scaling an object. See src/utils/objectTransform.ts.
 */
export interface ObjectTransform {
  x_mm: number;
  y_mm: number;
  rotation_deg: number;
  scale: number;
}

export interface VectorPath {
  id: string;
  type: 'polyline' | 'rectangle' | 'circle' | 'inlay_contour' | 'relief_cut';
  points: VectorPoint[];
  color: string;
  closed: boolean;
  /**
   * @deprecated Legacy 3-value layer tag, still emitted by loadPresetPattern's
   * ported pattern data and the AI concept generator. Real layer assignment is
   * `layerId`; use `getResolvedLayerId()` from objectTransform.ts to read either.
   * Safe to delete once every author of VectorPath objects sets `layerId` directly.
   */
  layer?: 'LAYER_CUT' | 'LAYER_ENGRAVE' | 'LAYER_INLAY';
  /** References a ProjectLayer.id from useProjectStore. Resolved dynamically — see getResolvedLayerId(). */
  layerId?: string;
  /** Identity assumed when absent — see getTransform() in objectTransform.ts. */
  transform?: ObjectTransform;
  strokeWidth: number;
  depth_mm?: number;
  isKerfOffset?: boolean;
  /** Reserved for future grouping (Phase 2 goal #3, not implemented this phase). */
  groupId?: string;
}

export interface CAMQualityReport {
  passed: boolean;
  kerf_mm: number;
  min_wall_thickness_mm: number;
  wall_thickness_passed: boolean;
  closed_loops_count: number;
  open_loops_count: number;
  self_intersections_count: number;
  estimated_cut_time_min: number;
  waterjet_bar_pressure: number;
  feed_rate_mm_min: number;
  warnings: string[];
  errors: string[];
}

export interface MaterialCalculations {
  singleTileAreaM2: number;
  singleTileVolumeCm3: number;
  singleTileMassKg: number;
  floorAreaM2: number;
  tilesNeededCount: number;
  tilesWithWasteCount: number; // +5% standard waste margin
  totalFloorMassKg: number;
  groutVolumeLiters: number;
  adhesiveMortarKg: number;
  waffleGripContactPct: number;
}

export interface FactoryPassport {
  passport_id: string;
  timestamp: string;
  designer_id: string;
  target_factory_id: string;
  status: 'draft' | 'qc_verified' | 'factory_queued' | 'machining_in_progress' | 'completed';
  dimensions: Dimensions;
  finish: FinishProps;
  color: ColorData;
  production_mode: ProductionMode;
  calculations: MaterialCalculations;
  cam_report: CAMQualityReport;
  sync_token: string;
  qr_data_url?: string;
}

export type ViewportMode = 'quad' | 'viewport_2d' | 'viewport_3d' | 'viewport_side' | 'viewport_back';

export interface AgentStepLog {
  agent_name: 'DesignRoutingAgent' | 'CADGenerationAgent' | 'QualityControlAgent' | 'PassportSyncAgent';
  status: 'pending' | 'running' | 'success' | 'retry' | 'failed';
  message: string;
  timestamp: string;
  details?: Record<string, unknown>;
}
