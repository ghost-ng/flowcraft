// ---------------------------------------------------------------------------
// styles.ts -- Visual theme types for diagrams
// ---------------------------------------------------------------------------

// ---- Diagram style identifiers --------------------------------------------

export type DiagramStyleId =
  | 'corporate'
  | 'blueprint'
  | 'handDrawn'
  | 'minimalist'
  | 'retro'
  | 'neon'
  | 'pastel'
  | 'highContrast'
  | 'wireframe'
  | 'watercolor'
  | 'darkMode'
  | 'gradient'
  | 'flat'
  | 'glass';

// ---- Palette identifiers --------------------------------------------------

export type PaletteId =
  | 'default'
  | 'ocean'
  | 'forest'
  | 'sunset'
  | 'monochrome'
  | 'candy'
  | 'earth'
  | 'neon'
  | 'pastel'
  | 'corporate';

// ---- Grid style -----------------------------------------------------------

export type GridStyle = 'dots' | 'lines' | 'cross' | 'none';

// ---- Canvas background settings -------------------------------------------

export interface CanvasStyle {
  background: string;
  gridColor: string;
  gridStyle: GridStyle;
  gridSpacing?: number;
}

// ---- Default node visual properties ---------------------------------------

export interface NodeStyleDefaults {
  fill: string;
  stroke: string;
  strokeWidth: number;
  borderRadius: number;
  shadow: string;
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  fontWeight: number | string;
  opacity?: number;
}

// ---- Default edge visual properties ---------------------------------------

export interface EdgeStyleDefaults {
  stroke: string;
  strokeWidth: number;
  /** Edge routing type name (maps to EdgePathType). */
  type: string;
  animated: boolean;
  /** Default arrowhead type name (maps to ArrowheadType). */
  arrowType: string;
  opacity?: number;
  strokeDasharray?: string;
}

// ---- Full diagram style definition ----------------------------------------

export interface DiagramStyle {
  id: DiagramStyleId;
  name: string;
  description?: string;

  canvas: CanvasStyle;
  nodeDefaults: NodeStyleDefaults;
  edgeDefaults: EdgeStyleDefaults;

  /** Ordered list of accent colors used for auto-coloring. */
  accentColors: string[];
}

// ---- Per-node style overrides (all optional) ------------------------------

export interface NodeStyleOverrides {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  borderRadius?: number;
  shadow?: string;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  fontWeight?: number | string;
  opacity?: number;
  /** Override width (bypasses auto-size). */
  width?: number;
  /** Override height (bypasses auto-size). */
  height?: number;
}

// ---- Per-edge style overrides (all optional) ------------------------------

export interface EdgeStyleOverrides {
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  opacity?: number;
  /** Label font size override. */
  labelFontSize?: number;
  /** Label font color override. */
  labelFontColor?: string;
  /** Label background color override. */
  labelBgColor?: string;
}

// ---- Auto-color mode ------------------------------------------------------

export type AutoColorMode =
  | 'by-depth'
  | 'by-group'
  | 'by-type'
  | 'manual';
