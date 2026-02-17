// ---------------------------------------------------------------------------
// edges.ts -- Edge path types, arrowheads, and FlowEdge definition
// ---------------------------------------------------------------------------

import type { Edge } from '@xyflow/react';
import type { EdgeStyleOverrides } from './styles';

// ---- Edge path routing styles ---------------------------------------------

export type EdgePathType =
  | 'bezier'
  | 'smoothstep'
  | 'step'
  | 'straight'
  | 'elbowed';

// ---- Dependency semantics carried by an edge ------------------------------

export type DependencyType =
  | 'depends-on'
  | 'blocks'
  | 'related'
  | 'triggers'
  | 'optional'
  | 'milestone-gate'
  | 'none';

// ---- Arrowhead catalogue --------------------------------------------------

export type ArrowheadType =
  | 'filledTriangle'
  | 'openTriangle'
  | 'thinArrow'
  | 'wideArrow'
  | 'filledDiamond'
  | 'openDiamond'
  | 'filledCircle'
  | 'openCircle'
  | 'filledSquare'
  | 'openSquare'
  | 'inheritance'
  | 'composition'
  | 'aggregation'
  | 'dependency'
  | 'crowsFootMany'
  | 'crowsFootOne'
  | 'crowsFootZeroMany'
  | 'crowsFootOneMany'
  | 'tee'
  | 'cross'
  | 'slash'
  | 'doubleLine'
  | 'lightningBolt'
  | 'gate'
  | 'none';

export type ArrowheadSize = 'small' | 'medium' | 'large' | 'custom';

// ---- Arrowhead configuration on a single end of an edge -------------------

export interface ArrowheadEndConfig {
  type: ArrowheadType;
  size?: ArrowheadSize;
  /** Only used when size === 'custom'. */
  customWidth?: number;
  /** Only used when size === 'custom'. */
  customHeight?: number;
  /** Override the arrowhead fill color. */
  color?: string;
}

// ---- FlowEdgeData ---------------------------------------------------------

export interface FlowEdgeData extends Record<string, unknown> {
  /** Semantic dependency type conveyed by this edge. */
  dependencyType?: DependencyType;

  /** Text label rendered along the edge path. */
  label?: string;

  /** Color for the label text. */
  labelColor?: string;

  /** Per-edge style overrides (stroke color, width, dash, etc.). */
  styleOverrides?: EdgeStyleOverrides;

  /** Arrowhead configuration for the source (start) end. */
  arrowheadStart?: ArrowheadEndConfig;

  /** Arrowhead configuration for the target (end) end. */
  arrowheadEnd?: ArrowheadEndConfig;

  /** Shorthand size applied to both ends unless individually overridden. */
  arrowheadSize?: ArrowheadSize;

  /** Whether the edge should be animated (marching ants / flow). */
  animated?: boolean;

  /** The layer this edge belongs to. */
  layerId?: string;

  /** Edge routing algorithm override. */
  pathType?: EdgePathType;
}

// ---- FlowEdge (the concrete Edge type used everywhere) --------------------

/**
 * `FlowEdge` is the application-wide edge type.
 * It extends the xyflow `Edge` generic with `FlowEdgeData`.
 */
export type FlowEdge = Edge<FlowEdgeData, string>;
