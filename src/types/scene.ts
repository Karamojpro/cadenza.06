import { Dimensions, FinishProps, ColorData, ReferenceAssets, ProductionMode, ArchitecturalArchetype, StairTreadParams, WallPanel3DParams, SkirtingMoldingParams, CountertopSlabParams, VectorPoint } from '../types';
import { ProjectLayer } from './project';

export type SceneObjectKind = ArchitecturalArchetype | 'vector_object' | 'reference_object';

export interface ObjectTransform3D {
  x_mm: number;
  y_mm: number;
  z_mm: number;
  rotation_x_deg: number;
  rotation_y_deg: number;
  rotation_z_deg: number;
  scale_x: number;
  scale_y: number;
  scale_z: number;
}

export const IDENTITY_TRANSFORM_3D: ObjectTransform3D = {
  x_mm: 0, y_mm: 0, z_mm: 0,
  rotation_x_deg: 0, rotation_y_deg: 0, rotation_z_deg: 0,
  scale_x: 1, scale_y: 1, scale_z: 1,
};

export type GeometrySpec =
  | { kind: 'flat_tile'; params: { dimensions: Dimensions } }
  | { kind: 'stair_tread'; params: { dimensions: Dimensions; stair: StairTreadParams } }
  | { kind: '3d_wall_panel'; params: { dimensions: Dimensions; wallPanel: WallPanel3DParams } }
  | { kind: 'skirting_molding'; params: { dimensions: Dimensions; molding: SkirtingMoldingParams } }
  | { kind: 'countertop_slab'; params: { dimensions: Dimensions; slab: CountertopSlabParams } }
  | { kind: 'vector_object'; params: { points: VectorPoint[]; closed: boolean; type: string; strokeWidth: number; depth_mm?: number; color: string } }
  | { kind: 'reference_object'; params: { source: string | null; width_mm: number; height_mm: number } };

export interface MaterialDefinition {
  id: string;
  name: string;
  color: ColorData;
  finish: FinishProps;
  density_kg_m3?: number;
}

export interface SceneObject {
  id: string;
  name: string;
  kind: SceneObjectKind;
  transform: ObjectTransform3D;
  visible: boolean;
  locked: boolean;
  manufacturingIncluded: boolean;
  layerId: string;
  geometry: GeometrySpec;
  materialId: string;
}

export interface SceneV2 {
  id: string;
  name: string;
  objectIds: string[];
  objects: Record<string, SceneObject>;
  layers: ProjectLayer[];
  materials: Record<string, MaterialDefinition>;
}

export interface ProjectV2 {
  schemaVersion: 2;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  activeSceneId: string;
  scenes: Record<string, SceneV2>;
  referenceAssets: ReferenceAssets;
  manufacturing: { productionMode: ProductionMode; targetFactoryId: string };
  exportConfig: { lastExportedFormats: string[]; lastExportedAt: string | null };
}
