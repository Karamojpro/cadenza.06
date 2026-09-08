import {
  ArchitecturalArchetype,
  StairTreadParams,
  WallPanel3DParams,
  SkirtingMoldingParams,
  CountertopSlabParams,
  Dimensions,
} from '../types';

export const DEFAULT_STAIR_PARAMS: StairTreadParams = {
  tread_depth_mm: 330,
  riser_height_mm: 180,
  nosing_type: 'mitre_45',
  nosing_drop_mm: 40,
  anti_slip_grooves: {
    count: 4,
    depth_mm: 1.5,
    pitch_mm: 8.0,
    offset_from_edge_mm: 25.0,
  },
  bonding_joint_angle_deg: 45.0,
};

export const DEFAULT_WALL_PANEL_PARAMS: WallPanel3DParams = {
  relief_amplitude_mm: 25,
  sculpt_pattern: 'origami_wave',
  draft_angle_deg: 8.0,
  panel_interlock: true,
  repeating_frequency: 3.0,
  is_press_mold_ready: true,
};

export const DEFAULT_MOLDING_PARAMS: SkirtingMoldingParams = {
  profile_type: 'modern_shadowline',
  profile_height_mm: 100,
  profile_depth_mm: 18,
  length_mm: 1200,
  corner_miter_deg: 45.0,
  reveal_gap_mm: 5.0,
};

export const DEFAULT_SLAB_PARAMS: CountertopSlabParams = {
  slab_width_mm: 3200,
  slab_length_mm: 1600,
  thickness_mm: 20,
  edge_treatment: 'miter_45_waterfall',
  waterfall_drop_mm: 850,
  sink_cutout: {
    enabled: true,
    x_offset_mm: 700,
    y_offset_mm: 220,
    width_mm: 600,
    length_mm: 450,
    corner_radius_mm: 15,
  },
  cooktop_cutout: {
    enabled: false,
    x_offset_mm: 1800,
    y_offset_mm: 250,
    width_mm: 750,
    length_mm: 490,
  },
  vein_matching_flow: 'continuous_waterfall',
};

