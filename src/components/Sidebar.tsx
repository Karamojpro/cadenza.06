import React, { useRef } from 'react';
import { useTileStore } from '../store/useTileStore';
import { GlazeType, ArchitecturalArchetype } from '../types';
import {
  Palette,
  Sparkles,
  Package,
  Code2,
  Square,
  Footprints,
  Boxes,
  SplitSquareVertical,
  Columns,
  Cpu,
  Send,
} from 'lucide-react';

interface SidebarProps {
  onOpenBundleModal: () => void;
  onOpenAgentModal: () => void;
  onOpenFactoryModal: () => void;
  onOpenPythonModal: () => void;
}

import { LayersPanel } from './workspace/LayersPanel';

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenBundleModal,
  onOpenAgentModal,
  onOpenFactoryModal,
  onOpenPythonModal,
}) => {
  const {
    dimensions,
    setDimensions,
    activeArchetype,
    setArchetype,
    stairParams,
    updateStairParams,
    wallPanelParams,
    updateWallPanelParams,
    moldingParams,
    updateMoldingParams,
    slabParams,
    updateSlabParams,
    finish,
    setFinish,
    color,
    setPrimaryColor,
    setSecondaryColor,
    referenceAssets,
    setAiPrompt,
    toggleMaterialDrawer,
    activePassport,
  } = useTileStore();

  const archetypeList: Array<{ id: ArchitecturalArchetype; label: string; icon: any }> = [
    { id: 'flat_tile', label: 'Flat Tile', icon: Square },
    { id: 'stair_tread', label: 'Stair', icon: Footprints },
    { id: '3d_wall_panel', label: '3D Relief', icon: Boxes },
    { id: 'skirting_molding', label: 'Molding', icon: SplitSquareVertical },
    { id: 'countertop_slab', label: 'Jumbo Slab', icon: Columns },
  ];

  return (
    <aside
      id="cad-control-sidebar"
      className="w-80 md:w-96 flex flex-col h-full bg-[#141416] border-r border-[#2A2A2E] select-none overflow-y-auto text-[#D1D1D1] shadow-2xl text-xs custom-scrollbar"
    >
      {/* Brand Header */}
      <div className="p-3.5 bg-[#141416] border-b border-[#2A2A2E] flex items-center justify-between sticky top-0 z-30 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-sm bg-[#00F0FF] flex items-center justify-center shadow-sm shadow-[#00F0FF]/30 text-black font-bold text-xs tracking-tighter">
            SC
          </div>
          <div>
            <h1 className="text-xs font-bold tracking-tight text-white uppercase flex items-center gap-1.5">
              ARCHITECTURAL CERAMICS
              <span className="text-[9px] px-1.5 py-0.2 bg-[#1E1E20] text-[#00F0FF] border border-[#2A2A2E] rounded font-mono font-normal">
                v2.6
              </span>
            </h1>
            <p className="text-[10px] text-[#D1D1D1]/60 font-mono">SPEC: ISO 13006 & EN 14411</p>
          </div>
        </div>

        {/* Material Library Quick Trigger */}
        <button
          onClick={toggleMaterialDrawer}
          className="flex items-center gap-1 px-2 py-1 bg-[#1E1E22] hover:bg-[#282830] text-[#D4AF37] border border-[#D4AF37]/30 rounded text-[9px] font-mono font-bold uppercase transition"
        >
          <Palette className="w-3 h-3" />
          <span>Glazes</span>
        </button>
      </div>

      <div className="p-3.5 space-y-4">
        {/* 0. Architectural Product Archetype Selector */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[9px] font-bold text-[#00F0FF] uppercase tracking-[0.2em] block">
              Architectural Archetype
            </label>
            <span className="text-[9px] font-mono text-[#888890] capitalize">
              {activeArchetype.replace('_', ' ')}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1 bg-[#1E1E20] p-1 rounded border border-[#2A2A2E]">
            {archetypeList.map((item) => {
              const IconComp = item.icon;
              const isActive = activeArchetype === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setArchetype(item.id)}
                  className={`p-1.5 rounded-sm flex flex-col items-center gap-1 text-center transition ${
                    isActive
                      ? 'bg-[#00F0FF] text-black font-bold shadow-sm'
                      : 'text-[#D1D1D1]/70 hover:text-white hover:bg-[#2A2A2E]'
                  }`}
                  title={item.label}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span className="text-[9px] leading-tight truncate w-full">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Minimal real layers panel (Phase 2) — visibility, lock, drag-reorder */}
        <LayersPanel />

        {/* 1. Contextual Archetype Parametric Controls */}
        {activeArchetype === 'flat_tile' && (
          <div className="space-y-3 bg-[#1E1E20]/50 p-3 rounded border border-[#2A2A2E]">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-bold text-[#00F0FF] uppercase tracking-[0.2em] block">
                Tile Dimensions
              </label>
              <span className="text-[10px] font-mono text-[#D1D1D1]/60">ISO Format</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-[#D1D1D1]/70">Width (X)</span>
                  <span className="font-mono text-white font-bold">{dimensions.width_mm} mm</span>
                </div>
                <input
                  type="range"
                  min="300"
                  max="1200"
                  step="50"
                  value={dimensions.width_mm}
                  onChange={(e) => setDimensions({ width_mm: Number(e.target.value) })}
                  className="w-full h-1 bg-[#141416] rounded-lg appearance-none cursor-pointer accent-[#00F0FF]"
                />
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-[#D1D1D1]/70">Height (Y)</span>
                  <span className="font-mono text-white font-bold">{dimensions.height_mm} mm</span>
                </div>
                <input
                  type="range"
                  min="300"
                  max="1200"
                  step="50"
                  value={dimensions.height_mm}
                  onChange={(e) => setDimensions({ height_mm: Number(e.target.value) })}
                  className="w-full h-1 bg-[#141416] rounded-lg appearance-none cursor-pointer accent-[#00F0FF]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-[#D1D1D1]/70">Thickness (Z)</span>
                  <span className="font-mono text-white font-bold">{dimensions.thickness_mm} mm</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="20"
                  step="1"
                  value={dimensions.thickness_mm}
                  onChange={(e) => setDimensions({ thickness_mm: Number(e.target.value) })}
                  className="w-full h-1 bg-[#141416] rounded-lg appearance-none cursor-pointer accent-[#00F0FF]"
                />
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-[#D1D1D1]/70">Relief Depth</span>
                  <span className="font-mono text-white font-bold">{dimensions.relief_depth_mm} mm</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="6"
                  step="0.5"
                  value={dimensions.relief_depth_mm}
                  onChange={(e) => setDimensions({ relief_depth_mm: Number(e.target.value) })}
                  className="w-full h-1 bg-[#141416] rounded-lg appearance-none cursor-pointer accent-[#00F0FF]"
                />
              </div>
            </div>
          </div>
        )}

        {activeArchetype === 'stair_tread' && (
          <div className="bg-[#141416] border border-[#2A2A2E] p-3 rounded space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-bold text-[#00F0FF] uppercase tracking-[0.2em] block m-0">
                Stair Tread & Nosing
              </label>
              <span className="text-[9px] font-mono text-[#D4AF37]">MONOLITHIC</span>
            </div>

            {/* Tread Depth & Width */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-[#888890]">Tread Depth (mm)</span>
                <input
                  type="number"
                  value={stairParams.tread_depth_mm}
                  onChange={(e) => updateStairParams({ tread_depth_mm: Number(e.target.value) })}
                  className="w-full p-1.5 bg-[#1E1E20] border border-[#2A2A2E] rounded text-white font-mono text-xs"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-[#888890]">Apron Drop (mm)</span>
                <input
                  type="number"
                  value={stairParams.nosing_drop_mm}
                  onChange={(e) => updateStairParams({ nosing_drop_mm: Number(e.target.value) })}
                  className="w-full p-1.5 bg-[#1E1E20] border border-[#2A2A2E] rounded text-white font-mono text-xs"
                />
              </div>
            </div>

            {/* Nosing Profile Switcher */}
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-[#888890]">Nosing Profile</span>
              <div className="grid grid-cols-3 gap-1 bg-[#1E1E20] p-1 rounded border border-[#2A2A2E] text-[9px] font-mono">
                {(['mitre_45', 'bullnose', 'chamfer'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => updateStairParams({ nosing_type: type })}
                    className={`py-1 rounded uppercase ${
                      stairParams.nosing_type === type
                        ? 'bg-[#00F0FF] text-black font-bold'
                        : 'text-[#888890] hover:text-white'
                    }`}
                  >
                    {type.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Anti-Slip Friction Grooves */}
            <div className="bg-[#1E1E20] p-2.5 rounded border border-[#2A2A2E] space-y-2 text-[10px] font-mono">
              <div className="flex justify-between text-[#00F0FF] font-bold">
                <span>Anti-Slip Friction Grooves</span>
                <span>{stairParams.anti_slip_grooves.count} Channels</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-[#888890]">Count:</span>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={stairParams.anti_slip_grooves.count}
                  onChange={(e) =>
                    updateStairParams({
                      anti_slip_grooves: {
                        ...stairParams.anti_slip_grooves,
                        count: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-[#00F0FF] h-1 bg-[#141416] rounded"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-[9px] text-[#888890]">
                <div>Cut Depth: {stairParams.anti_slip_grooves.depth_mm}mm</div>
                <div>Pitch: {stairParams.anti_slip_grooves.pitch_mm}mm</div>
              </div>
            </div>
          </div>
        )}

        {activeArchetype === '3d_wall_panel' && (
          <div className="bg-[#141416] border border-[#2A2A2E] p-3 rounded space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-bold text-[#00F0FF] uppercase tracking-[0.2em] block m-0">
                3D Wall Cladding & Relief
              </label>
              <span className="text-[9px] font-mono text-[#D4AF37]">PRESS MOLD</span>
            </div>

            {/* Sculpt Pattern */}
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-[#888890]">Sculpt Motif Pattern</span>
              <select
                value={wallPanelParams.sculpt_pattern}
                onChange={(e) => updateWallPanelParams({ sculpt_pattern: e.target.value as any })}
                className="w-full p-1.5 bg-[#1E1E20] border border-[#2A2A2E] rounded text-white font-mono text-xs outline-none"
              >
                <option value="origami_wave">Origami Continuous Wave</option>
                <option value="fluted_column">Fluted Vertical Ribs</option>
                <option value="parabolic_facet">Parabolic Diamond Facets</option>
                <option value="hex_pyramid">Tessellated Hex Pyramids</option>
              </select>
            </div>

            {/* Relief Depth Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-[#888890]">Max Relief Depth</span>
                <span className="text-white font-bold">{wallPanelParams.relief_amplitude_mm} mm</span>
              </div>
              <input
                type="range"
                min="5"
                max="45"
                value={wallPanelParams.relief_amplitude_mm}
                onChange={(e) => updateWallPanelParams({ relief_amplitude_mm: Number(e.target.value) })}
                className="w-full accent-[#00F0FF] h-1.5 bg-[#1E1E20] rounded"
              />
            </div>

            {/* Demolding Draft Angle */}
            <div className="flex justify-between items-center text-[10px] font-mono bg-[#1E1E20] p-2 rounded border border-[#2A2A2E]">
              <span className="text-[#888890]">Mold Extraction Draft Angle:</span>
              <span className="text-emerald-400 font-bold">{wallPanelParams.draft_angle_deg}° Safe</span>
            </div>
          </div>
        )}

        {activeArchetype === 'skirting_molding' && (
          <div className="bg-[#141416] border border-[#2A2A2E] p-3 rounded space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-bold text-[#00F0FF] uppercase tracking-[0.2em] block m-0">
                Skirting & Molding Extrusion
              </label>
              <span className="text-[9px] font-mono text-[#D4AF37]">SWEPT B-REP</span>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-mono text-[#888890]">Profile Cross-Section</span>
              <select
                value={moldingParams.profile_type}
                onChange={(e) => updateMoldingParams({ profile_type: e.target.value as any })}
                className="w-full p-1.5 bg-[#1E1E20] border border-[#2A2A2E] rounded text-white font-mono text-xs outline-none"
              >
                <option value="modern_shadowline">Modern 5mm Shadowline</option>
                <option value="cove_base">Sanitary Cove Base Radius</option>
                <option value="ogee_classic">Classical Ogee S-Curve</option>
                <option value="quarter_round">Quarter Round Trim</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-[#888890]">Height (mm)</span>
                <input
                  type="number"
                  value={moldingParams.profile_height_mm}
                  onChange={(e) => updateMoldingParams({ profile_height_mm: Number(e.target.value) })}
                  className="w-full p-1.5 bg-[#1E1E20] border border-[#2A2A2E] rounded text-white font-mono text-xs"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-[#888890]">Length (mm)</span>
                <input
                  type="number"
                  value={moldingParams.length_mm}
                  onChange={(e) => updateMoldingParams({ length_mm: Number(e.target.value) })}
                  className="w-full p-1.5 bg-[#1E1E20] border border-[#2A2A2E] rounded text-white font-mono text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {activeArchetype === 'countertop_slab' && (
          <div className="bg-[#141416] border border-[#2A2A2E] p-3 rounded space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-bold text-[#00F0FF] uppercase tracking-[0.2em] block m-0">
                Jumbo Slab & Island Waterfall
              </label>
              <span className="text-[9px] font-mono text-[#00F0FF]">3200 × 1600mm</span>
            </div>

            {/* Waterfall Miter Drop */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-[#888890]">Waterfall Apron Drop</span>
                <span className="text-white font-bold">{slabParams.waterfall_drop_mm} mm</span>
              </div>
              <input
                type="range"
                min="400"
                max="1000"
                step="50"
                value={slabParams.waterfall_drop_mm}
                onChange={(e) => updateSlabParams({ waterfall_drop_mm: Number(e.target.value) })}
                className="w-full accent-[#00F0FF] h-1.5 bg-[#1E1E20] rounded"
              />
            </div>

            {/* Sink Cutout Controls */}
            <div className="bg-[#1E1E20] p-2.5 rounded border border-[#2A2A2E] space-y-2 text-[10px] font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[#D1D1D1] font-bold">Waterjet Sink Cutout</span>
                <input
                  type="checkbox"
                  checked={slabParams.sink_cutout.enabled}
                  onChange={(e) =>
                    updateSlabParams({
                      sink_cutout: { ...slabParams.sink_cutout, enabled: e.target.checked },
                    })
                  }
                  className="rounded accent-[#00F0FF]"
                />
              </div>
              {slabParams.sink_cutout.enabled && (
                <div className="grid grid-cols-2 gap-1.5 text-[9px] text-[#888890]">
                  <div>Size: 600 × 450 mm</div>
                  <div>Radius: 15mm (Stress safe)</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. Color & Pigment Engine */}
        <div className="bg-[#141416] border border-[#2A2A2E] p-3 rounded space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[9px] font-bold text-[#00F0FF] uppercase tracking-[0.2em] block m-0">
              Material Surface & Color
            </label>
            <span className="text-[9px] font-mono text-[#00F0FF] bg-[#1E1E20] px-1.5 py-0.5 border border-[#2A2A2E] rounded">N-Channel RIP</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Primary Sintered Color */}
            <div className="bg-[#1E1E20] p-2 border border-[#2A2A2E] rounded space-y-1">
              <div className="text-[8px] uppercase tracking-wider text-[#D1D1D1]/50">Primary Base</div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color.primary_hex}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-5 h-5 rounded-sm cursor-pointer border-0 bg-transparent"
                />
                <span className="font-mono text-white text-[11px] uppercase">{color.primary_hex}</span>
              </div>
            </div>

            {/* Secondary Inlay Color */}
            <div className="bg-[#1E1E20] p-2 border border-[#2A2A2E] rounded space-y-1">
              <div className="text-[8px] uppercase tracking-wider text-[#D1D1D1]/50">Secondary Inlay</div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color.secondary_hex}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-5 h-5 rounded-sm cursor-pointer border-0 bg-transparent"
                />
                <span className="font-mono text-white text-[11px] uppercase">{color.secondary_hex}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Surface Finish & PBR Glaze */}
        <div className="bg-[#141416] border border-[#2A2A2E] p-3 rounded space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[9px] font-bold text-[#00F0FF] uppercase tracking-[0.2em] block m-0">
              Vitrified Glaze & Optical PBR
            </label>
            <span className="text-[9px] font-mono text-[#D4AF37] uppercase font-bold">{finish.glaze_type}</span>
          </div>

          <div className="grid grid-cols-4 gap-1 bg-[#1E1E20] p-1 rounded border border-[#2A2A2E]">
            {(['matte', 'satin', 'gloss', 'luster'] as GlazeType[]).map((g) => (
              <button
                key={g}
                onClick={() => setFinish({ glaze_type: g })}
                className={`py-1 rounded text-[10px] font-mono uppercase transition ${
                  finish.glaze_type === g
                    ? 'bg-[#D4AF37] text-black font-bold'
                    : 'text-[#D1D1D1]/70 hover:text-white'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-[#888890]">Micro-Roughness</span>
                <span className="text-white">{finish.roughness.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={finish.roughness}
                onChange={(e) => setFinish({ roughness: Number(e.target.value) })}
                className="w-full accent-[#00F0FF] h-1.5 bg-[#1E1E20] rounded"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-[#888890]">Metallic Inclusions</span>
                <span className="text-white">{finish.metallic.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={finish.metallic}
                onChange={(e) => setFinish({ metallic: Number(e.target.value) })}
                className="w-full accent-[#00F0FF] h-1.5 bg-[#1E1E20] rounded"
              />
            </div>
          </div>
        </div>

        {/* 4. AI Concept Prompt */}
        <div className="p-3 border border-[#2A2A2E] rounded bg-[#0D0D0F] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="text-[10px] text-white font-bold uppercase tracking-wider">AI Concept & Prompt</div>
            <Sparkles className="w-3.5 h-3.5 text-[#00F0FF]" />
          </div>

          <textarea
            value={referenceAssets.ai_prompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            rows={2}
            placeholder="Describe tile texture, 3D relief, veins..."
            className="w-full p-2 bg-[#1E1E20] border border-[#2A2A2E] rounded text-[#D1D1D1] text-[11px] outline-none focus:border-[#00F0FF] resize-none font-sans"
          />
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-3 bg-[#141416] border-t border-[#2A2A2E] space-y-2 mt-auto">
        <button
          onClick={onOpenBundleModal}
          className="w-full py-2 bg-[#00F0FF] hover:bg-[#00D0DF] text-black font-bold rounded text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-[#00F0FF]/15 transition"
        >
          <Package className="w-4 h-4" />
          <span>Production Bundle (.ZIP)</span>
        </button>

        <button
          onClick={onOpenPythonModal}
          className="w-full py-1.5 bg-[#1E1E20] hover:bg-[#2A2A2E] text-[#D1D1D1] rounded text-[10px] font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 transition border border-[#2A2A2E]"
        >
          <Code2 className="w-3.5 h-3.5 text-[#00F0FF]" />
          <span>CadQuery & FastAPI Kernel</span>
        </button>
      </div>
    </aside>
  );
};
