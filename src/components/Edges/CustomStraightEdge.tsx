// ---------------------------------------------------------------------------
// CustomStraightEdge.tsx -- Straight line edge with custom styling
// ---------------------------------------------------------------------------

import React from 'react';
import { type EdgeProps, getStraightPath } from '@xyflow/react';
import { useUIStore } from '../../store/uiStore';
import { useEdgeVisuals } from './useEdgeVisuals';
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

const CustomStraightEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style: _style,
  selected,
  markerEnd: markerEndProp,
  markerStart: markerStartProp,
}) => {
  void _style; // read from store via useEdgeVisuals instead (bypasses React Flow memo)
  const ev = useEdgeVisuals(id);
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

  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
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

      {/* Visible edge path */}
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
        style={
          isAnimated
            ? {
                strokeDasharray: strokeDasharray ?? '8 4',
                animation: 'charthero-edge-dash 0.6s linear infinite',
              }
            : undefined
        }
      />

      {/* Selection highlight */}
      {selected && (
        <path
          d={edgePath}
          fill="none"
          stroke={selectionColor}
          strokeWidth={strokeWidth + selectionThickness + 1}
          strokeLinecap="round"
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
          labelBgColor={ev.labelBgColor ?? ev.overrideLabelBgColor ?? '#ffffff'}
          borderColor={strokeColor}
          fontSize={ev.labelFontSize ?? ev.overrideLabelFontSize ?? 11}
        />
      )}
    </>
  );
};

export default React.memo(CustomStraightEdge);
