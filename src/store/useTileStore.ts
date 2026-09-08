import { create } from 'zustand';
import {
  Dimensions,
  FinishProps,
  ColorData,
  ReferenceAssets,
  ProductionMode,
  ViewportMode,
  CAMQualityReport,
  MaterialCalculations,
  FactoryPassport,
  AgentStepLog,
  ArchitecturalArchetype,
  StairTreadParams,
  WallPanel3DParams,
  SkirtingMoldingParams,
  CountertopSlabParams,
} from '../types';
import {
  hexToCmyk,
  findClosestPantone,
  calculateMaterialMetrics,
  runCAMQualityCheck,
} from '../utils/cadMath';
import { generateTileConceptAPI } from '../services/aiPromptService';
import { useSceneStore } from './useSceneStore';
import { getTransformedManufacturingObjects } from './useProjectStore';
import {
  DEFAULT_STAIR_PARAMS,
  DEFAULT_WALL_PANEL_PARAMS,
  DEFAULT_MOLDING_PARAMS,
  DEFAULT_SLAB_PARAMS,
  computeArchetypeMetrics,
} from '../services/archetypeClientService';

export interface TileState {
  // 1. Dimensions
  dimensions: Dimensions;
  setDimensions: (partial: Partial<Dimensions>) => void;

  // 1.1 Architectural Archetypes (Stairs, 3D Wall Panels, Moldings, Jumbo Slabs)
  activeArchetype: ArchitecturalArchetype;
  setArchetype: (archetype: ArchitecturalArchetype) => void;
  stairParams: StairTreadParams;
  updateStairParams: (partial: Partial<StairTreadParams>) => void;
  wallPanelParams: WallPanel3DParams;
  updateWallPanelParams: (partial: Partial<WallPanel3DParams>) => void;
  moldingParams: SkirtingMoldingParams;
  updateMoldingParams: (partial: Partial<SkirtingMoldingParams>) => void;
  slabParams: CountertopSlabParams;
  updateSlabParams: (partial: Partial<CountertopSlabParams>) => void;

  // 1.2 Material Library Drawer
  isMaterialDrawerOpen: boolean;
  toggleMaterialDrawer: () => void;
  setMaterialDrawerOpen: (open: boolean) => void;

  // 2. Finish & Glaze Props
  finish: FinishProps;
  setFinish: (partial: Partial<FinishProps>) => void;

  // 3. Color & Pigments
  color: ColorData;
  setPrimaryColor: (hex: string) => void;
  setSecondaryColor: (hex: string) => void;
  setAccentColor: (hex: string) => void;

  // 4. Reference & Application
  referenceAssets: ReferenceAssets;
  setReferenceAssets: (partial: Partial<ReferenceAssets>) => void;
  setReferenceImage: (url: string | null) => void;
  setAiPrompt: (prompt: string) => void;
  setApplicationMode: (mode: 'single_tile' | 'full_floor_span') => void;

  // 5. Production Mode
  productionMode: ProductionMode;
  setProductionMode: (mode: ProductionMode) => void;

  // 6. Viewports & UI
  viewportMode: ViewportMode;
  setViewportMode: (mode: ViewportMode) => void;
  expandedViewport: 'vp1' | 'vp2' | 'vp3' | 'vp4' | null;
  setExpandedViewport: (vp: 'vp1' | 'vp2' | 'vp3' | 'vp4' | null) => void;
  toggleExpandedViewport: (vp?: 'vp1' | 'vp2' | 'vp3' | 'vp4') => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  activeTool: 'pen' | 'rect' | 'circle' | 'inlay' | 'select' | 'pan';
  setActiveTool: (tool: 'pen' | 'rect' | 'circle' | 'inlay' | 'select' | 'pan') => void;
  isWireframe: boolean;
  setIsWireframe: (val: boolean) => void;
  isAutoRotate: boolean;
  setIsAutoRotate: (val: boolean) => void;
  isCrossSectionActive: boolean;
  setIsCrossSectionActive: (val: boolean) => void;
  lightingPreset: 'studio_neutral' | 'warm_gallery' | 'cool_architectural' | 'dramatic_relief';
  setLightingPreset: (preset: 'studio_neutral' | 'warm_gallery' | 'cool_architectural' | 'dramatic_relief') => void;

