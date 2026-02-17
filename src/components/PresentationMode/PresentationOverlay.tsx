// ---------------------------------------------------------------------------
// PresentationOverlay.tsx -- Fullscreen presentation mode with markup tools
// Annotations are stored in flow (canvas) coordinates so they pan/zoom
// with the diagram.
// ---------------------------------------------------------------------------

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  X,
  MousePointer2,
  Pen,
  Highlighter,
  Eraser,
  Download,
  Undo2,
  Trash2,
} from 'lucide-react';
import { useReactFlow, useViewport } from '@xyflow/react';
import { useUIStore } from '../../store/uiStore';
import { useStyleStore } from '../../store/styleStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StrokePath {
  points: Array<{ x: number; y: number }>;
  color: string;
  width: number;
  opacity: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOOL_STYLES = {
  pointer: { color: '', width: 0, opacity: 0 },
  pen: { color: '#ef4444', width: 2.5, opacity: 1 },
  highlighter: { color: '#facc15', width: 16, opacity: 0.35 },
  eraser: { color: '', width: 0, opacity: 0 },
};

// Custom SVG cursors for presentation tools (data URLs with hotspot coordinates)
export const CURSOR_POINTER = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M4 1 L4 17 L8.5 13 L12.5 21 L15 20 L11 12 L16.5 12 Z' fill='white' stroke='%23334155' stroke-width='1.5' stroke-linejoin='round'/%3E%3C/svg%3E") 4 1, default`;

const CURSOR_PEN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M3 21 L5.5 15.5 L17.5 3.5 C18.3 2.7 19.7 2.7 20.5 3.5 C21.3 4.3 21.3 5.7 20.5 6.5 L8.5 18.5 Z' fill='%23ef4444' stroke='%23991b1b' stroke-width='1' stroke-linejoin='round'/%3E%3Cpath d='M3 21 L5.5 15.5 L8.5 18.5 Z' fill='%23fca5a5' stroke='%23991b1b' stroke-width='0.75'/%3E%3Ccircle cx='3' cy='21' r='1.5' fill='%23ef4444'/%3E%3C/svg%3E") 3 21, crosshair`;

const CURSOR_HIGHLIGHTER = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Crect x='6' y='1' width='8' height='18' rx='1.5' transform='rotate(25 10 10)' fill='%23facc15' stroke='%23a16207' stroke-width='1'/%3E%3Crect x='7' y='15' width='6' height='4' rx='0.5' transform='rotate(25 10 10)' fill='%23a16207' opacity='0.6'/%3E%3Cpath d='M3.5 22.5 L5 19 L7 21 Z' fill='%23a16207' opacity='0.4'/%3E%3C/svg%3E") 3 22, crosshair`;

const CURSOR_ERASER = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Crect x='2' y='10' width='20' height='10' rx='2' fill='white' stroke='%23475569' stroke-width='1.5'/%3E%3Crect x='2' y='10' width='20' height='5' rx='2' fill='%23f8a4b8' stroke='%23475569' stroke-width='1.5'/%3E%3Cline x1='4' y1='22' x2='20' y2='22' stroke='%23cbd5e1' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E") 12 22, not-allowed`;

// ---------------------------------------------------------------------------
// Component (must be rendered inside ReactFlowProvider)
// ---------------------------------------------------------------------------

