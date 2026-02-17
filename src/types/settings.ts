// ---------------------------------------------------------------------------
// settings.ts -- Application and diagram settings
// ---------------------------------------------------------------------------

import type { DiagramStyleId, PaletteId, AutoColorMode, GridStyle } from './styles';

// ---- Snap settings --------------------------------------------------------

export interface SnapSettings {
  /** Snap nodes to grid when dragging. */
  snapToGrid: boolean;
  /** Grid spacing in pixels. */
  gridSize: number;
  /** Snap nodes to other node edges / centers. */
  snapToNodes: boolean;
  /** Snap distance threshold in pixels. */
  snapThreshold: number;
  /** Show alignment guidelines while dragging. */
  showGuides: boolean;
}

// ---- Interaction settings -------------------------------------------------

export interface InteractionSettings {
  /** Allow multi-select via click + modifier key. */
  multiSelectEnabled: boolean;
  /** Modifier key for multi-select: 'shift' | 'ctrl' | 'meta'. */
  multiSelectKey: 'shift' | 'ctrl' | 'meta';
  /** Enable box / lasso selection. */
  selectionMode: 'partial' | 'full';
  /** Enable panning with scroll wheel. */
  panOnScroll: boolean;
  /** Scroll direction for panning: 'free' | 'horizontal' | 'vertical'. */
  panOnScrollMode: 'free' | 'horizontal' | 'vertical';
  /** Enable zoom with scroll wheel. */
  zoomOnScroll: boolean;
  /** Minimum zoom level. */
  minZoom: number;
  /** Maximum zoom level. */
  maxZoom: number;
  /** Enable double-click to zoom in. */
  zoomOnDoubleClick: boolean;
  /** Enable keyboard shortcuts. */
  keyboardShortcutsEnabled: boolean;
}

// ---- Canvas display settings ----------------------------------------------

export interface CanvasSettings {
  /** Active diagram style preset. */
  diagramStyleId: DiagramStyleId;
  /** Active color palette. */
  paletteId: PaletteId;
  /** How nodes are automatically colored. */
  autoColorMode: AutoColorMode;
  /** Grid display style. */
  gridStyle: GridStyle;
  /** Grid spacing in pixels. */
  gridSpacing: number;
  /** Whether to show the minimap. */
  showMinimap: boolean;
  /** Whether to show the controls panel. */
  showControls: boolean;
  /** Canvas background color (overrides style preset). */
  backgroundColor?: string;
}

// ---- Auto-layout settings -------------------------------------------------

export type LayoutDirection = 'TB' | 'BT' | 'LR' | 'RL';
export type LayoutAlgorithm = 'dagre' | 'force' | 'tree' | 'radial' | 'manual';

export interface AutoLayoutSettings {
  /** Layout algorithm to use when auto-arranging. */
  algorithm: LayoutAlgorithm;
  /** Primary direction for hierarchical layouts. */
  direction: LayoutDirection;
  /** Horizontal spacing between nodes. */
  nodeSpacingX: number;
  /** Vertical spacing between nodes. */
  nodeSpacingY: number;
  /** Whether to animate the transition when re-laying out. */
  animate: boolean;
  /** Animation duration in milliseconds. */
  animationDuration: number;
}

// ---- Edge defaults --------------------------------------------------------

export interface EdgeSettings {
  /** Default edge routing type. */
  defaultPathType: string;
  /** Default edge animation state. */
  defaultAnimated: boolean;
  /** Default arrowhead on target end. */
  defaultArrowheadEnd: string;
  /** Default arrowhead on source end. */
  defaultArrowheadStart: string;
  /** Whether newly created edges carry dependency metadata. */
  defaultDependencyType: string;
}

// ---- Accessibility settings -----------------------------------------------

export interface AccessibilitySettings {
  /** Use high-contrast borders. */
  highContrast: boolean;
  /** Show focus rings on keyboard navigation. */
  focusRings: boolean;
  /** Enable screen-reader announcements for diagram changes. */
  screenReaderAnnouncements: boolean;
  /** Reduce or disable animations for motion-sensitive users. */
  reduceMotion: boolean;
}

// ---- Top-level settings aggregate -----------------------------------------

export interface AppSettings {
  snap: SnapSettings;
  interaction: InteractionSettings;
  canvas: CanvasSettings;
  autoLayout: AutoLayoutSettings;
  edge: EdgeSettings;
  accessibility: AccessibilitySettings;
  /** Whether to auto-save changes to local storage. */
  autoSave: boolean;
  /** Auto-save debounce interval in milliseconds. */
  autoSaveInterval: number;
  /** Whether to show the welcome / onboarding screen on startup. */
  showWelcome: boolean;
  /** Preferred UI color mode. */
  uiColorMode: 'light' | 'dark' | 'system';
}
