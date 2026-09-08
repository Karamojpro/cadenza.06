import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { MultiAngleInspector } from './components/MultiAngleInspector';
import { TopHeader } from './components/TopHeader';
import { MenuBar } from './components/workspace/MenuBar';
import { Toolbox } from './components/workspace/Toolbox';
import { DevOverlayDrawer } from './components/DevOverlayDrawer';
import { ProductionBundleModal } from './components/ProductionBundleModal';
import { AgentOrchestrationModal } from './components/AgentOrchestrationModal';
import { FactoryTransferModal } from './components/FactoryTransferModal';
import { PythonCodeViewerModal } from './components/PythonCodeViewerModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { ReleaseCommandCenter } from './components/ReleaseCommandCenter';
import { MaterialLibraryDrawer } from './components/MaterialLibraryDrawer';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useTileStore } from './store/useTileStore';
import {
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  Terminal,
} from 'lucide-react';

export default function App() {
  const {
    dimensions,
    calculations,
    activePassport,
    isSidebarOpen,
    toggleSidebar,
    updatePassportStatus,
    showKerfOffset,
    toggleKerfOffset,
    showGrid,
    toggleGrid,
    isDevModeEnabled,
    toggleDevMode,
    setDevMode,
    setActiveDevTab,
    qcNotificationToast,
    dismissQcToast,
    isMaterialDrawerOpen,
    setMaterialDrawerOpen,
  } = useTileStore();

  const [isBundleModalOpen, setIsBundleModalOpen] = useState(false);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isFactoryModalOpen, setIsFactoryModalOpen] = useState(false);
  const [isPythonModalOpen, setIsPythonModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isReleaseCenterOpen, setIsReleaseCenterOpen] = useState(false);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);

  // One-time correction of initial camReport/calculations: useTileStore's
  // module-level defaults are computed against an empty design (to avoid a
  // circular module-init dependency on useProjectStore's default objects —
  // see useTileStore.ts). This runs once, after both stores exist, to bring
  // them in line with the real starter pattern.
  useEffect(() => {
    useTileStore.getState().recomputeMetrics();
  }, []);

  const handleSaveProject = () => {
    updatePassportStatus('qc_verified');
    setSaveNotification(`Project & Passport ${activePassport.passport_id} saved successfully!`);
    setTimeout(() => setSaveNotification(null), 3500);
  };

  // Wire up Global Keyboard Shortcuts
  useKeyboardShortcuts({
    onOpenBundleModal: () => setIsBundleModalOpen(true),
    onOpenAgentModal: () => setIsAgentModalOpen(true),
    onOpenFactoryModal: () => setIsFactoryModalOpen(true),
    onOpenPythonModal: () => setIsPythonModalOpen(true),
    onOpenShortcutsModal: () => setIsShortcutsModalOpen(true),
    onToggleSidebar: () => toggleSidebar(),
    onSaveProject: handleSaveProject,
    onCloseVectorLoop: () => window.dispatchEvent(new CustomEvent('cad-close-vector-loop')),
    onCompleteOpenVectorPath: () => window.dispatchEvent(new CustomEvent('cad-complete-open-path')),
    onCancelVectorPath: () => window.dispatchEvent(new CustomEvent('cad-cancel-path')),
    onToggleKerf: () => toggleKerfOffset(),
    onToggleGrid: () => toggleGrid(),
  });

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0A0A0B] text-[#D1D1D1] overflow-hidden font-sans select-none">
      {/* 0. Professional Menu Bar: File / Edit / View / Object / Design / Material / Geometry / 3D / Reference / Manufacturing / Export */}
      <MenuBar
        onOpenBundleModal={() => setIsBundleModalOpen(true)}
        onOpenFactoryModal={() => setIsFactoryModalOpen(true)}
        onOpenAgentModal={() => setIsAgentModalOpen(true)}
      />

      {/* 1. Designer-First Top Navigation Bar */}
      <TopHeader
        onOpenBundleModal={() => setIsBundleModalOpen(true)}
        onOpenFactoryModal={() => setIsFactoryModalOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
      />

      {/* Save Project Feedback Toast */}
      {saveNotification && (
        <div className="absolute top-14 right-4 z-50 bg-[#161619] border border-[#00F0FF] text-white px-3 py-2 rounded shadow-2xl flex items-center gap-2 text-xs font-mono animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-[#00F0FF]" />
          <span>{saveNotification}</span>
        </div>
      )}

      {/* Non-Intrusive Manufacturing Constraint Alert Toast (when Dev Mode is closed) */}
      {qcNotificationToast && !isDevModeEnabled && (
        <div className="absolute bottom-12 right-4 z-50 bg-[#18181B]/95 backdrop-blur border border-amber-500/80 text-amber-200 px-3.5 py-2.5 rounded shadow-2xl flex items-center gap-3 text-xs font-mono animate-in fade-in slide-in-from-bottom-2 max-w-md">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="flex-1">
            <div className="font-bold text-amber-300 text-[11px]">Quality Alert</div>
            <div className="text-[10px] text-amber-200/90 leading-tight">
              {qcNotificationToast.message}
            </div>
          </div>
          <button
            onClick={() => {
              setDevMode(true);
              setActiveDevTab('cam_qc');
              dismissQcToast();
            }}
            className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 text-[9px] font-bold rounded uppercase cursor-pointer"
          >
            Inspect
          </button>
          <button
            onClick={dismissQcToast}
            className="p-1 text-amber-400/60 hover:text-amber-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Main Studio Workspace: Left Parameter Controls + Center Multi-Angle Inspector */}
      <div className="flex-1 flex min-h-0 overflow-hidden bg-[#0A0A0B]">
        <Toolbox />
        {isSidebarOpen && (
          <Sidebar
            onOpenBundleModal={() => setIsBundleModalOpen(true)}
            onOpenAgentModal={() => setIsAgentModalOpen(true)}
            onOpenFactoryModal={() => setIsFactoryModalOpen(true)}
            onOpenPythonModal={() => setIsPythonModalOpen(true)}
          />
        )}
        <MultiAngleInspector />
      </div>

      {/* 3. Developer & Telemetry Overlay Drawer */}
      <DevOverlayDrawer />

      <button onClick={() => setIsReleaseCenterOpen(true)} className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 px-3 py-1.5 rounded border border-[#303038] bg-[#161619]/95 text-[9px] font-mono text-zinc-300 hover:text-[#00F0FF] hover:border-[#00F0FF] shadow-xl">RELEASE CENTER · PHASE 4–6</button>
      {isReleaseCenterOpen && <ReleaseCommandCenter onClose={() => setIsReleaseCenterOpen(false)} />}

      {/* 4. Streamlined Industrial Designer Footer */}
      <footer className="h-8 border-t border-[#242428] bg-[#121214] flex items-center justify-between px-4 text-[9px] font-mono text-[#888890] shrink-0 z-30">
        <div className="flex gap-4 sm:gap-6 items-center">
          <div className="flex items-center gap-2">
            <span className="text-[#D1D1D1] font-medium">
              FORMAT: {dimensions.width_mm} × {dimensions.height_mm} × {dimensions.thickness_mm} mm
            </span>
          </div>
          <span className="text-[#28282E]">|</span>
          <div>
            KERF: <span className="text-[#00F0FF]">{showKerfOffset ? '0.75mm' : 'OFF'}</span>
          </div>
          <span className="text-[#28282E] hidden sm:inline">|</span>
          <div className="hidden sm:inline">
            GRID: <span className="text-[#D1D1D1]">{showGrid ? '100mm' : 'OFF'}</span>
          </div>
        </div>

        <div className="flex gap-4 sm:gap-6 items-center">
          <span>
            TILE MASS: <strong className="text-[#D4AF37] font-semibold">{calculations.singleTileMassKg} kg</strong>
          </span>
          <span className="text-[#28282E]">|</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <FileCheck className="w-3 h-3" /> ISO 13006 / EN 14411
          </span>
          <span className="text-[#28282E] hidden md:inline">|</span>
          <button
            onClick={toggleDevMode}
            className="hidden md:flex items-center gap-1 hover:text-[#00F0FF] cursor-pointer"
          >
            <Terminal className="w-2.5 h-2.5" />
            <span>{isDevModeEnabled ? 'DEV OVERLAY ACTIVE' : 'DEV DRAWER'}</span>
          </button>
        </div>
      </footer>

      {/* 5. Production Modals */}
      <ProductionBundleModal
        isOpen={isBundleModalOpen}
        onClose={() => setIsBundleModalOpen(false)}
      />

      <AgentOrchestrationModal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
      />

      <FactoryTransferModal
        isOpen={isFactoryModalOpen}
        onClose={() => setIsFactoryModalOpen(false)}
      />

      <PythonCodeViewerModal
        isOpen={isPythonModalOpen}
        onClose={() => setIsPythonModalOpen(false)}
      />

      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </div>
  );
}
