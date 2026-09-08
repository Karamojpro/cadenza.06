import { VectorPath, VectorPoint, ObjectTransform } from '../types';

export const IDENTITY_TRANSFORM: ObjectTransform = {
  x_mm: 0,
  y_mm: 0,
  rotation_deg: 0,
  scale: 1,
};

/** Legacy 3-value layer tag -> Phase 1 ProjectLayer id. Kept only for objects
 * authored before layerId existed (loadPresetPattern data, AI concept results). */
const LEGACY_LAYER_MAP: Record<string, string> = {
  LAYER_INLAY: 'layer_inlay',
  LAYER_CUT: 'layer_cut',
  LAYER_ENGRAVE: 'layer_engrave',
};

/**
 * Resolves an object's real layer id, whichever field it was authored with.
 * This is the ONLY place that understands the legacy `layer` tag — remove the
 * fallback branch once loadPresetPattern / the AI generator emit layerId directly.
 */
export function getResolvedLayerId(path: VectorPath): string {
  if (path.layerId) return path.layerId;
  if (path.layer && LEGACY_LAYER_MAP[path.layer]) return LEGACY_LAYER_MAP[path.layer];
  return 'layer_inlay';
}

export function getTransform(path: VectorPath): ObjectTransform {
  return path.transform ?? IDENTITY_TRANSFORM;
}

/** Applies scale -> rotate -> translate to a set of object-space points. Points
 * passed in (and stored on VectorPath) are never mutated by this. */
export function applyTransform(points: VectorPoint[], transform: ObjectTransform): VectorPoint[] {
  const { x_mm, y_mm, rotation_deg, scale } = transform;
  const rad = (rotation_deg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return points.map((p) => {
    const sx = p.x * scale;
    const sy = p.y * scale;
    const rx = sx * cos - sy * sin;
    const ry = sx * sin + sy * cos;
    return { x: rx + x_mm, y: ry + y_mm };
  });
}

export function getTransformedPoints(path: VectorPath): VectorPoint[] {
  return applyTransform(path.points, getTransform(path));
}

/** SVG `transform` attribute equivalent to applyTransform's scale->rotate->translate
 * composition, for wrapping a <g> around an object's untouched local-space points. */
export function toSvgTransform(transform: ObjectTransform): string {
  return `translate(${transform.x_mm} ${transform.y_mm}) rotate(${transform.rotation_deg}) scale(${transform.scale})`;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function getObjectBounds(path: VectorPath): Bounds {
  const pts = getTransformedPoints(path);
  if (pts.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}

/** Ray-casting point-in-polygon test against an object's transformed points.
 * Open paths fall back to a distance-to-segment threshold. */
export function hitTestObject(point: VectorPoint, path: VectorPath, thresholdMm = 6): boolean {
  const pts = getTransformedPoints(path);
  if (pts.length < 2) return false;

  if (path.closed) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i].x, yi = pts[i].y;
      const xj = pts[j].x, yj = pts[j].y;
      const intersects =
        yi > point.y !== yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
      if (intersects) inside = !inside;
    }
    if (inside) return true;
  }

  // Also allow selecting by clicking near the stroke itself (covers open
  // paths and thin closed shapes where the interior test above is too strict).
  for (let i = 0; i < pts.length - 1; i++) {
    if (distanceToSegment(point, pts[i], pts[i + 1]) <= thresholdMm) return true;
  }
  return false;
}

function distanceToSegment(p: VectorPoint, a: VectorPoint, b: VectorPoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  return Math.hypot(p.x - projX, p.y - projY);
}
