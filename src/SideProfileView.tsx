import React, { useState } from 'react';
import { useTileStore } from '../store/useTileStore';
import { Maximize2, Sliders, Layers, Ruler, ChevronRight } from 'lucide-react';

export const SideProfileView: React.FC<{ onExpand?: () => void; isExpanded?: boolean }> = ({
  onExpand,
  isExpanded = false,
}) => {
  const { dimensions, finish, color, productionMode, setDimensions } = useTileStore();
  const [showTolerance, setShowTolerance] = useState(true);

  const thickness = dimensions.thickness_mm; // e.g. 12mm
  const relief = dimensions.relief_depth_mm; // e.g. 3.5mm
  const edgeProfile = dimensions.edge_profile; // 'rectified_90' | 'chamfer_45' | 'cushion_bullnose'
  const chamferWidth = dimensions.chamfer_width_mm; // e.g. 1.5mm

  // Normalized visual scale for SVG cross section
  const svgWidth = 460;
  const svgHeight = 260;
  const scale = 8.5; // pixels per mm for side view

  const tileVisualWidthMm = 44; // showing side segment of 44mm
  const tileVisualWidthPx = tileVisualWidthMm * scale;
  const tileVisualThicknessPx = thickness * scale;
  const reliefPx = relief * scale;

  const startX = 60;
  const startY = 160;

  // Compute profile path points
  const leftEdgeX = startX;
  const rightEdgeX = startX + tileVisualWidthPx;
  const topY = startY - tileVisualThicknessPx;
  const bottomY = startY;

  return (
    <div
      id="viewport-side-cross-section"
      className="flex flex-col h-full bg-[#1A1A1C] border border-[#2A2A2E] rounded overflow-hidden select-none text-[#D1D1D1] shadow-xl"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#141416] border-b border-[#2A2A2E] text-xs shrink-0">
        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 bg-[#2A2A2E] text-[9px] font-bold rounded-sm uppercase tracking-widest text-[#00F0FF]">
            Viewport 03: Side Profile CAD
          </div>
          <span className="text-[#2A2A2E]">|</span>
          <span className="text-[#D1D1D1]/60 font-mono text-[10px]">
            {thickness.toFixed(1)}mm Body | {relief.toFixed(1)}mm Relief
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Edge Profile Switcher */}
          <div className="flex items-center bg-[#1E1E20] border border-[#2A2A2E] rounded px-1.5 py-0.5 text-[10px] gap-1">
            <span className="text-[#D1D1D1]/60">Edge:</span>
            <select
              value={dimensions.edge_profile}
              onChange={(e) => setDimensions({ edge_profile: e.target.value as any })}
              className="bg-transparent text-[#00F0FF] font-mono outline-none cursor-pointer text-[10px]"
            >
              <option value="rectified_90" className="bg-[#141416]">
                Rectified 90° (Precision)
              </option>
              <option value="chamfer_45" className="bg-[#141416]">
                Chamfer 45° (Safety Bevel)
              </option>
              <option value="cushion_bullnose" className="bg-[#141416]">
                Cushion Bullnose (Rounded)
              </option>
            </select>
          </div>

          <button
            onClick={() => setShowTolerance(!showTolerance)}
            className={`px-2 py-0.5 rounded-sm border text-[10px] font-mono transition ${
              showTolerance
                ? 'bg-[#1E1E20] text-[#00F0FF] border-[#00F0FF]'
                : 'bg-[#1E1E20] text-[#D1D1D1]/60 border-[#2A2A2E]'
            }`}
          >
            ±0.15mm Tolerances
          </button>

          {onExpand && (
            <button
              onClick={onExpand}
              title={isExpanded ? 'Restore Viewport Grid' : 'Maximize Viewport'}
              className="p-1 text-[#D1D1D1]/60 hover:text-white bg-[#1E1E20] border border-[#2A2A2E] rounded transition"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Cross Section SVG Stage */}
      <div className="relative flex-1 bg-[#101012] flex items-center justify-center p-2 overflow-hidden">
        {/* Technical Callout Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none font-mono text-[10px]">
          <div className="bg-[#141416]/90 border border-[#2A2A2E] px-2 py-1 rounded text-[#D1D1D1] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]" />
            Glaze Surface: <span className="text-white capitalize font-bold">{finish.glaze_type}</span> (0.4mm Vitreous Enamel)
          </div>
          <div className="bg-[#141416]/90 border border-[#2A2A2E] px-2 py-1 rounded text-[#D1D1D1] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
            Porcelain Core: High-density Sintered Ceramic (~2.4 g/cm³)
          </div>
        </div>

        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full max-h-[300px]"
        >
          {/* Engineering CAD Grid lines */}
          <defs>
            <pattern id="cross-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
            </pattern>
            {/* Ceramic Body Hatching */}
            <pattern id="ceramic-hatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="10" stroke="#475569" strokeWidth="0.8" opacity="0.6" />
            </pattern>
            {/* Dovetail Adhesive Undercut Hatching */}
            <pattern id="dovetail-hatch" width="8" height="8" patternTransform="rotate(-45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#3b82f6" strokeWidth="0.6" opacity="0.4" />
            </pattern>
          </defs>

          <rect x="0" y="0" width={svgWidth} height={svgHeight} fill="url(#cross-grid)" />

          {/* Datum Baseline Ground / Thinset Mortar Bed */}
          <line x1="20" y1={bottomY} x2={svgWidth - 20} y2={bottomY} stroke="#334155" strokeWidth="1.5" strokeDasharray="4,4" />
          <text x={svgWidth - 90} y={bottomY + 14} fill="#64748b" fontSize="9" fontFamily="monospace">
            DATUM BED LEVEL
          </text>

          {/* Main Tile Sintered Porcelain Body Solid */}
          {edgeProfile === 'rectified_90' && (
            <rect
              x={leftEdgeX}
              y={topY}
              width={tileVisualWidthPx}
              height={tileVisualThicknessPx}
              fill="#1e293b"
              stroke="#94a3b8"
              strokeWidth="2"
            />
          )}

          {edgeProfile === 'chamfer_45' && (
            <polygon
              points={`
                ${leftEdgeX + chamferWidth * scale},${topY}
                ${rightEdgeX - chamferWidth * scale},${topY}
                ${rightEdgeX},${topY + chamferWidth * scale}
                ${rightEdgeX},${bottomY}
                ${leftEdgeX},${bottomY}
                ${leftEdgeX},${topY + chamferWidth * scale}
              `}
              fill="#1e293b"
              stroke="#94a3b8"
              strokeWidth="2"
            />
          )}

          {edgeProfile === 'cushion_bullnose' && (
            <rect
              x={leftEdgeX}
              y={topY}
              width={tileVisualWidthPx}
              height={tileVisualThicknessPx}
              rx="8"
              fill="#1e293b"
              stroke="#94a3b8"
              strokeWidth="2"
            />
          )}

          {/* Hatching overlay for ceramic core */}
          <rect
            x={leftEdgeX}
            y={topY}
            width={tileVisualWidthPx}
            height={tileVisualThicknessPx}
            fill="url(#ceramic-hatch)"
            pointerEvents="none"
          />

          {/* Top Glaze Enamel Coating Layer (0.4mm) */}
          <path
            d={`M ${leftEdgeX} ${topY} L ${rightEdgeX} ${topY}`}
            stroke={color.primary_hex}
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Top Bas-Relief / Inlay Extrusion Section */}
          {productionMode === '3d_mold_relief' && relief > 0 && (
            <g>
              <rect
                x={leftEdgeX + 40}
                y={topY - reliefPx}
                width={tileVisualWidthPx - 80}
                height={reliefPx}
                fill={color.primary_hex}
                stroke="#38bdf8"
                strokeWidth="1.5"
              />
              <text
                x={leftEdgeX + 48}
                y={topY - reliefPx / 2 + 3}
                fill="#38bdf8"
                fontSize="9"
                fontFamily="monospace"
              >
                RELIEF +{relief.toFixed(1)}mm
              </text>
            </g>
          )}

          {/* Inlay Waterjet Pocket (Recessed cavity with metallic brass insert) */}
          {productionMode === 'waterjet_inlay' && (
            <g>
              <rect
                x={leftEdgeX + 70}
                y={topY}
                width={80}
                height={reliefPx}
                fill="#d4af37"
                stroke="#eab308"
                strokeWidth="1.5"
              />
              <text
                x={leftEdgeX + 76}
                y={topY + reliefPx / 2 + 3}
                fill="#0f172a"
                fontSize="9"
                fontWeight="bold"
                fontFamily="monospace"
              >
                BRASS INLAY
              </text>
            </g>
          )}

          {/* Back Underside Waffle Recessed Dovetail Grooves (Mortar keys) */}
          <g>
            {[0, 1, 2].map((idx) => {
              const grooveX = leftEdgeX + 40 + idx * 95;
              const grooveWidth = 35;
              const grooveDepth = 1.8 * scale;
              return (
                <polygon
                  key={idx}
                  points={`
                    ${grooveX},${bottomY}
                    ${grooveX + 4},${bottomY - grooveDepth}
                    ${grooveX + grooveWidth - 4},${bottomY - grooveDepth}
                    ${grooveX + grooveWidth},${bottomY}
                  `}
                  fill="#0f172a"
                  stroke="#3b82f6"
                  strokeWidth="1"
                />
              );
            })}
          </g>

          {/* Dimension Arrows & Callouts */}
          {/* Thickness Dimension line on the left */}
          <g>
            <line x1={leftEdgeX - 25} y1={topY} x2={leftEdgeX - 25} y2={bottomY} stroke="#38bdf8" strokeWidth="1.2" />
            <line x1={leftEdgeX - 32} y1={topY} x2={leftEdgeX - 18} y2={topY} stroke="#38bdf8" strokeWidth="1" />
            <line x1={leftEdgeX - 32} y1={bottomY} x2={leftEdgeX - 18} y2={bottomY} stroke="#38bdf8" strokeWidth="1" />
            {/* Arrows */}
            <polygon points={`${leftEdgeX - 25},${topY} ${leftEdgeX - 28},${topY + 6} ${leftEdgeX - 22},${topY + 6}`} fill="#38bdf8" />
            <polygon points={`${leftEdgeX - 25},${bottomY} ${leftEdgeX - 28},${bottomY - 6} ${leftEdgeX - 22},${bottomY - 6}`} fill="#38bdf8" />

            <text
              x={leftEdgeX - 32}
              y={topY + tileVisualThicknessPx / 2 + 4}
              fill="#38bdf8"
              fontSize="11"
              fontWeight="bold"
              fontFamily="monospace"
              textAnchor="end"
            >
              {thickness.toFixed(1)} mm
            </text>
            {showTolerance && (
              <text
                x={leftEdgeX - 32}
                y={topY + tileVisualThicknessPx / 2 + 15}
                fill="#94a3b8"
                fontSize="8"
                fontFamily="monospace"
                textAnchor="end"
              >
                ±0.12mm
              </text>
            )}
          </g>

          {/* Chamfer Callout */}
          {edgeProfile === 'chamfer_45' && (
            <g>
              <line x1={leftEdgeX + 4} y1={topY + 4} x2={leftEdgeX - 10} y2={topY - 18} stroke="#e2e8f0" strokeWidth="1" />
              <text x={leftEdgeX - 14} y={topY - 22} fill="#e2e8f0" fontSize="9" fontFamily="monospace">
                45° Chamfer ({chamferWidth.toFixed(1)}mm)
              </text>
            </g>
          )}

          {/* Dovetail Groove Callout */}
          <g>
            <line x1={leftEdgeX + 55} y1={bottomY - 6} x2={leftEdgeX + 55} y2={bottomY + 30} stroke="#3b82f6" strokeWidth="1" />
            <text x={leftEdgeX + 60} y={bottomY + 32} fill="#60a5fa" fontSize="9" fontFamily="monospace">
              Dovetail Mortar Groove (1.8mm depth)
            </text>
          </g>
        </svg>
      </div>

      {/* Bottom Cross-Section Info */}
      <div className="px-3 py-1.5 bg-[#141416] border-t border-[#2A2A2E] text-[10px] flex items-center justify-between text-[#D1D1D1]/60 font-mono">
        <div className="flex items-center gap-2">
          <span className="text-[#D1D1D1]">Edge Quality:</span>
          <span className="text-emerald-400 font-semibold">ISO 10545-2 Rectification Compliant</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Water Absorption: &lt;0.05% (BIa Grade)</span>
          <span>Modulus of Rupture: &gt;52 N/mm²</span>
        </div>
      </div>
    </div>
  );
};
