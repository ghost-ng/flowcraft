import type { FlowNode } from '../store/flowStore';

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
  const maxX = Math.max(...nodes.map(n => n.position.x + (n.data.width || 160)));
  const result = new Map<string, { x: number; y: number }>();
  for (const n of nodes) {
    const w = n.data.width || 160;
    result.set(n.id, { x: maxX - w, y: n.position.y });
  }
  return result;
}

/** Align to horizontal center */
export function alignCenterH(nodes: FlowNode[]): Map<string, { x: number; y: number }> {
  const centers = nodes.map(n => n.position.x + (n.data.width || 160) / 2);
  const avgCenter = centers.reduce((a, b) => a + b, 0) / centers.length;
  const result = new Map<string, { x: number; y: number }>();
  for (const n of nodes) {
    const w = n.data.width || 160;
    result.set(n.id, { x: avgCenter - w / 2, y: n.position.y });
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
  const maxY = Math.max(...nodes.map(n => n.position.y + (n.data.height || 60)));
  const result = new Map<string, { x: number; y: number }>();
  for (const n of nodes) {
    const h = n.data.height || 60;
    result.set(n.id, { x: n.position.x, y: maxY - h });
  }
  return result;
}

/** Align to vertical center */
export function alignCenterV(nodes: FlowNode[]): Map<string, { x: number; y: number }> {
  const centers = nodes.map(n => n.position.y + (n.data.height || 60) / 2);
  const avgCenter = centers.reduce((a, b) => a + b, 0) / centers.length;
  const result = new Map<string, { x: number; y: number }>();
  for (const n of nodes) {
    const h = n.data.height || 60;
    result.set(n.id, { x: n.position.x, y: avgCenter - h / 2 });
  }
  return result;
}

/** Distribute nodes evenly horizontally */
export function distributeH(nodes: FlowNode[]): Map<string, { x: number; y: number }> {
  if (nodes.length < 3) return new Map();
  const sorted = [...nodes].sort((a, b) => a.position.x - b.position.x);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const totalSpan = (last.position.x + (last.data.width || 160)) - first.position.x;
  const totalNodeWidth = sorted.reduce((sum, n) => sum + (n.data.width || 160), 0);
  const gap = (totalSpan - totalNodeWidth) / (sorted.length - 1);

  const result = new Map<string, { x: number; y: number }>();
  let cursor = first.position.x;
  for (const n of sorted) {
    result.set(n.id, { x: cursor, y: n.position.y });
    cursor += (n.data.width || 160) + gap;
  }
  return result;
}

/** Distribute nodes evenly vertically */
export function distributeV(nodes: FlowNode[]): Map<string, { x: number; y: number }> {
  if (nodes.length < 3) return new Map();
  const sorted = [...nodes].sort((a, b) => a.position.y - b.position.y);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const totalSpan = (last.position.y + (last.data.height || 60)) - first.position.y;
  const totalNodeHeight = sorted.reduce((sum, n) => sum + (n.data.height || 60), 0);
  const gap = (totalSpan - totalNodeHeight) / (sorted.length - 1);

  const result = new Map<string, { x: number; y: number }>();
  let cursor = first.position.y;
  for (const n of sorted) {
    result.set(n.id, { x: n.position.x, y: cursor });
    cursor += (n.data.height || 60) + gap;
  }
  return result;
}
