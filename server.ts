import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API health
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'online',
      app: 'Studio Cadenza',
      version: '2.6.0',
      cad_engine: 'OpenCASCADE 7.6 / CadQuery',
      cam_waterjet: 'Shapely Kerf Compensation (0.75mm)',
      glaze_rip: 'OpenCV N-Channel Spectral Separator',
    });
  });

  // Mock / API endpoints for factory passport and bundle status
  const passportDatabase: Record<string, any> = {};

  // AI Parametric Tile Concept Generation Endpoint
  app.post('/api/v1/ai/generate-tile-concept', (req, res) => {
    const { prompt, dimensions } = req.body;
    const pLower = (prompt || '').toLowerCase();
    const width = Number(dimensions?.width_mm) || 800;
    const height = Number(dimensions?.height_mm) || 800;
    const thickness = Number(dimensions?.thickness_mm) || 12;
    const cx = width / 2;
    const cy = height / 2;

    let primary_hex = '#1E1E24';
    let secondary_hex = '#D4AF37';
    let accent_hex = '#F8F9FA';
    let glaze_type = 'satin';
    let roughness = 0.28;
    let metallic = 0.15;
    let relief_depth_mm = 2.5;
    let edge_profile = 'rectified_90';
    let concept_name = 'Custom Geometric Concept';

    let vectors = [];

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

    const areaM2 = (width * height) / 1_000_000;
    const volumeM3 = areaM2 * (thickness / 1000);
    const densityKgM3 = 2400;
    const rawMassKg = volumeM3 * densityKgM3;
    const single_tile_mass_kg = Math.round(rawMassKg * 0.86 * 100) / 100;

    res.json({
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
    });
  });

  app.post('/api/v1/factory/transfer/:passport_id', (req, res) => {
    const passport_id = req.params.passport_id;
    passportDatabase[passport_id] = {
      ...req.body,
      passport_id,
      status: 'machining_in_progress',
      timestamp: new Date().toISOString(),
    };
    res.json({
      status: 'success',
      message: `Passport ${passport_id} queued at SACMI Bologna Controller.`,
    });
  });

  app.get('/api/v1/factory/passport/:passport_id', (req, res) => {
    const passport_id = req.params.passport_id;
    const item = passportDatabase[passport_id] || {
      passport_id,
      status: 'qc_verified',
      target_factory_id: 'SACMI-FAC-BOLOGNA-04',
      waterjet_parameters: {
        kerf_mm: 0.75,
        pressure_bar: 4100,
        feed_rate_mm_min: 650,
      },
    };
    res.json(item);
  });

  // Vite middleware in dev, static files in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Studio Cadenza server running on http://localhost:${PORT}`);
  });
}

startServer();
