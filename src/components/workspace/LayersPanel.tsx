import React, { useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { Eye, EyeOff, Lock, Unlock, GripVertical } from 'lucide-react';

/**
 * Minimal Photoshop-style layer list. Deliberately not a redesign: matches
 * Sidebar's existing section styling and does exactly what Phase 2 asked
 * for — visibility, lock, drag-to-reorder, active-layer indication.
 */
export const LayersPanel: React.FC = () => {
  const { layers, activeLayerId, setActiveLayer, toggleLayerVisibility, toggleLayerLock, reorderLayers } =
    useProjectStore();

  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Layers array is stored bottom-to-top; the panel lists top layer first,
  // matching the usual layers-panel convention (see useProjectStore.ts).
  const displayLayers = [...layers].reverse();

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[9px] font-bold text-[#00F0FF] uppercase tracking-[0.2em] block">Layers</label>
        <span className="text-[9px] font-mono text-[#888890]">{layers.length} total</span>
      </div>

      <div className="bg-[#1E1E20] border border-[#2A2A2E] rounded divide-y divide-[#2A2A2E]">
        {displayLayers.map((layer) => {
          const isActive = layer.id === activeLayerId;
          return (
            <div
              key={layer.id}
              draggable
              onDragStart={() => setDraggedId(layer.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedId && draggedId !== layer.id) reorderLayers(draggedId, layer.id);
                setDraggedId(null);
              }}
              onClick={() => setActiveLayer(layer.id)}
              className={`flex items-center gap-1.5 px-1.5 py-1 text-[10px] cursor-pointer transition ${
                isActive ? 'bg-[#00F0FF]/10 border-l-2 border-[#00F0FF]' : 'border-l-2 border-transparent hover:bg-[#242428]'
              }`}
              title="Click to make active — drag to reorder"
            >
              <GripVertical className="w-3 h-3 text-[#55555C] shrink-0 cursor-grab" />
              <span
                className={`flex-1 truncate font-mono ${
                  isActive ? 'text-white font-bold' : layer.visible ? 'text-[#D1D1D1]' : 'text-[#55555C]'
                }`}
              >
                {layer.name}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLayerLock(layer.id);
                }}
                title={layer.locked ? 'Unlock layer' : 'Lock layer'}
                className={`p-0.5 rounded ${layer.locked ? 'text-amber-400' : 'text-[#55555C] hover:text-[#D1D1D1]'}`}
              >
                {layer.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLayerVisibility(layer.id);
                }}
                title={layer.visible ? 'Hide layer' : 'Show layer'}
                className={`p-0.5 rounded ${layer.visible ? 'text-[#00F0FF]' : 'text-[#55555C] hover:text-[#D1D1D1]'}`}
              >
                {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
