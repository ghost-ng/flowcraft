// ---------------------------------------------------------------------------
// customBlocks.ts -- User-defined custom block / shape types
// ---------------------------------------------------------------------------

// ---- Block category -------------------------------------------------------

export type BlockCategory =
  | 'general'
  | 'flowchart'
  | 'uml'
  | 'network'
  | 'database'
  | 'cloud'
  | 'custom';

// ---- Handle (connection point) definition ---------------------------------

export type HandlePosition = 'top' | 'right' | 'bottom' | 'left';

export interface HandleDefinition {
  /** Unique id within the block. */
  id: string;
  /** Which side of the shape the handle sits on. */
  position: HandlePosition;
  /** Offset along the edge (0 = start, 1 = end). */
  offset: number;
  /** Whether this handle accepts incoming connections. */
  isSource: boolean;
  /** Whether this handle accepts outgoing connections. */
  isTarget: boolean;
  /** Optional label shown near the handle. */
  label?: string;
}

// ---- Text zone within a custom block --------------------------------------

export interface TextZone {
  /** Unique id within the block. */
  id: string;
  /** Zone label / placeholder. */
  label: string;
  /** Bounding box relative to the block's origin (0-1 normalized). */
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Current text content of the zone. */
  content?: string;
  /** Font size override for this zone. */
  fontSize?: number;
  /** Font color override. */
  fontColor?: string;
  /** Text alignment. */
  textAlign?: 'left' | 'center' | 'right';
  /** Vertical alignment. */
  verticalAlign?: 'top' | 'middle' | 'bottom';
  /** Whether the text is editable inline. */
  editable?: boolean;
}

// ---- SVG path point for custom shapes -------------------------------------

export interface PathPoint {
  x: number;
  y: number;
  /** Optional control point for curves. */
  cp1?: { x: number; y: number };
  cp2?: { x: number; y: number };
}

// ---- Full custom block definition -----------------------------------------

export interface CustomBlockDefinition {
  /** Unique identifier. */
  id: string;
  /** Display name. */
  name: string;
  /** Category for grouping in the palette. */
  category: BlockCategory;
  /** Description shown in tooltips. */
  description?: string;
  /** Optional thumbnail data URI for the palette preview. */
  thumbnail?: string;

  /** Default width in pixels. */
  defaultWidth: number;
  /** Default height in pixels. */
  defaultHeight: number;
  /** Whether the block can be resized. */
  resizable: boolean;
  /** Whether to maintain aspect ratio when resizing. */
  maintainAspectRatio: boolean;

  /**
   * SVG path data describing the outer shape.
   * Use a viewBox-relative coordinate system (0-100).
   */
  svgPath: string;

  /**
   * Alternative: array of path points for programmatic editing.
   */
  pathPoints?: PathPoint[];

  /** Connection handles. */
  handles: HandleDefinition[];

  /** Named text zones inside the shape. */
  textZones: TextZone[];

  /** Default fill color. */
  defaultFill?: string;
  /** Default stroke color. */
  defaultStroke?: string;
  /** Default stroke width. */
  defaultStrokeWidth?: number;

  /** ISO 8601 creation timestamp. */
  createdAt?: string;
  /** ISO 8601 last-modified timestamp. */
  updatedAt?: string;
}