export function computeArchetypeMetrics(
  archetype: ArchitecturalArchetype,
  dims: Dimensions,
  stair: StairTreadParams,
  panel: WallPanel3DParams,
  molding: SkirtingMoldingParams,
  slab: CountertopSlabParams
) {
  let massKg = 0;
  let areaM2 = 0;
  let waterjetCutM = 0;
  let warnings: string[] = [];

  const DENSITY_G_CM3 = 2.42;

  switch (archetype) {
    case 'stair_tread': {
      const volCm3 =
        (dims.width_mm * stair.tread_depth_mm * dims.thickness_mm +
          dims.width_mm * stair.nosing_drop_mm * dims.thickness_mm) /
        1000;
      massKg = Number(((volCm3 * DENSITY_G_CM3) / 1000).toFixed(2));
      areaM2 = Number(((dims.width_mm * stair.tread_depth_mm) / 1e6).toFixed(3));
      const groovesCutM = (stair.anti_slip_grooves.count * dims.width_mm) / 1000;
      waterjetCutM = Number(
        ((dims.width_mm * 2 + stair.tread_depth_mm * 2) / 1000 + groovesCutM).toFixed(2)
      );

      if (dims.thickness_mm < 15 && stair.nosing_drop_mm > 50) {
        warnings.push('Warning: Reinforcement backing mesh recommended for nosing apron drop > 50mm on < 15mm slabs.');
      }
      if (stair.anti_slip_grooves.depth_mm > dims.thickness_mm * 0.15) {
        warnings.push('Warning: Anti-slip channel cut depth exceeds 15% slab thickness; risk of stress concentration.');
      }
      break;
    }

    case '3d_wall_panel': {
      const avgThick = dims.thickness_mm + panel.relief_amplitude_mm * 0.45;
      const volCm3 = (dims.width_mm * dims.height_mm * avgThick) / 1000;
      massKg = Number(((volCm3 * DENSITY_G_CM3) / 1000).toFixed(2));
      areaM2 = Number(((dims.width_mm * dims.height_mm) / 1e6).toFixed(3));
      waterjetCutM = Number(((dims.width_mm * 2 + dims.height_mm * 2) / 1000).toFixed(2));

      if (panel.draft_angle_deg < 6.0) {
        warnings.push(`Warning: Demolding draft angle (${panel.draft_angle_deg}°) is steep; recommend ≥ 7.0° for ceramic press molds.`);
      }
      if (panel.relief_amplitude_mm > 35.0) {
        warnings.push('High relief (>35mm) requires multi-stage hydraulic compaction to prevent internal sintering voids.');
      }
      break;
    }

    case 'skirting_molding': {
      const crossSecAreaCm2 = (molding.profile_height_mm * molding.profile_depth_mm * 0.65) / 100;
      const volCm3 = crossSecAreaCm2 * (molding.length_mm / 10);
      massKg = Number(((volCm3 * DENSITY_G_CM3) / 1000).toFixed(2));
      areaM2 = Number(((molding.length_mm * molding.profile_height_mm) / 1e6).toFixed(3));
      waterjetCutM = Number((molding.length_mm / 1000).toFixed(2));
      break;
    }

    case 'countertop_slab': {
      const grossAreaM2 = (slab.slab_width_mm * slab.slab_length_mm) / 1e6;
      let cutoutAreaM2 = 0;
      let cutoutPerimeterM = 0;

      if (slab.sink_cutout.enabled) {
        cutoutAreaM2 += (slab.sink_cutout.width_mm * slab.sink_cutout.length_mm) / 1e6;
        cutoutPerimeterM += (slab.sink_cutout.width_mm * 2 + slab.sink_cutout.length_mm * 2) / 1000;
      }
      if (slab.cooktop_cutout.enabled) {
        cutoutAreaM2 += (slab.cooktop_cutout.width_mm * slab.cooktop_cutout.length_mm) / 1e6;
        cutoutPerimeterM += (slab.cooktop_cutout.width_mm * 2 + slab.cooktop_cutout.length_mm * 2) / 1000;
      }

      const netAreaM2 = Math.max(0.1, grossAreaM2 - cutoutAreaM2);
      const volCm3 = netAreaM2 * 1e4 * (slab.thickness_mm / 10);
      massKg = Number(((volCm3 * DENSITY_G_CM3) / 1000).toFixed(2));
      areaM2 = Number(netAreaM2.toFixed(3));
      const perimeterCutM = (slab.slab_width_mm * 2 + slab.slab_length_mm * 2) / 1000;
      waterjetCutM = Number((perimeterCutM + cutoutPerimeterM).toFixed(2));

      if (slab.sink_cutout.enabled) {
        if (slab.sink_cutout.y_offset_mm < 70) {
          warnings.push(`Warning: Sink cutout front bridge is ${slab.sink_cutout.y_offset_mm}mm (recommend ≥ 80mm to avoid transit fractures).`);
        }
        if (slab.sink_cutout.corner_radius_mm < 10) {
          warnings.push('Warning: Sink cutout internal corner radius is < 10mm; waterjet cut requires radius to distribute stress.');
        }
      }
      break;
    }

    default: {
      // flat_tile
      const volCm3 = (dims.width_mm * dims.height_mm * dims.thickness_mm) / 1000;
      massKg = Number(((volCm3 * DENSITY_G_CM3) / 1000).toFixed(2));
      areaM2 = Number(((dims.width_mm * dims.height_mm) / 1e6).toFixed(3));
      waterjetCutM = Number(((dims.width_mm * 2 + dims.height_mm * 2) / 1000).toFixed(2));
      break;
    }
  }

  return {
    massKg,
    areaM2,
    waterjetCutM,
    warnings,
  };
}
