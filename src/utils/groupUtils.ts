import type { FlowNode } from '../store/flowStore';

/** Get the effective width of a node (uses data.width or shape defaults) */
export function getNodeWidth(node: FlowNode): number {
  if (node.data.width) return node.data.width;
  const shape = node.data.shape;
  if (shape === 'circle') return 100;
  if (shape === 'diamond') return 100;
  if (shape === 'circularArrow') return 100;
  return 160;
}

/** Get the effective height of a node (uses data.height or shape defaults) */
export function getNodeHeight(node: FlowNode): number {
  if (node.data.height) return node.data.height;
  const shape = node.data.shape;
  if (shape === 'circle') return 100;
  if (shape === 'diamond') return 100;
  if (shape === 'circularArrow') return 100;
  return 60;
}

/** Compute a bounding box that encloses all the given nodes. */
export function computeBoundingBox(
  nodes: FlowNode[],
  padding = 40,
  labelPadding = 30,
): { x: number; y: number; width: number; height: number } {
  if (nodes.length === 0) return { x: 0, y: 0, width: 300, height: 200 };

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const n of nodes) {
    const w = getNodeWidth(n);
    const h = getNodeHeight(n);
    minX = Math.min(minX, n.position.x);
    minY = Math.min(minY, n.position.y);
    maxX = Math.max(maxX, n.position.x + w);
    maxY = Math.max(maxY, n.position.y + h);
  }

  return {
    x: minX - padding,
    y: minY - padding - labelPadding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2 + labelPadding,
  };
}
