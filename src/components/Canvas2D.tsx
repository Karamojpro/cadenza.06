import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useTileStore } from '../store/useTileStore';
import { useProjectStore, getVisibleOrderedObjects } from '../store/useProjectStore';
import { VectorPath, VectorPoint, ObjectTransform } from '../types';
import {
  getTransform,
  getObjectBounds,
  hitTestObject,
  toSvgTransform,
  getResolvedLayerId,
  IDENTITY_TRANSFORM,
} from '../utils/objectTransform';
import {
  PenTool,
  Square,
  Circle,
  Move,
  MousePointer2,
  Trash2,
  Eye,
  Plus,
  Upload,
  Layers,
  Sparkles,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  ShieldCheck,
  AlertTriangle,
  Lock,
} from 'lucide-react';

type DragMode = 'move' | 'rotate' | 'scale' | null;

export const Canvas2D: React.FC<{ onExpand?: () => void; isExpanded?: boolean }> = ({
  onExpand,
  isExpanded = false,
}) => {
  const {
    dimensions,
    color,
    finish,
    referenceAssets,
    setReferenceImage,
    camReport,
    activeTool,
    setActiveTool,
    showKerfOffset,
    toggleKerfOffset,
    showGrid,
    toggleGrid,
  } = useTileStore();

  const {
    layers,
    activeLayerId,
    setActiveLayer,
    isLayerLocked,
    addObject,
    removeSelectedObjects,
    selectedObjectIds,
    activeObjectId,
    selectObject,
    clearSelection,
    updateObjectTransform,
    loadPresetPattern,
  } = useProjectStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentPathPoints, setCurrentPathPoints] = useState<VectorPoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [mouseMm, setMouseMm] = useState<VectorPoint>({ x: 0, y: 0 });
  const [refOpacity, setRefOpacity] = useState(0.65);

  // --- Phase 2: non-destructive drag state for the selected object ---
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [dragObjectId, setDragObjectId] = useState<string | null>(null);
  const [dragOrigin, setDragOrigin] = useState<VectorPoint>({ x: 0, y: 0 });
  const [dragOriginTransform, setDragOriginTransform] = useState<ObjectTransform>(IDENTITY_TRANSFORM);
  const [previewTransform, setPreviewTransform] = useState<ObjectTransform | null>(null);

  const canvasWidth = dimensions.width_mm;
  const canvasHeight = dimensions.height_mm;

  const visibleObjects = getVisibleOrderedObjects();

  // Convert screen coordinates to mm space within the tile
  const getMmCoordinates = useCallback(
    (e: React.MouseEvent<SVGSVGElement> | MouseEvent): VectorPoint => {
      const svg = containerRef.current?.querySelector('#svg-2d-tile-canvas') as SVGSVGElement | null;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      const clientX = (e as MouseEvent).clientX - rect.left;
      const clientY = (e as MouseEvent).clientY - rect.top;

      const scaleX = canvasWidth / rect.width;
      const scaleY = canvasHeight / rect.height;

      const mmX = Math.max(0, Math.min(canvasWidth, clientX * scaleX));
      const mmY = Math.max(0, Math.min(canvasHeight, clientY * scaleY));

      return { x: Math.round(mmX * 10) / 10, y: Math.round(mmY * 10) / 10 };
    },
    [canvasWidth, canvasHeight]
  );

  const getObjectById = (id: string | null): VectorPath | undefined =>
    id ? visibleObjects.find((o) => o.id === id) : undefined;

  const commitDrag = useCallback(() => {
    if (dragMode && dragObjectId && previewTransform) {
      updateObjectTransform(dragObjectId, previewTransform);
    }
    setDragMode(null);
    setDragObjectId(null);
    setPreviewTransform(null);
  }, [dragMode, dragObjectId, previewTransform, updateObjectTransform]);

  // Commit a drag on mouseup anywhere on the page, not just inside the SVG.
  useEffect(() => {
    if (!dragMode) return;
    window.addEventListener('mouseup', commitDrag);
    return () => window.removeEventListener('mouseup', commitDrag);
  }, [dragMode, commitDrag]);

  // Delete/Backspace removes the current selection, unless typing somewhere.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedObjectIds.length > 0) {
        e.preventDefault();
        removeSelectedObjects();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObjectIds, removeSelectedObjects]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const pt = getMmCoordinates(e);
    setMouseMm(pt);

    if (isPanning) {
      setPanOffset({
        x: panOffset.x + (e.clientX - panStart.x),
        y: panOffset.y + (e.clientY - panStart.y),
      });
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (!dragMode || !dragObjectId) return;
    const obj = getObjectById(dragObjectId);
    if (!obj) return;
    const bounds = getObjectBounds({ ...obj, transform: dragOriginTransform });
    const center = { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 };

    if (dragMode === 'move') {
      setPreviewTransform({
        ...dragOriginTransform,
        x_mm: dragOriginTransform.x_mm + (pt.x - dragOrigin.x),
        y_mm: dragOriginTransform.y_mm + (pt.y - dragOrigin.y),
      });
    } else if (dragMode === 'rotate') {
      const angle0 = Math.atan2(dragOrigin.y - center.y, dragOrigin.x - center.x);
      const angleNow = Math.atan2(pt.y - center.y, pt.x - center.x);
      const deltaDeg = ((angleNow - angle0) * 180) / Math.PI;
      setPreviewTransform({
        ...dragOriginTransform,
        rotation_deg: dragOriginTransform.rotation_deg + deltaDeg,
      });
    } else if (dragMode === 'scale') {
      const dist0 = Math.hypot(dragOrigin.x - center.x, dragOrigin.y - center.y) || 1;
      const distNow = Math.hypot(pt.x - center.x, pt.y - center.y);
      const factor = Math.max(0.1, Math.min(10, distNow / dist0));
      setPreviewTransform({
        ...dragOriginTransform,
        scale: Math.max(0.1, Math.min(10, dragOriginTransform.scale * factor)),
      });
    }
  };

  const startDrag = (mode: DragMode, obj: VectorPath, pt: VectorPoint) => {
    if (isLayerLocked(getResolvedLayerId(obj))) return;
    selectObject(obj.id);
    setDragMode(mode);
    setDragObjectId(obj.id);
    setDragOrigin(pt);
    setDragOriginTransform(getTransform(obj));
    setPreviewTransform(getTransform(obj));
  };

  const handleObjectMouseDown = (e: React.MouseEvent, obj: VectorPath) => {
    if (activeTool !== 'select') return;
    e.stopPropagation();
    startDrag('move', obj, getMmCoordinates(e.nativeEvent as unknown as MouseEvent));
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool === 'pan' || dragMode) return;

    const pt = getMmCoordinates(e);

    if (activeTool === 'select') {
      // Topmost object first (reverse of render/stacking order).
      const hit = [...visibleObjects].reverse().find((o) => hitTestObject(pt, o));
      if (hit) {
        selectObject(hit.id, { additive: e.shiftKey });
      } else {
        clearSelection();
      }
      return;
    }

    if (isLayerLocked(activeLayerId)) return;

    if (activeTool === 'pen') {
      const updated = [...currentPathPoints, pt];
      setCurrentPathPoints(updated);
      setIsDrawing(true);
    } else if (activeTool === 'rect') {
      const halfSize = 80;
      const rectPoints: VectorPoint[] = [
        { x: Math.max(20, pt.x - halfSize), y: Math.max(20, pt.y - halfSize) },
        { x: Math.min(canvasWidth - 20, pt.x + halfSize), y: Math.max(20, pt.y - halfSize) },
        { x: Math.min(canvasWidth - 20, pt.x + halfSize), y: Math.min(canvasHeight - 20, pt.y + halfSize) },
        { x: Math.max(20, pt.x - halfSize), y: Math.min(canvasHeight - 20, pt.y + halfSize) },
        { x: Math.max(20, pt.x - halfSize), y: Math.max(20, pt.y - halfSize) },
      ];
      addObject({
        id: `rect_${Date.now()}`,
        type: 'rectangle',
        points: rectPoints,
        color: activeLayerId === 'layer_inlay' ? color.secondary_hex : color.primary_hex,
        closed: true,
        layerId: activeLayerId,
        strokeWidth: 2.5,
        depth_mm: activeLayerId === 'layer_engrave' ? 1.5 : 3.0,
      });
    } else if (activeTool === 'circle') {
      const radius = 70;
      const circlePoints: VectorPoint[] = [];
      for (let angle = 0; angle <= 360; angle += 15) {
        const rad = (angle * Math.PI) / 180;
        circlePoints.push({
          x: Math.round((pt.x + radius * Math.cos(rad)) * 10) / 10,
          y: Math.round((pt.y + radius * Math.sin(rad)) * 10) / 10,
        });
      }
      addObject({
        id: `circ_${Date.now()}`,
        type: 'circle',
        points: circlePoints,
        color: activeLayerId === 'layer_inlay' ? color.secondary_hex : color.primary_hex,
        closed: true,
        layerId: activeLayerId,
        strokeWidth: 2.5,
        depth_mm: activeLayerId === 'layer_engrave' ? 1.5 : 3.0,
      });
    }
  };

  const handleFinishPenPath = (closeLoop: boolean = true) => {
    if (currentPathPoints.length < 2) {
      setCurrentPathPoints([]);
      setIsDrawing(false);
      return;
    }
    if (isLayerLocked(activeLayerId)) {
      setCurrentPathPoints([]);
      setIsDrawing(false);
      return;
    }

    const points = [...currentPathPoints];
    if (closeLoop && points.length > 2) {
      points.push({ ...points[0] });
    }

    addObject({
      id: `vector_path_${Date.now()}`,
      type: 'polyline',
      points,
      color: activeLayerId === 'layer_inlay' ? color.secondary_hex : color.primary_hex,
      closed: closeLoop,
      layerId: activeLayerId,
      strokeWidth: activeLayerId === 'layer_engrave' ? 1.8 : 3.0,
      depth_mm: activeLayerId === 'layer_engrave' ? 1.2 : 3.5,
    });

    setCurrentPathPoints([]);
    setIsDrawing(false);
  };

  useEffect(() => {
    const handleCloseLoop = () => handleFinishPenPath(true);
    const handleCompleteOpen = () => handleFinishPenPath(false);
    const handleCancel = () => {
      setCurrentPathPoints([]);
      setIsDrawing(false);
    };

    window.addEventListener('cad-close-vector-loop', handleCloseLoop);
    window.addEventListener('cad-complete-open-path', handleCompleteOpen);
    window.addEventListener('cad-cancel-path', handleCancel);

    return () => {
      window.removeEventListener('cad-close-vector-loop', handleCloseLoop);
      window.removeEventListener('cad-complete-open-path', handleCompleteOpen);
      window.removeEventListener('cad-cancel-path', handleCancel);
    };
  }, [currentPathPoints, activeLayerId, color.secondary_hex, color.primary_hex]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setReferenceImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Generate SVG path string from points (object-local space; a <g transform>
  // wrapper applies position/rotation/scale — points themselves never change).
  const pointsToPathD = (pts: VectorPoint[]) => {
    if (pts.length === 0) return '';
    return pts.reduce((acc, p, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
  };

  const activeLayer = layers.find((l) => l.id === activeLayerId);
  const activeLayerLocked = isLayerLocked(activeLayerId);

  return (
    <div
      id="viewport-2d-canvas"
      ref={containerRef}
      className="flex flex-col h-full bg-[#1A1A1C] border border-[#2A2A2E] rounded overflow-hidden select-none text-[#D1D1D1] shadow-xl"
    >
      {/* 2D Canvas Top Command Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#141416] border-b border-[#2A2A2E] text-xs shrink-0">
        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 bg-[#2A2A2E] text-[9px] font-bold rounded-sm uppercase tracking-widest text-[#00F0FF]">
            Viewport 01: 2D Vector CAD
          </div>
          <span className="text-[#2A2A2E]">|</span>
          <span className="text-[#D1D1D1]/60 font-mono text-[10px]">
            {canvasWidth} × {canvasHeight} mm (1:1 CAD space)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick Tool Selector */}
          <div className="flex items-center bg-[#1E1E20] border border-[#2A2A2E] rounded p-0.5">
            <button
              id="btn-tool-select"
              title="Select / Transform (V)"
              onClick={() => setActiveTool('select')}
              className={`p-1 rounded transition-all ${
                activeTool === 'select' ? 'bg-[#00F0FF] text-black shadow-sm' : 'text-[#D1D1D1]/60 hover:text-white'
              }`}
            >
              <MousePointer2 className="w-3.5 h-3.5" />
            </button>
            <button
              id="btn-tool-pen"
              title="Vector Polyline Pen (Click points, Double-click to close)"
              onClick={() => {
                setActiveTool('pen');
              }}
              className={`p-1 rounded transition-all ${
                activeTool === 'pen' ? 'bg-[#00F0FF] text-black shadow-sm' : 'text-[#D1D1D1]/60 hover:text-white'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
            </button>
            <button
              id="btn-tool-rect"
              title="Add Inlay Rectangle"
              onClick={() => setActiveTool('rect')}
              className={`p-1 rounded transition-all ${
                activeTool === 'rect' ? 'bg-[#00F0FF] text-black shadow-sm' : 'text-[#D1D1D1]/60 hover:text-white'
              }`}
            >
              <Square className="w-3.5 h-3.5" />
            </button>
            <button
              id="btn-tool-circle"
              title="Add Medallion Circle"
              onClick={() => setActiveTool('circle')}
              className={`p-1 rounded transition-all ${
                activeTool === 'circle' ? 'bg-[#00F0FF] text-black shadow-sm' : 'text-[#D1D1D1]/60 hover:text-white'
              }`}
            >
              <Circle className="w-3.5 h-3.5" />
            </button>
            <button
              id="btn-tool-pan"
              title="Pan / Navigate Canvas"
              onClick={() => setActiveTool('pan')}
              className={`p-1 rounded transition-all ${
                activeTool === 'pan' ? 'bg-[#00F0FF] text-black shadow-sm' : 'text-[#D1D1D1]/60 hover:text-white'
              }`}
            >
              <Move className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Layer Selector (real project layers from useProjectStore) */}
          <div className="flex items-center bg-[#1E1E20] border border-[#2A2A2E] rounded px-1.5 py-0.5 text-[10px] gap-1">
            <Layers className="w-3 h-3 text-[#00F0FF]" />
            <select
              id="select-cad-layer"
              value={activeLayerId}
              onChange={(e) => setActiveLayer(e.target.value)}
              className="bg-transparent text-white outline-none cursor-pointer font-mono"
            >
              {layers.map((l) => (
                <option key={l.id} value={l.id} className="bg-[#141416] text-[#D1D1D1]">
                  {l.name}
                  {l.locked ? ' (locked)' : ''}
                </option>
              ))}
            </select>
            {activeLayerLocked && (
              <span title="Active layer is locked">
                <Lock className="w-3 h-3 text-amber-400" />
              </span>
            )}
          </div>

          {/* Presets Button */}
          <div className="relative group">
            <button
              id="btn-cad-presets"
              className="flex items-center gap-1 px-2 py-1 bg-[#1E1E20] border border-[#2A2A2E] hover:border-[#00F0FF] rounded text-white text-[10px] font-bold uppercase tracking-wider"
            >
              <Sparkles className="w-3 h-3 text-[#00F0FF]" />
              Presets
            </button>
            <div className="absolute right-0 top-full mt-1 w-48 bg-[#141416] border border-[#2A2A2E] rounded shadow-2xl p-1 hidden group-hover:block z-50">
              <button
                onClick={() => loadPresetPattern('art_deco_inlay')}
                className="w-full text-left px-2.5 py-1.5 text-xs text-[#D1D1D1] hover:bg-[#1E1E20] rounded flex items-center justify-between"
              >
                <span>Art Deco Medallion</span>
                <span className="text-[10px] text-[#D4AF37]">Inlay</span>
              </button>
              <button
                onClick={() => loadPresetPattern('geometric_brass')}
                className="w-full text-left px-2.5 py-1.5 text-xs text-[#D1D1D1] hover:bg-[#1E1E20] rounded flex items-center justify-between"
              >
                <span>Geometric Diamond</span>
                <span className="text-[10px] text-[#D4AF37]">Brass</span>
              </button>
              <button
                onClick={() => loadPresetPattern('moroccan_zellige')}
                className="w-full text-left px-2.5 py-1.5 text-xs text-[#D1D1D1] hover:bg-[#1E1E20] rounded flex items-center justify-between"
              >
                <span>Moroccan Zellige Grid</span>
                <span className="text-[10px] text-[#00F0FF]">Glaze</span>
              </button>
              <button
                onClick={() => loadPresetPattern('terrazzo_florence')}
                className="w-full text-left px-2.5 py-1.5 text-xs text-[#D1D1D1] hover:bg-[#1E1E20] rounded flex items-center justify-between"
              >
                <span>Florence Terrazzo</span>
                <span className="text-[10px] text-emerald-400">Inlay</span>
              </button>
              <button
                onClick={() => loadPresetPattern('chevron_relief')}
                className="w-full text-left px-2.5 py-1.5 text-xs text-[#D1D1D1] hover:bg-[#1E1E20] rounded flex items-center justify-between"
              >
                <span>Chevron Bas-Relief</span>
                <span className="text-[10px] text-indigo-400">3D Mold</span>
              </button>
            </div>
          </div>

          {/* Reference Image Upload */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            id="btn-upload-ref"
            title="Upload Reference Photo or Heightmap"
            onClick={() => fileInputRef.current?.click()}
            className="p-1 px-2 flex items-center gap-1 bg-[#1E1E20] border border-[#2A2A2E] hover:border-[#00F0FF] rounded text-white text-[10px] font-bold uppercase tracking-wider"
          >
            <Upload className="w-3 h-3 text-[#00F0FF]" />
            Upload
          </button>

          {/* Delete Selected */}
          {activeObjectId && (
            <button
              id="btn-delete-selected"
              title="Delete selected object (Del)"
              onClick={() => removeSelectedObjects()}
              className="p-1 px-2 flex items-center gap-1 bg-[#1E1E20] border border-red-800/60 hover:border-red-400 rounded text-red-300 text-[10px] font-bold uppercase tracking-wider"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          )}

          {/* Clear & Expand */}
          <button
            id="btn-clear-vectors"
            title="Clear all vector paths"
            onClick={() => useProjectStore.getState().clearObjects()}
            className="p-1 text-[#D1D1D1]/60 hover:text-red-400 bg-[#1E1E20] border border-[#2A2A2E] rounded transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {onExpand && (
            <button
              onClick={onExpand}
              className="p-1 text-[#D1D1D1]/60 hover:text-white bg-[#1E1E20] border border-[#2A2A2E] rounded transition"
              title={isExpanded ? 'Restore quad view' : 'Maximize viewport'}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main SVG Vector Stage with Rulers */}
      <div className="relative flex-1 bg-[#101012] overflow-hidden flex items-center justify-center p-3">
        {/* Millimeter Coordinates HUD & QC Status */}
        <div className="absolute top-2 left-2 z-20 flex items-center gap-2 pointer-events-none">
          <div className="bg-[#141416]/90 backdrop-blur border border-[#2A2A2E] px-2 py-1 rounded text-[10px] font-mono text-[#D1D1D1]">
            X: <span className="text-[#00F0FF]">{mouseMm.x} mm</span> | Y:{' '}
            <span className="text-[#00F0FF]">{mouseMm.y} mm</span>
          </div>

          {camReport.passed ? (
            <div className="bg-[#141416]/90 border border-emerald-500/50 px-2 py-1 rounded text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              QC PASSED (Kerf: {camReport.kerf_mm}mm | Min Wall: {camReport.min_wall_thickness_mm}mm)
            </div>
          ) : (
            <div className="bg-[#141416]/90 border border-amber-500/50 px-2 py-1 rounded text-[10px] font-mono text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              QC ALERT ({camReport.warnings[0] || 'Check Loops'})
            </div>
          )}

          {activeLayerLocked && activeTool !== 'select' && (
            <div className="bg-[#141416]/90 border border-amber-500/50 px-2 py-1 rounded text-[10px] font-mono text-amber-400 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Layer "{activeLayer?.name}" is locked
            </div>
          )}
        </div>

        {/* Floating Drawing Control Pill when actively drawing pen path */}
        {isDrawing && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-[#141416] border border-[#00F0FF] shadow-2xl px-3 py-1.5 rounded text-xs">
            <span className="text-[#00F0FF] font-semibold font-mono text-[10px] tracking-wider uppercase">
              PATH IN PROGRESS ({currentPathPoints.length} PTS)
            </span>
            <button
              onClick={() => handleFinishPenPath(true)}
              className="px-2 py-0.5 bg-[#00F0FF] text-black font-bold rounded-sm text-[10px] uppercase"
            >
              Close Loop
            </button>
            <button
              onClick={() => handleFinishPenPath(false)}
              className="px-2 py-0.5 bg-[#1E1E20] border border-[#2A2A2E] hover:border-[#D1D1D1] text-[#D1D1D1] rounded-sm text-[10px] uppercase"
            >
              Open Path
            </button>
            <button
              onClick={() => {
                setCurrentPathPoints([]);
                setIsDrawing(false);
              }}
              className="px-2 py-0.5 bg-red-950/80 border border-red-800 text-red-300 rounded-sm text-[10px] uppercase"
            >
              Cancel
            </button>
          </div>
        )}

        {/* SVG Drawing Surface */}
        <div
          className="relative max-w-full max-h-full flex items-center justify-center"
          style={{
            transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            transformOrigin: 'center center',
          }}
        >
          <svg
            id="svg-2d-tile-canvas"
            viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
            className="w-auto h-auto max-w-[92%] max-h-[82vh] border-2 border-slate-600 rounded bg-slate-900/95 shadow-2xl cursor-crosshair transition-all"
            style={{
              aspectRatio: `${canvasWidth} / ${canvasHeight}`,
              width: '460px',
              height: '460px',
            }}
            onMouseMove={handleMouseMove}
            onClick={handleSvgClick}
            onMouseDown={(e) => {
              if (activeTool === 'pan') {
                setIsPanning(true);
                setPanStart({ x: e.clientX, y: e.clientY });
              }
            }}
            onMouseUp={() => setIsPanning(false)}
            onMouseLeave={() => setIsPanning(false)}
          >
            {/* Defs for Grid and Patterns */}
            <defs>
              <pattern
                id="tile-cad-grid-100"
                width="100"
                height="100"
                patternUnits="userSpaceOnUse"
              >
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#334155" strokeWidth="0.8" />
                <path
                  d="M 50 0 L 50 100 M 0 50 L 100 50"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="0.4"
                  strokeDasharray="2,2"
                />
              </pattern>

              {/* Inlay Gold Glow Filter */}
              <filter id="gold-inlay-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Base Tile Body */}
            <rect
              x="0"
              y="0"
              width={canvasWidth}
              height={canvasHeight}
              fill={color.primary_hex}
              rx="4"
            />

            {/* Reference Image Overlay (if uploaded) */}
            {referenceAssets.reference_image_url && (
              <image
                href={referenceAssets.reference_image_url}
                x="0"
                y="0"
                width={canvasWidth}
                height={canvasHeight}
                opacity={refOpacity}
                preserveAspectRatio="xMidYMid slice"
              />
            )}

            {/* Cad Dimension Grid Overlay */}
            {showGrid && (
              <rect
                x="0"
                y="0"
                width={canvasWidth}
                height={canvasHeight}
                fill="url(#tile-cad-grid-100)"
                pointerEvents="none"
                opacity="0.7"
              />
            )}

            {/* Existing Vector Paths — Phase 2: sourced from useProjectStore,
                each wrapped in a <g transform> so points stay untouched. */}
            {visibleObjects.map((path) => {
              const d = pointsToPathD(path.points);
              const resolvedLayer = getResolvedLayerId(path);
              const isCut = resolvedLayer === 'layer_cut';
              const isInlay = resolvedLayer === 'layer_inlay';
              const isSelected = selectedObjectIds.includes(path.id);
              const isBeingDragged = dragObjectId === path.id && previewTransform;
              const effectiveTransform = isBeingDragged ? (previewTransform as ObjectTransform) : getTransform(path);
              const locked = isLayerLocked(resolvedLayer);

              return (
                <g
                  key={path.id}
                  id={path.id}
                  transform={toSvgTransform(effectiveTransform)}
                  onMouseDown={(e) => handleObjectMouseDown(e, path)}
                  style={{ cursor: activeTool === 'select' && !locked ? 'move' : undefined }}
                >
                  {/* Kerf Offset Boundary (0.75mm waterjet compensation) */}
                  {showKerfOffset && (
                    <path
                      d={d}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth={path.strokeWidth + 2.5}
                      strokeDasharray="4,4"
                      opacity="0.4"
                    />
                  )}

                  {/* Main Vector Stroke/Fill */}
                  <path
                    d={d}
                    fill={isInlay && path.closed ? path.color : 'none'}
                    fillOpacity={isInlay ? 0.85 : 0}
                    stroke={isSelected ? '#38bdf8' : path.color}
                    strokeWidth={isSelected ? path.strokeWidth + 1 : path.strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter={isInlay ? 'url(#gold-inlay-glow)' : undefined}
                  />

                  {/* Point anchors */}
                  {path.points.map((pt, pIdx) => (
                    <circle
                      key={pIdx}
                      cx={pt.x}
                      cy={pt.y}
                      r="3"
                      fill="#06b6d4"
                      stroke="#0f172a"
                      strokeWidth="1"
                    />
                  ))}
                </g>
              );
            })}

            {/* Selection outline + transform handles (world-space, drawn on
                top so rotate/scale handles stay a consistent screen size) */}
            {(() => {
              const selected = getObjectById(activeObjectId);
              if (!selected || activeTool !== 'select') return null;
              const locked = isLayerLocked(getResolvedLayerId(selected));
              if (locked) return null;
              const effective =
                dragObjectId === selected.id && previewTransform
                  ? { ...selected, transform: previewTransform }
                  : selected;
              const b = getObjectBounds(effective);
              const cx = (b.minX + b.maxX) / 2;
              const handleY = b.minY - 24;

              return (
                <g pointerEvents="none">
                  <rect
                    x={b.minX - 4}
                    y={b.minY - 4}
                    width={b.maxX - b.minX + 8}
                    height={b.maxY - b.minY + 8}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.2"
                    strokeDasharray="5,3"
                  />
                  <line x1={cx} y1={b.minY - 4} x2={cx} y2={handleY} stroke="#38bdf8" strokeWidth="1" />
                  {/* Rotate handle */}
                  <circle
                    cx={cx}
                    cy={handleY}
                    r="7"
                    fill="#141416"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    pointerEvents="auto"
                    style={{ cursor: 'grab' }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      startDrag('rotate', selected, getMmCoordinates(e.nativeEvent as unknown as MouseEvent));
                    }}
                  />
                  {/* Scale handle (bottom-right corner) */}
                  <rect
                    x={b.maxX}
                    y={b.maxY}
                    width="10"
                    height="10"
                    fill="#141416"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    pointerEvents="auto"
                    style={{ cursor: 'nwse-resize' }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      startDrag('scale', selected, getMmCoordinates(e.nativeEvent as unknown as MouseEvent));
                    }}
                  />
                </g>
              );
            })()}

            {/* Active Pen Drawing Line */}
            {isDrawing && currentPathPoints.length > 0 && (
              <g>
                <path
                  d={pointsToPathD(currentPathPoints)}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeDasharray="6,4"
                />
                {currentPathPoints.map((pt, idx) => (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r="4"
                    fill="#38bdf8"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                ))}
              </g>
            )}

            {/* Outer Precision Chamfer / Rectified Cut Border */}
            <rect
              x="2"
              y="2"
              width={canvasWidth - 4}
              height={canvasHeight - 4}
              fill="none"
              stroke="#64748b"
              strokeWidth="1.5"
              strokeDasharray="8,4"
            />
          </svg>
        </div>

        {/* Bottom Status bar for 2D Viewport */}
        <div className="absolute bottom-2 right-2 flex items-center gap-2 bg-[#141416]/95 backdrop-blur border border-[#2A2A2E] px-2.5 py-1 rounded text-xs">
          <label className="flex items-center gap-1.5 text-[10px] text-[#D1D1D1] cursor-pointer font-mono">
            <input
              type="checkbox"
              checked={showKerfOffset}
              onChange={() => toggleKerfOffset()}
              className="accent-[#00F0FF] rounded w-3 h-3 bg-[#1E1E20] border-[#2A2A2E]"
            />
            <span>KERF COMP (0.75mm)</span>
          </label>
          <span className="text-[#2A2A2E]">|</span>
          <label className="flex items-center gap-1.5 text-[10px] text-[#D1D1D1] cursor-pointer font-mono">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={() => toggleGrid()}
              className="accent-[#00F0FF] rounded w-3 h-3 bg-[#1E1E20] border-[#2A2A2E]"
            />
            <span>100mm GRID</span>
          </label>
          <span className="text-[#2A2A2E]">|</span>
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
            className="text-[#D1D1D1]/60 hover:text-white"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
            className="text-[#D1D1D1]/60 hover:text-white"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPanOffset({ x: 0, y: 0 });
            }}
            className="text-[#D1D1D1]/60 hover:text-white"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
