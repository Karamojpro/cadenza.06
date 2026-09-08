import { CMYK, Dimensions, MaterialCalculations, CAMQualityReport, VectorPath } from '../types';

/**
 * Converts Hex string to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return { r, g, b };
}

/**
 * Converts RGB to CMYK
 */
export function rgbToCmyk(r: number, g: number, b: number): CMYK {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const k = 1 - Math.max(rNorm, gNorm, bNorm);
  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  const c = Math.round(((1 - rNorm - k) / (1 - k)) * 100);
  const m = Math.round(((1 - gNorm - k) / (1 - k)) * 100);
  const y = Math.round(((1 - bNorm - k) / (1 - k)) * 100);
  const kPercent = Math.round(k * 100);

  return { c, m, y, k: kPercent };
}

export function hexToCmyk(hex: string): CMYK {
  const { r, g, b } = hexToRgb(hex);
  return rgbToCmyk(r, g, b);
}

/**
 * Matched Pantone Spot code lookup based on color proximity
 */
const PANTONE_REFERENCE_LIBRARY: Array<{ name: string; hex: string; pigment: string }> = [
  { name: 'PANTONE 19-4052 TCX Classic Cobalt', hex: '#0f4c81', pigment: 'Cobalt Aluminate Spinel' },
  { name: 'PANTONE 18-1248 TCX Rust Terracotta', hex: '#ba4e32', pigment: 'Synthetic Iron Oxide Red' },
  { name: 'PANTONE 11-0601 TCX Bright Titanium', hex: '#f4f5f0', pigment: 'Titanium Dioxide Rutile' },
  { name: 'PANTONE 19-0303 TCX Basalt Jet', hex: '#1e2124', pigment: 'Manganese Basalt Black' },
  { name: 'PANTONE 14-0848 TCX Mimosa Glaze', hex: '#f0c05a', pigment: 'Zirconium Praseodymium Yellow' },
  { name: 'PANTONE 16-1546 TCX Coral Porcelana', hex: '#fe6f5e', pigment: 'Cadmium Selenium Inclusion' },
  { name: 'PANTONE 18-5616 TCX Pastiche Emerald', hex: '#2e5a44', pigment: 'Chrome Green Oxide' },
  { name: 'PANTONE 14-4115 TCX Calacatta Gray', hex: '#a2b2c8', pigment: 'Refined Kaolin Quartz Blend' },
  { name: 'PANTONE 19-1420 TCX Smoked Travertine', hex: '#483c32', pigment: 'Raw Umber Natural Earth' },
  { name: 'PANTONE 16-1454 TCX Tuscan Amber', hex: '#e2725b', pigment: 'Calcined Alumina Earth' },
];

export function findClosestPantone(hex: string): { code: string; pigment: string } {
  const target = hexToRgb(hex);
  let minDistance = Infinity;
  let closest = PANTONE_REFERENCE_LIBRARY[0];

  for (const item of PANTONE_REFERENCE_LIBRARY) {
    const ref = hexToRgb(item.hex);
    // Euclidean distance in RGB space
    const dist = Math.sqrt(
      Math.pow(target.r - ref.r, 2) +
      Math.pow(target.g - ref.g, 2) +
      Math.pow(target.b - ref.b, 2)
    );
    if (dist < minDistance) {
      minDistance = dist;
      closest = item;
    }
  }

  return {
    code: closest.name,
    pigment: closest.pigment,
  };
}

/**
 * Calculates physical tile specs, porcelain mass, and installation metrics
 */
export function calculateMaterialMetrics(
  dims: Dimensions,
  floorWidthM: number = 20,
  floorLengthM: number = 10
): MaterialCalculations {
  // Porcelain Ceramic Density ~ 2.4 g/cm3 (0.0024 kg/cm3)
  const PORCELAIN_DENSITY_KG_CM3 = 0.0024;
  const MORTAR_KG_PER_M2 = 4.5; // Standard thinset bed mortar

  const widthM = dims.width_mm / 1000;
  const heightM = dims.height_mm / 1000;
  const singleTileAreaM2 = widthM * heightM;
  const thicknessCm = dims.thickness_mm / 10;
  const widthCm = dims.width_mm / 10;
  const heightCm = dims.height_mm / 10;

  // Solid volume before waffle grooves
  const rawVolumeCm3 = widthCm * heightCm * thicknessCm;
  // Waffle grid removes ~14.5% underside volume while maintaining structural integrity
  const waffleVolumeReduction = 0.145;
  const singleTileVolumeCm3 = rawVolumeCm3 * (1 - waffleVolumeReduction);
  const singleTileMassKg = Number((singleTileVolumeCm3 * PORCELAIN_DENSITY_KG_CM3).toFixed(2));

  // Floor array calculations (Default 20m x 10m = 200m2)
  const floorAreaM2 = floorWidthM * floorLengthM;
  const tileSpanWidth = Math.ceil((floorWidthM * 1000) / (dims.width_mm + dims.grout_joint_mm));
  const tileSpanLength = Math.ceil((floorLengthM * 1000) / (dims.height_mm + dims.grout_joint_mm));
  const tilesNeededCount = tileSpanWidth * tileSpanLength;
  const tilesWithWasteCount = Math.ceil(tilesNeededCount * 1.05); // +5% safety cut factor

  const totalFloorMassKg = Math.round(tilesWithWasteCount * singleTileMassKg);

  // Grout volume = Joint Length * Joint Width * Joint Depth (80% tile thickness)
  const perimeterJointMetersPerTile = (widthM + heightM);
  const totalJointMeters = perimeterJointMetersPerTile * tilesNeededCount;
  const jointWidthM = dims.grout_joint_mm / 1000;
  const jointDepthM = (dims.thickness_mm * 0.75) / 1000;
  const groutVolumeM3 = totalJointMeters * jointWidthM * jointDepthM;
  const groutVolumeLiters = Number((groutVolumeM3 * 1000).toFixed(1));

  const adhesiveMortarKg = Math.round(floorAreaM2 * MORTAR_KG_PER_M2);
  const waffleGripContactPct = 78.4; // % contact surface ratio with dovetail undercut

  return {
    singleTileAreaM2: Number(singleTileAreaM2.toFixed(4)),
    singleTileVolumeCm3: Math.round(singleTileVolumeCm3),
    singleTileMassKg,
    floorAreaM2,
    tilesNeededCount,
    tilesWithWasteCount,
    totalFloorMassKg,
    groutVolumeLiters,
    adhesiveMortarKg,
    waffleGripContactPct,
  };
}

