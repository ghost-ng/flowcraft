// ---------------------------------------------------------------------------
// CustomStepEdge.tsx -- Right-angle step edge with custom styling
// ---------------------------------------------------------------------------

import React from 'react';
import { type EdgeProps, getSmoothStepPath } from '@xyflow/react';
import { useUIStore } from '../../store/uiStore';
import { useStyleStore } from '../../store/styleStore';
import { useEdgeVisuals } from './useEdgeVisuals';
import { useEdgeTypeDrag } from './useEdgeTypeDrag';
import EdgeLabel from './EdgeLabel';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INTERACTION_PATH_WIDTH = 20;
const DEFAULT_STROKE = '#94a3b8';
const DEFAULT_STROKE_WIDTH = 2;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CustomStepEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style: _style,
  selected,
  markerEnd: markerEndProp,
  markerStart: markerStartProp,
}) => {
  void _style; // read from store via useEdgeVisuals instead (bypasses React Flow memo)
  const ev = useEdgeVisuals(id);
  const darkMode = useStyleStore((s) => s.darkMode);
  const selectionColor = useUIStore((s) => s.selectionColor);
  const selectionThickness = useUIStore((s) => s.selectionThickness);
  const strokeColor = ev.color ?? ev.overrideStroke ?? ev.styleStroke ?? DEFAULT_STROKE;
  const strokeWidth = ev.thickness ?? ev.overrideStrokeWidth ?? ev.styleStrokeWidth ?? DEFAULT_STROKE_WIDTH;
  const strokeDasharray = ev.strokeDasharray ?? ev.overrideDash ?? ev.styleDash ?? undefined;
  const opacity = ev.opacity ?? ev.overrideOpacity ?? ev.styleOpacity ?? 1;
  const isAnimated = ev.animated;
  const label = ev.label;
  const markerEnd = ev.markerEnd ?? markerEndProp;
  const markerStart = ev.markerStart ?? markerStartProp;
  const onInteractionMouseDown = useEdgeTypeDrag(id, sourceX, sourceY, targetX, targetY);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 8,
  });

  return (
    <>
      {/* Invisible wider interaction path for easier clicking + drag-to-cycle type */}
      <path
        id={`${id}-interaction`}
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={INTERACTION_PATH_WIDTH}
        className="react-flow__edge-interaction"
        onMouseDown={onInteractionMouseDown}
      />

      {/* Visible edge path — stroke/strokeWidth MUST be inline styles
           to override React Flow's CSS variables on .react-flow__edge-path */}
      <path
        id={id}
        d={edgePath}
        markerEnd={markerEnd}
        markerStart={markerStart}
        className={`react-flow__edge-path ${selected ? 'selected' : ''}`}
        style={{
          fill: 'none',
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray: isAnimated ? (strokeDasharray ?? '8 4') : strokeDasharray,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          opacity,
          ...(isAnimated ? { animation: 'charthero-edge-dash 0.6s linear infinite' } : {}),
        }}
      />

      {/* Selection highlight */}
      {selected && (
        <path
          d={edgePath}
          className="pointer-events-none"
          style={{
            fill: 'none',
            stroke: selectionColor,
            strokeWidth: strokeWidth + selectionThickness + 1,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            opacity: 0.25,
          }}
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
          labelColor={ev.labelColor ?? ev.overrideLabelFontColor ?? (darkMode ? '#c8d1dc' : '#475569')}
          labelBgColor={ev.labelBgColor ?? ev.overrideLabelBgColor ?? (darkMode ? '#253345' : '#ffffff')}
          borderColor={strokeColor}
          fontSize={ev.labelFontSize ?? ev.overrideLabelFontSize ?? 11}
        />
      )}
    </>
  );
};

export default React.memo(CustomStepEdge);