const PresentationOverlay: React.FC = () => {
  const presentationMode = useUIStore((s) => s.presentationMode);
  const tool = useUIStore((s) => s.presentationTool);
  const setPresentationMode = useUIStore((s) => s.setPresentationMode);
  const setPresentationTool = useUIStore((s) => s.setPresentationTool);
  const darkMode = useStyleStore((s) => s.darkMode);

  // React Flow viewport access — used to convert screen ↔ flow coordinates
  const rfInstance = useReactFlow();
  const viewport = useViewport();

  const svgRef = useRef<SVGSVGElement>(null);
  const [strokes, setStrokes] = useState<StrokePath[]>([]);
  const [penColor, setPenColor] = useState('#ef4444');

  // Use refs for the active drawing stroke to avoid stale closure issues
  const isDrawing = useRef(false);
  const activeStrokeRef = useRef<StrokePath | null>(null);
  const [, forceRender] = useState(0);

  // Panning cursor state (pointer tool + mouse held down)
  const [isPanning, setIsPanning] = useState(false);

  // Escape key exits presentation mode
  useEffect(() => {
    if (!presentationMode) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleExit();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [presentationMode]);

  // Track panning in pointer mode (mousedown on canvas → grabbing cursor)
  useEffect(() => {
    if (!presentationMode || tool !== 'pointer') {
      setIsPanning(false);
      return;
    }
    const pane = document.querySelector('.react-flow__pane');
    if (!pane) return;
    const handleDown = () => setIsPanning(true);
    const handleUp = () => setIsPanning(false);
    pane.addEventListener('mousedown', handleDown);
    window.addEventListener('mouseup', handleUp);
    return () => {
      pane.removeEventListener('mousedown', handleDown);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [presentationMode, tool]);

  // Inject grabbing cursor globally while panning
  useEffect(() => {
    if (!isPanning) return;
    const style = document.createElement('style');
    style.id = 'fc-panning-cursor';
    style.textContent = '.presentation-mode, .presentation-mode * { cursor: grabbing !important; }';
    document.head.appendChild(style);
    return () => { style.remove(); };
  }, [isPanning]);

  const handleExit = useCallback(async () => {
    if (strokes.length > 0) {
      const confirmed = await useUIStore.getState().showConfirm(
        'Save your annotations before exiting?',
        { title: 'Exit Presentation', confirmLabel: 'Export & Exit', cancelLabel: 'Discard & Exit' },
      );
      if (confirmed) {
        const { setDialogOpen } = await import('../../store/exportStore').then((m) => m.useExportStore.getState());
        setDialogOpen(true);
      }
    }
    setStrokes([]);
    activeStrokeRef.current = null;
    isDrawing.current = false;
    setPresentationMode(false);
    // Exit fullscreen (user gesture from button click or Escape key)
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }, [strokes, setPresentationMode]);

  // Drawing handlers — coordinates are converted to flow space so strokes
  // pan and zoom together with the diagram.
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const currentTool = useUIStore.getState().presentationTool;
      if (currentTool === 'pointer') return;

      // Convert screen coordinates to flow (canvas) coordinates
      const flowPos = rfInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const { zoom } = rfInstance.getViewport();

      if (currentTool === 'eraser') {
        const hitDist = 20 / zoom; // scale hit distance to flow space
        setStrokes((prev) => {
          const idx = prev.findIndex((s) =>
            s.points.some((p) => Math.hypot(p.x - flowPos.x, p.y - flowPos.y) < hitDist),
          );
          if (idx >= 0) return prev.filter((_, i) => i !== idx);
          return prev;
        });
        return;
      }

      // Start drawing
      const style = currentTool === 'highlighter' ? TOOL_STYLES.highlighter : TOOL_STYLES.pen;
      const color = currentTool === 'highlighter' ? style.color : penColor;
      activeStrokeRef.current = {
        points: [{ x: flowPos.x, y: flowPos.y }],
        color,
        width: style.width / zoom, // store width in flow units
        opacity: style.opacity,
      };
      isDrawing.current = true;
      forceRender((n) => n + 1);

      // Capture pointer for reliable tracking
      (e.target as Element).setPointerCapture?.(e.pointerId);
    },
    [penColor, rfInstance],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!isDrawing.current || !activeStrokeRef.current) return;
      const flowPos = rfInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      activeStrokeRef.current.points.push({ x: flowPos.x, y: flowPos.y });
      forceRender((n) => n + 1);
    },
    [rfInstance],
  );

  const handlePointerUp = useCallback(() => {
    if (!isDrawing.current || !activeStrokeRef.current) return;
    isDrawing.current = false;
    const stroke = activeStrokeRef.current;
    activeStrokeRef.current = null;
    if (stroke.points.length > 1) {
      setStrokes((prev) => [...prev, stroke]);
    }
    forceRender((n) => n + 1);
  }, []);

  const handleUndo = useCallback(() => {
    setStrokes((prev) => prev.slice(0, -1));
  }, []);

  const handleClearAll = useCallback(() => {
    setStrokes([]);
  }, []);

  if (!presentationMode) return null;

  const toolButtons = [
    { id: 'pointer' as const, icon: MousePointer2, label: 'Pointer' },
    { id: 'pen' as const, icon: Pen, label: 'Pen' },
    { id: 'highlighter' as const, icon: Highlighter, label: 'Highlighter' },
    { id: 'eraser' as const, icon: Eraser, label: 'Eraser' },
  ];

  const penColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#000000', '#ffffff'];

  const activeStroke = activeStrokeRef.current;

  return (
    <>
      {/* SVG overlay for annotations (above canvas, below toolbar) */}
      <svg
        ref={svgRef}
        className="fixed inset-0 z-[9990]"
        width="100%"
        height="100%"
        style={{
          pointerEvents: tool === 'pointer' ? 'none' : 'auto',
          cursor:
            tool === 'pen' ? CURSOR_PEN :
            tool === 'highlighter' ? CURSOR_HIGHLIGHTER :
            tool === 'eraser' ? CURSOR_ERASER : 'default',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Transparent hit area so pointer events fire on empty space */}
        <rect width="100%" height="100%" fill="transparent" />

        {/* Viewport-transformed group — strokes are in flow coordinates,
            this transform converts them to screen coordinates so they
            move and scale with the canvas */}
        <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}>
          {/* Completed strokes */}
          {strokes.map((stroke, i) => (
            <polyline
              key={i}
              points={stroke.points.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={stroke.color}
              strokeWidth={stroke.width}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={stroke.opacity}
            />
          ))}
          {/* Current stroke being drawn */}
          {activeStroke && activeStroke.points.length > 0 && (
            <polyline
              points={activeStroke.points.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={activeStroke.color}
              strokeWidth={activeStroke.width}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={activeStroke.opacity}
            />
          )}
        </g>
      </svg>

      {/* Floating toolbar at bottom-center */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9995] flex items-center gap-1 px-3 py-2 rounded-xl shadow-2xl border backdrop-blur-md"
        style={{
          backgroundColor: darkMode ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.95)',
          borderColor: darkMode ? '#334155' : '#e2e8f0',
        }}
      >
        {/* Tool buttons */}
        {toolButtons.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setPresentationTool(id)}
            title={label}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              tool === id
                ? 'bg-blue-500 text-white'
                : darkMode
                  ? 'text-gray-300 hover:bg-slate-700'
                  : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Icon size={18} />
          </button>
        ))}

        {/* Pen color picker (visible when pen is active) */}
        {tool === 'pen' && (
          <>
            <div className={`w-px h-6 mx-1 ${darkMode ? 'bg-slate-600' : 'bg-gray-200'}`} />
            {penColors.map((c) => (
              <button
                key={c}
                onClick={() => setPenColor(c)}
                className="w-5 h-5 rounded-full cursor-pointer transition-transform hover:scale-125"
                style={{
                  backgroundColor: c,
                  border: c === penColor ? '2px solid #3b82f6' : '1px solid rgba(0,0,0,0.15)',
                }}
              />
            ))}
          </>
        )}

        <div className={`w-px h-6 mx-1 ${darkMode ? 'bg-slate-600' : 'bg-gray-200'}`} />

        {/* Undo */}
        <button
          onClick={handleUndo}
          disabled={strokes.length === 0}
          title="Undo"
          className={`p-2 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
            darkMode ? 'text-gray-300 hover:bg-slate-700' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Undo2 size={18} />
        </button>

        {/* Clear all */}
        <button
          onClick={handleClearAll}
          disabled={strokes.length === 0}
          title="Clear all annotations"
          className={`p-2 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
            darkMode ? 'text-gray-300 hover:bg-slate-700' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Trash2 size={18} />
        </button>

        <div className={`w-px h-6 mx-1 ${darkMode ? 'bg-slate-600' : 'bg-gray-200'}`} />

        {/* Export */}
        <button
          onClick={() => {
            import('../../store/exportStore').then((m) => m.useExportStore.getState().setDialogOpen(true));
          }}
          title="Export"
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            darkMode ? 'text-gray-300 hover:bg-slate-700' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Download size={18} />
        </button>

        {/* Exit */}
        <button
          onClick={handleExit}
          title="Exit Presentation (Esc)"
          className="p-2 rounded-lg transition-colors cursor-pointer text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
        >
          <X size={18} />
        </button>
      </div>
    </>
  );
};

export default React.memo(PresentationOverlay);
