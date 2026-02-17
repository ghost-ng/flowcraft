import type { FlowNode } from '../store/flowStore';

/** Get the effective width of a node */
function nodeWidth(n: FlowNode): number {
  return n.data.width || (n.data.shape === 'circle' || n.data.shape === 'diamond' ? 100 : 160);
}

/** Get the effective height of a node */
function nodeHeight(n: FlowNode): number {
  return n.data.height || (n.data.shape === 'circle' || n.data.shape === 'diamond' ? 100 : 60);
}

/** Compute the center of a set of nodes */
function computeCenter(nodes: FlowNode[]): { cx: number; cy: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of nodes) {
    minX = Math.min(minX, n.position.x);
    minY = Math.min(minY, n.position.y);
    maxX = Math.max(maxX, n.position.x + nodeWidth(n));
    maxY = Math.max(maxY, n.position.y + nodeHeight(n));
  }
  return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
}

/** Mirror (flip) nodes horizontally around the collective center */
export function mirrorHorizontal(nodes: FlowNode[]): Map<string, { x: number; y: number }> {
  const { cx } = computeCenter(nodes);
  const result = new Map<string, { x: number; y: number }>();
  for (const n of nodes) {
    const w = nodeWidth(n);
    const nodeCenterX = n.position.x + w / 2;
    const newCenterX = 2 * cx - nodeCenterX;
    result.set(n.id, { x: newCenterX - w / 2, y: n.position.y });
  }
  return result;
}

/** Mirror (flip) nodes vertically around the collective center */
export function mirrorVertical(nodes: FlowNode[]): Map<string, { x: number; y: number }> {
  const { cy } = computeCenter(nodes);
  const result = new Map<string, { x: number; y: number }>();
  for (const n of nodes) {
    const h = nodeHeight(n);
    const nodeCenterY = n.position.y + h / 2;
    const newCenterY = 2 * cy - nodeCenterY;
    result.set(n.id, { x: n.position.x, y: newCenterY - h / 2 });
  }
  return result;
}

/** Rotate the arrangement of nodes by the given angle (degrees) around the collective center */
export function rotateArrangement(
  nodes: FlowNode[],
  angleDeg: number,
): Map<string, { x: number; y: number }> {
  const { cx, cy } = computeCenter(nodes);
  const angleRad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const result = new Map<string, { x: number; y: number }>();

  for (const n of nodes) {
    const w = nodeWidth(n);
    const h = nodeHeight(n);
    // Rotate the node's center around the collective center
    const nodeCX = n.position.x + w / 2;
    const nodeCY = n.position.y + h / 2;
    const dx = nodeCX - cx;
    const dy = nodeCY - cy;
    const newCX = cx + dx * cos - dy * sin;
    const newCY = cy + dx * sin + dy * cos;
    result.set(n.id, { x: newCX - w / 2, y: newCY - h / 2 });
  }

  return result;
}
