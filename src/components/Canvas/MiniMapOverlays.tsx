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

  // --- Legend overlay (shaded region in flow-space) ---
  useEffect(() => {
    const svg = document.querySelector('.react-flow__minimap-svg') as SVGSVGElement | null;
    if (!svg) return;

    svg.querySelector(`#${LEGEND_OVERLAY_ID}`)?.remove();

    if (!nodeLegend.visible || nodeLegend.items.length === 0) return;

    // Legend position is in flow-space (same coordinate system as the minimap).
    // Width comes from style; height is estimated from item count + title bar.
    const { position, style, items, title } = nodeLegend;
    const legendW = style.width;
    // Estimate height: title bar (~24px) + each item row (~(fontSize + 8)px) + padding
    const rowH = style.fontSize + 8;
    const visibleItems = items.filter((i) => !i.hidden);
    const legendH = 24 + visibleItems.length * rowH + 8;

    const g = document.createElementNS(SVG_NS, 'g');
    g.id = LEGEND_OVERLAY_ID;

    // Main background
    const bg = document.createElementNS(SVG_NS, 'rect');
    bg.setAttribute('x', String(position.x));
    bg.setAttribute('y', String(position.y));
    bg.setAttribute('width', String(legendW));
    bg.setAttribute('height', String(legendH));
    bg.setAttribute('fill', darkMode ? 'rgba(20,30,45,0.6)' : 'rgba(255,255,255,0.6)');
    bg.setAttribute('stroke', darkMode ? 'rgba(148,163,184,0.35)' : 'rgba(100,116,139,0.25)');
    bg.setAttribute('stroke-width', '1.5');
    bg.setAttribute('rx', '4');
    g.appendChild(bg);

    // Title text
    const titleEl = document.createElementNS(SVG_NS, 'text');
    titleEl.setAttribute('x', String(position.x + 8));
    titleEl.setAttribute('y', String(position.y + 15));
    titleEl.setAttribute('font-size', String(Math.max(8, style.fontSize - 1)));
    titleEl.setAttribute('font-weight', '600');
    titleEl.setAttribute('fill', darkMode ? '#94a3b8' : '#475569');
    titleEl.textContent = title || 'Legend';
    g.appendChild(titleEl);

    // Color swatches for each visible item
    let rowY = position.y + 26;
    for (const item of visibleItems) {
      // Swatch rect
      const sw = document.createElementNS(SVG_NS, 'rect');
      const swSize = Math.max(6, style.fontSize - 2);
      sw.setAttribute('x', String(position.x + 8));
      sw.setAttribute('y', String(rowY));
      sw.setAttribute('width', String(swSize));
      sw.setAttribute('height', String(swSize));
      sw.setAttribute('fill', item.color);
      sw.setAttribute('rx', item.kind === 'puck' ? String(swSize / 2) : '1');
      g.appendChild(sw);

      // Label
      const label = document.createElementNS(SVG_NS, 'text');
      label.setAttribute('x', String(position.x + 8 + swSize + 4));
      label.setAttribute('y', String(rowY + swSize - 1));
      label.setAttribute('font-size', String(Math.max(6, style.fontSize - 2)));
      label.setAttribute('fill', darkMode ? '#7e8d9f' : '#64748b');
      label.textContent = item.label;
      g.appendChild(label);

      rowY += rowH;
    }

    // Insert before the first child (behind nodes) so it doesn't cover them
    svg.insertBefore(g, svg.firstChild);

    return () => { g.remove(); };
  }, [nodeLegend, darkMode]);

  return null; // This component doesn't render DOM — it injects into MiniMap SVG
}
