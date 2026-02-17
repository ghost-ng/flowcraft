// ---------------------------------------------------------------------------
// Edges/index.ts -- Edge type registry for React Flow
// ---------------------------------------------------------------------------

import type { EdgeTypes } from '@xyflow/react';
import CustomBezierEdge from './CustomBezierEdge';
import CustomStepEdge from './CustomStepEdge';
import CustomStraightEdge from './CustomStraightEdge';
import DependencyEdge from './DependencyEdge';
import AnimatedEdge from './AnimatedEdge';

// ---------------------------------------------------------------------------
// Edge type map -- passed to <ReactFlow edgeTypes={edgeTypes} />
// ---------------------------------------------------------------------------

export const edgeTypes: EdgeTypes = {
  bezier: CustomBezierEdge,
  smoothstep: CustomStepEdge,
  step: CustomStepEdge,
  straight: CustomStraightEdge,
  dependency: DependencyEdge,
  animated: AnimatedEdge,
};

// ---------------------------------------------------------------------------
// Default edge type used when no type is specified on an edge
// ---------------------------------------------------------------------------

export const defaultEdgeType = 'smoothstep';

// ---------------------------------------------------------------------------
// Re-exports for convenience
// ---------------------------------------------------------------------------

export { default as CustomBezierEdge } from './CustomBezierEdge';
export { default as CustomStepEdge } from './CustomStepEdge';
export { default as CustomStraightEdge } from './CustomStraightEdge';
export { default as DependencyEdge } from './DependencyEdge';
export { default as AnimatedEdge } from './AnimatedEdge';
export { default as MarkerDefs } from './ArrowheadMarkers/MarkerDefs';
