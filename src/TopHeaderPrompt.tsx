import React, { useState } from 'react';
import { useTileStore } from '../store/useTileStore';
import {
  Sparkles,
  Loader2,
  ChevronDown,
  Layers,
  CheckCircle2,
  Wand2,
  CornerDownLeft,
} from 'lucide-react';

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

export const TopHeaderPrompt: React.FC = () => {
  const {
    referenceAssets,
    generateTileFromPrompt,
    isAiGenerating,
    aiFeedbackMessage,
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
    <div className="relative flex-1 max-w-2xl mx-2">
      <div className="flex items-center bg-[#141416] border border-[#2A2A2E] focus-within:border-[#00F0FF] rounded transition shadow-inner">
        {/* Magic Wand Icon */}
        <div className="pl-2.5 pr-1.5 flex items-center text-[#00F0FF]">
          {isAiGenerating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00F0FF]" />
          ) : (
            <Wand2 className="w-3.5 h-3.5 text-[#00F0FF]" />
          )}
        </div>

        {/* Input Field */}
        <input
          id="input-ai-tile-prompt"
          type="text"
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe tile concept (e.g., Calacatta Gold with brass inlay & 3.5mm bas-relief)..."
          disabled={isAiGenerating}
          className="flex-1 bg-transparent py-1 text-xs text-white placeholder-[#D1D1D1]/40 outline-none font-sans min-w-0"
        />

        {/* Preset Dropdown Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPresets(!showPresets)}
            title="Choose from Architectural Tile Presets"
            className="px-2 py-1 text-[#D1D1D1]/60 hover:text-white flex items-center gap-1 text-[10px] font-mono border-l border-[#2A2A2E] hover:bg-[#1E1E20] transition"
          >
            <span>Presets</span>
            <ChevronDown className="w-3 h-3 text-[#D1D1D1]/50" />
          </button>

          {/* Presets Menu */}
          {showPresets && (
            <div className="absolute right-0 top-full mt-1.5 w-72 bg-[#141416] border border-[#2A2A2E] rounded shadow-2xl z-50 p-1 font-sans text-xs">
              <div className="px-2 py-1 text-[9px] font-mono uppercase tracking-widest text-[#00F0FF] border-b border-[#2A2A2E]">
                Parametric Concepts
              </div>
              {PROMPT_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPromptText(preset.prompt);
                    setShowPresets(false);
                    handleGenerate(preset.prompt);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#1E1E20] hover:text-[#00F0FF] transition text-[11px] text-[#D1D1D1] flex flex-col gap-0.5"
                >
                  <span className="font-bold text-white">{preset.label}</span>
                  <span className="text-[9px] text-[#D1D1D1]/50 font-mono truncate">{preset.prompt}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Apply / Generate Button */}
        <button
          id="btn-apply-all-viewports"
          type="button"
          onClick={() => handleGenerate()}
          disabled={isAiGenerating || !promptText.trim()}
          className="ml-1 px-3 py-1 bg-[#00F0FF] hover:bg-[#00d8e6] disabled:opacity-50 text-black font-bold text-[10px] uppercase tracking-wider rounded-r flex items-center gap-1.5 transition shrink-0 shadow-sm"
        >
          {isAiGenerating ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>SYNCING...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3" />
              <span>APPLY ALL VIEWPORTS</span>
              <CornerDownLeft className="w-2.5 h-2.5 opacity-60 hidden sm:inline" />
            </>
          )}
        </button>
      </div>

      {/* Floating Feedback Notification */}
      {aiFeedbackMessage && (
        <div className="absolute top-full left-0 mt-1 z-40 bg-[#141416] border border-[#00F0FF]/60 px-2 py-0.5 rounded text-[9px] font-mono text-[#00F0FF] flex items-center gap-1.5 shadow-lg animate-in fade-in slide-in-from-top-1 duration-200">
          <CheckCircle2 className="w-2.5 h-2.5" />
          <span>{aiFeedbackMessage}</span>
        </div>
      )}
    </div>
  );
};
