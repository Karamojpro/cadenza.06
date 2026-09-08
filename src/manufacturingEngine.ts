import { SceneObject } from '../types/scene';
import { Dimensions, VectorPath } from '../types';

export interface ManufacturingOperation {
  objectId: string;
  objectName: string;
  operation: 'CUT' | 'ENGRAVE' | 'INLAY' | 'FORM' | 'REFERENCE';
  layerId: string;
  estimatedPathMm: number;
  estimatedTimeMin: number;
  included: boolean;
  warnings: string[];
}

export interface ManufacturingPlan {
  generatedAt: string;
  stock: { width_mm: number; height_mm: number; thickness_mm: number };
  includedObjectCount: number;
  vectorOperationCount: number;
  estimatedCutPathMm: number;
  estimatedMachineMinutes: number;
  estimatedWastePct: number;
  warnings: string[];
  operations: ManufacturingOperation[];
}

const dist = (a: {x:number;y:number}, b:{x:number;y:number}) => Math.hypot(b.x-a.x,b.y-a.y);

function vectorPathLength(points: {x:number;y:number}[], closed: boolean) {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i=1;i<points.length;i++) total += dist(points[i-1], points[i]);
  if (closed && points.length > 2) total += dist(points[points.length-1], points[0]);
  return total;
}

function asVector(object: SceneObject): VectorPath | null {
  if (object.geometry.kind !== 'vector_object') return null;
  const p = object.geometry.params;
  return {
    id: object.id,
    type: p.type === 'rectangle' || p.type === 'circle' || p.type === 'inlay_contour' || p.type === 'relief_cut' ? p.type : 'polyline',
    points: p.points,
    color: p.color,
    closed: p.closed,
    layerId: object.layerId,
    strokeWidth: p.strokeWidth,
    depth_mm: p.depth_mm,
    transform: { x_mm: object.transform.x_mm, y_mm: object.transform.y_mm, rotation_deg: object.transform.rotation_z_deg, scale: object.transform.scale_x },
  };
}

export function buildManufacturingPlan(objects: SceneObject[], dimensions: Dimensions, kerfMm = 0.75): ManufacturingPlan {
  const included = objects.filter(o => o.manufacturingIncluded);
  const operations: ManufacturingOperation[] = [];
  const warnings: string[] = [];
  let path = 0;

  for (const object of included) {
    const vector = asVector(object);
    if (vector) {
      const length = vectorPathLength(vector.points, vector.closed) * Math.max(0.001, object.transform.scale_x);
      const type = object.layerId.includes('cut') ? 'CUT' : object.layerId.includes('engrave') ? 'ENGRAVE' : 'INLAY';
      const depth = object.geometry.params.depth_mm ?? 0;
      const objectWarnings: string[] = [];
      if (length < 1) objectWarnings.push('Degenerate vector path.');
      if (depth > dimensions.thickness_mm) objectWarnings.push('Operation depth exceeds stock thickness.');
      if (kerfMm * 2 >= dimensions.width_mm || kerfMm * 2 >= dimensions.height_mm) objectWarnings.push('Kerf is too large for current stock.');
      operations.push({ objectId: object.id, objectName: object.name, operation: type, layerId: object.layerId, estimatedPathMm: Math.round(length * 100) / 100, estimatedTimeMin: Math.max(0.1, length / 1800), included: true, warnings: objectWarnings });
      path += length;
      warnings.push(...objectWarnings.map(w => `${object.name}: ${w}`));
    } else if (object.kind === 'reference_object') {
      operations.push({ objectId: object.id, objectName: object.name, operation: 'REFERENCE', layerId: object.layerId, estimatedPathMm: 0, estimatedTimeMin: 0, included: false, warnings: ['Reference objects are excluded from machining.'] });
    } else {
      const area = object.geometry.params.dimensions.width_mm * object.geometry.params.dimensions.height_mm;
      const perimeter = 2 * (object.geometry.params.dimensions.width_mm + object.geometry.params.dimensions.height_mm);
      const minutes = perimeter / 2400 + area / 1000000 * 0.8;
      operations.push({ objectId: object.id, objectName: object.name, operation: 'FORM', layerId: object.layerId, estimatedPathMm: perimeter, estimatedTimeMin: minutes, included: true, warnings: [] });
      path += perimeter;
    }
  }

  const stockArea = dimensions.width_mm * dimensions.height_mm;
  const estimatedUsedArea = included.filter(o => o.geometry.kind !== 'vector_object' && o.geometry.kind !== 'reference_object').reduce((sum, o) => sum + o.geometry.params.dimensions.width_mm * o.geometry.params.dimensions.height_mm, 0);
  const waste = Math.max(0, Math.min(95, 100 - (estimatedUsedArea / Math.max(1, stockArea)) * 100));
  return { generatedAt: new Date().toISOString(), stock: { width_mm: dimensions.width_mm, height_mm: dimensions.height_mm, thickness_mm: dimensions.thickness_mm }, includedObjectCount: included.length, vectorOperationCount: operations.filter(o => o.operation === 'CUT' || o.operation === 'ENGRAVE' || o.operation === 'INLAY').length, estimatedCutPathMm: Math.round(path * 100) / 100, estimatedMachineMinutes: Math.round(operations.reduce((s,o)=>s+o.estimatedTimeMin,0)*100)/100, estimatedWastePct: Math.round(waste*10)/10, warnings, operations };
}
