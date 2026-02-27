import type { FlowNode } from '../store/flowStore';

// ---------------------------------------------------------------------------
// Helpers — use measured (rendered) dimensions when available, matching
// snapUtils.ts so alignment commands and snap guides agree on node geometry.
// ---------------------------------------------------------------------------

function nodeW(n: FlowNode): number {
  return (n as unknown as { measured?: { width?: number } }).measured?.width ?? n.data.width ?? 160;
}

function nodeH(n: FlowNode): number {
  return (n as unknown as { measured?: { height?: number } }).measured?.height ?? n.data.height ?? 60;
}

// ---------------------------------------------------------------------------
// Align
// ---------------------------------------------------------------------------

/** Align selected nodes to the leftmost node's x */
export function alignLeft(nodes: FlowNode[]): Map<string, { x: number; y: number }> {
  const minX = Math.min(...nodes.map(n => n.position.x));
  const result = new Map<string, { x: number; y: number }>();
  for (const n of nodes) {
    result.set(n.id, { x: minX, y: n.position.y });
  }
  return result;
}

/** Align to rightmost */
export function alignRight(nodes: FlowNode[]): Map<string, { x: number; y: number }> {
  const maxX = Math.max(...nodes.map(n => n.position.x + nodeW(n)));
  const result = new Map<string, { x: number; y: number }>();
  for (const n of nodes) {
    result.set(n.id, { x: maxX - nodeW(n), y: n.position.y });
  }
  return result;
}

/** Align to horizontal center (make X centers the same) */
export function alignCenterH(nodes: FlowNode[]): Map<string, { x: number; y: number }> {
  const centers = nodes.map(n => n.position.x + nodeW(n) / 2);
  const avgCenter = centers.reduce((a, b) => a + b, 0) / centers.length;
  const result = new Map<string, { x: number; y: number }>();
  for (const n of nodes) {
    result.set(n.id, { x: avgCenter - nodeW(n) / 2, y: n.position.y });
  }
  return result;
}

/** Align to topmost */
export function alignTop(nodes: FlowNode[]): Map<string, { x: number; y: number }> {
  const minY = Math.min(...nodes.map(n => n.position.y));
  const result = new Map<string, { x: number; y: number }>();
  for (const n of nodes) {
    result.set(n.id, { x: n.position.x, y: minY });
  }
  return result;
}

/** Align to bottommost */
export function alignBottom(nodes: FlowNode[]): Map<string, { x: number; y: number }> {
  const maxY = Math.max(...nodes.map(n => n.position.y + nodeH(n)));
  const result = new Map<string, { x: number; y: number }>();
  for (const n of nodes) {
    result.set(n.id, { x: n.position.x, y: maxY - nodeH(n) });
  }
  return result;
}

/** Align to vertical center (make Y centers the same) */
export function alignCenterV(nodes: FlowNode[]): Map<string, { x: number; y: number }> {
  const centers = nodes.map(n => n.position.y + nodeH(n) / 2);
  const avgCenter = centers.reduce((a, b) => a + b, 0) / centers.length;
  const result = new Map<string, { x: number; y: number }>();
  for (const n of nodes) {
    result.set(n.id, { x: n.position.x, y: avgCenter - nodeH(n) / 2 });
  }
  return result;
}

// ---------------------------------------------------------------------------
// Distribute
// ---------------------------------------------------------------------------

/** Distribute nodes evenly horizontally */
export function distributeH(nodes: FlowNode[]): Map<string, { x: number; y: number }> {
  if (nodes.length < 3) return new Map();
  const sorted = [...nodes].sort((a, b) => a.position.x - b.position.x);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const totalSpan = (last.position.x + nodeW(last)) - first.position.x;
  const totalNodeWidth = sorted.reduce((sum, n) => sum + nodeW(n), 0);
  const gap = (totalSpan - totalNodeWidth) / (sorted.length - 1);

  const result = new Map<string, { x: number; y: number }>();
  let cursor = first.position.x;
  for (const n of sorted) {
    result.set(n.id, { x: cursor, y: n.position.y });
    cursor += nodeW(n) + gap;
  }
  return result;
}

/** Distribute nodes evenly vertically */
export function distributeV(nodes: FlowNode[]): Map<string, { x: number; y: number }> {
  if (nodes.length < 3) return new Map();
  const sorted = [...nodes].sort((a, b) => a.position.y - b.position.y);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const totalSpan = (last.position.y + nodeH(last)) - first.position.y;
  const totalNodeHeight = sorted.reduce((sum, n) => sum + nodeH(n), 0);
  const gap = (totalSpan - totalNodeHeight) / (sorted.length - 1);

  const result = new Map<string, { x: number; y: number }>();
  let cursor = first.position.y;
  for (const n of sorted) {
    result.set(n.id, { x: n.position.x, y: cursor });
    cursor += nodeH(n) + gap;
  }
  return result;
}
