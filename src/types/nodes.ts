// ---------------------------------------------------------------------------
// nodes.ts -- Node shape types and FlowNode definition for Chart Hero
// ---------------------------------------------------------------------------

import type { Node } from '@xyflow/react';
import type { NodeStyleOverrides } from './styles';
import type { TextZone } from './customBlocks';
import type { NodeMetadata } from './metadata';

// ---- Shape types ----------------------------------------------------------

export type ShapeType =
  | 'rectangle'
  | 'roundedRectangle'
  | 'diamond'
  | 'circle'
  | 'parallelogram'
  | 'document'
  | 'hexagon'
  | 'cloud'
  | 'stickyNote'
  | 'milestoneGate'
  | 'customBlock'
  | 'container';

export type ArrowShapeType =
  | 'straightArrow'
  | 'curvedArrow'
  | 'blockArrow'
  | 'chevronArrow'
  | 'doubleArrow'
  | 'bentArrow'
  | 'circularArrow'
  | 'calloutArrow';

// ---- Dependency status (node-level) ---------------------------------------

export type DependencyStatus =
  | 'none'
  | 'satisfied'
  | 'pending'
  | 'blocked'
  | 'warning';

// ---- Lane assignment (which swimlane a node belongs to) -------------------

export interface LaneAssignment {
  /** Horizontal lane id (row), or null if unassigned. */
  horizontal: string | null;
  /** Vertical lane id (column), or null if unassigned. */
  vertical: string | null;
}

// ---- FlowNodeData --------------------------------------------------------

export interface FlowNodeData extends Record<string, unknown> {
  /** Primary text displayed inside the node. */
  label: string;

  /** The geometric shape used to render this node. */
  shapeType: ShapeType;

  /** Per-node style overrides (fill, stroke, font, etc.). */
  styleOverrides?: NodeStyleOverrides;

  /** Which swimlane(s) this node is assigned to. */
  laneAssignment?: LaneAssignment;

  /** Dependency-health indicator shown as a badge / border color. */
  dependencyStatus?: DependencyStatus;

  /** Arbitrary key-value metadata (custom fields, tags, etc.). */
  metadata?: NodeMetadata;

  /** The layer this node belongs to. */
  layerId?: string;

  /** When true the node auto-sizes to fit its content. */
  isAutoSized?: boolean;

  /**
   * Text zones for custom block nodes.
   * Only meaningful when shapeType === 'customBlock'.
   */
  textZones?: TextZone[];

  /**
   * Reference to a custom block definition id.
   * Only meaningful when shapeType === 'customBlock'.
   */
  customBlockId?: string;

  /** Optional secondary description rendered below the label. */
  description?: string;

  /** Optional icon identifier (e.g. Lucide icon name). */
  icon?: string;
}

// ---- FlowNode (the concrete Node type used everywhere) --------------------

/**
 * `FlowNode` is the application-wide node type.
 * It extends the xyflow `Node` generic with `FlowNodeData` and a string type
 * discriminator that matches the registered custom node components.
 */
export type FlowNode = Node<FlowNodeData, string>;
