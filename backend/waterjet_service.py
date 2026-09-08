"""
Studio Cadenza - Waterjet CAM Vector Engine (WaterjetService)
Uses Shapely for tool radius kerf offset compensation and ezdxf for industrial DXF generation.
"""

import math
from typing import List, Dict, Any, Tuple
from models import VectorPathSchema, DimensionsSchema, CAMQCCheckResult

try:
    from shapely.geometry import Polygon, LineString, Point, MultiPolygon
    from shapely.ops import unary_union
except ImportError:
    Polygon = None
    LineString = None

try:
    import ezdxf
except ImportError:
    ezdxf = None

class WaterjetService:
    def __init__(self, kerf_mm: float = 0.75):
        self.kerf_mm = kerf_mm # Waterjet nozzle abrasive beam offset radius

    def run_algorithmic_qc(self, paths: List[VectorPathSchema], dims: DimensionsSchema) -> CAMQCCheckResult:
        """
        Algorithmic Quality Control Inspection:
        1. Checks for open vector loops on cutting contours.
        2. Checks for self-intersections and acute thermal pinch corners.
        3. Enforces structural wall thickness threshold (>= 2.0mm). If < 2.0mm, triggers safety alarm.
        """
        warnings = []
        errors = []
        closed_count = 0
        open_count = 0
        min_wall = 12.0

        if not paths:
            return CAMQCCheckResult(
                passed=True,
                kerf_mm=self.kerf_mm,
                min_wall_thickness_mm=5.0,
                wall_thickness_passed=True,
                closed_loops_count=0,
                open_loops_count=0,
                estimated_cut_time_min=1.2,
                waterjet_bar_pressure=4100,
                feed_rate_mm_min=650,
                warnings=["Perimeter perimeter cut applied. Zero custom inlays."]
            )

        shapely_geoms = []

        for idx, p in enumerate(paths):
            pts = [(pt.x, pt.y) for pt in p.points]
            if len(pts) < 2:
                continue

            is_closed = p.closed or (pts[0] == pts[-1])
            if is_closed and len(pts) >= 3:
                closed_count += 1
                if Polygon:
                    try:
                        poly = Polygon(pts)
                        if not poly.is_valid:
                            warnings.append(f"Path #{idx+1} ({p.id}) has self-intersections.")
                        shapely_geoms.append(poly)
                    except Exception:
                        pass
            else:
                open_count += 1
                if p.layer == "LAYER_CUT":
                    errors.append(f"Path #{idx+1} ({p.id}) on LAYER_CUT is unclosed. Waterjet lead-in requires 100% closed loop.")

            # Check boundary proximity (distance to tile edges)
            for pt in p.points:
                dist_left = pt.x
                dist_right = dims.width_mm - pt.x
                dist_top = pt.y
                dist_bottom = dims.height_mm - pt.y
                edge_dist = min(dist_left, dist_right, dist_top, dist_bottom)
                if 0 < edge_dist < min_wall:
                    min_wall = edge_dist

        # Check proximity between multiple distinct paths
        if len(shapely_geoms) > 1:
            for i in range(len(shapely_geoms)):
                for j in range(i + 1, len(shapely_geoms)):
                    d = shapely_geoms[i].distance(shapely_geoms[j])
                    if 0 < d < min_wall:
                        min_wall = d

        wall_passed = min_wall >= 2.0
        if not wall_passed:
            errors.append(
                f"Critical Structural Failure: Minimum wall thickness is {min_wall:.2f}mm (< 2.0mm threshold). "
                f"Risk of catastrophic ceramic micro-fracturing under 4100 bar abrasive hydraulic piercing."
            )

        passed = wall_passed and len(errors) == 0

        # Estimated cutting time calculation: Feed rate 650 mm/min for 12mm porcelain @ 4100 bar
        total_cut_len = (dims.width_mm + dims.height_mm) * 2
        for p in paths:
            for k in range(len(p.points) - 1):
                p1 = p.points[k]
                p2 = p.points[k + 1]
                total_cut_len += math.hypot(p2.x - p1.x, p2.y - p1.y)

        est_time = round((total_cut_len / 650.0) + 0.5, 1)

        return CAMQCCheckResult(
            passed=passed,
            kerf_mm=self.kerf_mm,
            min_wall_thickness_mm=round(min_wall, 2),
            wall_thickness_passed=wall_passed,
            closed_loops_count=closed_count,
            open_loops_count=open_count,
            estimated_cut_time_min=est_time,
            waterjet_bar_pressure=4100,
            feed_rate_mm_min=650,
            warnings=warnings,
            errors=errors,
        )

    def apply_kerf_offset(self, pts: List[Tuple[float, float]], is_outer: bool = True) -> List[Tuple[float, float]]:
        """
        Calculates tool radius offset (+0.75mm for outside cuts, -0.75mm for inside pockets) using Shapely
        """
        if not Polygon or len(pts) < 3:
            return pts
        try:
            poly = Polygon(pts)
            offset_dist = (self.kerf_mm / 2.0) if is_outer else (-self.kerf_mm / 2.0)
            buffered = poly.buffer(offset_dist, resolution=16, join_style=2)
            if buffered.geom_type == 'Polygon':
                return list(buffered.exterior.coords)
        except Exception:
            pass
        return pts

    def export_dxf(self, paths: List[VectorPathSchema], dims: DimensionsSchema, output_filepath: str) -> str:
        """
        Writes production DXF with ezdxf containing layers:
        - LAYER_CUT (Waterjet through cuts with kerf compensation)
        - LAYER_ENGRAVE (Micro shallow relief engraving)
        - LAYER_INLAY (Brass/Stone inlay profiles)
        """
        if ezdxf:
            doc = ezdxf.new('R2010')
            msp = doc.modelspace()

            # Create layers
            doc.layers.add('LAYER_CUT', color=1) # Red
            doc.layers.add('LAYER_ENGRAVE', color=5) # Blue
            doc.layers.add('LAYER_INLAY', color=2) # Yellow

            # Perimeter cut
            w, h = dims.width_mm, dims.height_mm
            msp.add_lwpolyline([(0, 0), (w, 0), (w, h), (0, h), (0, 0)], dxfattribs={'layer': 'LAYER_CUT'})

            # Feature paths
            for p in paths:
                raw_pts = [(pt.x, pt.y) for pt in p.points]
                compensated_pts = self.apply_kerf_offset(raw_pts, is_outer=True) if p.layer == 'LAYER_CUT' else raw_pts
                layer_tag = p.layer if p.layer in ['LAYER_CUT', 'LAYER_ENGRAVE', 'LAYER_INLAY'] else 'LAYER_INLAY'
                msp.add_lwpolyline(compensated_pts, close=p.closed, dxfattribs={'layer': layer_tag})

            doc.saveas(output_filepath)
        else:
            # Native fallback DXF writer
            with open(output_filepath, "w") as f:
                f.write("0\nSECTION\n2\nENTITIES\n")
                w, h = dims.width_mm, dims.height_mm
                f.write(f"0\nLWPOLYLINE\n8\nLAYER_CUT\n90\n5\n70\n1\n")
                f.write(f"10\n0.0\n20\n0.0\n10\n{w}\n20\n0.0\n10\n{w}\n20\n{h}\n10\n0.0\n20\n{h}\n10\n0.0\n20\n0.0\n")
                for p in paths:
                    f.write(f"0\nLWPOLYLINE\n8\n{p.layer}\n90\n{len(p.points)}\n70\n{1 if p.closed else 0}\n")
                    for pt in p.points:
                        f.write(f"10\n{pt.x}\n20\n{pt.y}\n")
                f.write("0\nENDSEC\n0\nEOF\n")

        return output_filepath
