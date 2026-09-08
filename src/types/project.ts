/**
 * PHASE 1 — Unified Project Data Model
 * ------------------------------------
 * This is the long-term source of truth for a Studio Cadenza project:
 * a serializable Project containing one or more Scenes, each holding
 * Objects placed on Layers, referencing shared Materials.
 *
 * Phase 1 wraps the existing single-tile design (dimensions/finish/color/
 * vectorPaths in useTileStore) as the first Scene's first Object, so that
 * Save/Open become real instead of a fake toast. Later phases extend this
 * to true multi-object scenes without another format break — every field
 * here is additive and versioned.
 */

import {
  Dimensions,
  FinishProps,
  ColorData,
  VectorPath,
  ProductionMode,
  ArchitecturalArchetype,
  ReferenceAssets,
} from '../types';

export const LEGACY_PROJECT_SCHEMA_VERSION = 1;
/** Current on-disk format. The v1 Project interfaces below are retained only for migration compatibility. */
export const PROJECT_SCHEMA_VERSION = 2;

export type ProjectLayerKind =
  | 'base_body'
  | 'surface'
  | 'reference'
  | 'pattern'
  | 'inlay'
  | 'engrave'
  | 'cut'
  | 'dimensions'
  | 'backside';

export interface ProjectLayer {
  id: string;
  name: string;
  kind: ProjectLayerKind;
  visible: boolean;
  locked: boolean;
  opacity: number; // 0..1
}

export interface SceneObjectTransform {
  x_mm: number;
  y_mm: number;
  rotation_deg: number;
  scale: number;
}

/**
 * A single designable object in a scene. Phase 1 only ever has one of
 * these (the active tile/archetype) — the shape supports more without
 * a migration once multi-object scenes land.
 */
export interface SceneObject {
  id: string;
  name: string;
  archetype: ArchitecturalArchetype;
  transform: SceneObjectTransform;
  dimensions: Dimensions;
  finish: FinishProps;
  color: ColorData;
  vectorPaths: VectorPath[];
  layerId: string;
}

export interface Scene {
  id: string;
  name: string;
  objectIds: string[];
  objects: Record<string, SceneObject>;
  layers: ProjectLayer[];
}

export interface ManufacturingSpec {
  productionMode: ProductionMode;
  targetFactoryId: string;
}

export interface ExportConfiguration {
  lastExportedFormats: string[];
  lastExportedAt: string | null;
}

export interface Project {
  schemaVersion: number;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  activeSceneId: string;
  scenes: Record<string, Scene>;
  referenceAssets: ReferenceAssets;
  manufacturing: ManufacturingSpec;
  exportConfig: ExportConfiguration;
}

export const DEFAULT_LAYERS: ProjectLayer[] = [
  { id: 'layer_base_body', name: 'Base Body', kind: 'base_body', visible: true, locked: false, opacity: 1 },
  { id: 'layer_surface', name: 'Surface', kind: 'surface', visible: true, locked: false, opacity: 1 },
  { id: 'layer_reference', name: 'Reference', kind: 'reference', visible: true, locked: false, opacity: 0.6 },
  { id: 'layer_inlay', name: 'Inlay', kind: 'inlay', visible: true, locked: false, opacity: 1 },
  { id: 'layer_engrave', name: 'Engrave', kind: 'engrave', visible: true, locked: false, opacity: 1 },
  { id: 'layer_cut', name: 'Cut', kind: 'cut', visible: true, locked: false, opacity: 1 },
  { id: 'layer_backside', name: 'Backside', kind: 'backside', visible: true, locked: true, opacity: 1 },
];
