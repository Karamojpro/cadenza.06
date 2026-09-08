import { Dimensions, FinishProps, VectorPath, GlazeType, EdgeProfile } from '../types';

export interface TileConceptRequest {
  prompt: string;
  dimensions: {
    width_mm: number;
    height_mm: number;
    thickness_mm: number;
  };
}

export interface TileConceptResponse {
  success: boolean;
  concept_name: string;
  description: string;
  vectors: VectorPath[];
  pbr_maps: {
    primary_hex: string;
    secondary_hex: string;
    accent_hex: string;
    roughness: number;
    metallic: number;
    glaze_type: GlazeType;
    sheen: number;
    ior: number;
  };
  profile_data: {
    relief_depth_mm: number;
    glaze_thickness_mm: number;
    edge_profile: EdgeProfile;
    core_density_g_cm3: number;
  };
  mass_data: {
    single_tile_mass_kg: number;
    waffle_grip_contact_pct: number;
    dovetail_pitch_mm: number;
    volume_reduction_pct: number;
  };
}

/**
 * Service to request AI-driven parametric tile concepts from the backend
 */
export async function generateTileConceptAPI(
  prompt: string,
  dimensions: Dimensions
): Promise<TileConceptResponse> {
  const payload: TileConceptRequest = {
    prompt,
    dimensions: {
      width_mm: dimensions.width_mm,
      height_mm: dimensions.height_mm,
      thickness_mm: dimensions.thickness_mm,
    },
  };

  try {
    const res = await fetch('/api/v1/ai/generate-tile-concept', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }

    const data: TileConceptResponse = await res.json();
    return data;
  } catch (err) {
    console.warn('Backend AI endpoint unavailable, using client-side deterministic fallback generator:', err);
    // Fallback synthesizer with realistic geometric and PBR generation based on prompt keywords
    return generateFallbackTileConcept(prompt, dimensions);
  }
}

/**
 * Client-side deterministic fallback generator for robust offline execution
 */
