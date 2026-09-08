import React from 'react';
import { useTileStore } from '../../store/useTileStore';
import { MousePointer2, PenTool, Square, Circle, Hand, Diamond } from 'lucide-react';

type Tool = 'select' | 'pen' | 'rect' | 'circle' | 'inlay' | 'pan';

const TOOLS: { tool: Tool; icon: any; label: string; shortcut: string }[] = [
  { tool: 'select', icon: MousePointer2, label: 'Select', shortcut: 'V' },
  { tool: 'pen', icon: PenTool, label: 'Pen / Path', shortcut: 'P' },
  { tool: 'rect', icon: Square, label: 'Rectangle', shortcut: 'R' },
  { tool: 'circle', icon: Circle, label: 'Ellipse', shortcut: 'C' },
  { tool: 'inlay', icon: Diamond, label: 'Inlay Contour', shortcut: 'I' },
  { tool: 'pan', icon: Hand, label: 'Pan', shortcut: 'H' },
];

/**
 * Real left toolbox rail. Drives the same `activeTool` state Canvas2D
 * already reads — this is not a decorative addition, selecting a tool
 * here changes what clicking the 2D viewport does.
 */
export const Toolbox: React.FC = () => {
  const { activeTool, setActiveTool } = useTileStore();

  return (
    <div className="w-10 bg-[#101012] border-r border-[#242428] flex flex-col items-center py-2 gap-1 shrink-0">
      {TOOLS.map(({ tool, icon: Icon, label, shortcut }) => (
        <button
          key={tool}
          onClick={() => setActiveTool(tool)}
          title={`${label} (${shortcut})`}
          className={`w-7 h-7 flex items-center justify-center rounded transition cursor-pointer ${
            activeTool === tool
              ? 'bg-[#00F0FF] text-black shadow-sm'
              : 'text-[#8A8A92] hover:text-white hover:bg-[#1E1E22]'
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
        </button>
      ))}
    </div>
  );
};