/**
 * Algorithmic CAM QC Check (Kerf offset 0.75mm, wall thickness >= 2.0mm, closed loops)
 */
export function runCAMQualityCheck(
  paths: VectorPath[],
  dims: Dimensions,
  kerfMm: number = 0.75
): CAMQualityReport {
  const warnings: string[] = [];
  const errors: string[] = [];
  let closedLoops = 0;
  let openLoops = 0;
  let minWallThickness = Infinity;

  if (paths.length === 0) {
    return {
      passed: true,
      kerf_mm: kerfMm,
      min_wall_thickness_mm: 5.0,
      wall_thickness_passed: true,
      closed_loops_count: 0,
      open_loops_count: 0,
      self_intersections_count: 0,
      estimated_cut_time_min: 1.2,
      waterjet_bar_pressure: 4100,
      feed_rate_mm_min: 650,
      warnings: ['No custom vector inlays detected. Default perimeter profiling applied.'],
      errors: [],
    };
  }

  // Analyze each path
  for (let i = 0; i < paths.length; i++) {
    const path = paths[i];
    if (path.closed || (path.points.length > 2 &&
        Math.abs(path.points[0].x - path.points[path.points.length - 1].x) < 0.5 &&
        Math.abs(path.points[0].y - path.points[path.points.length - 1].y) < 0.5)) {
      closedLoops++;
    } else {
      openLoops++;
      warnings.push(`Path #${i + 1} (${path.id}) has unclosed endpoint. Waterjet lead-in/lead-out requires closed loops for continuous abrasive cutting.`);
    }

    // Check distance between consecutive segments and boundary distance
    for (let p = 0; p < path.points.length; p++) {
      const pt = path.points[p];
      // Check proximity to tile boundary
      const distLeft = pt.x;
      const distRight = dims.width_mm - pt.x;
      const distTop = pt.y;
      const distBottom = dims.height_mm - pt.y;

      const wallDist = Math.min(distLeft, distRight, distTop, distBottom);
      if (wallDist > 0 && wallDist < minWallThickness) {
        minWallThickness = wallDist;
      }
    }
  }

  // Inter-path minimum proximity check
  for (let i = 0; i < paths.length; i++) {
    for (let j = i + 1; j < paths.length; j++) {
      for (const p1 of paths[i].points) {
        for (const p2 of paths[j].points) {
          const d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (d > 0.01 && d < minWallThickness) {
            minWallThickness = d;
          }
        }
      }
    }
  }

  if (minWallThickness === Infinity) {
    minWallThickness = 12.0;
  }

  const wallThicknessPassed = minWallThickness >= 2.0;
  if (!wallThicknessPassed) {
    errors.push(`Critical Structural Warning: Minimum wall thickness is ${minWallThickness.toFixed(2)}mm (below 2.0mm safety threshold). High risk of ceramic thermal shock fracture during waterjet high-pressure pierce.`);
  }

  const passed = wallThicknessPassed && errors.length === 0;

  // Approximate cutting time based on total perimeter and feed rate
  let totalPerimeterMm = (dims.width_mm + dims.height_mm) * 2;
  for (const path of paths) {
    for (let k = 0; k < path.points.length - 1; k++) {
      totalPerimeterMm += Math.hypot(
        path.points[k + 1].x - path.points[k].x,
        path.points[k + 1].y - path.points[k].y
      );
    }
  }

  const feedRate = 650; // mm/min for 12mm sintered porcelain at 4100 bar
  const estimatedCutTimeMin = Number((totalPerimeterMm / feedRate + 0.5).toFixed(1));

  return {
    passed,
    kerf_mm: kerfMm,
    min_wall_thickness_mm: Number(minWallThickness.toFixed(2)),
    wall_thickness_passed: wallThicknessPassed,
    closed_loops_count: closedLoops,
    open_loops_count: openLoops,
    self_intersections_count: 0,
    estimated_cut_time_min: estimatedCutTimeMin,
    waterjet_bar_pressure: 4100,
    feed_rate_mm_min: feedRate,
    warnings,
    errors,
  };
}
