import React, { useState, useMemo } from 'react';
import { useTileStore } from '../store/useTileStore';
import { CURATED_CERAMIC_MATERIALS } from '../data/materialPresets';
import { CeramicMaterialPreset, GlazeType } from '../types';
import {
  X,
  Sparkles,
  Search,
  Check,
  Flame,
  Layers,
  ShieldCheck,
  Eye,
  Sliders,
  ChevronRight,
  Palette,
  ArrowRight,
  Info,
} from 'lucide-react';

interface MaterialLibraryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MaterialLibraryDrawer: React.FC<MaterialLibraryDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    finish,
    color,
    setFinish,
    setPrimaryColor,
    setSecondaryColor,
    setAccentColor,
    setAiPrompt,
    activeArchetype,
    setArchetype,
  } = useTileStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGlaze, setSelectedGlaze] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewMaterial, setPreviewMaterial] = useState<CeramicMaterialPreset>(CURATED_CERAMIC_MATERIALS[0]);
  const [appliedToast, setAppliedToast] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Formulations' },
    { id: 'marble', label: 'Marble & Vitrified' },
    { id: 'majolica', label: 'Majolica & Glaze' },
    { id: 'stone', label: 'Architectural Stone' },
    { id: 'terrazzo', label: 'Venetian Terrazzo' },
    { id: 'metal_oxide', label: 'Metal & Oxide' },
    { id: 'terracotta', label: 'Cotto & Clay' },
  ];

  const glazes: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All Glazes' },
    { id: 'gloss', label: 'Gloss Vitrified' },
    { id: 'satin', label: 'Honed Satin' },
    { id: 'luster', label: 'Luster Sheen' },
    { id: 'matte', label: 'Matte R11' },
  ];

  const filteredMaterials = useMemo(() => {
    return CURATED_CERAMIC_MATERIALS.filter((mat) => {
      const matchCat = selectedCategory === 'all' || mat.category === selectedCategory;
      const matchGlaze = selectedGlaze === 'all' || mat.glaze_type === selectedGlaze;
      const matchQuery =
        !searchQuery.trim() ||
        mat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mat.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mat.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        mat.pigments.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchCat && matchGlaze && matchQuery;
    });
  }, [selectedCategory, selectedGlaze, searchQuery]);

  const handleApplyMaterial = (mat: CeramicMaterialPreset, switchArchetype: boolean = false) => {
    setFinish(mat.finish);
    setPrimaryColor(mat.primary_hex);
    setSecondaryColor(mat.secondary_hex);
    setAccentColor(mat.accent_hex);
    setAiPrompt(mat.ai_prompt);

    if (switchArchetype && mat.recommended_archetype) {
      setArchetype(mat.recommended_archetype);
    }

    setAppliedToast(`Applied "${mat.name}" to 3D Scene`);
    setTimeout(() => setAppliedToast(null), 3000);
  };

  if (!isOpen) return null;

  return (
    <div
      id="material-library-drawer-modal"
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#121214] border-l border-[#242428] h-full flex flex-col shadow-2xl text-[#D1D1D1] animate-in slide-in-from-right duration-300 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 bg-[#161619] border-b border-[#242428] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-[#00F0FF]/20 to-[#D4AF37]/20 border border-[#00F0FF]/40 flex items-center justify-center text-[#00F0FF]">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
                Physical Ceramic Material Library
                <span className="text-[9px] px-1.5 py-0.5 bg-[#1F1F24] text-[#00F0FF] border border-[#2A2A2E] rounded font-mono">
                  PBR SHADER SYNC
                </span>
              </h2>
              <p className="text-[11px] text-[#888890] font-mono">
                Curated porcelain glazes, mineral pigments & slip ratings
              </p>
            </div>
          </div>

          <button
            id="btn-close-material-drawer"
            onClick={onClose}
            className="p-1.5 text-[#888890] hover:text-white hover:bg-[#242428] rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Applied Notification Toast */}
        {appliedToast && (
          <div className="bg-emerald-950/80 border-b border-emerald-500/40 text-emerald-200 px-4 py-2 text-xs font-mono flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{appliedToast}</span>
            </div>
            <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">
              Active in Viewport
            </span>
          </div>
        )}

        {/* Search & Filtering Controls */}
        <div className="p-4 bg-[#161619]/60 border-b border-[#242428] space-y-3 shrink-0">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#888890]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by mineral, marble, glaze type, slip rating (e.g. Statuario, R10, Cobalt)..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#1C1C20] border border-[#2A2A2E] rounded text-xs text-white placeholder-[#707078] outline-none focus:border-[#00F0FF] font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-[#707078] hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-[10px]">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-sm whitespace-nowrap transition font-mono ${
                  selectedCategory === cat.id
                    ? 'bg-[#00F0FF] text-black font-bold'
                    : 'bg-[#1C1C20] text-[#9E9EA6] hover:text-white hover:bg-[#26262B] border border-[#242428]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Glaze Type Sub-Filter */}
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-[#888890]">
            <span className="uppercase tracking-wider">Finish:</span>
            {glazes.map((glz) => (
              <button
                key={glz.id}
                onClick={() => setSelectedGlaze(glz.id)}
                className={`px-2 py-0.5 rounded transition ${
                  selectedGlaze === glz.id
                    ? 'bg-[#D4AF37] text-black font-bold'
                    : 'bg-[#18181B] text-[#888890] hover:text-white'
                }`}
              >
                {glz.label}
              </button>
            ))}
          </div>
        </div>

        {/* Two-Column Explorer & Deep Inspector */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#242428] overflow-hidden">
          {/* Left Column: Material Grid */}
          <div className="p-3 overflow-y-auto space-y-2.5 custom-scrollbar">
            <div className="flex items-center justify-between text-[10px] text-[#888890] font-mono mb-1">
              <span>{filteredMaterials.length} MATERIALS FOUND</span>
              <span>CLICK TO INSPECT</span>
            </div>

            {filteredMaterials.map((mat) => {
              const isSelected = previewMaterial.id === mat.id;
              const isActiveInScene =
                color.primary_hex.toLowerCase() === mat.primary_hex.toLowerCase() &&
                finish.glaze_type === mat.glaze_type;

              return (
                <div
                  key={mat.id}
                  onClick={() => setPreviewMaterial(mat)}
                  className={`p-3 rounded border transition cursor-pointer flex flex-col gap-2 ${
                    isSelected
                      ? 'bg-[#1D1D22] border-[#00F0FF] shadow-md shadow-[#00F0FF]/10'
                      : 'bg-[#161619] border-[#242428] hover:border-[#383840] hover:bg-[#1A1A1E]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      {/* Visual Swatch Pill */}
                      <div
                        className="w-7 h-7 rounded border border-white/20 shadow-inner flex items-center justify-center shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${mat.primary_hex} 0%, ${mat.primary_hex} 60%, ${mat.secondary_hex} 100%)`,
                        }}
                      >
                        {mat.finish.metallic > 0.3 && (
                          <div className="w-2.5 h-2.5 rounded-full bg-white/40 blur-[1px]"></div>
                        )}
                      </div>

                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          {mat.name}
                          {isActiveInScene && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#888890] font-mono capitalize">
                          {mat.category} • {mat.glaze_type} finish
                        </div>
                      </div>
                    </div>

                    <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#1F1F24] text-[#D4AF37] border border-[#2E2E35] rounded">
                      {mat.slip_resistance_rating.split(' ')[0]}
                    </span>
                  </div>

                  <p className="text-[10px] text-[#A0A0A8] line-clamp-2 leading-relaxed">
                    {mat.description}
                  </p>

                  <div className="flex items-center justify-between text-[9px] font-mono pt-1 border-t border-[#242428]/60 text-[#888890]">
                    <div className="flex items-center gap-1">
                      <Flame className="w-2.5 h-2.5 text-amber-400" />
                      <span>{mat.firing_temp_celsius}°C Sintered</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApplyMaterial(mat);
                      }}
                      className="px-2 py-0.5 bg-[#202026] hover:bg-[#00F0FF] hover:text-black text-[#D1D1D1] rounded transition font-bold uppercase tracking-wider text-[8px]"
                    >
                      Quick Apply
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredMaterials.length === 0 && (
              <div className="p-8 text-center text-[#707078] text-xs font-mono space-y-2">
                <p>No materials match the selected filters.</p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedGlaze('all');
                    setSearchQuery('');
                  }}
                  className="text-[#00F0FF] underline hover:text-white"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Physical PBR Spec & Deep Shader Inspector */}
          <div className="p-4 bg-[#141416] overflow-y-auto space-y-4 custom-scrollbar flex flex-col justify-between">
            <div className="space-y-3.5">
              {/* Selected Material Header */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono uppercase text-[#00F0FF] tracking-widest">
                    PBR Specimen Card
                  </span>
                  <span className="text-[9px] font-mono text-[#D4AF37] bg-[#1E1E22] px-2 py-0.5 rounded border border-[#2E2E35]">
                    {previewMaterial.slip_resistance_rating}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {previewMaterial.name}
                </h3>
                <p className="text-xs text-[#9E9EA6] leading-relaxed">
                  {previewMaterial.description}
                </p>
              </div>

              {/* Large Procedural Swatch Visualizer */}
              <div
                className="w-full h-24 rounded border border-[#2E2E35] relative overflow-hidden shadow-inner flex items-end p-2.5"
                style={{
                  background: `linear-gradient(135deg, ${previewMaterial.primary_hex} 0%, ${previewMaterial.primary_hex} 55%, ${previewMaterial.secondary_hex} 90%, ${previewMaterial.accent_hex} 100%)`,
                }}
              >
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur text-[9px] font-mono text-white border border-white/20">
                  {previewMaterial.pantone_code}
                </div>
                <div className="text-[10px] font-mono text-black/80 bg-white/90 backdrop-blur px-2 py-0.5 rounded font-bold uppercase shadow-sm">
                  {previewMaterial.glaze_type} Glaze Formula
                </div>
              </div>

              {/* PBR Physical Slider Meters */}
              <div className="bg-[#18181B] p-3 rounded border border-[#242428] space-y-2 text-[10px] font-mono">
                <div className="text-[9px] text-[#888890] uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Physical Optical Attributes</span>
                  <span>IOR: 1.54</span>
                </div>

                {/* Roughness Meter */}
                <div>
                  <div className="flex justify-between text-[#B0B0B8]">
                    <span>Surface Micro-Roughness:</span>
                    <span className="text-white font-bold">{previewMaterial.finish.roughness.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-[#242428] h-1.5 rounded overflow-hidden mt-0.5">
                    <div
                      className="bg-[#00F0FF] h-full rounded"
                      style={{ width: `${previewMaterial.finish.roughness * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Metallic Sheen */}
                <div>
                  <div className="flex justify-between text-[#B0B0B8]">
                    <span>Metallic / Mineral Inclusions:</span>
                    <span className="text-white font-bold">{previewMaterial.finish.metallic.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-[#242428] h-1.5 rounded overflow-hidden mt-0.5">
                    <div
                      className="bg-[#D4AF37] h-full rounded"
                      style={{ width: `${previewMaterial.finish.metallic * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Luster & Clearcoat */}
                <div>
                  <div className="flex justify-between text-[#B0B0B8]">
                    <span>Vitreous Luster Sheen:</span>
                    <span className="text-white font-bold">
                      {previewMaterial.finish.luster_sheen.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-[#242428] h-1.5 rounded overflow-hidden mt-0.5">
                    <div
                      className="bg-emerald-400 h-full rounded"
                      style={{ width: `${previewMaterial.finish.luster_sheen * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Pigment Chemistry & Frit Composition */}
              <div className="bg-[#18181B] p-3 rounded border border-[#242428] space-y-1.5 text-[10px] font-mono">
                <div className="text-[9px] text-[#888890] uppercase tracking-wider">
                  Pigment Formulation & Frits
                </div>
                <div className="flex flex-wrap gap-1">
                  {previewMaterial.pigments.map((pigment, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-[#202026] text-[#D1D1D1] rounded border border-[#2A2A30] text-[9px]"
                    >
                      {pigment}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recommended Architectural Archetype */}
              <div className="bg-[#18181B] p-3 rounded border border-[#242428] flex items-center justify-between text-[10px] font-mono">
                <div>
                  <div className="text-[8px] text-[#888890] uppercase tracking-wider">
                    Recommended Form
                  </div>
                  <div className="text-white font-bold capitalize">
                    {previewMaterial.recommended_archetype.replace('_', ' ')}
                  </div>
                </div>
                <button
                  onClick={() => setArchetype(previewMaterial.recommended_archetype)}
                  className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition ${
                    activeArchetype === previewMaterial.recommended_archetype
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-[#242428] hover:bg-[#2E2E36] text-[#D1D1D1]'
                  }`}
                >
                  {activeArchetype === previewMaterial.recommended_archetype
                    ? 'Active'
                    : 'Switch Form'}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-[#242428] space-y-2 shrink-0">
              <button
                id="btn-apply-material-to-scene"
                onClick={() => handleApplyMaterial(previewMaterial, false)}
                className="w-full py-2.5 bg-[#00F0FF] hover:bg-[#00D0DF] text-black font-bold rounded text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#00F0FF]/20 transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Apply To 3D Viewport & Shaders</span>
              </button>

              <button
                onClick={() => {
                  handleApplyMaterial(previewMaterial, true);
                  onClose();
                }}
                className="w-full py-1.5 bg-[#1E1E22] hover:bg-[#26262C] text-[#D1D1D1] rounded text-[10px] font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer border border-[#2E2E35]"
              >
                <span>Apply & Switch Archetype ({previewMaterial.recommended_archetype.replace('_', ' ')})</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
