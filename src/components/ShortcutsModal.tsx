import React, { useState } from 'react';
import {
  Keyboard,
  X,
  Search,
  Command,
  Sliders,
  Layers,
  Sparkles,
  Eye,
  Scissors,
  Check,
} from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  label: string;
  description: string;
  category: 'global' | 'viewport' | 'vector' | 'parametric';
}

const SHORTCUTS: ShortcutItem[] = [
  // Global Actions
  {
    keys: ['Ctrl / ⌘', 'S'],
    label: 'Save Project State',
    description: 'Updates active passport and persists state',
    category: 'global',
  },
  {
    keys: ['Ctrl / ⌘', 'E'],
    label: 'Export ZIP Bundle',
    description: 'Triggers Production Package Builder modal',
    category: 'global',
  },
  {
    keys: ['Ctrl / ⌘', 'Shift', 'F'],
    label: 'Factory Cloud Sync',
    description: 'Opens direct SACMI / CNC machine sync portal',
    category: 'global',
  },
  {
    keys: ['Ctrl / ⌘', 'Q'],
    label: 'AI QC Safety Audit',
    description: 'Launches multi-agent CAM quality control pipeline',
    category: 'global',
  },
  {
    keys: ['Tab'],
    label: 'Toggle CAD Sidebar',
    description: 'Expands or collapses the left parameter sidebar',
    category: 'global',
  },
  {
    keys: ['?'],
    label: 'Keyboard Shortcuts',
    description: 'Displays this visual shortcut reference overlay',
    category: 'global',
  },

  // Viewport Controls
  {
    keys: ['1'],
    label: 'Viewport 01: 2D Vector',
    description: 'Maximizes 2D vector CAD & waterjet path canvas',
    category: 'viewport',
  },
  {
    keys: ['2'],
    label: 'Viewport 02: 3D PBR Orbit',
    description: 'Maximizes real-time WebGL surface and lighting viewer',
    category: 'viewport',
  },
  {
    keys: ['3'],
    label: 'Viewport 03: Profile CAD',
    description: 'Maximizes 2D SVG cross-section and relief tolerances',
    category: 'viewport',
  },
  {
    keys: ['4'],
    label: 'Viewport 04: Waffle Grid',
    description: 'Maximizes underside 50mm dovetail mortar matrix',
    category: 'viewport',
  },
  {
    keys: ['Spacebar'],
    label: 'Toggle Quad / Fullscreen',
    description: 'Switches between active viewport and 4-quad split stage',
    category: 'viewport',
  },
  {
    keys: ['M'],
    label: 'Toggle Workspace Mode',
    description: 'Switches between Single Tile & Floor Span (20×10m)',
    category: 'viewport',
  },

  // 2D Vector Canvas
  {
    keys: ['V'],
    label: 'Select Tool',
    description: 'Switches 2D canvas to standard pointer/selection mode',
    category: 'vector',
  },
  {
    keys: ['P'],
    label: 'Pen Tool',
    description: 'Starts interactive waterjet polyline path drawing',
    category: 'vector',
  },
  {
    keys: ['Enter'],
    label: 'Close Vector Loop',
    description: 'Finishes active drawing by connecting to start point',
    category: 'vector',
  },
  {
    keys: ['Shift', 'Enter'],
    label: 'Complete Open Path',
    description: 'Finishes active drawing without closing contour',
    category: 'vector',
  },
  {
    keys: ['Esc'],
    label: 'Cancel / Clear',
    description: 'Aborts current path drawing or deselects node',
    category: 'vector',
  },
  {
    keys: ['K'],
    label: 'Toggle Kerf Offset',
    description: 'Toggles 0.75mm waterjet toolpath compensation line',
    category: 'vector',
  },
  {
    keys: ['G'],
    label: 'Toggle Snap Grid',
    description: 'Shows or hides 100mm millimeter drafting grid',
    category: 'vector',
  },

  // CAD Parametric Focus
  {
    keys: ['Alt', 'W'],
    label: 'Focus Width Slider',
    description: 'Jumps cursor to Width (mm) dimension control',
    category: 'parametric',
  },
  {
    keys: ['Alt', 'H'],
    label: 'Focus Height Slider',
    description: 'Jumps cursor to Height (mm) dimension control',
    category: 'parametric',
  },
  {
    keys: ['Alt', 'T'],
    label: 'Focus Thickness Slider',
    description: 'Jumps cursor to Thickness (mm) dimension control',
    category: 'parametric',
  },
  {
    keys: ['Alt', '1'],
    label: 'Matte Glaze Finish',
    description: 'Sets surface preset to high-roughness diffuse matte',
    category: 'parametric',
  },
  {
    keys: ['Alt', '2'],
    label: 'Gloss Glaze Finish',
    description: 'Sets surface preset to polished specular mirror gloss',
    category: 'parametric',
  },
  {
    keys: ['Alt', '3'],
    label: 'Satin Glaze Finish',
    description: 'Sets surface preset to balanced architectural satin',
    category: 'parametric',
  },
  {
    keys: ['Alt', '4'],
    label: 'Luster Glaze Finish',
    description: 'Sets surface preset to metallic iridescent luster sheen',
    category: 'parametric',
  },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'global' | 'viewport' | 'vector' | 'parametric'>('all');

  if (!isOpen) return null;

  const filteredShortcuts = SHORTCUTS.filter((s) => {
    const matchesTab = activeTab === 'all' || s.category === activeTab;
    const matchesQuery =
      s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.keys.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesQuery;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-[#141416] border border-[#2A2A2E] rounded w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-[#D1D1D1]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-[#101012] border-b border-[#2A2A2E]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#1E1E20] border border-[#2A2A2E] flex items-center justify-center text-[#00F0FF]">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                Keyboard Shortcuts & Hotkey Controls
              </h2>
              <p className="text-[11px] text-[#D1D1D1]/60 font-mono">
                CAD PARAMETRICS • VIEWPORT NAVIGATION • 2D VECTOR CAM ENGINE
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#D1D1D1]/60 hover:text-white hover:bg-[#1E1E20] border border-transparent hover:border-[#2A2A2E] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="p-3 bg-[#0D0D0F] border-b border-[#2A2A2E] flex flex-col sm:flex-row gap-2.5 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-[#00F0FF] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search shortcut (e.g. Space, Kerf, Alt+W)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#141416] border border-[#2A2A2E] rounded text-white text-xs outline-none focus:border-[#00F0FF] font-sans"
            />
          </div>

          <div className="flex items-center bg-[#141416] border border-[#2A2A2E] rounded p-0.5 text-[10px] w-full sm:w-auto overflow-x-auto">
            {(
              [
                { id: 'all', label: 'All Shortcuts' },
                { id: 'global', label: 'Global' },
                { id: 'viewport', label: 'Viewports' },
                { id: 'vector', label: '2D Vector' },
                { id: 'parametric', label: 'Parametrics' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-2.5 py-1 rounded-sm uppercase tracking-wider font-bold whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'bg-[#00F0FF] text-black shadow-sm'
                    : 'text-[#D1D1D1]/60 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Shortcuts List */}
        <div className="flex-1 p-4 overflow-y-auto bg-[#0A0A0B] space-y-2 custom-scrollbar">
          {filteredShortcuts.length === 0 ? (
            <div className="py-12 text-center text-[#D1D1D1]/50 text-xs font-mono">
              No shortcuts found matching &quot;{searchQuery}&quot;
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filteredShortcuts.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#141416] border border-[#2A2A2E] hover:border-[#00F0FF]/40 rounded p-2.5 flex items-center justify-between gap-3 transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white uppercase tracking-wide truncate">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-[#D1D1D1]/60 mt-0.5 truncate">
                      {item.description}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {item.keys.map((k, kIdx) => (
                      <React.Fragment key={kIdx}>
                        <kbd className="px-2 py-1 bg-[#1E1E20] border border-[#2A2A2E] text-[#00F0FF] rounded text-[10px] font-mono font-bold shadow-sm">
                          {k}
                        </kbd>
                        {kIdx < item.keys.length - 1 && (
                          <span className="text-[10px] text-[#D1D1D1]/40 font-mono">+</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#101012] border-t border-[#2A2A2E] flex items-center justify-between text-xs font-mono text-[#D1D1D1]/60">
          <span>Press <kbd className="px-1.5 py-0.5 bg-[#1E1E20] text-white border border-[#2A2A2E] rounded text-[9px]">Esc</kbd> anytime to dismiss overlay</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#1E1E20] hover:bg-[#2A2A2E] text-white rounded border border-[#2A2A2E] text-[11px] font-bold uppercase tracking-wider transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
