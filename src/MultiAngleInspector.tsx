import React, { useState } from 'react';
import { useTileStore } from '../store/useTileStore';
import { Canvas2D } from './Canvas2D';
import { Viewport3D } from './Viewport3D';
import { SideProfileView } from './SideProfileView';
import { BackWaffleView } from './BackWaffleView';
import {
  LayoutGrid,
  Square,
  Box,
  Spline,
  Layers,
  Sparkles,
  ShieldCheck,
  Maximize2,
  Minimize2,
} from 'lucide-react';

export const MultiAngleInspector: React.FC = () => {
  const {
    viewportMode,
    setViewportMode,
    expandedViewport,
    setExpandedViewport,
    toggleExpandedViewport,
  } = useTileStore();

  const toggleExpand = (vpName: 'vp1' | 'vp2' | 'vp3' | 'vp4') => {
    toggleExpandedViewport(vpName);
  };

  return (
    <div id="multi-angle-inspector" className="flex-1 flex flex-col h-full bg-[#0A0A0B] p-2 gap-2 overflow-hidden">
      {/* Inspector Top Viewport Switcher Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#121214] border border-[#242428] rounded text-xs shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-[#00F0FF] uppercase tracking-wider flex items-center gap-1.5">
            <LayoutGrid className="w-3.5 h-3.5 text-[#00F0FF]" />
            Viewport Canvas
          </span>
          <span className="text-[#2E2E34]">|</span>
          <span className="text-[#888890] text-[10px] font-mono">Real-time CAD/CAM Synchronized</span>
        </div>

        {/* Streamlined Segment Control: [ 2D Vector | 3D Orbit | Side Profile | Waffle Grid | 4-Quad ] */}
        <div className="flex items-center bg-[#18181B] rounded p-0.5 border border-[#28282E]">
          <button
            id="btn-segment-2d-vector"
            onClick={() => setExpandedViewport('vp1')}
            className={`px-2.5 py-1 rounded-sm transition text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
              expandedViewport === 'vp1'
                ? 'bg-[#00F0FF] text-black shadow-sm'
                : 'text-[#A0A0A8] hover:text-white'
            }`}
          >
            2D Vector
          </button>
          <button
            id="btn-segment-3d-orbit"
            onClick={() => setExpandedViewport('vp2')}
            className={`px-2.5 py-1 rounded-sm transition text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
              expandedViewport === 'vp2'
                ? 'bg-[#00F0FF] text-black shadow-sm'
                : 'text-[#A0A0A8] hover:text-white'
            }`}
          >
            3D Orbit
          </button>
          <button
            id="btn-segment-side-profile"
            onClick={() => setExpandedViewport('vp3')}
            className={`px-2.5 py-1 rounded-sm transition text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
              expandedViewport === 'vp3'
                ? 'bg-[#00F0FF] text-black shadow-sm'
                : 'text-[#A0A0A8] hover:text-white'
            }`}
          >
            Side Profile
          </button>
          <button
            id="btn-segment-waffle-grid"
            onClick={() => setExpandedViewport('vp4')}
            className={`px-2.5 py-1 rounded-sm transition text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
              expandedViewport === 'vp4'
                ? 'bg-[#00F0FF] text-black shadow-sm'
                : 'text-[#A0A0A8] hover:text-white'
            }`}
          >
            Waffle Grid
          </button>
          <div className="w-[1px] h-3 bg-[#28282E] mx-0.5" />
          <button
            id="btn-segment-4-quad"
            onClick={() => {
              setExpandedViewport(null);
              setViewportMode('quad');
            }}
            className={`px-2.5 py-1 rounded-sm flex items-center gap-1.5 transition text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
              expandedViewport === null
                ? 'bg-[#00F0FF] text-black shadow-sm'
                : 'text-[#A0A0A8] hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3 h-3" />
            4-Quad
          </button>
        </div>
      </div>

      {/* Grid or Single Expanded Viewport Container */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {expandedViewport === null ? (
          /* 4-Quadrant Split Layout (2x2 Grid with 1px geometric borders) */
          <div className="grid grid-cols-1 md:grid-cols-2 grid-rows-2 h-full gap-[1px] bg-[#2A2A2E] p-[1px] rounded overflow-hidden">
            {/* Quadrant 1: 2D Front Vector Drawing Stage */}
            <div className="h-full min-h-0 bg-[#1A1A1C]">
              <Canvas2D onExpand={() => toggleExpand('vp1')} isExpanded={false} />
            </div>

            {/* Quadrant 2: 3D Real-time PBR Orbit Stage */}
            <div className="h-full min-h-0 bg-[#1A1A1C]">
              <Viewport3D onExpand={() => toggleExpand('vp2')} isExpanded={false} />
            </div>

            {/* Quadrant 3: Side Cross-Section CAD Stage */}
            <div className="h-full min-h-0 bg-[#1A1A1C]">
              <SideProfileView onExpand={() => toggleExpand('vp3')} isExpanded={false} />
            </div>

            {/* Quadrant 4: Back Underside Waffle Matrix Stage */}
            <div className="h-full min-h-0 bg-[#1A1A1C]">
              <BackWaffleView onExpand={() => toggleExpand('vp4')} isExpanded={false} />
            </div>
          </div>
        ) : (
          /* Single Expanded Viewport */
          <div className="h-full w-full bg-[#1A1A1C] border border-[#2A2A2E] rounded overflow-hidden">
            {expandedViewport === 'vp1' && (
              <Canvas2D onExpand={() => toggleExpand('vp1')} isExpanded={true} />
            )}
            {expandedViewport === 'vp2' && (
              <Viewport3D onExpand={() => toggleExpand('vp2')} isExpanded={true} />
            )}
            {expandedViewport === 'vp3' && (
              <SideProfileView onExpand={() => toggleExpand('vp3')} isExpanded={true} />
            )}
            {expandedViewport === 'vp4' && (
              <BackWaffleView onExpand={() => toggleExpand('vp4')} isExpanded={true} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
