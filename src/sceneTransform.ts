import { ObjectTransform } from '../types';
import { ObjectTransform3D, IDENTITY_TRANSFORM_3D, SceneObject } from '../types/scene';

export function project3DTo2D(t: ObjectTransform3D): ObjectTransform {
  return { x_mm: t.x_mm, y_mm: t.y_mm, rotation_deg: t.rotation_z_deg, scale: (t.scale_x + t.scale_y) / 2 };
}
export function merge2DIntoTransform3D(t: ObjectTransform3D | undefined, p: Partial<ObjectTransform>): ObjectTransform3D {
  const base = t ?? IDENTITY_TRANSFORM_3D;
  return { ...base, x_mm: p.x_mm ?? base.x_mm, y_mm: p.y_mm ?? base.y_mm, rotation_z_deg: p.rotation_deg ?? base.rotation_z_deg, scale_x: p.scale ?? base.scale_x, scale_y: p.scale ?? base.scale_y };
}
export function sceneObjectToSvgTransform(o: SceneObject): string {
  const t = o.transform;
  return `translate(${t.x_mm} ${t.y_mm}) rotate(${t.rotation_z_deg}) scale(${t.scale_x} ${t.scale_y})`;
}
