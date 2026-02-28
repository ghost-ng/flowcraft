// ---------------------------------------------------------------------------
// Auto-Layout Hook
// ---------------------------------------------------------------------------

import { useCallback } from 'react';
import { useFlowStore } from '../store/flowStore';
import type { FlowNode, FlowEdge } from '../store/flowStore';
import {
  applyDagreLayout,
  type LayoutDirection,
  type LayoutNode,
  type LayoutEdge,
} from '../utils/layoutEngine';

// ---------------------------------------------------------------------------
// Inline types
// ---------------------------------------------------------------------------

export interface AutoLayoutResult {
  /** Apply the dagre layout to the current nodes and edges.
   *  Optionally pass nodeIds to layout only a subset of nodes. */
  applyLayout: (direction?: LayoutDirection, nodeIds?: string[]) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve the pixel width of a node. */
function nw(n: FlowNode): number {
  return n.measured?.width ?? n.width ?? 172;
}

/** Resolve the pixel height of a node. */
function nh(n: FlowNode): number {
  return n.measured?.height ?? n.height ?? 40;
}

/**
 * After layout, reassign sourceHandle / targetHandle on every edge so that
 * connectors attach at the side that makes sense for the flow direction
 * and the relative positions of the connected nodes.
 */
function reassignEdgeHandles(
  updatedNodes: FlowNode[],
  edges: FlowEdge[],
): FlowEdge[] {
  const nodeMap = new Map<string, FlowNode>();
  for (const n of updatedNodes) nodeMap.set(n.id, n);

  return edges.map((edge) => {
    const src = nodeMap.get(edge.source);
    const tgt = nodeMap.get(edge.target);
    if (!src || !tgt) return edge;

    // Compute center points
    const srcCx = src.position.x + nw(src) / 2;
    const srcCy = src.position.y + nh(src) / 2;
    const tgtCx = tgt.position.x + nw(tgt) / 2;
    const tgtCy = tgt.position.y + nh(tgt) / 2;

    const dx = tgtCx - srcCx;
    const dy = tgtCy - srcCy;

    let sourceHandle: string;
    let targetHandle: string;

    if (Math.abs(dy) >= Math.abs(dx)) {
      // Primarily vertical relationship
      if (dy > 0) {
        sourceHandle = 'bottom';
        targetHandle = 'top';
      } else {
        sourceHandle = 'top';
        targetHandle = 'bottom';
      }
    } else {
      // Primarily horizontal relationship
      if (dx > 0) {
        sourceHandle = 'right';
        targetHandle = 'left';
      } else {
        sourceHandle = 'left';
        targetHandle = 'right';
      }
    }

    return {
      ...edge,
      sourceHandle,
      targetHandle,
    };
  });
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Hook that wraps the dagre layout engine, reading nodes/edges from the flow
 * store and writing updated positions back. Also reassigns edge handles based
 * on the new node positions so connectors attach at the correct sides.
 *
 * Usage:
 * ```ts
 * const { applyLayout } = useAutoLayout();
 * applyLayout('LR'); // left-to-right
 * ```
 */
export function useAutoLayout(): AutoLayoutResult {
  const applyLayout = useCallback((direction: LayoutDirection = 'TB', nodeIds?: string[]) => {
    const { nodes, edges, setNodes, setEdges } = useFlowStore.getState();

    if (nodeIds && nodeIds.length > 0) {
      // Layout only selected nodes
      const targetIds = new Set(nodeIds);
      const targetNodes: LayoutNode[] = nodes
        .filter((n) => targetIds.has(n.id))
        .map((n) => ({
          id: n.id,
          position: n.position,
          measured: n.measured,
          width: n.width,
          height: n.height,
          data: n.data,
        }));

      const targetEdges: LayoutEdge[] = edges
        .filter((e) => targetIds.has(e.source) && targetIds.has(e.target))
        .map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: (e.data?.label as string) || undefined,
        }));

      // Compute original center of selected nodes
      let origMinX = Infinity, origMinY = Infinity, origMaxX = -Infinity, origMaxY = -Infinity;
      for (const n of targetNodes) {
        const w = n.measured?.width ?? n.width ?? 172;
        const h = n.measured?.height ?? n.height ?? 40;
        origMinX = Math.min(origMinX, n.position.x);
        origMinY = Math.min(origMinY, n.position.y);
        origMaxX = Math.max(origMaxX, n.position.x + w);
        origMaxY = Math.max(origMaxY, n.position.y + h);
      }
      const origCenterX = (origMinX + origMaxX) / 2;
      const origCenterY = (origMinY + origMaxY) / 2;

      const laidOut = applyDagreLayout(targetNodes, targetEdges, direction);

      // Compute new center after layout
      let newMinX = Infinity, newMinY = Infinity, newMaxX = -Infinity, newMaxY = -Infinity;
      for (const n of laidOut) {
        const orig = targetNodes.find((t) => t.id === n.id);
        const w = orig?.measured?.width ?? orig?.width ?? 172;
        const h = orig?.measured?.height ?? orig?.height ?? 40;
        newMinX = Math.min(newMinX, n.position.x);
        newMinY = Math.min(newMinY, n.position.y);
        newMaxX = Math.max(newMaxX, n.position.x + w);
        newMaxY = Math.max(newMaxY, n.position.y + h);
      }
      const newCenterX = (newMinX + newMaxX) / 2;
      const newCenterY = (newMinY + newMaxY) / 2;

      // Offset to keep the layout centered on the original position
      const offsetX = origCenterX - newCenterX;
      const offsetY = origCenterY - newCenterY;

      // Merge: keep non-target nodes unchanged, replace target node positions (offset to stay in place)
      const layoutedMap = new Map(laidOut.map((n) => [n.id, { x: n.position.x + offsetX, y: n.position.y + offsetY }]));
      const merged = nodes.map((n) => {
        const newPos = layoutedMap.get(n.id);
        if (!newPos) return n;
        return { ...n, position: newPos };
      });
      setNodes(merged);

      // Reassign edge handles for affected edges
      const affectedEdges = edges.filter(
        (e) => targetIds.has(e.source) || targetIds.has(e.target),
      );
      if (affectedEdges.length > 0) {
        const updatedEdges = reassignEdgeHandles(merged, edges);
        setEdges(updatedEdges);
      }
    } else {
      // Layout all nodes (existing behavior)
      const layoutNodes: LayoutNode[] = nodes.map((n) => ({
        id: n.id,
        position: n.position,
        measured: n.measured,
        width: n.width,
        height: n.height,
        data: n.data,
      }));

      const layoutEdges: LayoutEdge[] = edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: (e.data?.label as string) || undefined,
      }));

      const laidOut = applyDagreLayout(layoutNodes, layoutEdges, direction);

      // Map new positions back onto the original store nodes
      const positionMap = new Map(laidOut.map((n) => [n.id, n.position]));

      const updatedNodes = nodes.map((n) => {
        const newPos = positionMap.get(n.id);
        if (!newPos) return n;
        return { ...n, position: newPos };
      });

      setNodes(updatedNodes);

      // Reassign edge handles based on new positions
      const updatedEdges = reassignEdgeHandles(updatedNodes, edges);
      setEdges(updatedEdges);
    }
  }, []);

  return { applyLayout };
}
