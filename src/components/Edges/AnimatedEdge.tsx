// ---------------------------------------------------------------------------
// AnimatedEdge.tsx -- Edge with animated flowing dashes
// ---------------------------------------------------------------------------

import React, { useMemo } from 'react';
import { type EdgeProps, getBezierPath } from '@xyflow/react';
import { useUIStore } from '../../store/uiStore';
import { useEdgeVisuals } from './useEdgeVisuals';
import EdgeLabel from './EdgeLabel';

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
  style,
  selected,
  markerEnd: markerEndProp,
  markerStart: markerStartProp,
}) => {
  // Ensure keyframes are injected
  useMemo(() => injectKeyframes(), []);

  // Read visual properties from Zustand via useShallow for reliable re-renders
  const ev = useEdgeVisuals(id);
  const selectionColor = useUIStore((s) => s.selectionColor);
  const selectionThickness = useUIStore((s) => s.selectionThickness);

  // Resolve visual properties — read from store via useEdgeVisuals (reliable re-renders)
  const strokeColor = ev.color ?? ev.overrideStroke ?? ev.styleStroke ?? DEFAULT_STROKE;
  const strokeWidth = ev.thickness ?? ev.overrideStrokeWidth ?? ev.styleStrokeWidth ?? DEFAULT_STROKE_WIDTH;
  const strokeDasharray = ev.strokeDasharray ?? ev.overrideDash ?? ev.styleDash ?? DEFAULT_DASH;
  const opacity = (style?.opacity as number) ?? ev.overrideOpacity ?? ev.opacity ?? 1;
  const speed = DEFAULT_SPEED;
  const label = ev.label;
  const markerEnd = ev.markerEnd ?? markerEndProp;
  const markerStart = ev.markerStart ?? markerStartProp;

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
          strokeWidth={strokeWidth + selectionThickness + 1}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.25}
          className="pointer-events-none"
        />
      )}

      {/* Label (draggable along the path) */}
      {label && (
        <EdgeLabel
          edgeId={id}
          label={label}
          sourceX={sourceX}
          sourceY={sourceY}
          midX={labelX}
          midY={labelY}
          targetX={targetX}
          targetY={targetY}
          labelPosition={ev.labelPosition ?? 0.5}
          labelColor={ev.labelColor ?? ev.overrideLabelFontColor ?? '#475569'}
          labelBgColor={ev.overrideLabelBgColor ?? '#ffffff'}
          borderColor={strokeColor as string}
          fontSize={ev.overrideLabelFontSize ?? 11}
        />
      )}
    </>
  );
};

export default React.memo(AnimatedEdge);
