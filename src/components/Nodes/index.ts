// ---------------------------------------------------------------------------
// index.ts -- Node type registry for React Flow
// ---------------------------------------------------------------------------

import { type NodeTypes } from '@xyflow/react';

import RectangleNode from './RectangleNode';
import DiamondNode from './DiamondNode';
import CircleNode from './CircleNode';
import ParallelogramNode from './ParallelogramNode';
import DocumentNode from './DocumentNode';
import HexagonNode from './HexagonNode';
import CloudNode from './CloudNode';
import StickyNoteNode from './StickyNoteNode';
import MilestoneGateNode from './MilestoneGateNode';

// Re-export BaseNode and its types for external use
export { default as BaseNode } from './BaseNode';
export type { BaseNodeData, BaseNodeProps, NodeStyleOverrides } from './BaseNode';

// Re-export individual node components
export {
  RectangleNode,
  DiamondNode,
  CircleNode,
  ParallelogramNode,
  DocumentNode,
  HexagonNode,
  CloudNode,
  StickyNoteNode,
  MilestoneGateNode,
};

/**
 * The `nodeTypes` map registered with `<ReactFlow nodeTypes={nodeTypes} />`.
 *
 * `roundedRectangle` reuses `RectangleNode` -- the only difference is a
 * larger default `borderRadius` which can be set via `data.styleOverrides`.
 */
export const nodeTypes: NodeTypes = {
  rectangle: RectangleNode,
  roundedRectangle: RectangleNode,
  diamond: DiamondNode,
  circle: CircleNode,
  parallelogram: ParallelogramNode,
  document: DocumentNode,
  hexagon: HexagonNode,
  cloud: CloudNode,
  stickyNote: StickyNoteNode,
  milestoneGate: MilestoneGateNode,
};
