/**
 * MiniMapOverlays — injects swimlane band rects into React Flow's MiniMap SVG.
 *
 * The MiniMap doesn't support custom SVG children, so we DOM-inject <rect>
 * elements behind the node layer.  All coordinates are in flow-space (the same
 * coordinate system the minimap uses for its viewBox).
 */

import { useEffect } from 'react';
import { useSwimlaneStore, type SwimlaneItem } from '../../store/swimlaneStore';
import { useLegendStore } from '../../store/legendStore';
import { useStyleStore } from '../../store/styleStore';

// ---------------------------------------------------------------------------
// Lane bounds helper (mirrors SwimlaneLayer.computeBounds)
// ---------------------------------------------------------------------------

function computeBounds(
  lanes: SwimlaneItem[],
  headerOffset: number,
): Array<{ lane: SwimlaneItem; offset: number; size: number }> {
  const sorted = [...lanes].sort((a, b) => a.order - b.order);
  const result: Array<{ lane: SwimlaneItem; offset: number; size: number }> = [];
  let cursor = headerOffset;
  for (const lane of sorted) {
    if (lane.hidden) { result.push({ lane, offset: cursor, size: 0 }); continue; }
    const sz = lane.collapsed ? 32 : lane.size;
    result.push({ lane, offset: cursor, size: sz });
    cursor += sz;
  }
  return result;
}

// ---------------------------------------------------------------------------
// SVG namespace constant
// ---------------------------------------------------------------------------

const SVG_NS = 'http://www.w3.org/2000/svg';
const OVERLAY_ID = 'minimap-swimlane-overlay';
const LEGEND_OVERLAY_ID = 'minimap-legend-overlay';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MiniMapOverlays() {
  const hLanes = useSwimlaneStore((s) => s.config.horizontal);
  const vLanes = useSwimlaneStore((s) => s.config.vertical);
  const containerOffset = useSwimlaneStore((s) => s.containerOffset);
  const hHeaderWidth = useSwimlaneStore((s) => s.config.hHeaderWidth) ?? 48;
  const vHeaderHeight = useSwimlaneStore((s) => s.config.vHeaderHeight) ?? 32;
  const darkMode = useStyleStore((s) => s.darkMode);

  // Legend state
  const nodeLegend = useLegendStore((s) => s.nodeLegend);

  // --- Swimlane overlay ---
  useEffect(() => {
    const svg = document.querySelector('.react-flow__minimap-svg') as SVGSVGElement | null;
    if (!svg) return;

    // Remove stale overlay
    svg.querySelector(`#${OVERLAY_ID}`)?.remove();

    const hasH = hLanes.length > 0;
    const hasV = vLanes.length > 0;
    if (!hasH && !hasV) return;

    const g = document.createElementNS(SVG_NS, 'g');
    g.id = OVERLAY_ID;

    const ox = containerOffset.x;
    const oy = containerOffset.y;

    // Compute total dims
    const hBounds = hasH ? computeBounds(hLanes, hasV ? vHeaderHeight : 0) : [];
    const vBounds = hasV ? computeBounds(vLanes, hasH ? hHeaderWidth : 0) : [];

    const totalWidth = hasV
      ? vBounds.reduce((m, b) => Math.max(m, b.offset + b.size), 0)
      : 2000;
    const totalHeight = hasH
      ? hBounds.reduce((m, b) => Math.max(m, b.offset + b.size), 0)
      : 2000;

    // Horizontal lane bands
    for (const { lane, offset, size } of hBounds) {
      if (lane.hidden || size === 0) continue;
      const headerW = hasH ? hHeaderWidth : 0;
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', String(ox + headerW));
      rect.setAttribute('y', String(oy + offset));
      rect.setAttribute('width', String(totalWidth - headerW));
      rect.setAttribute('height', String(size));
      rect.setAttribute('fill', lane.color);
      rect.setAttribute('opacity', darkMode ? '0.25' : '0.3');
      g.appendChild(rect);
    }

    // Vertical lane bands
    for (const { lane, offset, size } of vBounds) {
      if (lane.hidden || size === 0) continue;
      const headerH = hasV ? vHeaderHeight : 0;
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', String(ox + offset));
      rect.setAttribute('y', String(oy + headerH));
      rect.setAttribute('width', String(size));
      rect.setAttribute('height', String(totalHeight - headerH));
      rect.setAttribute('fill', lane.color);
      rect.setAttribute('opacity', darkMode ? '0.2' : '0.25');
      g.appendChild(rect);
    }

    // Outer border
    const border = document.createElementNS(SVG_NS, 'rect');
    border.setAttribute('x', String(ox));
    border.setAttribute('y', String(oy));
    border.setAttribute('width', String(totalWidth));
    border.setAttribute('height', String(totalHeight));
    border.setAttribute('fill', 'none');
    border.setAttribute('stroke', darkMode ? 'rgba(148,163,184,0.3)' : 'rgba(100,116,139,0.3)');
    border.setAttribute('stroke-width', '2');
    border.setAttribute('rx', '3');
    g.appendChild(border);

    // Insert before the first child (behind nodes)
    svg.insertBefore(g, svg.firstChild);

    return () => { g.remove(); };
  }, [hLanes, vLanes, containerOffset, hHeaderWidth, vHeaderHeight, darkMode]);

  // --- Legend overlay ---
  useEffect(() => {
    const svg = document.querySelector('.react-flow__minimap-svg') as SVGSVGElement | null;
    if (!svg) return;

    svg.querySelector(`#${LEGEND_OVERLAY_ID}`)?.remove();

    if (!nodeLegend.visible || nodeLegend.items.length === 0) return;

    // The legend is a viewport overlay (screen coords), not in flow-space.
    // To show it on the minimap, we convert its screen position to flow-space
    // using the current viewport transform stored on the React Flow instance.
    // We read the viewBox to determine the visible flow region instead.
    const vb = svg.getAttribute('viewBox');
    if (!vb) return;
    const [vbX, vbY, vbW] = vb.split(' ').map(Number);

    // Place legend indicator at top-right of the minimap viewBox
    const legendW = 24;
    const legendH = 16;
    const lx = vbX + vbW - legendW - 8;
    const ly = vbY + 8;

    const g = document.createElementNS(SVG_NS, 'g');
    g.id = LEGEND_OVERLAY_ID;

    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(lx));
    rect.setAttribute('y', String(ly));
    rect.setAttribute('width', String(legendW));
    rect.setAttribute('height', String(legendH));
    rect.setAttribute('fill', darkMode ? 'rgba(20,30,45,0.8)' : 'rgba(255,255,255,0.8)');
    rect.setAttribute('stroke', darkMode ? 'rgba(148,163,184,0.4)' : 'rgba(100,116,139,0.3)');
    rect.setAttribute('stroke-width', '1');
    rect.setAttribute('rx', '2');
    g.appendChild(rect);

    // Small "L" text label
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(lx + legendW / 2));
    text.setAttribute('y', String(ly + legendH / 2 + 1));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('font-size', '8');
    text.setAttribute('fill', darkMode ? '#94a3b8' : '#64748b');
    text.textContent = 'L';
    g.appendChild(text);

    // Insert before the mask path (after nodes)
    const mask = svg.querySelector('.react-flow__minimap-mask');
    if (mask) svg.insertBefore(g, mask);
    else svg.appendChild(g);

    return () => { g.remove(); };
  }, [nodeLegend.visible, nodeLegend.items.length, darkMode]);

  return null; // This component doesn't render DOM — it injects into MiniMap SVG
}
