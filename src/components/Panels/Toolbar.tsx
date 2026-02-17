import React, { useCallback, useState } from 'react';
import {
  FilePlus,
  FolderOpen,
  Save,
  Undo2,
  Redo2,
  Copy,
  Clipboard,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid3X3,
  Map,
  Magnet,
  LayoutDashboard,
  ArrowDownUp,
  ArrowLeftRight,
  Palette,
  Moon,
  Sun,
  Image,
  Code,
  Download,
  Workflow,
  LayoutTemplate,
  Paintbrush,
  PaintBucket,
  MousePointer2,
  Ruler,
  AlignLeft,
  AlignCenterHorizontal,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  FlipHorizontal2,
  FlipVertical2,
  RotateCw,
  RotateCcw,
  GitBranch,
  Keyboard,
  MousePointerClick,
  Bug,
  Monitor,
  ClipboardPaste,
  Github,
} from 'lucide-react';

import { useUIStore } from '../../store/uiStore';
import { useStyleStore } from '../../store/styleStore';
import { useFlowStore } from '../../store/flowStore';
import { useExportStore } from '../../store/exportStore';
import { copyImageToClipboard, copySvgToClipboard, importFromJson, exportAsJson } from '../../utils/exportUtils';
import { useDependencyStore } from '../../store/dependencyStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useAutoLayout } from '../../hooks/useAutoLayout';
import * as alignment from '../../utils/alignmentUtils';
import { mirrorHorizontal, mirrorVertical, rotateArrangement } from '../../utils/transformUtils';
import DiagramStylePicker from '../StylePicker/DiagramStylePicker';
import { log } from '../../utils/logger';

// ---------------------------------------------------------------------------
// Toolbar button
// ---------------------------------------------------------------------------

