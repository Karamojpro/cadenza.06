import React from 'react';
import { SceneObject } from '../types/scene';

export type GeometryFactory = React.FC<{ object: SceneObject; selected?: boolean }>;

const materialFor = (selected: boolean, color = '#D4AF37') => (
  <meshPhysicalMaterial color={color} roughness={selected ? 0.2 : 0.3} metalness={0.08} wireframe={selected} />
);

export const geometryFactories: Record<string, GeometryFactory> = {
  flat_tile: ({ object, selected = false }) => {
    if (object.geometry.kind !== 'flat_tile') return null;
    const d = object.geometry.params.dimensions;
    return <mesh castShadow receiveShadow><boxGeometry args={[d.width_mm / 1000, d.thickness_mm / 1000, d.height_mm / 1000]} />{materialFor(selected)}</mesh>;
  },
  stair_tread: ({ object, selected = false }) => {
    if (object.geometry.kind !== 'stair_tread') return null;
    const d = object.geometry.params.dimensions;
    return <mesh castShadow receiveShadow><boxGeometry args={[d.width_mm / 1000, d.thickness_mm / 1000, d.height_mm / 1000]} />{materialFor(selected)}</mesh>;
  },
  '3d_wall_panel': ({ object, selected = false }) => {
    if (object.geometry.kind !== '3d_wall_panel') return null;
    const d = object.geometry.params.dimensions;
    return <mesh castShadow receiveShadow><boxGeometry args={[d.width_mm / 1000, d.thickness_mm / 1000, d.height_mm / 1000]} />{materialFor(selected)}</mesh>;
  },
  skirting_molding: ({ object, selected = false }) => {
    if (object.geometry.kind !== 'skirting_molding') return null;
    const d = object.geometry.params.dimensions;
    return <mesh castShadow receiveShadow><boxGeometry args={[d.width_mm / 1000, d.thickness_mm / 1000, d.height_mm / 1000]} />{materialFor(selected)}</mesh>;
  },
  countertop_slab: ({ object, selected = false }) => {
    if (object.geometry.kind !== 'countertop_slab') return null;
    const d = object.geometry.params.dimensions;
    return <mesh castShadow receiveShadow><boxGeometry args={[d.width_mm / 1000, d.thickness_mm / 1000, d.height_mm / 1000]} />{materialFor(selected)}</mesh>;
  },
};

export function GeometryFactoryFallback({ object, selected = false }: { object: SceneObject; selected?: boolean }) {
  if (object.geometry.kind === 'vector_object' || object.geometry.kind === 'reference_object') return null;
  const Factory = geometryFactories[object.kind];
  return Factory ? <Factory object={object} selected={selected} /> : null;
}
