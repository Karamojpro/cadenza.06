import React, { useState } from 'react';
import { useTileStore } from '../store/useTileStore';
import {
  Sparkles,
  Loader2,
  ChevronDown,
  Package,
  Send,
  Sliders,
  Settings,
  Terminal,
  Keyboard,
  PanelLeftClose,
  PanelLeftOpen,
  Wand2,
  CornerDownLeft,
  CheckCircle2,
  Cpu,
} from 'lucide-react';

interface TopHeaderProps {
  onOpenBundleModal: () => void;
  onOpenFactoryModal: () => void;
  onOpenShortcutsModal: () => void;
}

const PROMPT_PRESETS = [
  {
    label: 'Calacatta Gold Inlay',
    prompt: 'Calacatta Oro porcelain with geometric brass waterjet inlays and 2.0mm relief',
  },
  {
    label: 'Cobalt Majolica Relief',
    prompt: 'Cobalt Blue Majolica glaze with 3D carved bas-relief tiles and luster sheen',
  },
  {
    label: 'Volcanic Basalt Fluted',
    prompt: 'Deep matte black volcanic basalt with vertical fluted grooves and 45° chamfer',
  },
  {
    label: 'Venetian Emerald Terrazzo',
    prompt: 'Venetian Emerald Terrazzo with brass and Carrara stone aggregates in satin finish',
  },
];

