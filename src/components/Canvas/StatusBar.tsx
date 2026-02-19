import React, { useEffect, useRef, useState } from 'react';
import { useViewport } from '@xyflow/react';
import { Pipette } from 'lucide-react';
import { useFlowStore, type FlowNodeData } from '../../store/flowStore';
import { useStyleStore } from '../../store/styleStore';
import { useUIStore } from '../../store/uiStore';

const StatusBar: React.FC = () => {
  const darkMode = useStyleStore((s) => s.darkMode);
  const selectedNodes = useFlowStore((s) => s.selectedNodes);
  const selectedEdges = useFlowStore((s) => s.selectedEdges);
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const rulerVisible = useUIStore((s) => s.rulerVisible);
  const viewport = useViewport();

  // Eyedropper state
  const [eyedropperActive, setEyedropperActive] = useState(false);

  const openEyedropper = async () => {
    if (!('EyeDropper' in window)) return;
    setEyedropperActive(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dropper = new (window as any).EyeDropper();
      const result = await dropper.open();
      const color = result.sRGBHex as string;
      const { updateNodeData } = useFlowStore.getState();
      for (const nid of selectedNodes) {
        updateNodeData(nid, { color } as Partial<FlowNodeData>);
      }
    } catch {
      // User cancelled or API error — ignore
    } finally {
      setEyedropperActive(false);
    }
  };

  // Get current fill color of first selected node
  const currentColor = (() => {
    if (selectedNodes.length === 0) return null;
    const node = nodes.find((n) => n.id === selectedNodes[0]);
    return (node?.data as FlowNodeData | undefined)?.color || '#3b82f6';
  })();

  // Mouse coordinates in flow space
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track mouse position over the canvas
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      // Convert screen coords to flow coords using viewport
      const flowX = (e.clientX - viewport.x) / viewport.zoom;
      const flowY = (e.clientY - viewport.y) / viewport.zoom;
      setMousePos({ x: Math.round(flowX), y: Math.round(flowY) });
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, [viewport.x, viewport.y, viewport.zoom]);

  // Session timer — counts time since app loaded
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s.toString().padStart(2, '0')}s`;
    return `${s}s`;
  };

  // Selection info
  const selCount = selectedNodes.length + selectedEdges.length;
  const selectedType = (() => {
    if (selectedNodes.length === 1 && selectedEdges.length === 0) {
      const node = nodes.find((n) => n.id === selectedNodes[0]);
      return node?.data?.shape ? String(node.data.shape) : 'node';
    }
    if (selectedEdges.length === 1 && selectedNodes.length === 0) {
      const edge = edges.find((e) => e.id === selectedEdges[0]);
      return edge?.type || 'edge';
    }
    if (selCount > 1) return 'mixed';
    return null;
  })();

  const totalElements = nodes.length + edges.length;

  const itemClass = `flex items-center gap-1 px-2 ${darkMode ? 'text-dk-muted' : 'text-slate-500'}`;
  const separatorClass = `h-3 w-px ${darkMode ? 'bg-dk-border' : 'bg-slate-200'}`;

  return (
    <div
      ref={containerRef}
      className={`absolute bottom-0 left-0 right-0 h-6 flex items-center text-[10px] font-mono z-10 border-t select-none ${
        darkMode
          ? 'bg-surface-alt-dark border-dk-border'
          : 'bg-white/90 border-slate-200'
      }`}
      style={{ left: rulerVisible ? 24 : 0 }}
    >
      {/* Time saved */}
      <div className={itemClass} title="Time spent creating this diagram">
        <span className="opacity-60">&#9202;</span>
        {formatTime(elapsed)}
      </div>

      <div className={separatorClass} />

      {/* Total elements */}
      <div className={itemClass} title="Total elements on canvas">
        {totalElements} element{totalElements !== 1 ? 's' : ''}
      </div>

      <div className={separatorClass} />

      {/* Selection */}
      <div className={itemClass} title="Selected elements">
        {selCount > 0 ? (
          <>
            {selCount} selected
            {selectedType && selectedType !== 'mixed' && (
              <span className="opacity-60">({selectedType})</span>
            )}
          </>
        ) : (
          <span className="opacity-50">None selected</span>
        )}
      </div>

      <div className={separatorClass} />

      {/* Mouse coordinates */}
      <div className={itemClass} title="Cursor position (flow coordinates)">
        {mousePos ? (
          <>X: {mousePos.x} &nbsp; Y: {mousePos.y}</>
        ) : (
          <span className="opacity-50">—</span>
        )}
      </div>

      <div className="flex-1" />

      {/* Eyedropper color picker */}
      {selectedNodes.length > 0 && 'EyeDropper' in window && (
        <>
          <button
            onClick={openEyedropper}
            disabled={eyedropperActive}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer transition-colors text-[10px] ${
              eyedropperActive
                ? 'opacity-60 cursor-wait'
                : darkMode ? 'hover:bg-dk-hover text-dk-muted' : 'hover:bg-slate-100 text-slate-500'
            }`}
            title="Pick color from screen (eyedropper)"
          >
            <span
              className="w-3 h-3 rounded-sm border border-white/30"
              style={{ backgroundColor: currentColor || '#3b82f6' }}
            />
            <Pipette size={10} />
          </button>
          <div className={separatorClass} />
        </>
      )}

      {/* Zoom */}
      <div className={itemClass} title="Zoom level">
        {Math.round(viewport.zoom * 100)}%
      </div>
    </div>
  );
};

export default React.memo(StatusBar);