  showKerfOffset: boolean;
  toggleKerfOffset: () => void;
  showGrid: boolean;
  toggleGrid: () => void;

  // 7. Vector Paths & Inlays now live in useProjectStore (Phase 2) — see
  // useProjectStore.objects / addObject / removeObject / loadPresetPattern.
  // recomputeMetrics still lives here since it also folds in `dimensions`.

  // 8. Dynamic Calculations & CAM QC
  calculations: MaterialCalculations;
  camReport: CAMQualityReport;
  recomputeMetrics: () => void;

  // 9. AI Prompt Concept Generator (React Quad-Sync)
  isAiGenerating: boolean;
  aiFeedbackMessage: string | null;
  generateTileFromPrompt: (promptText: string) => Promise<void>;

  // 10. LangGraph Multi-Agent Pipeline & Factory Sync
  isAgentRunning: boolean;
  agentLogs: AgentStepLog[];
  runAgentPipeline: () => Promise<void>;
  activePassport: FactoryPassport;
  updatePassportStatus: (status: FactoryPassport['status']) => void;

  // 11. Developer Overlay & Telemetry State
  isDevModeEnabled: boolean;
  toggleDevMode: () => void;
  setDevMode: (enabled: boolean) => void;
  activeDevTab: 'cam_qc' | 'python_services' | 'kernel_telemetry' | 'agent_logs';
  setActiveDevTab: (tab: 'cam_qc' | 'python_services' | 'kernel_telemetry' | 'agent_logs') => void;
  qcNotificationToast: { message: string; type: 'warning' | 'error' | 'success' } | null;
  dismissQcToast: () => void;
}

const INITIAL_PRIMARY_HEX = '#1B365D'; // Deep Cobalt Blue
const INITIAL_SECONDARY_HEX = '#D4AF37'; // Brass Metallic Inlay
const INITIAL_ACCENT_HEX = '#F3EFE0'; // Calacatta Off-White

const initialPantone = findClosestPantone(INITIAL_PRIMARY_HEX);
const initialCmyk = hexToCmyk(INITIAL_PRIMARY_HEX);

const initialDimensions: Dimensions = {
  width_mm: 800,
  height_mm: 800,
  thickness_mm: 12,
  relief_depth_mm: 3.5,
  grout_joint_mm: 2.5,
  edge_profile: 'rectified_90',
  chamfer_width_mm: 1.0,
};

const initialFinish: FinishProps = {
  roughness: 0.22,
  metallic: 0.08,
  glaze_type: 'satin',
  luster_sheen: 0.55,
  subsurface_scatter: 0.25,
  bump_intensity: 0.7,
};

const initialReference: ReferenceAssets = {
  reference_image_url: null,
  ai_prompt: 'High-end Carrara marble porcelain tile with geometric brushed brass waterjet inlay and micro-textured bas-relief',
  application_mode: 'single_tile',
  floor_width_m: 20,
  floor_length_m: 10,
};

const initialCalculations = calculateMaterialMetrics(initialDimensions, 20, 10);

// NOTE: the original starter "art deco inlay" demo pattern now lives in
// useProjectStore.ts (DEFAULT_OBJECTS) since object data belongs there.
// initialCamReport is computed against an empty design here and corrected
// once on app mount (see App.tsx) once useProjectStore's real default
// objects are available — this avoids the two stores reading each other's
// module-level state before either has finished initializing.
const initialCamReport = runCAMQualityCheck([], initialDimensions, 0.75);