interface ToolbarButtonProps {
  icon: React.ReactNode;
  tooltip: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  label?: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = React.memo(
  ({ icon, tooltip, onClick, active, disabled, label }) => (
    <button
      data-tooltip={tooltip}
      onClick={onClick}
      disabled={disabled}
      className={`
        relative flex items-center gap-1 px-1.5 py-1 rounded text-xs
        transition-colors duration-100
        ${disabled
          ? 'cursor-not-allowed text-slate-300 dark:text-slate-600'
          : `cursor-pointer ${active
              ? 'bg-primary/10 text-primary'
              : 'text-text-muted hover:bg-slate-100 hover:text-text'
            }`
        }
      `}
    >
      {icon}
      {label && <span className="hidden xl:inline text-[11px]">{label}</span>}
    </button>
  ),
);

ToolbarButton.displayName = 'ToolbarButton';

// ---------------------------------------------------------------------------
// Divider
// ---------------------------------------------------------------------------

const ToolbarDivider: React.FC = () => (
  <div className="w-px h-5 bg-border mx-1" />
);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ToolbarProps {
  /** Zoom in on the canvas (from useReactFlow) */
  onZoomIn?: () => void;
  /** Zoom out on the canvas (from useReactFlow) */
  onZoomOut?: () => void;
  /** Fit all nodes in view (from useReactFlow) */
  onFitView?: () => void;
  /** Undo last action */
  onUndo?: () => void;
  /** Redo last undone action */
  onRedo?: () => void;
  /** Whether undo is available */
  canUndo?: boolean;
  /** Whether redo is available */
  canRedo?: boolean;
  /** Open the template gallery */
  onOpenTemplates?: () => void;
  /** Open the keyboard shortcuts dialog */
  onOpenShortcuts?: () => void;
}

// ---------------------------------------------------------------------------
// Main Toolbar
// ---------------------------------------------------------------------------

const Toolbar: React.FC<ToolbarProps> = ({
  onZoomIn,
  onZoomOut,
  onFitView,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onOpenTemplates,
  onOpenShortcuts,
}) => {
  // UI store
  const gridVisible = useUIStore((s) => s.gridVisible);
  const toggleGrid = useUIStore((s) => s.toggleGrid);
  const minimapVisible = useUIStore((s) => s.minimapVisible);
  const toggleMinimap = useUIStore((s) => s.toggleMinimap);
  const snapEnabled = useUIStore((s) => s.snapEnabled);
  const toggleSnap = useUIStore((s) => s.toggleSnap);
  const propertiesPanelOpen = useUIStore((s) => s.propertiesPanelOpen);
  const togglePropertiesPanel = useUIStore((s) => s.togglePropertiesPanel);
  const rulerVisible = useUIStore((s) => s.rulerVisible);
  const toggleRuler = useUIStore((s) => s.toggleRuler);
  const gridStyle = useUIStore((s) => s.gridStyle);
  const setGridStyle = useUIStore((s) => s.setGridStyle);
  const gridSpacing = useUIStore((s) => s.gridSpacing);
  const setGridSpacing = useUIStore((s) => s.setGridSpacing);

  // Style store
  const darkMode = useStyleStore((s) => s.darkMode);
  const toggleDarkMode = useStyleStore((s) => s.toggleDarkMode);

  // Settings store
  const debugMode = useSettingsStore((s) => s.debugMode);
  const toggleDebugMode = useSettingsStore((s) => s.toggleDebugMode);

  // Flow store
  const selectedNodes = useFlowStore((s) => s.selectedNodes);
  const selectedEdges = useFlowStore((s) => s.selectedEdges);
  const removeNode = useFlowStore((s) => s.removeNode);
  const setNodes = useFlowStore((s) => s.setNodes);
  const setEdges = useFlowStore((s) => s.setEdges);

  // Export store
  const setExportDialogOpen = useExportStore((s) => s.setDialogOpen);

  // Dependency store
  const showBadges = useDependencyStore((s) => s.showBadges);
  const toggleBadges = useDependencyStore((s) => s.toggleBadges);
  // Auto layout
  const { applyLayout } = useAutoLayout();

  // Selection color
  const selectionColor = useUIStore((s) => s.selectionColor);
  const setSelectionColor = useUIStore((s) => s.setSelectionColor);

  // Format painter state
  const formatPainterActive = useUIStore((s) => s.formatPainterActive);
  const setFormatPainterActive = useUIStore((s) => s.setFormatPainterActive);
  const setFormatPainterNodeStyle = useUIStore((s) => s.setFormatPainterNodeStyle);
  const setFormatPainterEdgeStyle = useUIStore((s) => s.setFormatPainterEdgeStyle);
  const clearFormatPainter = useUIStore((s) => s.clearFormatPainter);

  // Style picker state
  const [stylePickerOpen, setStylePickerOpen] = useState(false);

  // Grid options dropdown state
  const [gridOptionsOpen, setGridOptionsOpen] = useState(false);

  // Transform dropdown states
  const [alignDropdownOpen, setAlignDropdownOpen] = useState(false);
  const [mirrorDropdownOpen, setMirrorDropdownOpen] = useState(false);
  const [rotateDropdownOpen, setRotateDropdownOpen] = useState(false);

  // Selection color picker state
  const [selectionColorOpen, setSelectionColorOpen] = useState(false);

  const multiSelected = selectedNodes.length >= 2;

  // ---- Actions ------------------------------------------------------------

  const handleCopyImage = useCallback(async () => {
    try {
      await copyImageToClipboard();
    } catch (e) {
      log.error('Copy image to clipboard failed', e);
    }
  }, []);

  const handleCopySvg = useCallback(async () => {
    try {
      await copySvgToClipboard();
    } catch (e) {
      log.error('Copy SVG to clipboard failed', e);
    }
  }, []);

  const handleOpenExport = useCallback(() => {
    setExportDialogOpen(true);
  }, [setExportDialogOpen]);

  const handleNew = useCallback(async () => {
    const confirmed = await useUIStore.getState().showConfirm(
      'Start a new diagram? Unsaved changes will be lost.',
      { title: 'New Diagram', confirmLabel: 'New Diagram', cancelLabel: 'Cancel' },
    );
    if (confirmed) {
      setNodes([]);
      setEdges([]);
    }
  }, [setNodes, setEdges]);

  const handleDelete = useCallback(() => {
    for (const nodeId of selectedNodes) {
      removeNode(nodeId);
    }
  }, [selectedNodes, removeNode]);

  const handleSave = useCallback(() => {
    exportAsJson({ includeViewport: true, includeStyles: true, includeMetadata: true, pretty: true });
  }, []);

  const handleOpen = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const result = importFromJson(text);
        const msg = `Imported ${result.nodeCount} nodes and ${result.edgeCount} edges`;
        if (result.warnings.length > 0) {
          log.warn('Import warnings', result.warnings);
          useUIStore.getState().showToast(`${msg} (${result.warnings.length} warnings — see console)`, 'warning');
        } else {
          useUIStore.getState().showToast(msg, 'success');
        }
      } catch (err) {
        log.error('Failed to load file', err);
        useUIStore.getState().showToast(`Failed to load file: ${err instanceof Error ? err.message : 'unknown error'}`, 'error');
      }
    };
    input.click();
  }, []);

  const handlePasteJson = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        useUIStore.getState().showToast('Clipboard is empty', 'warning');
        return;
      }
      const result = importFromJson(text);
      const msg = `Imported ${result.nodeCount} nodes and ${result.edgeCount} edges`;
      if (result.warnings.length > 0) {
        log.warn('Import warnings', result.warnings);
        useUIStore.getState().showToast(`${msg} (${result.warnings.length} warnings — see console)`, 'warning');
      } else {
        useUIStore.getState().showToast(msg, 'success');
      }
    } catch (err) {
      log.error('Paste JSON failed', err);
      useUIStore.getState().showToast(`Paste failed: ${err instanceof Error ? err.message : 'unknown error'}`, 'error');
    }
  }, []);

  const handleAutoArrange = useCallback(() => {
    applyLayout('TB');
  }, [applyLayout]);

  const handleVerticalLayout = useCallback(() => {
    applyLayout('TB');
  }, [applyLayout]);

  const handleHorizontalLayout = useCallback(() => {
    applyLayout('LR');
  }, [applyLayout]);

  const handleFormatPainter = useCallback(() => {
    if (formatPainterActive) {
      // Toggle off
      clearFormatPainter();
      return;
    }
    // Copy format from the selected node or edge
    const { nodes, edges } = useFlowStore.getState();
    if (selectedNodes.length > 0) {
      const node = nodes.find((n) => n.id === selectedNodes[0]);
      if (node) {
        const d = node.data;
        setFormatPainterNodeStyle({
          color: d.color,
          borderColor: d.borderColor,
          textColor: d.textColor,
          fontSize: d.fontSize,
          fontWeight: d.fontWeight,
          fontFamily: d.fontFamily,
          borderStyle: d.borderStyle,
          borderWidth: d.borderWidth,
          borderRadius: d.borderRadius,
          opacity: d.opacity,
          textAlign: (d as Record<string, unknown>).textAlign as string | undefined,
        });
        setFormatPainterActive(true);
      }
    } else if (selectedEdges.length > 0) {
      const edge = edges.find((e) => e.id === selectedEdges[0]);
      if (edge) {
        const d = (edge.data || {}) as Record<string, unknown>;
        setFormatPainterEdgeStyle({
          color: d.color as string | undefined,
          thickness: d.thickness as number | undefined,
          opacity: d.opacity as number | undefined,
          strokeDasharray: d.strokeDasharray as string | undefined,
          labelColor: d.labelColor as string | undefined,
        });
        setFormatPainterActive(true);
      }
    }
  }, [formatPainterActive, selectedNodes, selectedEdges, clearFormatPainter, setFormatPainterActive, setFormatPainterNodeStyle, setFormatPainterEdgeStyle]);

  // ---- Transform helpers ---------------------------------------------------

  const getSelectedFlowNodes = useCallback(() => {
    const { nodes } = useFlowStore.getState();
    const idSet = new Set(selectedNodes);
    return nodes.filter((n) => idSet.has(n.id));
  }, [selectedNodes]);

  const applyPositions = useCallback((positions: Map<string, { x: number; y: number }>) => {
    const { updateNodePosition } = useFlowStore.getState();
    for (const [id, pos] of positions) {
      updateNodePosition(id, pos);
    }
  }, []);

  const handleAlign = useCallback((fn: typeof alignment.alignLeft) => {
    const nodes = getSelectedFlowNodes();
    if (nodes.length < 2) return;
    applyPositions(fn(nodes));
    setAlignDropdownOpen(false);
  }, [getSelectedFlowNodes, applyPositions]);

  const handleDistribute = useCallback((fn: typeof alignment.distributeH) => {
    const nodes = getSelectedFlowNodes();
    if (nodes.length < 3) return;
    applyPositions(fn(nodes));
    setAlignDropdownOpen(false);
  }, [getSelectedFlowNodes, applyPositions]);

  const handleMirror = useCallback((fn: typeof mirrorHorizontal) => {
    const nodes = getSelectedFlowNodes();
    if (nodes.length < 2) return;
    applyPositions(fn(nodes));
    setMirrorDropdownOpen(false);
  }, [getSelectedFlowNodes, applyPositions]);

  const handleRotate = useCallback((angleDeg: number) => {
    const nodes = getSelectedFlowNodes();
    if (nodes.length < 2) return;
    applyPositions(rotateArrangement(nodes, angleDeg));
    setRotateDropdownOpen(false);
  }, [getSelectedFlowNodes, applyPositions]);

  const hasSelection = selectedNodes.length > 0 || selectedEdges.length > 0;
  const iconSize = 16;

  return (
    <div
      className={`
        relative flex items-center h-11 px-3 border-b shrink-0 select-none
        ${darkMode
          ? 'bg-surface-alt-dark border-border-dark'
          : 'bg-surface-alt border-border'
        }
      `}
    >
      {/* ---- Logo ---- */}
      <div className="flex items-center gap-2 mr-4">
        <Workflow size={20} className="text-primary" />
        <span className="font-display font-semibold text-sm tracking-tight">
          FlowCraft
        </span>
      </div>

      <ToolbarDivider />

      {/* ---- File group ---- */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton
          icon={<FilePlus size={iconSize} />}
          tooltip="New Diagram"
          label="New"
          onClick={handleNew}
        />
        <ToolbarButton
          icon={<FolderOpen size={iconSize} />}
          tooltip="Open File"
          onClick={handleOpen}
        />
        <ToolbarButton
          icon={<Save size={iconSize} />}
          tooltip="Save (JSON)"
          onClick={handleSave}
        />
        <ToolbarButton
          icon={<LayoutTemplate size={iconSize} />}
          tooltip="Templates"
          label="Templates"
          onClick={onOpenTemplates}
        />
      </div>

      <ToolbarDivider />

      {/* ---- Edit group ---- */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton
          icon={<Undo2 size={iconSize} />}
          tooltip="Undo (Ctrl+Z)"
          onClick={onUndo}
          disabled={!canUndo}
        />
        <ToolbarButton
          icon={<Redo2 size={iconSize} />}
          tooltip="Redo (Ctrl+Shift+Z)"
          onClick={onRedo}
          disabled={!canRedo}
        />
        <ToolbarButton
          icon={<Copy size={iconSize} />}
          tooltip="Copy"
          disabled={!hasSelection}
        />
        <ToolbarButton
          icon={<Clipboard size={iconSize} />}
          tooltip="Paste"
          disabled
        />
        <ToolbarButton
          icon={<Trash2 size={iconSize} />}
          tooltip="Delete Selected"
          onClick={handleDelete}
          disabled={!hasSelection}
        />
      </div>

      <ToolbarDivider />

      {/* ---- View group ---- */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton
          icon={<MousePointer2 size={iconSize} />}
          tooltip="Select (drag to box-select)"
          active={true}
        />
        <ToolbarButton
          icon={<ZoomIn size={iconSize} />}
          tooltip="Zoom In"
          onClick={onZoomIn}
        />
        <ToolbarButton
          icon={<ZoomOut size={iconSize} />}
          tooltip="Zoom Out"
          onClick={onZoomOut}
        />
        <ToolbarButton
          icon={<Maximize size={iconSize} />}
          tooltip="Fit View"
          onClick={onFitView}
        />

        {/* Grid Options dropdown */}
        <div className="relative">
          <ToolbarButton
            icon={<Grid3X3 size={iconSize} />}
            tooltip="Grid Options"
            onClick={() => setGridOptionsOpen(!gridOptionsOpen)}
            active={gridVisible}
          />
          {gridOptionsOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg p-3 z-50 w-48">
              {/* Grid visibility toggle */}
              <button
                onClick={toggleGrid}
                className={`w-full text-left text-xs px-2 py-1.5 rounded mb-2 transition-colors ${
                  gridVisible
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {gridVisible ? 'Hide Grid' : 'Show Grid'}
              </button>

              <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                Grid Style
              </div>
              <div className="flex gap-1 mb-3">
                {(['dots', 'lines', 'cross'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => setGridStyle(style)}
                    className={`flex-1 text-[11px] px-1.5 py-1 rounded transition-colors capitalize ${
                      gridStyle === style
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>

              <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                Grid Size
              </div>
              <div className="flex gap-1">
                {[10, 20, 40, 80].map((size) => (
                  <button
                    key={size}
                    onClick={() => setGridSpacing(size)}
                    className={`flex-1 text-[11px] px-1 py-1 rounded transition-colors ${
                      gridSpacing === size
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {size}px
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Ruler toggle */}
        <ToolbarButton
          icon={<Ruler size={iconSize} />}
          tooltip="Toggle Rulers"
          onClick={toggleRuler}
          active={rulerVisible}
        />

        <ToolbarButton
          icon={<Map size={iconSize} />}
          tooltip="Toggle Minimap"
          onClick={toggleMinimap}
          active={minimapVisible}
        />
        <ToolbarButton
          icon={<Magnet size={iconSize} />}
          tooltip="Toggle Snap"
          onClick={toggleSnap}
          active={snapEnabled}
        />
        <ToolbarButton
          icon={<GitBranch size={iconSize} />}
          tooltip="Toggle Dependency Badges"
          onClick={toggleBadges}
          active={showBadges}
        />
      </div>

      <ToolbarDivider />

      {/* ---- Layout group ---- */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton
          icon={<LayoutDashboard size={iconSize} />}
          tooltip="Auto Arrange"
          onClick={handleAutoArrange}
        />
        <ToolbarButton
          icon={<ArrowDownUp size={iconSize} />}
          tooltip="Vertical Layout"
          onClick={handleVerticalLayout}
        />
        <ToolbarButton
          icon={<ArrowLeftRight size={iconSize} />}
          tooltip="Horizontal Layout"
          onClick={handleHorizontalLayout}
        />
      </div>

      <ToolbarDivider />

      {/* ---- Transform group (Align / Mirror / Rotate) ---- */}
      <div className="flex items-center gap-0.5">
        {/* Align dropdown */}
        <div className="relative">
          <ToolbarButton
            icon={<AlignLeft size={iconSize} />}
            tooltip="Align & Distribute"
            onClick={() => { setAlignDropdownOpen(!alignDropdownOpen); setMirrorDropdownOpen(false); setRotateDropdownOpen(false); }}
            disabled={!multiSelected}
            active={alignDropdownOpen}
          />
          {alignDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg p-1 z-50 min-w-[170px]">
              <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 px-2 pt-1 pb-0.5 uppercase tracking-wider">Align</div>
              <button onClick={() => handleAlign(alignment.alignLeft)} className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">
                <AlignLeft size={13} className="text-slate-400" /> Align Left
              </button>
              <button onClick={() => handleAlign(alignment.alignCenterH)} className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">
                <AlignCenterHorizontal size={13} className="text-slate-400" /> Align Center (H)
              </button>
              <button onClick={() => handleAlign(alignment.alignRight)} className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">
                <AlignRight size={13} className="text-slate-400" /> Align Right
              </button>
              <div className="my-1 h-px bg-slate-200 dark:bg-slate-600" />
              <button onClick={() => handleAlign(alignment.alignTop)} className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">
                <AlignStartVertical size={13} className="text-slate-400" /> Align Top
              </button>
              <button onClick={() => handleAlign(alignment.alignCenterV)} className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">
                <AlignCenterVertical size={13} className="text-slate-400" /> Align Center (V)
              </button>
              <button onClick={() => handleAlign(alignment.alignBottom)} className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">
                <AlignEndVertical size={13} className="text-slate-400" /> Align Bottom
              </button>
              {selectedNodes.length >= 3 && (
                <>
                  <div className="my-1 h-px bg-slate-200 dark:bg-slate-600" />
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 px-2 pt-1 pb-0.5 uppercase tracking-wider">Distribute</div>
                  <button onClick={() => handleDistribute(alignment.distributeH)} className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">
                    <ArrowLeftRight size={13} className="text-slate-400" /> Distribute Horizontally
                  </button>
                  <button onClick={() => handleDistribute(alignment.distributeV)} className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">
                    <ArrowDownUp size={13} className="text-slate-400" /> Distribute Vertically
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Mirror dropdown */}
        <div className="relative">
          <ToolbarButton
            icon={<FlipHorizontal2 size={iconSize} />}
            tooltip="Mirror / Flip"
            onClick={() => { setMirrorDropdownOpen(!mirrorDropdownOpen); setAlignDropdownOpen(false); setRotateDropdownOpen(false); }}
            disabled={!multiSelected}
            active={mirrorDropdownOpen}
          />
          {mirrorDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg p-1 z-50 min-w-[170px]">
              <button onClick={() => handleMirror(mirrorHorizontal)} className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">
                <FlipHorizontal2 size={13} className="text-slate-400" /> Flip Horizontal
              </button>
              <button onClick={() => handleMirror(mirrorVertical)} className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">
                <FlipVertical2 size={13} className="text-slate-400" /> Flip Vertical
              </button>
            </div>
          )}
        </div>

        {/* Rotate dropdown */}
        <div className="relative">
          <ToolbarButton
            icon={<RotateCw size={iconSize} />}
            tooltip="Rotate Arrangement"
            onClick={() => { setRotateDropdownOpen(!rotateDropdownOpen); setAlignDropdownOpen(false); setMirrorDropdownOpen(false); }}
            disabled={!multiSelected}
            active={rotateDropdownOpen}
          />
          {rotateDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg p-1 z-50 min-w-[150px]">
              <button onClick={() => handleRotate(90)} className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">
                <RotateCw size={13} className="text-slate-400" /> 90° Clockwise
              </button>
              <button onClick={() => handleRotate(-90)} className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">
                <RotateCcw size={13} className="text-slate-400" /> 90° Counter-CW
              </button>
              <button onClick={() => handleRotate(180)} className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">
                <RotateCw size={13} className="text-slate-400" /> 180°
              </button>
            </div>
          )}
        </div>
      </div>

      <ToolbarDivider />

      {/* ---- Panels group ---- */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton
          icon={<Palette size={iconSize} />}
          tooltip="Properties Panel"
          onClick={togglePropertiesPanel}
          active={propertiesPanelOpen}
        />
        <ToolbarButton
          icon={<PaintBucket size={iconSize} />}
          tooltip={formatPainterActive ? 'Cancel Format Painter (Esc)' : 'Format Painter'}
          onClick={handleFormatPainter}
          active={formatPainterActive}
          disabled={!hasSelection && !formatPainterActive}
        />
        <ToolbarButton
          icon={<MousePointerClick size={iconSize} />}
          tooltip="Select Same Type"
          onClick={() => {
            const { nodes, setSelectedNodes } = useFlowStore.getState();
            // Find the first selected node (check node.selected directly for reliability)
            const sourceNode = nodes.find((n) => n.selected);
            if (!sourceNode || !sourceNode.data.shape) return;
            const sourceShape = sourceNode.data.shape;
            const sameShapeIds = nodes
              .filter((n) => n.data.shape === sourceShape)
              .map((n) => n.id);
            setSelectedNodes(sameShapeIds);
          }}
          disabled={!hasSelection}
        />
        <ToolbarButton
          icon={<Paintbrush size={iconSize} />}
          tooltip="Style & Palette"
          onClick={() => setStylePickerOpen((o) => !o)}
          active={stylePickerOpen}
        />
      </div>

      {/* ---- Spacer ---- */}
      <div className="flex-1" />

      {/* ---- Export group ---- */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton
          icon={<Image size={iconSize} />}
          tooltip="Copy as Image"
          onClick={handleCopyImage}
        />
        <ToolbarButton
          icon={<Code size={iconSize} />}
          tooltip="Copy as SVG"
          onClick={handleCopySvg}
        />
        <ToolbarButton
          icon={<Download size={iconSize} />}
          tooltip="Export (Ctrl+E)"
          onClick={handleOpenExport}
        />
        <ToolbarButton
          icon={<ClipboardPaste size={iconSize} />}
          tooltip="Import from Clipboard"
          onClick={handlePasteJson}
        />
      </div>

      <ToolbarDivider />

      {/* ---- Keyboard Shortcuts ---- */}
      <ToolbarButton
        icon={<Keyboard size={iconSize} />}
        tooltip="Shortcuts (Ctrl+/)"
        onClick={onOpenShortcuts || (() => {})}
      />

      {/* ---- Selection color picker ---- */}
      <div className="relative">
        <button
          data-tooltip="Selection Highlight Color"
          onClick={() => setSelectionColorOpen((o) => !o)}
          className="relative flex items-center gap-1 px-1.5 py-1 rounded text-xs cursor-pointer transition-colors duration-100 text-text-muted hover:bg-slate-100 hover:text-text dark:hover:bg-slate-700 dark:hover:text-white"
        >
          <MousePointer2 size={iconSize} />
          <span
            className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-[3px] rounded-full"
            style={{ width: 14, backgroundColor: selectionColor }}
          />
        </button>

        {selectionColorOpen && (
          <div className="absolute right-0 top-full mt-1 z-50 p-3 rounded-lg shadow-xl border bg-white dark:bg-slate-800 dark:border-slate-700" style={{ minWidth: 160 }}>
            <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2">Selection Color</div>
            <div className="grid grid-cols-5 gap-2">
              {['#d946ef', '#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6b7280'].map((c) => (
                <button
                  key={c}
                  onClick={() => { setSelectionColor(c); setSelectionColorOpen(false); }}
                  className="w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-125"
                  style={{
                    backgroundColor: c,
                    border: c === selectionColor ? '2px solid #fff' : '2px solid transparent',
                    boxShadow: c === selectionColor ? `0 0 0 2px ${c}` : 'none',
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ---- Presentation mode ---- */}
      <ToolbarButton
        icon={<Monitor size={iconSize} />}
        tooltip="Presentation Mode"
        onClick={() => {
          useUIStore.getState().setPresentationMode(true);
          document.documentElement.requestFullscreen?.().catch(() => {});
        }}
      />

      {/* ---- Debug mode toggle ---- */}
      <ToolbarButton
        icon={<Bug size={iconSize} />}
        tooltip={debugMode ? 'Disable Debug Logging' : 'Enable Debug Logging'}
        onClick={toggleDebugMode}
        active={debugMode}
      />

      {/* ---- Dark mode toggle ---- */}
      <ToolbarButton
        icon={darkMode ? <Sun size={iconSize} /> : <Moon size={iconSize} />}
        tooltip={darkMode ? 'Light Mode' : 'Dark Mode'}
        onClick={toggleDarkMode}
      />

      {/* ---- Style Picker dropdown ---- */}
      <DiagramStylePicker
        open={stylePickerOpen}
        onClose={() => setStylePickerOpen(false)}
      />

      <ToolbarDivider />

      {/* ---- Version + GitHub ---- */}
      <span className="text-[10px] font-mono text-text-muted select-none px-1">
        v{__APP_VERSION__}
      </span>
      <a
        href="https://github.com/ghost-ng/flowcraft"
        target="_blank"
        rel="noopener noreferrer"
        className="p-1 rounded text-text-muted hover:text-text transition-colors"
        data-tooltip="GitHub"
      >
        <Github size={14} />
      </a>
    </div>
  );
};

export default React.memo(Toolbar);
