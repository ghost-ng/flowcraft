// ---------------------------------------------------------------------------
// AnimatedEdge.tsx -- Edge with animated flowing dashes
// ---------------------------------------------------------------------------

import React, { useMemo } from 'react';
import { type EdgeProps, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';
import type { FlowEdgeData } from '../../types/edges';
import { useUIStore } from '../../store/uiStore';

// ---------------------------------------------------------------------------
// Inline keyframes -- injected once via a <style> element
// ---------------------------------------------------------------------------

const ANIMATION_STYLE_ID = 'flowcraft-edge-dash-keyframes';

const injectKeyframes = (): void => {
  if (typeof document === 'undefined') return;
  if (document.getElementById(ANIMATION_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = ANIMATION_STYLE_ID;
  style.textContent = `
    @keyframes flowcraft-edge-dash {
      to {
        stroke-dashoffset: -24;
      }
    }
  `;
  document.head.appendChild(style);
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INTERACTION_PATH_WIDTH = 20;
const DEFAULT_STROKE = '#6366f1';
const DEFAULT_STROKE_WIDTH = 2;
const DEFAULT_DASH = '8 4';
const DEFAULT_SPEED = 0.6; // seconds per cycle

// ---------------------------------------------------------------------------
// Extended edge data with animation speed
// ---------------------------------------------------------------------------

interface AnimatedEdgeData extends FlowEdgeData {
  /** Animation speed in seconds per dash cycle. Lower = faster. */
  animationSpeed?: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AnimatedEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style,
  selected,
  markerEnd,
  markerStart,
}) => {
  // Ensure keyframes are injected
  useMemo(() => injectKeyframes(), []);

  const selectionColor = useUIStore((s) => s.selectionColor);
  const edgeData = data as AnimatedEdgeData | undefined;
  const overrides = edgeData?.styleOverrides;

  // Resolve visual properties
  const strokeColor = overrides?.stroke ?? style?.stroke ?? DEFAULT_STROKE;
  const strokeWidth = overrides?.strokeWidth ?? (style?.strokeWidth as number) ?? DEFAULT_STROKE_WIDTH;
  const rawData = edgeData as Record<string, unknown> | undefined;
  const strokeDasharray = (rawData?.strokeDasharray as string) ?? overrides?.strokeDasharray ?? DEFAULT_DASH;
  const opacity = overrides?.opacity ?? 1;
  const speed = edgeData?.animationSpeed ?? DEFAULT_SPEED;
  const label = edgeData?.label;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      {/* Invisible wider interaction path for easier clicking */}
      <path
        id={`${id}-interaction`}
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={INTERACTION_PATH_WIDTH}
        className="react-flow__edge-interaction"
      />

      {/* Static background path (subtle, lower opacity) */}
      <path
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity * 0.2}
        className="pointer-events-none"
      />

      {/* Animated dashed path */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
        markerEnd={markerEnd}
        markerStart={markerStart}
        className={`react-flow__edge-path ${selected ? 'selected' : ''}`}
        style={{
          animation: `flowcraft-edge-dash ${speed}s linear infinite`,
        }}
      />

      {/* Selection highlight */}
      {selected && (
        <path
          d={edgePath}
          fill="none"
          stroke={selectionColor}
          strokeWidth={strokeWidth + 3}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.25}
          className="pointer-events-none"
        />
      )}

      {/* Label (position adjustable via labelPosition: 0=source, 0.5=center, 1=target) */}
      {label && (() => {
        const t = (edgeData as Record<string, unknown>)?.labelPosition as number ?? 0.5;
        let lx = labelX, ly = labelY;
        if (t !== 0.5) {
          if (t < 0.5) { const s = t * 2; lx = sourceX + s * (labelX - sourceX); ly = sourceY + s * (labelY - sourceY); }
          else { const s = (t - 0.5) * 2; lx = labelX + s * (targetX - labelX); ly = labelY + s * (targetY - labelY); }
        }
        return (
          <EdgeLabelRenderer>
            <div
              className="absolute pointer-events-auto cursor-pointer rounded px-2 py-0.5 text-xs font-medium shadow-sm border"
              style={{
                transform: `translate(-50%, -50%) translate(${lx}px, ${ly}px)`,
                color: (edgeData as Record<string, unknown>)?.labelColor as string ?? overrides?.labelFontColor ?? '#475569',
                backgroundColor: overrides?.labelBgColor ?? '#ffffff',
                borderColor: strokeColor as string,
                fontSize: overrides?.labelFontSize ?? 11,
              }}
            >
              {label}
            </div>
          </EdgeLabelRenderer>
        );
      })()}
    </>
  );
};

export default React.memo(AnimatedEdge);