export const TopHeader: React.FC<TopHeaderProps> = ({
  onOpenBundleModal,
  onOpenFactoryModal,
  onOpenShortcutsModal,
}) => {
  const {
    referenceAssets,
    setApplicationMode,
    calculations,
    generateTileFromPrompt,
    isAiGenerating,
    aiFeedbackMessage,
    isSidebarOpen,
    toggleSidebar,
    isDevModeEnabled,
    toggleDevMode,
  } = useTileStore();

  const [promptText, setPromptText] = useState(
    referenceAssets.ai_prompt || 'Calacatta Oro with brass inlay and 3.5mm bas-relief'
  );
  const [showPresets, setShowPresets] = useState(false);

  const handleGenerate = async (textToRun?: string) => {
    const text = (textToRun || promptText).trim();
    if (!text || isAiGenerating) return;
    await generateTileFromPrompt(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <header className="h-12 bg-[#121214] border-b border-[#242428] px-3.5 flex items-center justify-between z-30 shrink-0 gap-3">
      {/* 1. Left Group: Sidebar Toggle + Brand Identity + View Mode Switch */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Collapsible Sidebar Icon */}
        <button
          id="btn-toggle-cad-sidebar"
          onClick={toggleSidebar}
          title={isSidebarOpen ? 'Collapse CAD Controls (Tab)' : 'Expand CAD Controls (Tab)'}
          className="p-1.5 bg-[#1A1A1D] hover:bg-[#26262B] border border-[#2E2E34] rounded text-[#D1D1D1]/70 hover:text-white transition flex items-center gap-1 text-[10px] font-mono cursor-pointer"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-3.5 h-3.5" />
          ) : (
            <PanelLeftOpen className="w-3.5 h-3.5 text-[#00F0FF]" />
          )}
        </button>

        {/* Brand Identity */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#00F0FF] rounded-sm flex items-center justify-center text-black font-bold text-xs tracking-tighter shadow-sm shadow-[#00F0FF]/25 select-none">
            SC
          </div>
          <span className="font-bold tracking-tight text-white uppercase text-xs sm:text-sm font-sans select-none">
            Studio Cadenza
          </span>
        </div>

        {/* 2. View Mode Switch: [ SINGLE TILE | FLOOR SPAN ] */}
        <div className="flex items-center bg-[#18181B] rounded p-0.5 border border-[#27272C] ml-1">
          <button
            id="btn-mode-single-tile"
            type="button"
            onClick={() => setApplicationMode('single_tile')}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-sm uppercase tracking-wider transition cursor-pointer ${
              referenceAssets.application_mode === 'single_tile'
                ? 'bg-[#00F0FF] text-black shadow-sm'
                : 'text-[#A0A0A5] hover:text-white'
            }`}
          >
            Single Tile
          </button>
          <button
            id="btn-mode-floor-span"
            type="button"
            onClick={() => setApplicationMode('full_floor_span')}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-sm uppercase tracking-wider transition cursor-pointer ${
              referenceAssets.application_mode === 'full_floor_span'
                ? 'bg-[#00F0FF] text-black shadow-sm'
                : 'text-[#A0A0A5] hover:text-white'
            }`}
          >
            Floor Span ({calculations.tilesWithWasteCount} pcs)
          </button>
        </div>
      </div>

      {/* 3. Centerpiece: AI Concept Prompt Bar with Live Feedback */}
      <div className="relative flex-1 max-w-xl mx-1 sm:mx-3">
        <div className="flex items-center bg-[#18181B] border border-[#28282E] focus-within:border-[#00F0FF] focus-within:ring-1 focus-within:ring-[#00F0FF]/30 rounded transition shadow-inner">
          {/* Wand Icon / Spinner */}
          <div className="pl-2.5 pr-1.5 flex items-center text-[#00F0FF] shrink-0">
            {isAiGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00F0FF]" />
            ) : (
              <Wand2 className="w-3.5 h-3.5 text-[#00F0FF]" />
            )}
          </div>

          {/* Clean Prompt Input */}
          <input
            id="input-ai-concept-prompt"
            type="text"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe tile design (e.g. Calacatta Oro with brass inlay & 3.5mm relief)..."
            disabled={isAiGenerating}
            className="flex-1 bg-transparent py-1 text-xs text-white placeholder-[#888890] outline-none font-sans min-w-0"
          />

          {/* Quick Presets Trigger */}
          <div className="relative shrink-0">
            <button
              id="btn-prompt-presets-dropdown"
              type="button"
              onClick={() => setShowPresets(!showPresets)}
              title="Design Presets"
              className="px-2 py-1 text-[#A0A0A8] hover:text-white flex items-center gap-1 text-[10px] font-mono border-l border-[#28282E] hover:bg-[#202024] transition cursor-pointer"
            >
              <span>Presets</span>
              <ChevronDown className="w-3 h-3 text-[#707078]" />
            </button>

            {/* Presets Menu */}
            {showPresets && (
              <div className="absolute right-0 top-full mt-1.5 w-72 bg-[#161619] border border-[#2E2E34] rounded shadow-2xl z-50 p-1 font-sans text-xs">
                <div className="px-2 py-1 text-[9px] font-mono uppercase tracking-widest text-[#00F0FF] border-b border-[#2E2E34]">
                  Architectural Presets
                </div>
                {PROMPT_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setPromptText(preset.prompt);
                      setShowPresets(false);
                      handleGenerate(preset.prompt);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#222228] hover:text-[#00F0FF] transition text-[11px] text-[#D1D1D1] flex flex-col gap-0.5 cursor-pointer"
                  >
                    <span className="font-semibold text-white">{preset.label}</span>
                    <span className="text-[9px] text-[#808088] font-mono truncate">
                      {preset.prompt}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* APPLY (Enter) Action */}
          <button
            id="btn-apply-concept-prompt"
            type="button"
            onClick={() => handleGenerate()}
            disabled={isAiGenerating || !promptText.trim()}
            className="ml-1 px-3 py-1 bg-[#00F0FF] hover:bg-[#00d8e6] disabled:opacity-40 text-black font-bold text-[10px] uppercase tracking-wider rounded-r flex items-center gap-1.5 transition shrink-0 shadow-sm cursor-pointer"
          >
            {isAiGenerating ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="hidden sm:inline">GENERATING...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3" />
                <span>APPLY</span>
                <CornerDownLeft className="w-2.5 h-2.5 opacity-60 hidden md:inline" />
              </>
            )}
          </button>
        </div>

        {/* Non-intrusive Live Generation Feedback */}
        {aiFeedbackMessage && (
          <div className="absolute top-full left-0 mt-1 z-40 bg-[#161619] border border-[#00F0FF]/50 px-2.5 py-0.5 rounded text-[9px] font-mono text-[#00F0FF] flex items-center gap-1.5 shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>{aiFeedbackMessage}</span>
          </div>
        )}
      </div>

      {/* 4. Right Action Group: [ 📦 GENERATE BUNDLE ] | [ ✈️ FACTORY CLOUD ] | Developer Gear */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Export Production Bundle */}
        <button
          id="btn-top-generate-bundle"
          onClick={onOpenBundleModal}
          className="flex items-center gap-1.5 h-7 px-3 bg-white hover:bg-[#00F0FF] text-black text-[10px] font-bold rounded-sm uppercase tracking-widest transition shadow-sm cursor-pointer"
          title="Generate Complete Production Bundle (.ZIP) (Ctrl+E)"
        >
          <Package className="w-3.5 h-3.5" />
          <span>Generate Bundle</span>
        </button>

        {/* Factory Cloud Sync */}
        <button
          id="btn-top-factory-cloud"
          onClick={onOpenFactoryModal}
          className="hidden sm:flex items-center gap-1.5 h-7 px-3 bg-[#1A1A1D] hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-700/50 rounded-sm text-[10px] font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
          title="Direct Factory Cloud Sync (Ctrl+Shift+F)"
        >
          <Send className="w-3 h-3" />
          <span>Factory Cloud</span>
        </button>

        {/* Divider */}
        <div className="h-4 w-[1px] bg-[#28282E]" />

        {/* Keyboard Shortcuts Reference Modal Trigger */}
        <button
          id="btn-top-keyboard-shortcuts"
          onClick={onOpenShortcutsModal}
          className="p-1.5 bg-[#1A1A1D] hover:bg-[#26262B] text-[#A0A0A8] hover:text-[#00F0FF] border border-[#2E2E34] rounded transition cursor-pointer"
          title="Keyboard Shortcuts Reference (? or Shift+/)"
        >
          <Keyboard className="w-3.5 h-3.5" />
        </button>

        {/* 5. Advanced Toggle: Subtle Gear / Terminal Icon for Developer Overlay */}
        <button
          id="btn-toggle-dev-overlay"
          onClick={toggleDevMode}
          className={`p-1.5 rounded transition border cursor-pointer relative flex items-center justify-center ${
            isDevModeEnabled
              ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-[#00F0FF] shadow-sm shadow-[#00F0FF]/20'
              : 'bg-[#1A1A1D] hover:bg-[#26262B] text-[#888890] hover:text-white border-[#2E2E34]'
          }`}
          title={isDevModeEnabled ? 'Close Developer & Telemetry Overlay' : 'Open Developer & Telemetry Drawer (OpenCASCADE / Python / AI Agents)'}
        >
          <Terminal className="w-3.5 h-3.5" />
          {isDevModeEnabled && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#00F0FF] ring-2 ring-[#121214]" />
          )}
        </button>
      </div>
    </header>
  );
};
