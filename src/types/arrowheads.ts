// ---------------------------------------------------------------------------
// arrowheads.ts -- SVG marker definitions for edge arrowheads
// ---------------------------------------------------------------------------

import type { ArrowheadType, ArrowheadSize } from './edges';

// ---- Arrowhead visual configuration ---------------------------------------

export interface ArrowheadConfig {
  /** Which catalogue arrowhead this config describes. */
  type: ArrowheadType;
  /** Display name shown in the UI picker. */
  label: string;
  /** Grouping for the picker UI. */
  category: 'basic' | 'uml' | 'erd' | 'decorative' | 'notation';
  /** Whether the arrowhead interior is filled or stroked-only. */
  filled: boolean;
  /** Default size preset. */
  defaultSize: ArrowheadSize;
  /** Width of the marker at "medium" size. */
  baseWidth: number;
  /** Height of the marker at "medium" size. */
  baseHeight: number;
  /** Scale factors for each size preset relative to medium (1.0). */
  sizeScales: Record<Exclude<ArrowheadSize, 'custom'>, number>;
}

// ---- SVG <marker> definition for rendering --------------------------------

export interface MarkerDef {
  /** Unique marker id (used in url(#id) references). */
  id: string;
  /** Arrowhead type this marker renders. */
  type: ArrowheadType;
  /** Viewport width of the marker. */
  viewBoxWidth: number;
  /** Viewport height of the marker. */
  viewBoxHeight: number;
  /** X coordinate of the reference point (attachment to path). */
  refX: number;
  /** Y coordinate of the reference point. */
  refY: number;
  /** Actual rendered width in pixels (after size scaling). */
  markerWidth: number;
  /** Actual rendered height in pixels. */
  markerHeight: number;
  /** SVG path data for the marker shape. */
  path: string;
  /** Fill color (use 'context-stroke' to inherit edge color). */
  fill: string;
  /** Stroke color (use 'context-stroke' to inherit edge color). */
  stroke: string;
  /** Stroke width of the marker outline. */
  strokeWidth: number;
  /** Whether to orient the marker along the path direction. */
  orient: 'auto' | 'auto-start-reverse' | string;
}