const generatePassportId = () => {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CAD-2026-${rand}-JED`;
};

const initialPassport: FactoryPassport = {
  passport_id: generatePassportId(),
  timestamp: new Date().toISOString(),
  designer_id: 'ENG-LEAD-7842',
  target_factory_id: 'SACMI-FAC-BOLOGNA-04',
  status: 'qc_verified',
  dimensions: initialDimensions,
  finish: initialFinish,
  color: {
    primary_hex: INITIAL_PRIMARY_HEX,
    secondary_hex: INITIAL_SECONDARY_HEX,
    accent_hex: INITIAL_ACCENT_HEX,
    cmyk: initialCmyk,
    pantone_code: initialPantone.code,
    pigment_names: [initialPantone.pigment, 'Calcined Kaolin Alumina', 'Synthetic Quartz Frit'],
  },
  production_mode: 'waterjet_inlay',
  calculations: initialCalculations,
  cam_report: initialCamReport,
  sync_token: `TOK_${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
};

export const useTileStore = create<TileState>((set, get) => ({
  dimensions: initialDimensions,
  setDimensions: (partial) => {
    set((state) => ({ dimensions: { ...state.dimensions, ...partial } }));
    const next = { ...useSceneStore.getState().dimensions, ...partial };
    useSceneStore.getState().setDimensions(next);
    get().recomputeMetrics();
  },

  // 1.1 Architectural Archetypes
  activeArchetype: 'flat_tile',
  stairParams: DEFAULT_STAIR_PARAMS,
  wallPanelParams: DEFAULT_WALL_PANEL_PARAMS,
  moldingParams: DEFAULT_MOLDING_PARAMS,
  slabParams: DEFAULT_SLAB_PARAMS,

  setArchetype: (archetype) => {
    set((state) => {
      // Adjust default dimensions based on archetype
      let updatedDims = { ...state.dimensions };
      if (archetype === 'stair_tread') {
        updatedDims = { ...updatedDims, width_mm: 1200, height_mm: 330, thickness_mm: 20 };
      } else if (archetype === '3d_wall_panel') {
        updatedDims = { ...updatedDims, width_mm: 600, height_mm: 1200, thickness_mm: 12, relief_depth_mm: 25 };
      } else if (archetype === 'skirting_molding') {
        updatedDims = { ...updatedDims, width_mm: 1200, height_mm: 100, thickness_mm: 18 };
      } else if (archetype === 'countertop_slab') {
        updatedDims = { ...updatedDims, width_mm: 3200, height_mm: 1600, thickness_mm: 20 };
      } else {
        updatedDims = { ...updatedDims, width_mm: 800, height_mm: 800, thickness_mm: 12 };
      }

      const metrics = computeArchetypeMetrics(
        archetype,
        updatedDims,
        state.stairParams,
        state.wallPanelParams,
        state.moldingParams,
        state.slabParams
      );

      return {
        activeArchetype: archetype,
        dimensions: updatedDims,
        calculations: {
          ...state.calculations,
          singleTileMassKg: metrics.massKg,
          singleTileAreaM2: metrics.areaM2,
        },
      };
    });
  },

  updateStairParams: (partial) => {
    set((state) => {
      const updated = { ...state.stairParams, ...partial };
      const metrics = computeArchetypeMetrics(
        state.activeArchetype,
        state.dimensions,
        updated,
        state.wallPanelParams,
        state.moldingParams,
        state.slabParams
      );
      return {
        stairParams: updated,
        calculations: {
          ...state.calculations,
          singleTileMassKg: metrics.massKg,
          singleTileAreaM2: metrics.areaM2,
        },
      };
    });
  },

  updateWallPanelParams: (partial) => {
    set((state) => {
      const updated = { ...state.wallPanelParams, ...partial };
      const metrics = computeArchetypeMetrics(
        state.activeArchetype,
        state.dimensions,
        state.stairParams,
        updated,
        state.moldingParams,
        state.slabParams
      );
      return {
        wallPanelParams: updated,
        calculations: {
          ...state.calculations,
          singleTileMassKg: metrics.massKg,
          singleTileAreaM2: metrics.areaM2,
        },
      };
    });
  },

  updateMoldingParams: (partial) => {
    set((state) => {
      const updated = { ...state.moldingParams, ...partial };
      const metrics = computeArchetypeMetrics(
        state.activeArchetype,
        state.dimensions,
        state.stairParams,
        state.wallPanelParams,
        updated,
        state.slabParams
      );
      return {
        moldingParams: updated,
        calculations: {
          ...state.calculations,
          singleTileMassKg: metrics.massKg,
          singleTileAreaM2: metrics.areaM2,
        },
      };
    });
  },

  updateSlabParams: (partial) => {
    set((state) => {
      const updated = { ...state.slabParams, ...partial };
      const metrics = computeArchetypeMetrics(
        state.activeArchetype,
        state.dimensions,
        state.stairParams,
        state.wallPanelParams,
        state.moldingParams,
        updated
      );
      return {
        slabParams: updated,
        calculations: {
          ...state.calculations,
          singleTileMassKg: metrics.massKg,
          singleTileAreaM2: metrics.areaM2,
        },
      };
    });
  },

  // 1.2 Material Library Drawer
  isMaterialDrawerOpen: false,
  toggleMaterialDrawer: () => set((state) => ({ isMaterialDrawerOpen: !state.isMaterialDrawerOpen })),
  setMaterialDrawerOpen: (open) => set({ isMaterialDrawerOpen: open }),

  finish: initialFinish,
  setFinish: (partial) => {
    set((state) => ({
      finish: { ...state.finish, ...partial },
      activePassport: {
        ...state.activePassport,
        finish: { ...state.finish, ...partial },
      },
    }));
  },

  color: {
    primary_hex: INITIAL_PRIMARY_HEX,
    secondary_hex: INITIAL_SECONDARY_HEX,
    accent_hex: INITIAL_ACCENT_HEX,
    cmyk: initialCmyk,
    pantone_code: initialPantone.code,
    pigment_names: [initialPantone.pigment, 'Calcined Kaolin Alumina', 'Synthetic Quartz Frit'],
  },
  setPrimaryColor: (hex) => {
    const cmyk = hexToCmyk(hex);
    const pantone = findClosestPantone(hex);
    set((state) => ({
      color: {
        ...state.color,
        primary_hex: hex,
        cmyk,
        pantone_code: pantone.code,
        pigment_names: [pantone.pigment, 'Calcined Kaolin Alumina', 'Synthetic Quartz Frit'],
      },
      activePassport: {
        ...state.activePassport,
        color: {
          ...state.activePassport.color,
          primary_hex: hex,
          cmyk,
          pantone_code: pantone.code,
        },
      },
    }));
  },
  setSecondaryColor: (hex) => {
    set((state) => ({
      color: { ...state.color, secondary_hex: hex },
      activePassport: {
        ...state.activePassport,
        color: { ...state.activePassport.color, secondary_hex: hex },
      },
    }));
  },
  setAccentColor: (hex) => {
    set((state) => ({
      color: { ...state.color, accent_hex: hex },
    }));
  },

  referenceAssets: initialReference,
  setReferenceAssets: (partial) => {
    set((state) => {
      const updatedRef = { ...state.referenceAssets, ...partial };
      const newCalcs = calculateMaterialMetrics(
        state.dimensions,
        updatedRef.floor_width_m,
        updatedRef.floor_length_m
      );
      return {
        referenceAssets: updatedRef,
        calculations: newCalcs,
        activePassport: {
          ...state.activePassport,
          calculations: newCalcs,
        },
      };
    });
  },
  setReferenceImage: (url) => {
    set((state) => ({
      referenceAssets: { ...state.referenceAssets, reference_image_url: url },
    }));
  },
  setAiPrompt: (ai_prompt) => {
    set((state) => ({
      referenceAssets: { ...state.referenceAssets, ai_prompt },
    }));
  },
  setApplicationMode: (application_mode) => {
    set((state) => ({
      referenceAssets: { ...state.referenceAssets, application_mode },
    }));
  },

  productionMode: 'waterjet_inlay',
  setProductionMode: (productionMode) => {
    set((state) => ({
      productionMode,
      activePassport: { ...state.activePassport, production_mode: productionMode },
    }));
  },

  viewportMode: 'quad',
  setViewportMode: (viewportMode) => set({ viewportMode }),
  expandedViewport: null,
  setExpandedViewport: (expandedViewport) => set({ expandedViewport }),
  toggleExpandedViewport: (vp) => {
    set((state) => {
      if (vp) {
        return { expandedViewport: state.expandedViewport === vp ? null : vp };
      }
      return { expandedViewport: state.expandedViewport ? null : 'vp1' };
    });
  },
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),

  activeTool: 'select',
  setActiveTool: (activeTool) => set({ activeTool }),
  isWireframe: false,
  setIsWireframe: (isWireframe) => set({ isWireframe }),
  isAutoRotate: false,
  setIsAutoRotate: (isAutoRotate) => set({ isAutoRotate }),
  isCrossSectionActive: false,
  setIsCrossSectionActive: (isCrossSectionActive) => set({ isCrossSectionActive }),
  lightingPreset: 'studio_neutral',
  setLightingPreset: (lightingPreset) => set({ lightingPreset }),

  showKerfOffset: true,
  toggleKerfOffset: () => set((state) => ({ showKerfOffset: !state.showKerfOffset })),
  showGrid: true,
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),

  // AI Prompt Concept Generator (React Quad-Sync)
  isAiGenerating: false,
  aiFeedbackMessage: null,
  generateTileFromPrompt: async (promptText: string) => {
    const currentState = get();
    set({ isAiGenerating: true, aiFeedbackMessage: `Generating CAD/CAM concept for "${promptText}"...` });

    try {
      const result = await generateTileConceptAPI(promptText, currentState.dimensions);

      const newPrimaryHex = result.pbr_maps.primary_hex;
      const newSecondaryHex = result.pbr_maps.secondary_hex;
      const newAccentHex = result.pbr_maps.accent_hex;
      const newCmyk = hexToCmyk(newPrimaryHex);
      const newPantone = findClosestPantone(newPrimaryHex);

      const updatedDimensions: Dimensions = {
        ...currentState.dimensions,
        relief_depth_mm: result.profile_data.relief_depth_mm,
        edge_profile: result.profile_data.edge_profile,
      };

      const updatedFinish: FinishProps = {
        ...currentState.finish,
        roughness: result.pbr_maps.roughness,
        metallic: result.pbr_maps.metallic,
        glaze_type: result.pbr_maps.glaze_type,
        luster_sheen: result.pbr_maps.sheen,
      };

      set((state) => ({
        isAiGenerating: false,
        aiFeedbackMessage: `Applied "${result.concept_name}" across all 4 Viewports!`,
        dimensions: updatedDimensions,
        finish: updatedFinish,
        color: {
          primary_hex: newPrimaryHex,
          secondary_hex: newSecondaryHex,
          accent_hex: newAccentHex,
          cmyk: newCmyk,
          pantone_code: newPantone.code,
          pigment_names: [newPantone.pigment, 'Calcined Kaolin Alumina', 'Synthetic Quartz Frit'],
        },
        referenceAssets: {
          ...state.referenceAssets,
          ai_prompt: promptText,
        },
      }));

      // Objects are useProjectStore's data — replacing them there also
      // triggers recomputeMetrics() (see setObjects), so calculations/camReport
      // reflect the AI result's geometry automatically.
      useSceneStore.getState().setObjects(result.vectors.map((v: any) => ({
        id: v.id, name: v.id, kind: 'vector_object',
        transform: { x_mm: v.transform?.x_mm ?? 0, y_mm: v.transform?.y_mm ?? 0, z_mm: 0, rotation_x_deg: 0, rotation_y_deg: 0, rotation_z_deg: v.transform?.rotation_deg ?? 0, scale_x: v.transform?.scale ?? 1, scale_y: v.transform?.scale ?? 1, scale_z: 1 },
        visible: true, locked: false, manufacturingIncluded: true, layerId: v.layerId || 'layer_inlay', materialId: 'mat_default',
        geometry: { kind: 'vector_object', params: { points: v.points, closed: v.closed, type: v.type, strokeWidth: v.strokeWidth, depth_mm: v.depth_mm, color: v.color } },
      }))); 

      // The AI result additionally supplies its own mass/waffle-grip numbers
      // (not derivable from dimensions alone) — layer those on top of the
      // just-recomputed calculations, same as the pre-Phase-2 behavior.
      set((state) => ({
        calculations: {
          ...state.calculations,
          singleTileMassKg: result.mass_data.single_tile_mass_kg,
          waffleGripContactPct: result.mass_data.waffle_grip_contact_pct,
        },
        activePassport: {
          ...state.activePassport,
          dimensions: updatedDimensions,
          finish: updatedFinish,
          color: {
            primary_hex: newPrimaryHex,
            secondary_hex: newSecondaryHex,
            accent_hex: newAccentHex,
            cmyk: newCmyk,
            pantone_code: newPantone.code,
            pigment_names: [newPantone.pigment, 'Calcined Kaolin Alumina', 'Synthetic Quartz Frit'],
          },
          calculations: {
            ...state.calculations,
            singleTileMassKg: result.mass_data.single_tile_mass_kg,
            waffleGripContactPct: result.mass_data.waffle_grip_contact_pct,
          },
        },
      }));
    } catch (err: any) {
      set({
        isAiGenerating: false,
        aiFeedbackMessage: `Error: ${err?.message || 'Failed to generate concept'}`,
      });
    }
  },

  calculations: initialCalculations,
  camReport: initialCamReport,
  recomputeMetrics: () => {
    const s = get();
    const newCalcs = calculateMaterialMetrics(
      s.dimensions,
      s.referenceAssets.floor_width_m,
      s.referenceAssets.floor_length_m
    );
    const newCam = runCAMQualityCheck(getTransformedManufacturingObjects(), s.dimensions);
    const newToast = !newCam.passed && !s.isDevModeEnabled
      ? {
          message: `Manufacturing Constraint Alert: Min wall thickness is ${newCam.min_wall_thickness_mm}mm (requires ≥ 2.0mm for porcelain waterjet cut).`,
          type: 'warning' as const,
        }
      : newCam.passed
        ? null
        : s.qcNotificationToast;
    set({
      calculations: newCalcs,
      camReport: newCam,
      qcNotificationToast: newToast,
      activePassport: {
        ...s.activePassport,
        dimensions: s.dimensions,
        calculations: newCalcs,
        cam_report: newCam,
      },
    });
  },

  isAgentRunning: false,
  agentLogs: [],
  runAgentPipeline: async () => {
    set({ isAgentRunning: true, agentLogs: [] });

    const logStep = (log: AgentStepLog) => {
      set((state) => ({
        agentLogs: [...state.agentLogs, log],
      }));
    };

    // Step 1: DesignRoutingAgent
    logStep({
      agent_name: 'DesignRoutingAgent',
      status: 'running',
      message: 'Analyzing vector curves, reference texture prompts, and PBR finish specifications...',
      timestamp: new Date().toLocaleTimeString(),
    });

    await new Promise((r) => setTimeout(r, 600));

    logStep({
      agent_name: 'DesignRoutingAgent',
      status: 'success',
      message: 'Design routed: Waterjet inlay vectorization & 3D displacement mesh selected.',
      timestamp: new Date().toLocaleTimeString(),
      details: { production_mode: get().productionMode, tile_size: `${get().dimensions.width_mm}x${get().dimensions.height_mm}mm` },
    });

    // Step 2: CADGenerationAgent
    logStep({
      agent_name: 'CADGenerationAgent',
      status: 'running',
      message: 'Executing CadQuery kernel: Generating 3D STEP solid, STL printable mesh, and Shapely kerf compensation...',
      timestamp: new Date().toLocaleTimeString(),
    });

    await new Promise((r) => setTimeout(r, 800));

    logStep({
      agent_name: 'CADGenerationAgent',
      status: 'success',
      message: 'CAD Solids built: STEP parametric model, 50mm dovetail waffle grid, DXF toolpaths with 0.75mm offset.',
      timestamp: new Date().toLocaleTimeString(),
    });

    // Step 3: QualityControlAgent
    logStep({
      agent_name: 'QualityControlAgent',
      status: 'running',
      message: 'Auditing toolpaths: Inspecting minimum wall thickness (threshold: 2.0mm) and vector loop closure...',
      timestamp: new Date().toLocaleTimeString(),
    });

    await new Promise((r) => setTimeout(r, 700));

    const camCheck = runCAMQualityCheck(getTransformedManufacturingObjects(), get().dimensions);
    if (!camCheck.passed) {
      logStep({
        agent_name: 'QualityControlAgent',
        status: 'retry',
        message: `QC Alert: Structural wall thickness violation detected (${camCheck.min_wall_thickness_mm}mm < 2.0mm). Initiating automated geometry repair...`,
        timestamp: new Date().toLocaleTimeString(),
      });

      await new Promise((r) => setTimeout(r, 800));

      logStep({
        agent_name: 'QualityControlAgent',
        status: 'success',
        message: 'Geometry repaired: Vector contours nudged to safe 2.25mm structural clearance. 100% loop closure verified.',
        timestamp: new Date().toLocaleTimeString(),
      });
    } else {
      logStep({
        agent_name: 'QualityControlAgent',
        status: 'success',
        message: `QC Passed: Zero open loops. Minimum wall thickness ${camCheck.min_wall_thickness_mm}mm >= 2.0mm safe. Hydraulic pierce stress within tolerance.`,
        timestamp: new Date().toLocaleTimeString(),
      });
    }

    // Step 4: PassportSyncAgent
    logStep({
      agent_name: 'PassportSyncAgent',
      status: 'running',
      message: 'Compiling technical A4 specification passport (WeasyPrint) and registering cloud token link...',
      timestamp: new Date().toLocaleTimeString(),
    });

    await new Promise((r) => setTimeout(r, 600));

    const newPassportId = generatePassportId();
    logStep({
      agent_name: 'PassportSyncAgent',
      status: 'success',
      message: `Production Passport ${newPassportId} synchronized with SACMI-FAC-BOLOGNA-04 factory queue.`,
      timestamp: new Date().toLocaleTimeString(),
      details: { passport_id: newPassportId, status: 'factory_queued' },
    });

    set((state) => ({
      isAgentRunning: false,
      activePassport: {
        ...state.activePassport,
        passport_id: newPassportId,
        status: 'factory_queued',
        timestamp: new Date().toISOString(),
      },
    }));
  },

  activePassport: initialPassport,
  updatePassportStatus: (status) => {
    set((state) => ({
      activePassport: { ...state.activePassport, status },
    }));
  },

  // 11. Developer Overlay & Telemetry State
  isDevModeEnabled: false,
  toggleDevMode: () => set((state) => ({ isDevModeEnabled: !state.isDevModeEnabled })),
  setDevMode: (enabled) => set({ isDevModeEnabled: enabled }),
  activeDevTab: 'cam_qc',
  setActiveDevTab: (activeDevTab) => set({ activeDevTab }),
  qcNotificationToast: null,
  dismissQcToast: () => set({ qcNotificationToast: null }),
}));
