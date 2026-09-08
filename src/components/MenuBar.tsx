import React, { useRef, useState } from 'react';
import { useTileStore } from '../../store/useTileStore';
import { useProjectStore } from '../../store/useProjectStore';

interface MenuItem {
  label: string;
  action?: () => void;
  planned?: boolean; // rendered disabled with "Planned" note instead of faking behavior
  shortcut?: string;
}

interface MenuDef {
  label: string;
  items: MenuItem[];
}

interface MenuBarProps {
  onOpenBundleModal: () => void;
  onOpenFactoryModal: () => void;
  onOpenAgentModal: () => void;
}

export const MenuBar: React.FC<MenuBarProps> = ({
  onOpenBundleModal,
  onOpenFactoryModal,
  onOpenAgentModal,
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { downloadProject, newProject, parseProjectFile, loadProject, projectName, isDirty } =
    useProjectStore();

  const {
    viewportMode,
    setViewportMode,
    showGrid,
    toggleGrid,
    showKerfOffset,
    toggleKerfOffset,
    isWireframe,
    setIsWireframe,
    productionMode,
    setProductionMode,
  } = useTileStore();

  const handleOpenClick = () => fileInputRef.current?.click();

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const project = parseProjectFile(text);
      loadProject(project);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to open project file.');
    }
  };

  const menus: MenuDef[] = [
    {
      label: 'File',
      items: [
        { label: 'New Project', action: () => newProject() },
        { label: 'Open Project…', action: handleOpenClick },
        { label: `Save Project (${isDirty ? 'unsaved' : 'saved'})`, action: () => downloadProject() },
        { label: 'Save As…', action: () => downloadProject() },
      ],
    },
    {
      label: 'Edit',
      items: [
        { label: 'Undo', planned: true },
        { label: 'Redo', planned: true },
      ],
    },
    {
      label: 'View',
      items: [
        { label: 'Quad View', action: () => setViewportMode('quad') },
        { label: '2D Design View', action: () => setViewportMode('viewport_2d') },
        { label: '3D View', action: () => setViewportMode('viewport_3d') },
        { label: `Grid: ${showGrid ? 'On' : 'Off'}`, action: toggleGrid },
        { label: `Kerf Offset: ${showKerfOffset ? 'On' : 'Off'}`, action: toggleKerfOffset },
        { label: `Wireframe: ${isWireframe ? 'On' : 'Off'}`, action: () => setIsWireframe(!isWireframe) },
      ],
    },
    {
      label: 'Object',
      items: [
        { label: 'Duplicate', planned: true },
        { label: 'Group', planned: true },
        { label: 'Multi-object scenes', planned: true },
      ],
    },
    {
      label: 'Design',
      items: [
        { label: 'Pattern Engine', planned: true },
        { label: 'Sketch → Vector', planned: true },
      ],
    },
    {
      label: 'Material',
      items: [
        { label: 'Open Material Library', action: () => useTileStore.getState().setMaterialDrawerOpen(true) },
      ],
    },
    {
      label: 'Geometry',
      items: [
        { label: 'Boolean Operations', planned: true },
        { label: 'Bevel / Chamfer Editor', planned: true },
      ],
    },
    {
      label: '3D',
      items: [
        { label: 'Toggle Cross-Section', action: () => useTileStore.getState().setIsCrossSectionActive(!useTileStore.getState().isCrossSectionActive) },
        { label: 'Toggle Auto-Rotate', action: () => useTileStore.getState().setIsAutoRotate(!useTileStore.getState().isAutoRotate) },
      ],
    },
    {
      label: 'Reference',
      items: [
        { label: 'Visual DNA Extraction', planned: true },
        { label: 'Natural Stone Analysis', planned: true },
      ],
    },
    {
      label: 'Manufacturing',
      items: [
        { label: `Production Mode: ${productionMode}`, planned: true },
        { label: 'Run Agent Pipeline (demo)', action: onOpenAgentModal },
        { label: 'Factory Transfer…', action: onOpenFactoryModal },
      ],
    },
    {
      label: 'Export',
      items: [
        { label: 'Generate Production Bundle…', action: onOpenBundleModal },
      ],
    },
  ];

  const handleItemClick = (item: MenuItem) => {
    if (item.planned) return;
    item.action?.();
    setOpenMenu(null);
  };

  return (
    <div className="h-7 bg-[#0E0E10] border-b border-[#242428] flex items-center px-2 gap-0.5 text-[11px] font-sans shrink-0 relative z-40 select-none">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFileSelected}
      />
      {menus.map((menu) => (
        <div key={menu.label} className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === menu.label ? null : menu.label)}
            onMouseEnter={() => openMenu && setOpenMenu(menu.label)}
            className={`px-2 py-0.5 rounded-sm cursor-pointer transition ${
              openMenu === menu.label
                ? 'bg-[#00F0FF] text-black'
                : 'text-[#A0A0A8] hover:text-white hover:bg-[#1E1E22]'
            }`}
          >
            {menu.label}
          </button>
          {openMenu === menu.label && (
            <div
              className="absolute left-0 top-full mt-0.5 min-w-[220px] bg-[#161619] border border-[#2E2E34] rounded shadow-2xl py-1"
              onMouseLeave={() => setOpenMenu(null)}
            >
              {menu.items.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleItemClick(item)}
                  disabled={item.planned}
                  className={`w-full text-left px-3 py-1.5 flex items-center justify-between gap-3 ${
                    item.planned
                      ? 'text-[#55555C] cursor-not-allowed'
                      : 'text-[#D1D1D1] hover:bg-[#222228] hover:text-[#00F0FF] cursor-pointer'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.planned && (
                    <span className="text-[8px] uppercase tracking-wider border border-[#33333A] rounded px-1 text-[#55555C]">
                      Planned
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
      <div className="flex-1" />
      <span className="text-[#55555C] font-mono pr-1 truncate max-w-[220px]">
        {projectName}
        {isDirty ? ' •' : ''}
      </span>
    </div>
  );
};
