// ---------------------------------------------------------------------------
// FreehandDrawingOverlay — captures mouse events for freehand drawing mode.
// Renders live strokes as SVG paths; auto-converts to a node after 2s idle.
// ---------------------------------------------------------------------------

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useReactFlow, useViewport } from '@xyflow/react';
import { useUIStore } from '../../store/uiStore';
import { useFlowStore, type FlowNode, type FlowNodeData } from '../../store/flowStore';

// ---------------------------------------------------------------------------
// Catmull-Rom → cubic bezier SVG path conversion
// ---------------------------------------------------------------------------

interface Point {
  x: number;
  y: number;
}

function catmullRomToSvgPath(points: Point[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
  if (points.length === 2) {
    return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;
  }

  let d = `M ${points[0].x},${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const t = 6; // tension divisor — lower = smoother
    const cp1x = p1.x + (p2.x - p0.x) / t;
    const cp1y = p1.y + (p2.y - p0.y) / t;
    const cp2x = p2.x - (p3.x - p1.x) / t;
    const cp2y = p2.y - (p3.y - p1.y) / t;

    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }

  return d;
}

// ---------------------------------------------------------------------------
// Stroke type
// ---------------------------------------------------------------------------

interface Stroke {
  points: Point[];
}

// ---------------------------------------------------------------------------
// ID generator
// ---------------------------------------------------------------------------

let _freehandIdCounter = 0;
const nextFreehandId = () => `freehand_${Date.now()}_${++_freehandIdCounter}`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AUTO_CONVERT_DELAY = 2000; // ms

const FreehandDrawingOverlay: React.FC = () => {
  const { screenToFlowPosition } = useReactFlow();
  const { x: vx, y: vy, zoom } = useViewport();
  const markerColor = useUIStore((s) => s.markerColor);
  const markerThickness = useUIStore((s) => s.markerThickness);
  const setDrawingMode = useUIStore((s) => s.setDrawingMode);

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [activeStroke, setActiveStroke] = useState<Point[] | null>(null);
  const isDrawing = useRef(false);
  const autoConvertTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Flow→screen coordinate conversion for rendering live strokes
  const toScreenX = useCallback((fx: number) => fx * zoom + vx, [zoom, vx]);
  const toScreenY = useCallback((fy: number) => fy * zoom + vy, [zoom, vy]);

  // Convert all pending strokes into a single freehand node
  const convertToNode = useCallback(
    (allStrokes: Stroke[]) => {
      if (allStrokes.length === 0) return;

      // Collect all points to compute bounding box
      const allPoints = allStrokes.flatMap((s) => s.points);
      if (allPoints.length === 0) return;

      const pad = markerThickness / 2 + 4;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const pt of allPoints) {
        if (pt.x < minX) minX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y > maxY) maxY = pt.y;
      }
      minX -= pad; minY -= pad; maxX += pad; maxY += pad;
      const w = Math.max(maxX - minX, 20);
      const h = Math.max(maxY - minY, 20);

      // Normalize points relative to bounding box origin
      const normalized = allStrokes.map((s) => ({
        ...s,
        points: s.points.map((p) => ({ x: p.x - minX, y: p.y - minY })),
      }));

      // Build combined SVG path
      const svgPath = normalized.map((s) => catmullRomToSvgPath(s.points)).join(' ');

      const newNode: FlowNode = {
        id: nextFreehandId(),
        type: 'shapeNode',
        position: { x: minX, y: minY },
        data: {
          label: '',
          shape: 'freehand',
          width: w,
          height: h,
          svgPath,
          svgViewBox: `0 0 ${w} ${h}`,
          svgStrokeColor: markerColor,
          svgStrokeWidth: markerThickness,
          color: 'transparent',
          borderColor: 'transparent',
          borderWidth: 0,
        } as FlowNodeData,
      };

      useFlowStore.getState().addNode(newNode);
      useFlowStore.getState().setSelectedNodes([newNode.id]);
      setStrokes([]);
    },
    [markerColor, markerThickness],
  );

  // Schedule auto-convert after inactivity
  const scheduleAutoConvert = useCallback(
    (currentStrokes: Stroke[]) => {
      if (autoConvertTimer.current) clearTimeout(autoConvertTimer.current);
      if (currentStrokes.length === 0) return;
      autoConvertTimer.current = setTimeout(() => {
        convertToNode(currentStrokes);
      }, AUTO_CONVERT_DELAY);
    },
    [convertToNode],
  );

  // Cancel auto-convert on unmount or when drawing starts
  useEffect(() => {
    return () => {
      if (autoConvertTimer.current) clearTimeout(autoConvertTimer.current);
    };
  }, []);

  // Escape key handler — convert immediately and exit drawing mode
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (autoConvertTimer.current) clearTimeout(autoConvertTimer.current);
        // Convert any pending strokes
        const currentStrokes = [...strokes];
        if (activeStroke && activeStroke.length > 1) {
          currentStrokes.push({ points: activeStroke });
        }
        if (currentStrokes.length > 0) {
          convertToNode(currentStrokes);
        }
        setActiveStroke(null);
        setDrawingMode(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [strokes, activeStroke, convertToNode, setDrawingMode]);

  // Pointer event handlers
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return; // Only left click
      e.preventDefault();
      e.stopPropagation();
      isDrawing.current = true;
      if (autoConvertTimer.current) clearTimeout(autoConvertTimer.current);

      const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      setActiveStroke([flowPos]);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [screenToFlowPosition],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawing.current) return;
      e.preventDefault();
      const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      setActiveStroke((prev) => (prev ? [...prev, flowPos] : [flowPos]));
    },
    [screenToFlowPosition],
  );

  const handlePointerUp = useCallback(
    (_e: React.PointerEvent) => {
      if (!isDrawing.current) return;
      isDrawing.current = false;
      setActiveStroke((currentActive) => {
        if (currentActive && currentActive.length > 1) {
          const newStroke: Stroke = { points: currentActive };
          setStrokes((prev) => {
            const updated = [...prev, newStroke];
            scheduleAutoConvert(updated);
            return updated;
          });
        }
        return null;
      });
    },
    [scheduleAutoConvert],
  );

  // Render all completed strokes + active stroke in screen coordinates
  const strokeWidth = markerThickness * zoom;

  // Pen-tip cursor colored to match the marker
  const encodedColor = encodeURIComponent(markerColor);
  const penCursor = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='${encodedColor}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z'/%3E%3C/svg%3E") 2 22, crosshair`;

  return (
    <div
      className="absolute inset-0"
      style={{ zIndex: 1001, cursor: penCursor }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <svg
        width="100%"
        height="100%"
        style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}
      >
        {/* Completed strokes */}
        {strokes.map((stroke, i) => {
          const screenPoints = stroke.points.map((p) => ({
            x: toScreenX(p.x),
            y: toScreenY(p.y),
          }));
          const d = catmullRomToSvgPath(screenPoints);
          return (
            <path
              key={`stroke-${i}`}
              d={d}
              fill="none"
              stroke={markerColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.85}
            />
          );
        })}

        {/* Active stroke */}
        {activeStroke && activeStroke.length > 1 && (() => {
          const screenPoints = activeStroke.map((p) => ({
            x: toScreenX(p.x),
            y: toScreenY(p.y),
          }));
          const d = catmullRomToSvgPath(screenPoints);
          return (
            <path
              d={d}
              fill="none"
              stroke={markerColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.85}
            />
          );
        })()}
      </svg>
    </div>
  );
};

export default FreehandDrawingOverlay;