export function generateFallbackTileConcept(
  prompt: string,
  dimensions: Dimensions
): TileConceptResponse {
  const pLower = prompt.toLowerCase();
  const width = dimensions.width_mm;
  const height = dimensions.height_mm;
  const cx = width / 2;
  const cy = height / 2;

  let primary_hex = '#1E1E24';
  let secondary_hex = '#D4AF37';
  let accent_hex = '#F8F9FA';
  let glaze_type: GlazeType = 'satin';
  let roughness = 0.28;
  let metallic = 0.15;
  let relief_depth_mm = 2.5;
  let edge_profile: EdgeProfile = 'rectified_90';
  let concept_name = 'Custom Geometric Concept';

  let vectors: VectorPath[] = [];

  if (pLower.includes('calacatta') || pLower.includes('gold') || pLower.includes('marble')) {
    concept_name = 'Calacatta Oro Imperial';
    primary_hex = '#F5F5F0';
    secondary_hex = '#D4AF37';
    accent_hex = '#4A4A4A';
    glaze_type = 'gloss';
    roughness = 0.08;
    metallic = 0.12;
    relief_depth_mm = 2.0;

    vectors = [
      {
        id: `ai_vec_inlay_diamond_${Date.now()}`,
        type: 'polyline',
        points: [
          { x: cx, y: 70 },
          { x: width - 70, y: cy },
          { x: cx, y: height - 70 },
          { x: 70, y: cy },
          { x: cx, y: 70 },
        ],
        color: '#D4AF37',
        closed: true,
        layer: 'LAYER_INLAY',
        strokeWidth: 3.5,
        depth_mm: 2.0,
      },
      {
        id: `ai_vec_inlay_inner_${Date.now()}`,
        type: 'circle',
        points: [
          { x: cx, y: cy - 120 },
          { x: cx + 120, y: cy },
          { x: cx, y: cy + 120 },
          { x: cx - 120, y: cy },
          { x: cx, y: cy - 120 },
        ],
        color: '#D4AF37',
        closed: true,
        layer: 'LAYER_CUT',
        strokeWidth: 2.0,
        depth_mm: 2.5,
      },
    ];
  } else if (pLower.includes('cobalt') || pLower.includes('majolica') || pLower.includes('blue')) {
    concept_name = 'Cobalt Majolica Relief';
    primary_hex = '#0F3B66';
    secondary_hex = '#F8FAFC';
    accent_hex = '#D4AF37';
    glaze_type = 'luster';
    roughness = 0.16;
    metallic = 0.25;
    relief_depth_mm = 4.2;

    const stepX = width / 4;
    const stepY = height / 4;
    vectors = [];
    for (let i = 1; i <= 3; i++) {
      for (let j = 1; j <= 3; j++) {
        vectors.push({
          id: `ai_majolica_${i}_${j}_${Date.now()}`,
          type: 'rectangle',
          points: [
            { x: i * stepX - stepX / 2.8, y: j * stepY - stepY / 2.8 },
            { x: i * stepX + stepX / 2.8, y: j * stepY - stepY / 2.8 },
            { x: i * stepX + stepX / 2.8, y: j * stepY + stepY / 2.8 },
            { x: i * stepX - stepX / 2.8, y: j * stepY + stepY / 2.8 },
            { x: i * stepX - stepX / 2.8, y: j * stepY - stepY / 2.8 },
          ],
          color: '#38BDF8',
          closed: true,
          layer: 'LAYER_ENGRAVE',
          strokeWidth: 2.2,
          depth_mm: 1.8,
        });
      }
    }
  } else if (pLower.includes('basalt') || pLower.includes('black') || pLower.includes('relief') || pLower.includes('fluted')) {
    concept_name = 'Volcanic Basalt Bas-Relief';
    primary_hex = '#18181B';
    secondary_hex = '#71717A';
    accent_hex = '#E4E4E7';
    glaze_type = 'matte';
    roughness = 0.78;
    metallic = 0.05;
    relief_depth_mm = 5.0;
    edge_profile = 'chamfer_45';

    vectors = [];
    const flutes = 7;
    const spacing = height / (flutes + 1);
    for (let k = 1; k <= flutes; k++) {
      vectors.push({
        id: `ai_basalt_flute_${k}_${Date.now()}`,
        type: 'polyline',
        points: [
          { x: 40, y: k * spacing },
          { x: cx, y: k * spacing + (k % 2 === 0 ? 30 : -30) },
          { x: width - 40, y: k * spacing },
        ],
        color: '#52525B',
        closed: false,
        layer: 'LAYER_ENGRAVE',
        strokeWidth: 2.5,
        depth_mm: 3.5,
      });
    }
  } else if (pLower.includes('terrazzo') || pLower.includes('emerald') || pLower.includes('green')) {
    concept_name = 'Venetian Emerald Terrazzo';
    primary_hex = '#1C382B';
    secondary_hex = '#C5A059';
    accent_hex = '#E2E8F0';
    glaze_type = 'satin';
    roughness = 0.35;
    metallic = 0.18;
    relief_depth_mm = 3.0;

    vectors = [
      {
        id: `ai_flake_1_${Date.now()}`,
        type: 'polyline',
        points: [
          { x: cx - 160, y: cy - 140 },
          { x: cx - 80, y: cy - 200 },
          { x: cx - 20, y: cy - 110 },
          { x: cx - 90, y: cy - 50 },
          { x: cx - 160, y: cy - 140 },
        ],
        color: '#C5A059',
        closed: true,
        layer: 'LAYER_INLAY',
        strokeWidth: 2.5,
        depth_mm: 2.8,
      },
      {
        id: `ai_flake_2_${Date.now()}`,
        type: 'polyline',
        points: [
          { x: cx + 70, y: cy + 60 },
          { x: cx + 190, y: cy + 80 },
          { x: cx + 220, y: cy + 180 },
          { x: cx + 100, y: cy + 210 },
          { x: cx + 70, y: cy + 60 },
        ],
        color: '#E2E8F0',
        closed: true,
        layer: 'LAYER_INLAY',
        strokeWidth: 2.5,
        depth_mm: 2.8,
      },
    ];
  } else {
    // Default high-precision modern architectural inlay
    concept_name = 'Architectural Sintered Matrix';
    primary_hex = '#232328';
    secondary_hex = '#00F0FF';
    accent_hex = '#D4AF37';
    glaze_type = 'satin';
    roughness = 0.3;
    metallic = 0.2;
    relief_depth_mm = 2.8;

    vectors = [
      {
        id: `ai_geom_outer_${Date.now()}`,
        type: 'polyline',
        points: [
          { x: cx, y: 80 },
          { x: width - 80, y: cy },
          { x: cx, y: height - 80 },
          { x: 80, y: cy },
          { x: cx, y: 80 },
        ],
        color: '#00F0FF',
        closed: true,
        layer: 'LAYER_INLAY',
        strokeWidth: 3,
        depth_mm: 2.2,
      },
    ];
  }

  // Calculate realistic mass & density metrics
  const areaM2 = (width * height) / 1_000_000;
  const volumeM3 = areaM2 * (dimensions.thickness_mm / 1000);
  const densityKgM3 = 2400; // Porcelain density
  const rawMassKg = volumeM3 * densityKgM3;
  const single_tile_mass_kg = Math.round(rawMassKg * 0.86 * 100) / 100; // 14% mass reduction from waffle

  return {
    success: true,
    concept_name,
    description: `Synthesized parametric model for "${prompt}". Synchronized vectors, PBR finish, side profile relief, and mortar grip matrix.`,
    vectors,
    pbr_maps: {
      primary_hex,
      secondary_hex,
      accent_hex,
      roughness,
      metallic,
      glaze_type,
      sheen: 0.65,
      ior: 1.54,
    },
    profile_data: {
      relief_depth_mm,
      glaze_thickness_mm: 0.4,
      edge_profile,
      core_density_g_cm3: 2.42,
    },
    mass_data: {
      single_tile_mass_kg,
      waffle_grip_contact_pct: 88.5,
      dovetail_pitch_mm: 50,
      volume_reduction_pct: 14.5,
    },
  };
}
