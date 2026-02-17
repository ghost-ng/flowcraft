// ---------------------------------------------------------------------------
// PresentationOverlay.tsx -- Fullscreen presentation mode with markup tools
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PresentationOverlay: React.FC = () => {
  const presentationMode = useUIStore((s) => s.presentationMode);
  const tool = useUIStore((s) => s.presentationTool);
  const setPresentationMode = useUIStore((s) => s.setPresentationMode);
  const setPresentationTool = useUIStore((s) => s.setPresentationTool);
  const darkMode = useStyleStore((s) => s.darkMode);

  const svgRef = useRef<SVGSVGElement>(null);
  const [strokes, setStrokes] = useState<StrokePath[]>([]);
  const [currentStroke, setCurrentStroke] = useState<StrokePath | null>(null);
  const [penColor, setPenColor] = useState('#ef4444');
  const isDrawing = useRef(false);

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

  // Request fullscreen on enter
  useEffect(() => {
    if (presentationMode) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    }
  }, [presentationMode]);

  const handleExit = useCallback(async () => {
    if (strokes.length > 0) {
      const confirmed = await useUIStore.getState().showConfirm(
        'Save your annotations before exiting?',
        { title: 'Exit Presentation', confirmLabel: 'Export & Exit', cancelLabel: 'Discard & Exit' },
      );
      if (confirmed) {
        // Trigger export dialog
        const { setDialogOpen } = await import('../../store/exportStore').then((m) => m.useExportStore.getState());
        setDialogOpen(true);
      }
    }
    setStrokes([]);
    setPresentationMode(false);
  }, [strokes, setPresentationMode]);

  // Drawing handlers
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (tool === 'pointer') return;

      if (tool === 'eraser') {
        // Find and remove the stroke closest to click point
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setStrokes((prev) => {
          // Remove the last stroke whose any point is within 20px of click
          const idx = prev.findIndex((s) =>
            s.points.some((p) => Math.hypot(p.x - x, p.y - y) < 20),
          );
          if (idx >= 0) return prev.filter((_, i) => i !== idx);
          return prev;
        });
        return;
      }

      isDrawing.current = true;
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const style = tool === 'highlighter' ? TOOL_STYLES.highlighter : TOOL_STYLES.pen;
      setCurrentStroke({
        points: [{ x, y }],
        color: tool === 'highlighter' ? style.color : penColor,
        width: style.width,
        opacity: style.opacity,
      });
    },
    [tool, penColor],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!isDrawing.current || !currentStroke) return;
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setCurrentStroke((prev) =>
        prev ? { ...prev, points: [...prev.points, { x, y }] } : null,
      );
    },
    [currentStroke],
  );

  const handlePointerUp = useCallback(() => {
    if (!isDrawing.current || !currentStroke) return;
    isDrawing.current = false;
    if (currentStroke.points.length > 1) {
      setStrokes((prev) => [...prev, currentStroke]);
    }
    setCurrentStroke(null);
  }, [currentStroke]);

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

  return (
    <>
      {/* SVG overlay for annotations (above canvas, below toolbar) */}
      <svg
        ref={svgRef}
        className="fixed inset-0 z-[9990]"
        style={{
          pointerEvents: tool === 'pointer' ? 'none' : 'auto',
          cursor:
            tool === 'pen' ? 'crosshair' :
            tool === 'highlighter' ? 'crosshair' :
            tool === 'eraser' ? 'cell' : 'default',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
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
        {currentStroke && (
          <polyline
            points={currentStroke.points.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={currentStroke.color}
            strokeWidth={currentStroke.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={currentStroke.opacity}
          />
        )}
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
            className={`p-2 rounded-lg transition-colors ${
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
          className={`p-2 rounded-lg transition-colors disabled:opacity-30 ${
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
          className={`p-2 rounded-lg transition-colors disabled:opacity-30 ${
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
          className={`p-2 rounded-lg transition-colors ${
            darkMode ? 'text-gray-300 hover:bg-slate-700' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Download size={18} />
        </button>

        {/* Exit */}
        <button
          onClick={handleExit}
          title="Exit Presentation (Esc)"
          className="p-2 rounded-lg transition-colors text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
        >
          <X size={18} />
        </button>
      </div>
    </>
  );
};

export default React.memo(PresentationOverlay);
