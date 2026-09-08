import { useEffect } from 'react';
import { useTileStore } from '../store/useTileStore';

export interface ShortcutHandlers {
  onOpenBundleModal?: () => void;
  onOpenAgentModal?: () => void;
  onOpenFactoryModal?: () => void;
  onOpenPythonModal?: () => void;
  onOpenShortcutsModal?: () => void;
  onToggleSidebar?: () => void;
  onSaveProject?: () => void;
  onCloseVectorLoop?: () => void;
  onCompleteOpenVectorPath?: () => void;
  onCancelVectorPath?: () => void;
  onToggleKerf?: () => void;
  onToggleGrid?: () => void;
}

/**
 * Custom Hook for centralizing global, editing, camera, and parametric shortcuts
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers = {}) {
  const {
    setViewportMode,
    setActiveTool,
    setApplicationMode,
    referenceAssets,
    setFinish,
    expandedViewport,
    setExpandedViewport,
    toggleExpandedViewport,
  } = useTileStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target as HTMLElement)?.isContentEditable;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      // Handle Escape even if in input (to blur)
      if (e.key === 'Escape') {
        if (isInput) {
          (e.target as HTMLElement).blur();
          return;
        }
        if (handlers.onCancelVectorPath) {
          handlers.onCancelVectorPath();
        }
        return;
      }

      // If user is currently typing in an input/textarea, do NOT trigger single-key or navigation hotkeys
      if (isInput) {
        // Special case: Allow Ctrl+S / Ctrl+E to still trigger
        if (isCtrlOrCmd && (e.key.toLowerCase() === 's' || e.key.toLowerCase() === 'e')) {
          e.preventDefault();
          if (e.key.toLowerCase() === 's') handlers.onSaveProject?.();
          if (e.key.toLowerCase() === 'e') handlers.onOpenBundleModal?.();
        }
        return;
      }

      // 1. GLOBAL ACTIONS
      // Ctrl/Cmd + Shift + F -> Factory Cloud Sync
      if (isCtrlOrCmd && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
        e.preventDefault();
        handlers.onOpenFactoryModal?.();
        return;
      }

      // Ctrl/Cmd + S -> Save Project State / Passport
      if (isCtrlOrCmd && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handlers.onSaveProject?.();
        return;
      }

      // Ctrl/Cmd + E -> Generate Bundle (.ZIP)
      if (isCtrlOrCmd && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handlers.onOpenBundleModal?.();
        return;
      }

      // Ctrl/Cmd + Q -> Run AI QC Safety Audit
      if (isCtrlOrCmd && e.key.toLowerCase() === 'q') {
        e.preventDefault();
        handlers.onOpenAgentModal?.();
        return;
      }

      // Tab -> Toggle Left CAD Parametrics Sidebar
      if (e.key === 'Tab' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        handlers.onToggleSidebar?.();
        return;
      }

      // ? or Shift + / -> Open Shortcuts Help Modal
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        handlers.onOpenShortcutsModal?.();
        return;
      }

      // 2. CAD PARAMETRIC FOCUS & PRESETS (Alt + ...)
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const k = e.key.toLowerCase();
        if (k === 'w') {
          e.preventDefault();
          const el = document.getElementById('slider-dim-width') as HTMLInputElement | null;
          el?.focus();
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
        if (k === 'h') {
          e.preventDefault();
          const el = document.getElementById('slider-dim-height') as HTMLInputElement | null;
          el?.focus();
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
        if (k === 't') {
          e.preventDefault();
          const el = document.getElementById('slider-dim-thickness') as HTMLInputElement | null;
          el?.focus();
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
        if (e.key === '1') {
          e.preventDefault();
          setFinish({ glaze_type: 'matte' });
          return;
        }
        if (e.key === '2') {
          e.preventDefault();
          setFinish({ glaze_type: 'gloss' });
          return;
        }
        if (e.key === '3') {
          e.preventDefault();
          setFinish({ glaze_type: 'satin' });
          return;
        }
        if (e.key === '4') {
          e.preventDefault();
          setFinish({ glaze_type: 'luster' });
          return;
        }
      }

      // 3. VIEWPORT CONTROLS (Single Keys)
      if (!isCtrlOrCmd && !e.altKey) {
        if (e.key === '1') {
          e.preventDefault();
          setExpandedViewport('vp1');
          setViewportMode('viewport_2d');
          return;
        }
        if (e.key === '2') {
          e.preventDefault();
          setExpandedViewport('vp2');
          setViewportMode('viewport_3d');
          return;
        }
        if (e.key === '3') {
          e.preventDefault();
          setExpandedViewport('vp3');
          setViewportMode('viewport_side');
          return;
        }
        if (e.key === '4') {
          e.preventDefault();
          setExpandedViewport('vp4');
          setViewportMode('viewport_back');
          return;
        }
        // Spacebar -> Toggle between Active Viewport Fullscreen and 4-QUAD Split View
        if (e.code === 'Space') {
          e.preventDefault();
          toggleExpandedViewport();
          return;
        }
        // M -> Toggle workspace mode (Single Tile <-> Floor Span Layout)
        if (e.key.toLowerCase() === 'm') {
          e.preventDefault();
          const nextMode =
            referenceAssets.application_mode === 'single_tile' ? 'full_floor_span' : 'single_tile';
          setApplicationMode(nextMode);
          return;
        }

        // 4. 2D VECTOR CANVAS SHORTCUTS
        if (e.key.toLowerCase() === 'v') {
          e.preventDefault();
          setActiveTool('select');
          return;
        }
        if (e.key.toLowerCase() === 'p') {
          e.preventDefault();
          setActiveTool('pen');
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          if (e.shiftKey) {
            handlers.onCompleteOpenVectorPath?.();
          } else {
            handlers.onCloseVectorLoop?.();
          }
          return;
        }
        if (e.key.toLowerCase() === 'k') {
          e.preventDefault();
          handlers.onToggleKerf?.();
          return;
        }
        if (e.key.toLowerCase() === 'g') {
          e.preventDefault();
          handlers.onToggleGrid?.();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    handlers,
    setViewportMode,
    setActiveTool,
    setApplicationMode,
    referenceAssets.application_mode,
    setFinish,
    expandedViewport,
    setExpandedViewport,
    toggleExpandedViewport,
  ]);
}
